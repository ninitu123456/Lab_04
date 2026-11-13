import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useForumMessages } from './useForumMessages';

const NASA = [{ id: 'n1', forum: 'nasa', author: 'Mission Control', text: 'Liftoff', timestamp: '2026-11-10T08:00:00.000Z' }];
const TRIBUNAL = [{ id: 't1', forum: 'esports-tribunal', author: 'Clerk', text: 'Case opened', timestamp: '2026-11-09T10:00:00.000Z' }];
const NEW_MSG = { id: 'n2', forum: 'nasa', author: 'Tú', text: 'Hello', timestamp: '2026-11-13T08:00:00.000Z' };

const jsonResponse = (body, status = 200) => ({
  ok: status >= 200 && status < 300,
  status,
  json: async () => body,
});

function deferred() {
  let resolve;
  const promise = new Promise((r) => { resolve = r; });
  return { promise, resolve };
}

let fetchMock;
let consoleErrorSpy;

beforeEach(() => {
  fetchMock = vi.fn();
  vi.stubGlobal('fetch', fetchMock);
  consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('useForumMessages — GET with AbortController', () => {
  it('fetches messages for the forum and derives loading/data/error', async () => {
    fetchMock.mockResolvedValue(jsonResponse(NASA));
    const { result } = renderHook(() => useForumMessages('nasa'));

    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.data).toEqual(NASA);
    expect(result.current.error).toBeNull();
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/api/messages/nasa'),
      expect.objectContaining({ signal: expect.any(AbortSignal) })
    );
  });

  it('aborts the in-flight request on channel switch and ignores its late response', async () => {
    const slowNasa = deferred();
    fetchMock.mockReturnValueOnce(slowNasa.promise).mockResolvedValueOnce(jsonResponse(TRIBUNAL));

    const { result, rerender } = renderHook(({ forum }) => useForumMessages(forum), {
      initialProps: { forum: 'nasa' },
    });
    const firstSignal = fetchMock.mock.calls[0][1].signal;

    rerender({ forum: 'esports-tribunal' });
    expect(firstSignal.aborted).toBe(true);
    await waitFor(() => expect(result.current.data).toEqual(TRIBUNAL));

    // Response cũ của 'nasa' về muộn → phải bị bỏ qua (không có race condition)
    await act(async () => { slowNasa.resolve(jsonResponse(NASA)); });
    expect(result.current.data).toEqual(TRIBUNAL);
  });

  it('aborts on unmount and never logs the AbortError', async () => {
    fetchMock.mockImplementation((url, { signal }) =>
      new Promise((_, reject) => {
        signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')));
      })
    );

    const { unmount } = renderHook(() => useForumMessages('nasa'));
    const signal = fetchMock.mock.calls[0][1].signal;
    unmount();

    expect(signal.aborted).toBe(true);
    await act(async () => {});
    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });

  it('exposes a 404 error for the unknown notNasa forum and logs it exactly once', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ error: 'Unknown forum' }, 404));
    const { result } = renderHook(() => useForumMessages('notNasa'));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toMatch(/Unknown forum/);
    expect(result.current.data).toEqual([]);
    expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
  });
});

describe('useForumMessages — postMessage helper', () => {
  it('POSTs JSON then triggers a refetch of the channel', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse(NASA))
      .mockResolvedValueOnce(jsonResponse(NEW_MSG, 201))
      .mockResolvedValueOnce(jsonResponse([...NASA, NEW_MSG]));

    const { result } = renderHook(() => useForumMessages('nasa'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.postMessage({ author: 'Tú', text: 'Hello' });
    });

    const [postUrl, postInit] = fetchMock.mock.calls[1];
    expect(postUrl).toContain('/api/messages/nasa');
    expect(postInit).toMatchObject({
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ author: 'Tú', text: 'Hello' }),
    });

    await waitFor(() => expect(result.current.data).toEqual([...NASA, NEW_MSG]));
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it('throws the server error message so the caller can handle it', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse(NASA))
      .mockResolvedValueOnce(jsonResponse({ error: 'Missing required fields' }, 400));

    const { result } = renderHook(() => useForumMessages('nasa'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await expect(result.current.postMessage({ author: '', text: '' })).rejects.toThrow('Missing required fields');
  });
});