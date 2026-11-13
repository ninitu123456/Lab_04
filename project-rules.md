# project-rules.md — Lab 04: Multi-Route SPA, Context Form Engine & Full-Stack React 19

> Sinh viên: Nguyễn Ngọc Thiên Tú — MSSV 24521911

## 1. Tech stack
- React 19 + Vite (thư mục `client/`)
- React Router v7 — import từ package `react-router`
- Vitest + React Testing Library + jsdom
- (Sprint 3) Express + Mongoose 8 (thư mục `server/`)

## 2. Strict 4-Stage Contract-First Loop
1. **Contract** — viết spec interface/API trong file này trước khi code.
2. **Fail Test** — viết test tự động mô tả contract, test phải đỏ.
3. **Implement** — viết code tối thiểu để test xanh.
4. **Refactor** — làm sạch code, test vẫn phải xanh.

## 3. Atomic Git Commits
- Mỗi commit chỉ một phạm vi, theo Conventional Commits:
  `init`, `feat`, `fix`, `test`, `docs`, `style`, `refactor`, `perf`, `chore`.
- Không commit `node_modules/`, `dist/`, `.env`.

## 4. Banned (deprecated) patterns
| Không dùng | Thay bằng |
|---|---|
| `<Switch>`, `<Redirect>`, `exact`, `component={...}`, `activeClassName` (Router v5) | `<Routes>`, `<Navigate>`, `element={...}`, `NavLink className={({ isActive }) => ...}` |
| `react-media` | CSS Grid + `@media` |
| `typeface-roboto` | `@font-face` / web font loader |
| `Component.defaultProps` | Default parameter `function C({ x = 1 })` |
| `@material-ui/core` (MUI v4) | HTML ngữ nghĩa / headless primitives |
| `useEffect` để validate / đồng bộ state dẫn xuất | Tính toán đồng bộ trong render (`useMemo` nếu nặng) |
| Cờ `didCancel` | `AbortController` + `signal` |
| Connection string hard-code | `process.env.MONGODB_URI` |
| Mongoose callback `(err, doc) => ...` | `async/await` + `.exec()` |

## 5. Accessibility & quality gates
- HTML ngữ nghĩa (`nav`, `main`, `section`, `dl/dt/dd`); mỗi trang chỉ một landmark `<main>`.
- Nút chỉ có icon bắt buộc có `aria-label`.
- Console DevTools không có warning; không có unhandled promise rejection.