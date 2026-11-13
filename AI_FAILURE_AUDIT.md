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
| AI-06 | S2 | FormContext.js (slide 24) | Viết JSX `<FormContext.Provider>` trực tiếp trong file `.js` | Syntax | Vite/esbuild báo lỗi parse JSX trong file `.js` | `FormContext.js` chỉ chứa `createContext` + `useFormContext()`; Provider chuyển sang `SimpleForm.jsx` |
| AI-07 | S2 | InputField.jsx (slide 25) | `<input id aria-invalid aria-describedby />` không có `value`/`onChange`, không spread `...props` | Logic | Gõ vào ô nhưng form không nhận giá trị; test `handleChange` không được gọi | Đọc `values`, `handleChange`, `handleBlur` từ `useFormContext()`, spread `...props` |
| AI-08 | S2 | InputField.jsx (slide 25) | Hiện lỗi ngay khi render lần đầu (không kiểm tra touched) | A11y / UX | Mở `/form` thấy cả 5 ô báo đỏ và screen reader đọc 5 alert | Derived `error = touched[name] \|\| submitAttempted ? errors[name] : undefined` |
| AI-09 | S2 | FormContext.tsx (slide 14) | Gọi một `useId()` ở Provider rồi dùng chung `fieldId` cho mọi field | Hallucinated API usage | DevTools Elements thấy nhiều input trùng `id`, label trỏ sai ô | Gọi `useId()` riêng trong từng `InputField` |
| AI-10 | S2 | SimpleForm (Ex 1.6 legacy) | Chuỗi 5 `useEffect` (sync → validate → validity → syncErrors → scroll) | Effect loop | Profiler thấy 5 lần commit cho 1 phím gõ; lỗi "Maximum update depth exceeded" | `errors = useMemo(() => validateForm(values), [values])`; test tĩnh đảm bảo 0 `useEffect` |