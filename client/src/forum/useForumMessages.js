import { useEffect, useState } from 'react';
import { API_BASE_URL } from '../config';

const INITIAL_RESULT = { key: null, forumId: null, data: [], error: null };

const messagesUrl = (forumId) => `${API_BASE_URL}/api/messages/${encodeURIComponent(forumId)}`;

async function readErrorMessage(res) {
  const body = await res.json().catch(() => ({}));
  return body.error ?? `HTTP ${res.status}`;
}

export function useForumMessages(forumId) {
  // Kết quả settled gần nhất, gắn với key của request đã sinh ra nó
  const [result, setResult] = useState(INITIAL_RESULT);
  const requestKey = forumId;

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
    // Cleanup: huỷ request đang bay khi forumId đổi hoặc component unmount
    return () => controller.abort();
  }, [forumId, requestKey]);

  // Derived state — không có setLoading(true) đồng bộ trong effect
  const loading = result.key !== requestKey;
  const data = result.forumId === forumId ? result.data : [];
  const error = loading ? null : result.error;

  return { data, loading, error };
}