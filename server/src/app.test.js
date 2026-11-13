import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from './app.js';
import { createMessageStore } from './db.js';

const ORIGIN = 'http://localhost:5173';
const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

let app;

// Mỗi test dùng một store mới → các test POST không ảnh hưởng lẫn nhau
beforeEach(() => {
  app = createApp({ store: createMessageStore(), clientOrigin: ORIGIN, logger: () => {} });
});

describe('GET /api/messages/:forum', () => {
  it('returns seeded messages for an existing forum, oldest first', async () => {
    const res = await request(app).get('/api/messages/nasa');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body.every((m) => m.forum === 'nasa')).toBe(true);

    const times = res.body.map((m) => Date.parse(m.timestamp));
    expect(times).toEqual([...times].sort((a, b) => a - b));
  });

  it('returns 404 for the intentionally missing notNasa forum', async () => {
    const res = await request(app).get('/api/messages/notNasa');
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Unknown forum' });
  });

  it('sends CORS headers for the Vite dev origin', async () => {
    const res = await request(app).get('/api/messages/nasa').set('Origin', ORIGIN);
    expect(res.headers['access-control-allow-origin']).toBe(ORIGIN);
  });
});

describe('POST /api/messages/:forum', () => {
  it('creates a message with crypto.randomUUID() and an ISO timestamp', async () => {
    const res = await request(app)
      .post('/api/messages/esports-tribunal')
      .send({ author: '  Tú ', text: ' Hello tribunal ' });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ forum: 'esports-tribunal', author: 'Tú', text: 'Hello tribunal' });
    expect(res.body.id).toMatch(UUID_V4);
    expect(new Date(res.body.timestamp).toISOString()).toBe(res.body.timestamp);

    const list = await request(app).get('/api/messages/esports-tribunal');
    expect(list.body.at(-1).id).toBe(res.body.id);
  });

  it('rejects missing or blank fields with 400', async () => {
    const missing = await request(app).post('/api/messages/nasa').send({ author: 'Tú' });
    expect(missing.status).toBe(400);
    expect(missing.body).toEqual({ error: 'Missing required fields' });

    const blank = await request(app).post('/api/messages/nasa').send({ author: 'Tú', text: '   ' });
    expect(blank.status).toBe(400);
    expect(blank.body).toEqual({ error: 'Missing required fields' });
  });

  it('rejects non-string or oversized fields with 400', async () => {
    const wrongType = await request(app).post('/api/messages/nasa').send({ author: 123, text: 'hi' });
    expect(wrongType.status).toBe(400);
    expect(wrongType.body).toEqual({ error: 'Invalid payload' });

    const tooLong = await request(app).post('/api/messages/nasa').send({ author: 'Tú', text: 'x'.repeat(501) });
    expect(tooLong.status).toBe(400);
    expect(tooLong.body).toEqual({ error: 'Invalid payload' });
  });

  it('ignores client-supplied id and timestamp (whitelisted payload)', async () => {
    const res = await request(app)
      .post('/api/messages/nasa')
      .send({ author: 'Tú', text: 'hi', id: 'hacked', timestamp: '1999-01-01T00:00:00.000Z' });

    expect(res.status).toBe(201);
    expect(res.body.id).toMatch(UUID_V4);
    expect(res.body.timestamp).not.toBe('1999-01-01T00:00:00.000Z');
  });

  it('returns 404 when posting to an unknown forum', async () => {
    const res = await request(app).post('/api/messages/notNasa').send({ author: 'Tú', text: 'hi' });
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Unknown forum' });
  });

  it('returns 400 for malformed JSON instead of crashing', async () => {
    const res = await request(app)
      .post('/api/messages/nasa')
      .set('Content-Type', 'application/json')
      .send('{"author":');
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'Malformed JSON' });
  });
});

describe('fallback handlers', () => {
  it('returns a JSON 404 for unknown routes', async () => {
    const res = await request(app).get('/api/does-not-exist');
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Not found' });
  });
});