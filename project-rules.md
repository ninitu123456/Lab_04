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

## 6. Sprint 1 Contract — Router & Master-Detail (Ex 1.2, 1.3, 1.3.1, 1.3.2)

### 6.1 Route map
| Path | Layout | Element |
|---|---|---|
| `/` | `RootLayout` | `Home` (index) |
| `/about` | `RootLayout` | `About` |
| `/people` | `RootLayout > PeopleLayout` | `PeopleIndex` (index) |
| `/people/:id` | `RootLayout > PeopleLayout` | `PersonDetail` (React.lazy + Suspense) |
| `*` | `RootLayout` | `NotFound` (404 toàn cục) |

### 6.2 Data contract
`Person = { id: string (slug), name: string, role: string, team: string, email: string, location: string }`

### 6.3 Component contracts
- `PeopleLayout({ people = [] })`
  - `<nav aria-label="People directory">` render một `NavLink` cho mỗi person, `to="/people/:id"`.
  - `className={({ isActive }) => isActive ? 'active-link' : 'link'}`; link đang active có `aria-current="page"`.
  - Child route render qua `<Outlet />` bên trong `<section className="content-area">`.
- `PersonDetail({ people = [] })`
  - Lấy `id` bằng `useParams()`, tìm bằng `people.find(p => p.id === id)`.
  - Không tìm thấy → `NotFoundState` có `role="alert"` chứa "404".
  - Tìm thấy → `<h2>` tên + `<dl className="person-details">` gồm các cặp `<dt>/<dd>`: Name, Role, Team, Email, Location.
- `PersonDetailSkeleton({ rows = PERSON_FIELDS.length })`
  - `role="status"`, `aria-busy="true"`, `aria-live="polite"`.
  - Kích thước khớp `PersonDetail` để CLS = 0.

### 6.4 Layout contract
- `.people-frame { display: grid; grid-template-columns: minmax(280px, 1fr) 2fr; }`
- Màn hình dưới 720px chuyển về 1 cột.

### 6.5 Acceptance
- Toàn bộ test Vitest xanh.
- Console DevTools không warning; `/people/:id` parse đúng, id sai → 404.