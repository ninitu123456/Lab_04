import { createApp } from './app.js';

// Config từ biến môi trường — không hard-code (xem .env.example ở thư mục gốc)
const PORT = Number(process.env.PORT) || 4000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173';

const app = createApp({ clientOrigin: CLIENT_ORIGIN });

app.listen(PORT, (error) => {
  if (error) throw error;
  console.log(`[server] API listening on http://localhost:${PORT} (CORS origin: ${CLIENT_ORIGIN})`);
});

// Lưới an toàn: ghi log mọi promise bị reject mà không ai xử lý
process.on('unhandledRejection', (reason) => {
  console.error('[server] Unhandled rejection:', reason);
});