// Đọc từ biến môi trường Vite (VITE_API_URL), fallback về Express dev server
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';