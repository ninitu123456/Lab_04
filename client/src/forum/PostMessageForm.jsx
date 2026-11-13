import { useId, useState } from 'react';

// Khớp giới hạn của server (validateMessage.js) → client & server validation parity
const LIMITS = { author: 50, text: 500 };

function validateMessage({ author, text }) {
  const errors = {};
  if (!author.trim()) errors.author = 'Author is required';
  else if (author.trim().length > LIMITS.author) errors.author = `Author must be at most ${LIMITS.author} characters`;

  if (!text.trim()) errors.text = 'Message is required';
  else if (text.trim().length > LIMITS.text) errors.text = `Message must be at most ${LIMITS.text} characters`;
  return errors;
}

export default function PostMessageForm({ channel, onPost }) {
  const id = useId();
  const authorId = `${id}-author`;
  const textId = `${id}-text`;

  const [values, setValues] = useState({ author: '', text: '' });
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState(null);

  // Derived, synchronous validation (cùng pattern Sprint 2)
  const errors = validateMessage(values);
  const isValid = Object.keys(errors).length === 0;
  const visibleErrors = submitAttempted ? errors : {};

  const handleChange = (event) => {
    const { name, value } = event.target;
    setValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitAttempted(true);
    if (!isValid || submitting) return;

    setSubmitting(true);
    setServerError(null);
    try {
      await onPost({ author: values.author.trim(), text: values.text.trim() });
      // Giữ lại author để gửi tiếp cho tiện, chỉ xoá nội dung tin nhắn
      setValues((prev) => ({ ...prev, text: '' }));
      setSubmitAttempted(false);
    } catch (err) {
      // Lỗi từ server (400/404...) được bắt tại đây → không có unhandled rejection
      setServerError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="post-form" noValidate onSubmit={handleSubmit} aria-label={`Post to #${channel}`}>
      <div className="field-group">
        <label htmlFor={authorId}>Author</label>
        <input
          id={authorId}
          name="author"
          value={values.author}
          onChange={handleChange}
          autoComplete="nickname"
          aria-invalid={!!visibleErrors.author}
          aria-describedby={visibleErrors.author ? `${authorId}-error` : undefined}
        />
        {visibleErrors.author && (
          <span id={`${authorId}-error`} className="field-error" role="alert">{visibleErrors.author}</span>
        )}
      </div>

      <div className="field-group">
        <label htmlFor={textId}>Message</label>
        <textarea
          id={textId}
          name="text"
          rows={3}
          value={values.text}
          onChange={handleChange}
          aria-invalid={!!visibleErrors.text}
          aria-describedby={visibleErrors.text ? `${textId}-error` : undefined}
        />
        {visibleErrors.text && (
          <span id={`${textId}-error`} className="field-error" role="alert">{visibleErrors.text}</span>
        )}
      </div>

      {serverError && (
        <p className="forum-error" role="alert">Could not post: {serverError}</p>
      )}

      <button type="submit" disabled={submitting}>
        {submitting ? 'Posting…' : 'Post message'}
      </button>
    </form>
  );
}