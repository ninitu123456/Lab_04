import { useSearchParams } from 'react-router';
import { useForumMessages } from './useForumMessages';
import { CHANNELS, DEFAULT_CHANNEL } from './channels';
import MessageList from './MessageList';
import PostMessageForm from './PostMessageForm';

export default function ForumPage() {
  // Kênh hiện tại sống trên URL (?channel=...) → deep link + nút Back hoạt động
  const [searchParams, setSearchParams] = useSearchParams();
  const channel = searchParams.get('channel') || DEFAULT_CHANNEL;

  const { data, loading, error, postMessage } = useForumMessages(channel);

  // Hiện list khi đã tải xong, hoặc khi đang refetch CÙNG kênh mà đã có data
  const showList = !error && (!loading || data.length > 0);

  return (
    <section className="forum-page">
      <header className="forum-header">
        <h1>Forum Channels</h1>
        <p className="placeholder">
          Switch channels quickly — in-flight requests are cancelled with AbortController.
        </p>
      </header>

      <div className="channel-switcher" role="group" aria-label="Channels">
        {CHANNELS.map((id) => (
          <button
            key={id}
            type="button"
            className="channel-button"
            aria-pressed={id === channel}
            onClick={() => setSearchParams({ channel: id })}
          >
            {id}
          </button>
        ))}
      </div>

      <div className="forum-feed">
        {loading && (
          <p role="status" className="forum-status">Loading messages…</p>
        )}
        {!loading && error && (
          <p role="alert" className="forum-error">
            Could not load #{channel}: {error}
          </p>
        )}
        {showList && <MessageList messages={data} />}
      </div>

      <PostMessageForm channel={channel} onPost={postMessage} />
    </section>
  );
}