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

## 7. Sprint 2 Contract — Context Form Engine (Ex 1.6)

### 7.1 Anti-pattern cần loại bỏ
Chuỗi 5 `useEffect` giữa `InputField` và `SimpleForm` (syncToParent → validateField → calcFormValidity → syncErrorsToChild → autoScrollToError) gây 5 lần re-render cho mỗi phím gõ, race condition và lỗi "Maximum update depth exceeded".
**Giải pháp:** errors và isValid là *derived state*, được tính đồng bộ trong render bằng một hàm thuần `validateForm()`.

### 7.2 Route
| Path | Layout | Element |
|---|---|---|
| `/form` | `RootLayout` | `SimpleForm` |

Thanh điều hướng chính có thêm `NavLink` "Form".

### 7.3 Data & validation rules
`values = { fullName, email, age, password, confirmPassword }` (đều là string, khởi tạo rỗng).

| Field | Rule | Message |
|---|---|---|
| `fullName` | bắt buộc, ≥ 2 ký tự (sau trim) | `Full name is required` / `Full name must be at least 2 characters` |
| `email` | bắt buộc, khớp `/^[^\s@]+@[^\s@]+\.[^\s@]+$/` | `Email is required` / `Email is invalid` |
| `age` | bắt buộc, số nguyên 16–100 | `Age is required` / `Age must be an integer between 16 and 100` |
| `password` | ≥ 8 ký tự và có ít nhất 1 chữ số | `Password is required` / `Password must be at least 8 characters and contain a number` |
| `confirmPassword` | trùng `password` (cross-field) | `Please confirm your password` / `Passwords do not match` |

`validateForm(values, rules = FORM_RULES) → { [field]: message }`: hàm thuần, đồng bộ, không side effect.

### 7.4 Component contracts
- `FormContext.js`
  - `export const FormContext = createContext(null)`
  - `export const useFormContext()`: throw Error nếu dùng ngoài Provider.
- `SimpleForm.jsx`
  - State: `values`, `touched`, `submitAttempted`, `submittedData`.
  - `errors = useMemo(() => validateForm(values), [values])`, `isValid = Object.keys(errors).length === 0`.
  - `<FormContext.Provider value={{ values, errors, touched, submitAttempted, handleChange, handleBlur }}>`.
  - **0 lần gọi `useEffect`.**
  - Submit không hợp lệ → `submitAttempted = true` (hiện toàn bộ lỗi). Submit hợp lệ → lưu snapshot (ẩn password, bỏ confirmPassword) và render `<ShowData data={submittedData} />`.
  - `<form noValidate>` để validation do engine kiểm soát.
- `InputField.jsx({ name, label, type = 'text', ...props })`
  - `useId()` gắn `<label htmlFor>` ↔ `<input id>`.
  - Đọc `value`, `onChange`, `onBlur`, lỗi từ `useFormContext()`.
  - Chỉ hiện lỗi khi `touched[name] || submitAttempted`.
  - `aria-invalid={!!error}`, `aria-describedby={error ? `${id}-error` : undefined}`, lỗi nằm trong `<span id={`${id}-error`} role="alert">`.
- `ShowData.jsx({ data = {} })`
  - `<dl className="json-inspector">`, mỗi key là `<div className="data-row"><dt>key</dt><dd>{String(val)}</dd></div>`.

### 7.5 Acceptance
- Toàn bộ test Vitest xanh, gồm cả test tĩnh "zero useEffect" cho `SimpleForm.jsx` và `InputField.jsx`.
- 1 phím gõ = 1 lần render; không có "Maximum update depth exceeded"; Console không warning.

## 8. Sprint 3 Contract — useForumMessages & Express REST API (Ex 1.7.1)

### 8.1 REST API (`server/`, mặc định port 4000)
| Method | Path | Body | Response |
|---|---|---|---|
| `GET` | `/api/messages/:forum` | — | `200 Message[]` (cũ → mới) · `404 { error: 'Unknown forum' }` |
| `POST` | `/api/messages/:forum` | `{ author, text }` | `201 Message` · `400 { error: 'Missing required fields' }` · `400 { error: 'Invalid payload' }` · `404 { error: 'Unknown forum' }` |
| bất kỳ | route khác | — | `404 { error: 'Not found' }` |

- `Message = { id: string (crypto.randomUUID()), forum, author, text, timestamp: ISO string }`
- Forum tồn tại: `nasa`, `esports-tribunal`. **`notNasa` cố ý không tồn tại** → 404, dùng để kiểm chứng đường lỗi full-stack.
- Validation POST:
  - `author`: string, 1–50 ký tự sau trim.
  - `text`: string, 1–500 ký tự sau trim.
  - Chỉ lấy đúng 2 field này (whitelist), **không** spread `...req.body`. Nhờ vậy client không thể ghi đè `id` hay `timestamp`.
- Middleware:
  - `cors({ origin: CLIENT_ORIGIN })`, mặc định `http://localhost:5173`.
  - `express.json({ limit: '10kb' })`.
  - Request logger.
  - 404 handler.
  - Error handler: JSON hỏng → `400 { error: 'Malformed JSON' }`, lỗi khác → `500`.
- Config: `PORT`, `CLIENT_ORIGIN` đọc từ `process.env`, không hard-code secret.
- Storage: store in-memory với API async `hasForum()`, `getMessagesByForum()`, `addMessage()`, mô phỏng Mongoose 8 `async/await` (Homework 2 sẽ thay bằng MongoDB).

### 8.2 Hook contract — `useForumMessages(forumId) → { data, loading, error, postMessage }`
- Tạo `AbortController` trong effect; cleanup gọi `controller.abort()`.
- Mọi `setState` được bọc guard `!controller.signal.aborted` trong `try / catch / finally`.
- Response không phải 2xx → throw và expose `error`. `AbortError` không bao giờ được log hay hiển thị.
- `loading` / `data` / `error` được **derive** từ kết quả gần nhất, gắn với key `forumId#version`. Nhờ vậy UI không bao giờ hiện tin nhắn của kênh cũ.
- `postMessage(payload)`: gửi `POST`. Thành công → tăng `version` → refetch. Lỗi → `throw new Error(message)` để component tự xử lý (không để unhandled rejection).
- API base: `import.meta.env.VITE_API_URL ?? 'http://localhost:4000'`.

### 8.3 UI contract — `ForumPage` tại `/forum`
- Channel switcher gồm 3 nút `nasa` / `esports-tribunal` / `notNasa`, có `aria-pressed`. Kênh được đồng bộ với `?channel=` qua `useSearchParams()`, mặc định `nasa`.
- Danh sách tin nhắn: `<dl className="message-list">`, mỗi tin là `<React.Fragment key={msg.id}><dt>author + <time></dt><dd>text</dd></React.Fragment>`.
- Trạng thái:
  - Đang tải → `role="status"` "Loading messages…"
  - Lỗi → `role="alert"`
  - Rỗng → "No messages yet."
- Form gửi tin: `author` + `text`, validate đồng bộ (derived). Lỗi từ server hiển thị bằng `role="alert"`.

### 8.4 Acceptance
- Test của `server/` và `client/` đều xanh.
- DevTools → Network → **Slow 3G**: bấm đổi kênh liên tục thì request cũ hiện **(canceled)**, UI không bao giờ hiện tin nhắn của kênh trước.
- Kênh `notNasa`:
  - UI hiện lỗi 404.
  - Console có đúng 1 dòng `console.error`.
  - Server log có dòng `GET /api/messages/notNasa 404`.
- Không có unhandled promise rejection.