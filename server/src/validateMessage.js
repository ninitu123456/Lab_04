export const MESSAGE_LIMITS = { author: 50, text: 500 };
const FIELDS = ['author', 'text'];

const isBlank = (value) =>
  value === undefined || value === null || (typeof value === 'string' && value.trim() === '');

/**
 * Strict POST payload validation.
 * Trả về { ok: true, value } với payload đã whitelist + trim,
 * hoặc { ok: false, error } để route trả 400.
 */
export function validateMessagePayload(body) {
  const payload = body ?? {};

  if (FIELDS.some((field) => isBlank(payload[field]))) {
    return { ok: false, error: 'Missing required fields' };
  }

  const invalid = FIELDS.some(
    (field) => typeof payload[field] !== 'string' || payload[field].trim().length > MESSAGE_LIMITS[field]
  );
  if (invalid) {
    return { ok: false, error: 'Invalid payload' };
  }

  // Whitelist: chỉ lấy author + text, bỏ mọi field client tự gửi (id, timestamp...)
  return { ok: true, value: { author: payload.author.trim(), text: payload.text.trim() } };
}