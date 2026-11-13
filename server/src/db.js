import { randomUUID } from 'node:crypto';

// Dữ liệu mẫu cho các forum hợp lệ.
// 'notNasa' cố ý KHÔNG có ở đây → API trả 404 để kiểm chứng đường lỗi full-stack.
const SEED = {
  nasa: [
    { author: 'Mission Control', text: 'Artemis crew completed the lunar flyby checklist.', timestamp: '2026-11-10T08:00:00.000Z' },
    { author: 'JPL Ops', text: 'Europa Clipper telemetry nominal after course correction.', timestamp: '2026-11-11T09:30:00.000Z' },
    { author: 'ISS Comms', text: 'Spacewalk window confirmed for Thursday 14:00 UTC.', timestamp: '2026-11-12T14:15:00.000Z' },
  ],
  'esports-tribunal': [
    { author: 'Tribunal Clerk', text: 'Case #2026-117 opened: disputed round reset in grand final.', timestamp: '2026-11-09T10:00:00.000Z' },
    { author: 'Referee Board', text: 'Replay evidence uploaded; awaiting player statements.', timestamp: '2026-11-11T16:45:00.000Z' },
  ],
};

/**
 * Store in-memory với API async — cùng "hình dạng" async/await như Mongoose 8,
 * nên Homework 2 có thể thay bằng model MongoDB mà không phải sửa route.
 */
export function createMessageStore(seed = SEED) {
  const forums = new Map(
    Object.entries(seed).map(([forum, messages]) => [
      forum,
      messages.map((m) => ({ id: randomUUID(), forum, ...m })),
    ])
  );

  return {
    async hasForum(forum) {
      return forums.has(forum);
    },

    async getMessagesByForum(forum) {
      const messages = forums.get(forum) ?? [];
      // Trả về bản sao đã sắp xếp cũ → mới, tránh caller sửa trực tiếp state bên trong
      return structuredClone(messages).sort((a, b) => Date.parse(a.timestamp) - Date.parse(b.timestamp));
    },

    async addMessage(forum, message) {
      const messages = forums.get(forum);
      if (!messages) throw new Error(`Unknown forum: ${forum}`);
      messages.push(message);
      return structuredClone(message);
    },
  };
}