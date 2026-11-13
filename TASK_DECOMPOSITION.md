# TASK_DECOMPOSITION — Lab 04

> Sinh viên: Nguyễn Ngọc Thiên Tú — MSSV 24521911

## Timebox (180 phút)
| Block | Thời gian | Nội dung |
|---|---|---|
| 1 | 0–40m | Setup & WBS decomposition |
| 2 | 40–75m | Sprint 1 — Router migration (Ex 1.2, 1.3, 1.3.1, 1.3.2) |
| 3 | 75–120m | Sprint 2 — Context Form Engine (Ex 1.6) |
| 4 | 120–155m | Sprint 3 — useForumMessages + Express REST API (Ex 1.7.1) |
| 5 | 155–180m | Live refactoring defense & AI Failure Audit |

## Sprint 1 — Responsive Master-Detail Directory & Case Dossier Router ✅
Mục tiêu: hoàn thành contract `PeopleLayout.jsx` & `PersonDetail.jsx` bằng React Router v7 `<Outlet />` và `useParams()`.

- [x] S1-01 Scaffold Vite + React 19 + React Router v7 — `init`
- [x] S1-02 Governance docs (rules, WBS, audit, env template) — `docs` / `chore`
- [x] S1-03 Cấu hình Vitest + React Testing Library — `chore`
- [x] S1-04 Contract: route map & component props — `docs`
- [x] S1-05 Seed data `people` — `feat`
- [x] S1-06 Fail tests: App routes, PeopleLayout, PersonDetail — `test`
- [x] S1-07 RootLayout + Routes/element/NavLink (Ex 1.3, 1.3.1) — `feat`
- [x] S1-08 PeopleLayout + `<Outlet />` — `feat: router layout`
- [x] S1-09 PersonDetail + `useParams` + 404 + `<dl>` (Ex 1.3.2) — `feat: detail route handling`
- [x] S1-10 CSS Grid master-detail responsive — `style`
- [x] S1-11 Fail test cho skeleton fallback — `test`
- [x] S1-12 React.lazy + Suspense skeleton (Ex 1.2) — `perf`
- [x] S1-13 Refactor helper `navClass` — `refactor`
- [x] S1-14 Cập nhật audit & DevTools checkpoint — `docs`

### DevTools checkpoint (Sprint 1)
- [x] Console không có warning
- [x] `/people/:id` hợp lệ hiển thị đúng hồ sơ; id sai hiển thị 404
- [x] Tab Network thấy chunk `PersonDetail` tải riêng (code-splitting)

## Sprint 2 — Context-Driven Multi-Field Form Engine & Live `<ShowData />` Inspector ✅
Mục tiêu: hoàn thành contract `SimpleForm.jsx` & `InputField.jsx` dùng Context, validate đồng bộ **không có `useEffect`**, render `<ShowData />` khi submit hợp lệ.

- [x] S2-01 Contract form engine & validation rules — `docs`
- [x] S2-02 Phân rã task Sprint 2 — `docs`
- [x] S2-03 Cài `@testing-library/user-event` — `chore`
- [x] S2-04 Fail tests cho `validateForm()` — `test`
- [x] S2-05 Hàm validate thuần, đồng bộ — `feat`
- [x] S2-06 Fail tests: SimpleForm, InputField, ShowData, route `/form` — `test`
- [x] S2-07 `FormContext` + `useFormContext()` — `feat: form context`
- [x] S2-08 `InputField` với `useId`, `aria-invalid`, `aria-describedby` — `feat: input field validation`
- [x] S2-09 `SimpleForm` với derived errors, zero `useEffect` — `feat`
- [x] S2-10 `<ShowData />` JSON inspector khi submit hợp lệ — `feat: inspector output`
- [x] S2-11 Route `/form` + NavLink — `feat`
- [x] S2-12 CSS form & inspector — `style`
- [x] S2-13 Refactor field config array — `refactor`
- [x] S2-14 Cập nhật audit & DevTools checkpoint — `docs`

### DevTools checkpoint (Sprint 2)
- [x] React DevTools Profiler: 1 phím gõ = 1 lần commit render
- [x] Không có "Maximum update depth exceeded"; Console không warning
- [x] Screen reader / Accessibility tree: input có `aria-invalid` và `aria-describedby` trỏ đúng lỗi

## Sprint 3 — useForumMessages + Express REST API (Ex 1.7.1)
_TBD_