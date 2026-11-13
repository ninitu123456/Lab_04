import { randomUUID } from 'node:crypto';
import express from 'express';
import cors from 'cors';
import { createMessageStore } from './db.js';
import { validateMessagePayload } from './validateMessage.js';

/**
 * App factory — không gọi listen() ở đây, để supertest có thể test trực tiếp.
 */
export function createApp({
  store = createMessageStore(),
  clientOrigin = 'http://localhost:5173',
  logger = console.log,
} = {}) {
  const app = express();

  // Request logger: "GET /api/messages/nasa 200 3ms" — dùng cho full-stack error log
  app.use((req, res, next) => {
    const start = performance.now();
    res.on('finish', () => {
      const ms = Math.round(performance.now() - start);
      logger(`${req.method} ${req.originalUrl} ${res.statusCode} ${ms}ms`);
    });
    next();
  });

  // CORS: chỉ cho phép origin của Vite dev server gọi API
  app.use(cors({ origin: clientOrigin }));
  // Giới hạn kích thước body để tránh payload quá lớn
  app.use(express.json({ limit: '10kb' }));

  // GET /api/messages/:forum — async/await, Express 5 tự chuyển lỗi sang error handler
  app.get('/api/messages/:forum', async (req, res) => {
    const { forum } = req.params;
    if (!(await store.hasForum(forum))) {
      return res.status(404).json({ error: 'Unknown forum' });
    }
    const messages = await store.getMessagesByForum(forum);
    res.json(messages);
  });

  // POST /api/messages/:forum — strict payload validation + server-generated id/timestamp
  app.post('/api/messages/:forum', async (req, res) => {
    const { forum } = req.params;
    if (!(await store.hasForum(forum))) {
      return res.status(404).json({ error: 'Unknown forum' });
    }

    const result = validateMessagePayload(req.body);
    if (!result.ok) {
      return res.status(400).json({ error: result.error });
    }

    const newMessage = {
      id: randomUUID(),
      forum,
      ...result.value,
      timestamp: new Date().toISOString(),
    };
    const saved = await store.addMessage(forum, newMessage);
    res.status(201).json(saved);
  });

  // 404 cho mọi route không khớp — luôn trả JSON
  app.use((req, res) => {
    res.status(404).json({ error: 'Not found' });
  });

  // Error handler tập trung (đủ 4 tham số để Express nhận diện)
  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    if (err.type === 'entity.parse.failed') {
      return res.status(400).json({ error: 'Malformed JSON' });
    }
    if (err.type === 'entity.too.large') {
      return res.status(413).json({ error: 'Payload too large' });
    }
    logger(`[error] ${req.method} ${req.originalUrl}: ${err.stack ?? err}`);
    res.status(500).json({ error: 'Internal server error' });
  });

  return app;
}