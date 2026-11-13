import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router';
import ForumPage from './ForumPage';

const NASA = [{ id: 'n1', forum: 'nasa', author: 'Mission Control', text: 'Artemis flyby complete', timestamp: '2026-11-10T08:00:00.000Z' }];
const TRIBUNAL = [{ id: 't1', forum: 'esports-tribunal', author: 'Tribunal Clerk', text: 'Case #117 opened', timestamp: '2026-11-09T10:00:00.000Z' }];

const jsonResponse = (body, status = 200) => ({
  ok: status >= 200 && status < 300,
  status,
  json: async () => body,
});

let fetchMock;

// Fake REST server giống contract mục 8.1 — 'notNasa' không tồn tại → 404
beforeEach(() => {
  const db = { nasa: [...NASA], 'esports-tribunal': [...TRIBUNAL] };
  let nextId = 1;
  fetchMock = vi.fn(async (url, init = {}) => {
    const forum = decodeURIComponent(url.split('/api/messages/')[1]);
    if (!(forum in db)) return jsonResponse({ error: 'Unknown forum' }, 404);
    if (init.method === 'POST') {
      const { author, text } = JSON.parse(init.body);
      const created = { id: `new-${nextId++}`, forum, author, text, timestamp: '2026-11-13T09:00:00.000Z' };
      db[forum].push(created);
      return jsonResponse(created, 201);
    }
    return jsonResponse(db[forum]);
  });
  vi.stubGlobal('fetch', fetchMock);
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

function LocationProbe() {
  const { search } = useLocation();
  // <div> thay vì <output>: <output> có implicit role="status" → trùng với "Loading messages…"
  return <div data-testid="location">{search}</div>;
}

function renderForum(path = '/forum') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/forum" element={<><ForumPage /><LocationProbe /></>} />
      </Routes>
    </MemoryRouter>
  );
}

const postRequests = () => fetchMock.mock.calls.filter(([, init]) => init?.method === 'POST');

describe('ForumPage — live channel switcher', () => {
  it('shows a loading status while the first request is in flight', async () => {
    renderForum();
    expect(screen.getByRole('status')).toHaveTextContent(/loading messages/i);
    expect(await screen.findByText(NASA[0].text)).toBeInTheDocument();
  });

  it('defaults to nasa and renders messages as <dt>/<dd> pairs in a <dl>', async () => {
    const { container } = renderForum();
    expect(screen.getByRole('heading', { level: 1, name: /forum channels/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'nasa' })).toHaveAttribute('aria-pressed', 'true');

    await screen.findByText(NASA[0].text);
    const list = container.querySelector('dl.message-list');
    expect(list).not.toBeNull();
    expect(within(list).getByText(NASA[0].text).tagName).toBe('DD');
    expect(within(list).getByText(NASA[0].author).closest('dt')).not.toBeNull();
  });

  it('switches channel, syncs ?channel= and never shows the previous channel', async () => {
    const user = userEvent.setup();
    renderForum();
    await screen.findByText(NASA[0].text);

    await user.click(screen.getByRole('button', { name: 'esports-tribunal' }));

    expect(screen.getByRole('button', { name: 'esports-tribunal' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'nasa' })).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByTestId('location')).toHaveTextContent('?channel=esports-tribunal');
    expect(screen.queryByText(NASA[0].text)).toBeNull();
    expect(await screen.findByText(TRIBUNAL[0].text)).toBeInTheDocument();
  });

  it('supports deep links through ?channel=', async () => {
    renderForum('/forum?channel=esports-tribunal');
    expect(await screen.findByText(TRIBUNAL[0].text)).toBeInTheDocument();
  });

  it('shows a 404 alert for the unknown notNasa channel', async () => {
    const user = userEvent.setup();
    renderForum();
    await user.click(screen.getByRole('button', { name: 'notNasa' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/unknown forum/i);
  });
});

describe('ForumPage — post message form', () => {
  it('validates synchronously and does not POST an empty message', async () => {
    const user = userEvent.setup();
    renderForum();
    await screen.findByText(NASA[0].text);

    await user.click(screen.getByRole('button', { name: /post message/i }));

    const alerts = screen.getAllByRole('alert');
    expect(alerts.map((a) => a.textContent).join(' ')).toMatch(/author is required/i);
    expect(alerts.map((a) => a.textContent).join(' ')).toMatch(/message is required/i);
    expect(postRequests()).toHaveLength(0);
  });

  it('posts a new message, clears the text field and shows it after the refetch', async () => {
    const user = userEvent.setup();
    renderForum();
    await screen.findByText(NASA[0].text);

    await user.type(screen.getByLabelText('Author'), 'Tú');
    await user.type(screen.getByLabelText('Message'), 'Hello NASA');
    await user.click(screen.getByRole('button', { name: /post message/i }));

    expect(await screen.findByText('Hello NASA')).toBeInTheDocument();
    expect(postRequests()).toHaveLength(1);
    expect(screen.getByLabelText('Message')).toHaveValue('');
  });
});