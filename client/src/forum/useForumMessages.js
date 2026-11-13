import { useCallback, useEffect, useState } from 'react';
import { API_BASE_URL } from '../config';

const INITIAL_RESULT = { key: null, forumId: null, data: [], error: null };

const messagesUrl = (forumId) => `${API_BASE_URL}/api/messages/${encodeURIComponent(forumId)}`;

async function readErrorMessage(res) {
  const body = await res.json().catch(() => ({}));
  return body.error ?? `HTTP ${res.status}`;
}

export function useForumMessages(forumId) {
  // version tăng sau mỗi POST thành công → đổi requestKey → effect refetch
  const [version, setVersion] = useState(0);
  // Kết quả settled gần nhất, gắn với key của request đã sinh ra nó
  const [result, setResult] = useState(INITIAL_RESULT);
  const requestKey = `${forumId}#${version}`;

  useEffect(() => {
    // AbortController instantiation inside the effect
    const controller = new AbortController();

    const fetchMessages = async () => {
      let next = null;
      try {
        const res = await fetch(messagesUrl(forumId), { signal: controller.signal });
        // fetch KHÔNG reject với 4xx/5xx → phải tự kiểm tra res.ok
        if (!res.ok) throw new Error(await readErrorMessage(res));
        next = { data: await res.json(), error: null };
      } catch (err) {
        // signal.aborted guard: request bị huỷ do đổi kênh/unmount → im lặng
        if (!controller.signal.aborted) {
          console.error(`[useForumMessages] GET ${forumId} failed:`, err);
          next = { data: [], error: err.message };
        }
      } finally {
        // signal.aborted guard: không bao giờ setState từ request đã bị huỷ
        if (!controller.signal.aborted && next) {
          setResult({ key: requestKey, forumId, ...next });
        }
      }
    };

    fetchMessages();
    // Cleanup: huỷ request đang bay khi forumId/version đổi hoặc component unmount
    return () => controller.abort();
  }, [forumId, requestKey]);

  // Integrated POST helper → trigger refetch
  const postMessage = useCallback(
    async (payload) => {
      const res = await fetch(messagesUrl(forumId), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        // Ném lỗi có message rõ ràng — component gọi phải try/catch (không unhandled rejection)
        throw new Error(await readErrorMessage(res));
      }
      const created = await res.json();
      setVersion((v) => v + 1);
      return created;
    },
    [forumId]
  );

  // Derived state — không có setLoading(true) đồng bộ trong effect
  const loading = result.key !== requestKey;
  // Giữ data cũ của CÙNG kênh khi đang refetch sau POST (không nhấp nháy rỗng),
  // nhưng không bao giờ hiện data của kênh KHÁC
  const data = result.forumId === forumId ? result.data : [];
  const error = loading ? null : result.error;

  return { data, loading, error, postMessage };
}