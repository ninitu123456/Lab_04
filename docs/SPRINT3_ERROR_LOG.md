# SPRINT3_ERROR_LOG — Full-stack verification (Ex 1.7.1)

> Sinh viên: Nguyễn Ngọc Thiên Tú — MSSV 24521911
> Thu thập ngày 2026-11-13 bằng `tools/evidence/capture.mjs` (Playwright 1.65, Chromium headless) trên Windows 11, Node 24.21.0.
> Mọi log dưới đây được copy nguyên văn từ `evidence/logs/`, không chỉnh tay.

## 1. Test summary

| Package | Lệnh | Kết quả | Log | Ảnh |
|---|---|---|---|---|
| `server/` | `npm run test:run -- --reporter=verbose` | **1 file, 10/10 passed** | [server-tests.txt](../evidence/logs/server-tests.txt) | [11-server-tests.png](../evidence/exercise-3/11-server-tests.png) |
| `client/` | `npm run test:run -- --reporter=verbose` | **11 files, 51/51 passed** | [client-tests.txt](../evidence/logs/client-tests.txt) | [09-client-tests.png](../evidence/exercise-1/09-client-tests.png) |
| `client/` | `npm run lint` | 0 lỗi, 0 warning | — | — |

Lần chạy đầu: client có **2/51 test đỏ**. Cả hai lỗi nằm trong code test, không phải code app (xem AI-17, AI-18 trong `AI_FAILURE_AUDIT.md`):

```
× ForumPage — live channel switcher > shows a loading status while the first request is in flight
  → TestingLibraryElementError: Found multiple elements with the role "status"
× SimpleForm (context-driven engine) > validates a field synchronously after it is blurred
  → AssertionError: expected <span id="_r_7_-error" …(2)></span> to be null   (Received: "Age is required")
```

Đã sửa bằng 2 commit `fix:` riêng (`eb9ae23`, `7831c4e`). Ý nghĩa assertion giữ nguyên. Sau khi sửa, cả 51 test đều xanh.

## 2. Slow 3G + đổi kênh liên tục → request cũ bị huỷ

Điều kiện mạng: CDP `Network.emulateNetworkConditions { latency: 2000, downloadThroughput: 50000, uploadThroughput: 50000 }`.
Chuỗi click: `esports-tribunal → nasa → esports-tribunal → nasa`, mỗi lần cách nhau khoảng 400 ms.

Trích từ [abort-network.txt](../evidence/logs/abort-network.txt):

```
#   phase                       t       done    method  result          errorText         url
1   initial-load                129     130     GET     failed          net::ERR_ABORTED  http://localhost:4000/api/messages/nasa
2   initial-load                129     132     GET     finished 200    -                 http://localhost:4000/api/messages/nasa
...
8   slow3g-switch-to-nasa       756     2780    GET     finished 200    -                 http://localhost:4000/api/messages/nasa
9   slow3g-rapid-switch         3242    3709    GET     failed          net::ERR_ABORTED  http://localhost:4000/api/messages/esports-tribunal
10  slow3g-rapid-switch         3709    4174    GET     failed          net::ERR_ABORTED  http://localhost:4000/api/messages/nasa
11  slow3g-rapid-switch         4174    4640    GET     failed          net::ERR_ABORTED  http://localhost:4000/api/messages/esports-tribunal
12  slow3g-rapid-switch         4640    5655    GET     finished 200    -                 http://localhost:4000/api/messages/nasa

## Rapid switch (Slow 3G) click sequence: esports-tribunal → nasa → esports-tribunal → nasa
requests: 4, aborted (net::ERR_ABORTED): 3, finished: 1

## UI checks during rapid switch
after click "esports-tribunal": aria-pressed=true, messages of "nasa" visible: none
after click "nasa": aria-pressed=true, messages of "esports-tribunal" visible: none
after click "esports-tribunal": aria-pressed=true, messages of "nasa" visible: none
after click "nasa": aria-pressed=true, messages of "esports-tribunal" visible: none
final: channel "nasa" rendered, messages of "esports-tribunal" visible: none
```

- Thời điểm `done` của mỗi request bị huỷ trùng với `t` của request kế tiếp. Nghĩa là cleanup `controller.abort()` chạy đúng lúc `forumId` đổi. Trên DevTools, các request này hiện là **(canceled)**.
- UI không lúc nào hiện tin nhắn của kênh trước.
- Ảnh: [04-loading-slow3g.png](../evidence/exercise-3/04-loading-slow3g.png) · [05-abort-canceled-requests.png](../evidence/exercise-3/05-abort-canceled-requests.png) · [05b-after-rapid-switch.png](../evidence/exercise-3/05b-after-rapid-switch.png)

> **Ghi chú 1 — Slow 3G chỉ giả lập phía trình duyệt.** Request đã rời Chromium vẫn tới Express ngay lập tức. Vì vậy server vẫn log `200`/`304` cho các request mà client đã huỷ (dòng `GET … 304` liên tiếp ở mục 4). Abort chỉ có nghĩa là trình duyệt bỏ response, còn server không biết request đã bị huỷ.
>
> **Ghi chú 2 — React StrictMode chạy effect 2 lần ở dev.** Request #1/#2 (`initial-load`) và #6/#7 (`reload-esports-tribunal`) là cặp mount → cleanup → mount của StrictMode. Request đầu bị abort ngay (`done` gần bằng `t`), request thứ hai hoàn tất. Đây là hành vi mong đợi ở development và không xảy ra ở production build.

## 3. Kênh `notNasa` — đường lỗi 404 full-stack

| Bước | Client | Server log |
|---|---|---|
| GET | alert `Could not load #notNasa: Unknown forum` | `GET /api/messages/notNasa 404` |
| POST | alert `Could not post: Unknown forum` | `OPTIONS /api/messages/notNasa 204` → `POST /api/messages/notNasa 404` |

Ảnh: [03-forum-notnasa-404.png](../evidence/exercise-3/03-forum-notnasa-404.png) · [08-post-notnasa-error.png](../evidence/exercise-3/08-post-notnasa-error.png)

### Browser console — nguyên văn [browser-console.txt](../evidence/logs/browser-console.txt)

```
[debug] [vite] connecting...
[debug] [vite] connected.
[info] %cDownload the React DevTools for a better development experience: https://react.dev/link/react-devtools font-weight:bold
[error] Failed to load resource: the server responded with a status of 404 (Not Found)
[error] [useForumMessages] GET notNasa failed: Error: Unknown forum
    at fetchMessages (http://localhost:5173/src/forum/useForumMessages.js:28:24)
[error] Failed to load resource: the server responded with a status of 404 (Not Found)
[debug] [vite] connecting...
[debug] [vite] connected.
[info] %cDownload the React DevTools for a better development experience: https://react.dev/link/react-devtools font-weight:bold
```

- Đúng **1** dòng `console.error` do app ghi: `[useForumMessages] GET notNasa failed`.
- 2 dòng `Failed to load resource … 404` do **Chromium tự sinh** cho mọi response 4xx (GET và POST notNasa), không phải lời gọi `console.error` trong code.
- **Không** có `AbortError` mặc dù có 5 request bị abort. **Không** có `Uncaught (in promise)` hay `pageerror`.
- Khối `[vite] connecting…` thứ hai là do script reload trang trước bước Slow 3G.
- Ảnh: [09-browser-console.png](../evidence/exercise-3/09-browser-console.png)

## 4. Server log — nguyên văn [server-log.txt](../evidence/logs/server-log.txt)

```
> server@1.0.0 dev
> node --watch src/server.js

[server] API listening on http://localhost:4000 (CORS origin: http://localhost:5173)
GET /api/messages/nasa 200 4ms
GET /api/messages/nasa 200 1ms
GET /api/messages/esports-tribunal 200 0ms
GET /api/messages/nasa 200 1ms
GET /api/messages/nasa 200 0ms
GET /api/messages/esports-tribunal 200 1ms
GET /api/messages/notNasa 404 1ms
OPTIONS /api/messages/notNasa 204 1ms
POST /api/messages/notNasa 404 15ms
GET /api/messages/esports-tribunal 304 1ms
GET /api/messages/esports-tribunal 200 0ms
GET /api/messages/nasa 304 0ms
GET /api/messages/esports-tribunal 304 0ms
GET /api/messages/nasa 304 1ms
GET /api/messages/esports-tribunal 200 0ms
GET /api/messages/nasa 200 0ms
OPTIONS /api/messages/nasa 204 0ms
POST /api/messages/nasa 201 1ms
GET /api/messages/nasa 200 0ms
GET /api/messages/nasa 200 0ms
GET /api/messages/nasa 304 0ms
```

- 3 dòng `GET` đầu tiên là request kiểm tra "server ready" và request lấy seed text của script, không phải từ trình duyệt.
- `OPTIONS … 204` là CORS preflight cho `POST` có `Content-Type: application/json`.
- Có đủ các dòng bắt buộc: `GET /api/messages/notNasa 404`, `POST /api/messages/nasa 201`, `POST /api/messages/notNasa 404`.
- Ảnh: [10-server-log.png](../evidence/exercise-3/10-server-log.png)

## 5. POST validation

| Trường hợp | Kết quả | Ảnh |
|---|---|---|
| Bấm "Post message" khi trống | Client chặn, hiện `Author is required` + `Message is required`, **không gửi request** (abort-network.txt không có POST nào ở bước này) | [06-post-validation.png](../evidence/exercise-3/06-post-validation.png) |
| Tin hợp lệ ở `nasa` | `POST /api/messages/nasa 201` → `version + 1` → refetch `GET 200`, tin mới hiện cuối danh sách | [07-post-success.png](../evidence/exercise-3/07-post-success.png) |
| Tin ở `notNasa` | `POST /api/messages/notNasa 404`, `postMessage` throw → form hiện `Could not post: Unknown forum`, không có unhandled rejection | [08-post-notnasa-error.png](../evidence/exercise-3/08-post-notnasa-error.png) |
| Thiếu field / sai kiểu / quá dài / JSON hỏng / ghi đè `id`, `timestamp` | Đã kiểm tra bằng supertest (`400 Missing required fields`, `400 Invalid payload`, `400 Malformed JSON`, id/timestamp do server sinh) | [11-server-tests.png](../evidence/exercise-3/11-server-tests.png) |

## 6. Kết quả tự kiểm của script ([capture-summary.txt](../evidence/logs/capture-summary.txt))

22/22 PASS, gồm: Slow 3G hiện "Loading messages…" · 3/4 request bị abort khi đổi kênh nhanh · UI không lẫn kênh · console có đúng 1 dòng `GET notNasa failed` · không có `AbortError` / `Uncaught` · server log có đủ 3 dòng bắt buộc.

## 7. Vấn đề còn mở (chưa sửa, ngoài phạm vi)

- Lỗi `Could not post: …` của `PostMessageForm` **vẫn còn hiện sau khi đổi kênh** vì state `serverError` không reset theo `channel`. Phát hiện ở lần chụp đầu: ảnh 04 bị lẫn lỗi POST của `notNasa`. Lần chụp cuối reload trang trước bước Slow 3G để ảnh 04 sạch. Hướng sửa đề xuất: render `<PostMessageForm key={channel} … />`. Xem AI-19.
