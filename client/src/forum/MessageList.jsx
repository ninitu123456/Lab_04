import { Fragment } from 'react';

const formatTime = (iso) =>
  new Date(iso).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' });

export default function MessageList({ messages = [] }) {
  if (messages.length === 0) {
    return <p className="placeholder">No messages yet.</p>;
  }

  return (
    <dl className="message-list">
      {messages.map((msg) => (
        // Semantic keyed <React.Fragment key={msg.id}> inside <dl>
        <Fragment key={msg.id}>
          <dt>
            <span className="message-author">{msg.author}</span>
            <time dateTime={msg.timestamp}>{formatTime(msg.timestamp)}</time>
          </dt>
          <dd>{msg.text}</dd>
        </Fragment>
      ))}
    </dl>
  );
}