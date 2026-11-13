# AI_FAILURE_AUDIT.md — Lab 04

> Ghi lại mọi đoạn code do AI sinh ra bị sai / không chạy, cách phát hiện và cách sửa.
> Loại lỗi: Syntax · Hallucinated API · Deprecated API · Effect loop · Security · A11y · Logic

| ID | Sprint | File / vị trí | AI đã sinh ra | Loại lỗi | Cách phát hiện | Cách sửa (Engineering Verification) |
|---|---|---|---|---|---|---|
| AI-01 | S1 | Layout (slide 10) | `const Layout = () => (<nav>…</nav><Outlet />)` | Syntax | Vite báo "Adjacent JSX elements must be wrapped in an enclosing tag" | Bọc trong `<div className="app-shell">` (RootLayout.jsx) |
| AI-02 | S1 | NavLink (slide 10) | `<NavLink className=…>Home</NavLink>` thiếu `to` | Hallucinated API | Đối chiếu docs React Router v7: `to` là prop bắt buộc | Thêm `to="/"` |
| AI-03 | S1 | NavLink `/` | Không có `end` → Home luôn active ở mọi route | Logic | Vào `/people` thấy cả Home và People cùng active | Thêm prop `end` cho NavLink `/` |
| AI-04 | S1 | PeopleLayout (slide 23) | `// Render layout frame…` viết thẳng trong JSX | Syntax | Dòng comment hiện thành text trên UI | Đổi sang `{/* … */}` |
| AI-05 | S1 | PeopleLayout (slide 23) | `<main>` lồng trong `<main>` của RootLayout | A11y | Accessibility tree trong DevTools có 2 landmark `main` | Đổi thành `<section className="content-area">` |