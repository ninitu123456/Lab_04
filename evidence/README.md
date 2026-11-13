# Evidence — Lab 04

> Sinh viên: Nguyễn Ngọc Thiên Tú — MSSV 24521911

Ảnh PNG và log trong thư mục này đều do [`tools/evidence/capture.mjs`](../tools/evidence/capture.mjs) sinh tự động trên app thật: Express ở port 4000 và Vite dev ở port 5173, chụp bằng Chromium headless của Playwright 1.65. Viewport desktop là 1280×800, mobile là 375×812. Ảnh UI chụp full page.

Ảnh có tên kết thúc bằng log (`*-tests`, `*-network`, `*-console`, `*-server-log`) được render từ file `.txt` trong `logs/` thành trang `<pre>` nền tối. Nội dung giữ nguyên văn.

## Ex 1 — Router v7, master-detail, code splitting

| Ảnh | Chứng minh | Yêu cầu slide |
|---|---|---|
| [01-home.png](exercise-1/01-home.png) | `RootLayout` + `NavLink` (Home active nhờ `end`) + `<Outlet />` | Ex 1.3 |
| [02-people-index.png](exercise-1/02-people-index.png) | `/people`: sidebar `PeopleLayout` + index route "Select a person…" | Ex 1.3, 1.3.1 |
| [03-person-detail.png](exercise-1/03-person-detail.png) | `/people/le-hoang-cuong`: `useParams()`, `NavLink` active (`aria-current="page"`), `<dl>` chi tiết | Ex 1.3.1, 1.3.2 |
| [04-person-404.png](exercise-1/04-person-404.png) | `/people/khong-ton-tai` → alert "404 Person Not Found" | Ex 1.3.2 |
| [05-global-404.png](exercise-1/05-global-404.png) | `/khong-ton-tai` → route `*` 404 toàn cục | Ex 1.3 |
| [06-suspense-skeleton.png](exercise-1/06-suspense-skeleton.png) | `<Suspense fallback={<PersonDetailSkeleton />}>`. `page.route` giữ request `PersonDetail.jsx` lại cho tới khi chụp xong | Ex 1.2 |
| [07-people-mobile.png](exercise-1/07-people-mobile.png) | 375×812: CSS Grid về 1 cột (`grid-template-columns: 343px`) | Ex 1.3.1 |
| [08-code-splitting-network.png](exercise-1/08-code-splitting-network.png) | [logs/chunks.txt](logs/chunks.txt): `/people` **không** tải `PersonDetail.jsx`; click NavLink mới tải. `vite build` tách ra chunk `PersonDetail-*.js` riêng | Ex 1.2 |
| [09-client-tests.png](exercise-1/09-client-tests.png) | [logs/client-tests.txt](logs/client-tests.txt): 11 files, 51/51 passed | Ex 1.2, 1.3, 1.3.1, 1.3.2 |

## Ex 2 — Context Form Engine

| Ảnh | Chứng minh | Yêu cầu slide |
|---|---|---|
| [01-form-empty.png](exercise-2/01-form-empty.png) | `/form` chưa tương tác: không có lỗi nào | Ex 1.6 |
| [02-field-blur-error.png](exercise-2/02-field-blur-error.png) | Focus rồi blur ô Email → chỉ hiện "Email is required" (`touched`) | Ex 1.6 |
| [03-submit-empty-errors.png](exercise-2/03-submit-empty-errors.png) | Submit khi trống → 5 lỗi (`submitAttempted`) | Ex 1.6 |
| [04-cross-field-mismatch.png](exercise-2/04-cross-field-mismatch.png) | Validate chéo field → "Passwords do not match" | Ex 1.6 |
| [05-valid-submit-showdata.png](exercise-2/05-valid-submit-showdata.png) | Submit hợp lệ → `<ShowData />`: password bị che, không có `confirmPassword` | Ex 1.6 |
| [06-form-mobile.png](exercise-2/06-form-mobile.png) | `/form` ở 375×812 | Ex 1.6 |
| [07-client-tests-form.png](exercise-2/07-client-tests-form.png) | Trích các dòng `src/form/` và dòng tổng kết của `client-tests.txt`, có test "contains zero useEffect calls" | Ex 1.6 |

## Ex 3 — `useForumMessages` + Express REST API

| Ảnh | Chứng minh | Yêu cầu slide |
|---|---|---|
| [01-forum-nasa.png](exercise-3/01-forum-nasa.png) | `/forum` mặc định `nasa`, danh sách `<dl className="message-list">` | Ex 1.7.1 |
| [02-forum-esports-tribunal.png](exercise-3/02-forum-esports-tribunal.png) | Đổi kênh → URL `?channel=esports-tribunal` | Ex 1.7.1 |
| [03-forum-notnasa-404.png](exercise-3/03-forum-notnasa-404.png) | `notNasa` → alert "Could not load #notNasa: Unknown forum" | Ex 1.7.1 |
| [04-loading-slow3g.png](exercise-3/04-loading-slow3g.png) | Slow 3G (CDP: latency 2000 ms, 50000 B/s) → "Loading messages…" | Ex 1.7.1 |
| [05-abort-canceled-requests.png](exercise-3/05-abort-canceled-requests.png) | [logs/abort-network.txt](logs/abort-network.txt): đổi kênh 4 lần → 3 request `net::ERR_ABORTED`, 1 request hoàn tất | Ex 1.7.1 |
| [05b-after-rapid-switch.png](exercise-3/05b-after-rapid-switch.png) | Sau khi đổi nhanh, UI chỉ hiện kênh cuối (`nasa`) | Ex 1.7.1 |
| [06-post-validation.png](exercise-3/06-post-validation.png) | "Author is required" + "Message is required", không gửi request | Ex 1.7.1 |
| [07-post-success.png](exercise-3/07-post-success.png) | POST 201 → refetch → tin mới hiện trong danh sách | Ex 1.7.1 |
| [08-post-notnasa-error.png](exercise-3/08-post-notnasa-error.png) | POST `notNasa` → "Could not post: Unknown forum" | Ex 1.7.1 |
| [09-browser-console.png](exercise-3/09-browser-console.png) | [logs/browser-console.txt](logs/browser-console.txt): 1 dòng `[useForumMessages] GET notNasa failed`, không có `AbortError` / `Uncaught (in promise)` | Ex 1.7.1 |
| [10-server-log.png](exercise-3/10-server-log.png) | [logs/server-log.txt](logs/server-log.txt): `GET …/notNasa 404`, `POST …/nasa 201`, `POST …/notNasa 404` | Ex 1.7.1 |
| [11-server-tests.png](exercise-3/11-server-tests.png) | [logs/server-tests.txt](logs/server-tests.txt): 10/10 passed | Ex 1.7.1 |
| [12-forum-mobile.png](exercise-3/12-forum-mobile.png) | `/forum` ở 375×812 | Ex 1.7.1 |

Phân tích chi tiết log nằm trong [docs/SPRINT3_ERROR_LOG.md](../docs/SPRINT3_ERROR_LOG.md).

## Logs

| File | Nguồn |
|---|---|
| `logs/server-tests.txt` | `cd server && npm run test:run -- --reporter=verbose` (đặt `NO_COLOR=1`) |
| `logs/client-tests.txt` | `cd client && npm run test:run -- --reporter=verbose` (đặt `NO_COLOR=1`) |
| `logs/chunks.txt` | Request JS (`resourceType === 'script'`) ở `/people` và sau khi click sang `/people/:id`, kèm output `vite build` vào thư mục tạm. Đường dẫn tạm được thay bằng `<tmp-outDir>` |
| `logs/abort-network.txt` | `page.on('request' / 'requestfinished' / 'requestfailed')` cho mọi `/api/messages` |
| `logs/browser-console.txt` | `page.on('console')` + `page.on('pageerror')` trong phiên forum |
| `logs/server-log.txt` | stdout/stderr của `npm run dev` trong `server/` suốt lần chụp |
| `logs/capture-summary.txt` | 22 phép tự kiểm của script, tất cả PASS |

## Ghi chú trung thực

- Có đủ 29 ảnh. Không có ảnh nào phải giả lập hay sửa tay.
- Ảnh 08 (Ex 1): Vite dev phục vụ ESM chưa bundle, nên "chunk" ở dev là module `PersonDetail.jsx` riêng. Bằng chứng dạng chunk thật lấy từ `vite build` (`PersonDetail-*.js`), được ghi trong cùng file log.
- Ảnh 07 (Ex 2) là **trích đoạn** của `client-tests.txt`: lọc các dòng chứa `src/form/` và dòng tổng kết. File đầy đủ ở ảnh 09 (Ex 1).
- Ex 3: script reload `/forum?channel=esports-tribunal` trước bước Slow 3G. Ở lần chạy đầu, ảnh 04 còn dính lỗi "Could not post" của `notNasa` vì `serverError` không reset khi đổi kênh. Vấn đề này được ghi ở AI-19 và chưa sửa.
- Console có thêm 2 dòng `Failed to load resource … 404` do Chromium tự sinh cho response 4xx. Đây không phải `console.error` của app.
- Server log có 3 request `GET` đầu từ chính script (kiểm tra server sẵn sàng và lấy seed). Slow 3G chỉ throttle phía trình duyệt nên server vẫn log `200`/`304` cho các request client đã huỷ.

## Chạy lại

```bash
# 1. Log test (bắt buộc có trước khi chụp) — Git Bash, từ thư mục gốc repo
(cd server && NO_COLOR=1 npm run test:run -- --reporter=verbose > ../evidence/logs/server-tests.txt 2>&1)
(cd client && NO_COLOR=1 npm run test:run -- --reporter=verbose > ../evidence/logs/client-tests.txt 2>&1)

# 2. Cài tool (một lần) và chụp
cd tools/evidence
npm install
npx playwright install chromium
npm run capture
```

Yêu cầu: port 4000 và 5173 phải trống. Script tự chạy `npm run dev` cho `server/` và `client/`, đợi cả hai sẵn sàng, chụp xong thì tắt cả hai (`taskkill /T /F` trên Windows). Exit code khác 0 nếu có check FAIL.
