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

  return app;
}