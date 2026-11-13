// tools/evidence/capture.mjs
// Khởi động server (Express) + client (Vite), chụp toàn bộ bằng chứng PNG cho 3 bài,
// thu log thật (network, console, server stdout) rồi tắt cả 2 process.
//
// Chạy:  cd tools/evidence && npm install && npx playwright install chromium && npm run capture
import { spawn, spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync, readFileSync, existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const EVIDENCE = path.join(ROOT, 'evidence');
const LOGS = path.join(EVIDENCE, 'logs');
const EX1 = path.join(EVIDENCE, 'exercise-1');
const EX2 = path.join(EVIDENCE, 'exercise-2');
const EX3 = path.join(EVIDENCE, 'exercise-3');
const CLIENT_URL = 'http://localhost:5173';
const API_URL = 'http://localhost:4000';
const DESKTOP = { width: 1280, height: 800 };
const MOBILE = { width: 375, height: 812 };
// DevTools preset "Slow 3G" theo đề bài
const SLOW_3G = { offline: false, latency: 2000, downloadThroughput: 50000, uploadThroughput: 50000 };
const NO_THROTTLE = { offline: false, latency: 0, downloadThroughput: -1, uploadThroughput: -1 };
const IS_WIN = process.platform === 'win32';

for (const dir of [LOGS, EX1, EX2, EX3]) mkdirSync(dir, { recursive: true });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const log = (...args) => console.log('[capture]', ...args);
const summary = [];
const check = (label, ok, detail = '') => {
  const line = `${ok ? 'PASS' : 'FAIL'}  ${label}${detail ? ` — ${detail}` : ''}`;
  summary.push(line);
  console.log(`[check] ${line}`);
};

// ---------------------------------------------------------------- processes
const procs = [];
function startDev(name, cwd, sink) {
  const child = spawn('npm run dev', {
    cwd,
    shell: true,
    detached: !IS_WIN,
    env: { ...process.env, NO_COLOR: '1', FORCE_COLOR: '0' },
  });
  child.stdout.on('data', (d) => sink?.push(d.toString()));
  child.stderr.on('data', (d) => sink?.push(d.toString()));
  child.on('exit', (code) => log(`${name} exited (${code})`));
  procs.push({ name, child });
  return child;
}

function stopAll() {
  for (const { name, child } of procs) {
    if (child.exitCode !== null) continue;
    log(`stopping ${name} (pid ${child.pid})`);
    try {
      if (IS_WIN) spawnSync('taskkill', ['/pid', String(child.pid), '/T', '/F'], { stdio: 'ignore' });
      else process.kill(-child.pid, 'SIGTERM');
    } catch (err) {
      log(`could not stop ${name}: ${err.message}`);
    }
  }
}
process.on('SIGINT', () => { stopAll(); process.exit(130); });

async function isUp(url) {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(1500) });
    return res.status > 0;
  } catch {
    return false;
  }
}

async function waitFor(url, label, timeoutMs = 60000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (await isUp(url)) return log(`${label} ready: ${url}`);
    await sleep(500);
  }
  throw new Error(`${label} not ready after ${timeoutMs}ms (${url})`);
}

// ---------------------------------------------------------------- helpers
const escapeHtml = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// Render file text thành PNG: trang HTML <pre> nền tối, font monospace
async function renderText(browser, title, text, outFile) {
  const page = await browser.newPage({ viewport: DESKTOP });
  await page.setContent(`<!doctype html><html><head><meta charset="utf-8"><style>
    html,body{margin:0;background:#0d1117;color:#e6edf3}
    header{padding:12px 20px;background:#161b22;border-bottom:1px solid #30363d;
      font:600 14px/1.4 Consolas,'Cascadia Mono','Courier New',monospace;color:#7ee787}
    pre{margin:0;padding:16px 20px;font:13px/1.5 Consolas,'Cascadia Mono','Courier New',monospace;
      white-space:pre-wrap;word-break:break-word}
  </style></head><body><header>${escapeHtml(title)}</header><pre>${escapeHtml(text)}</pre></body></html>`);
  await page.screenshot({ path: outFile, fullPage: true });
  await page.close();
  log(`rendered ${path.relative(ROOT, outFile)}`);
}

async function shot(page, outFile, fullPage = true) {
  await page.screenshot({ path: outFile, fullPage });
  log(`captured ${path.relative(ROOT, outFile)}`);
}

const pathnameIs = (suffix) => (url) => {
  try { return new URL(url).pathname.endsWith(suffix); } catch { return false; }
};

// ---------------------------------------------------------------- exercise 1
async function exercise1(browser) {
  const ctx = await browser.newContext({ viewport: DESKTOP });
  const page = await ctx.newPage();

  await page.goto(`${CLIENT_URL}/`);
  await page.getByRole('heading', { level: 1 }).first().waitFor();
  await shot(page, path.join(EX1, '01-home.png'));

  await page.goto(`${CLIENT_URL}/people`);
  await page.getByText(/Select a person/).waitFor();
  await shot(page, path.join(EX1, '02-people-index.png'));

  await page.goto(`${CLIENT_URL}/people/le-hoang-cuong`);
  await page.locator('dl.person-details').waitFor();
  const active = await page.locator('nav[aria-label="People directory"] [aria-current="page"]').textContent();
  check('Ex1 /people/le-hoang-cuong NavLink active', /Lê Hoàng Cường/.test(active ?? ''), `aria-current link = "${active?.trim()}"`);
  await shot(page, path.join(EX1, '03-person-detail.png'));

  await page.goto(`${CLIENT_URL}/people/khong-ton-tai`);
  const alert = page.getByRole('alert');
  await alert.waitFor();
  check('Ex1 person 404 alert', /404/.test(await alert.textContent()));
  await shot(page, path.join(EX1, '04-person-404.png'));

  await page.goto(`${CLIENT_URL}/khong-ton-tai`);
  await page.getByRole('heading', { name: /404/ }).waitFor();
  await shot(page, path.join(EX1, '05-global-404.png'));
  await ctx.close();

  // 06 — Suspense skeleton: trì hoãn request module PersonDetail.jsx để fallback hiện đủ lâu
  {
    const c = await browser.newContext({ viewport: DESKTOP });
    const p = await c.newPage();
    let release;
    const gate = new Promise((r) => { release = r; });
    await p.route(pathnameIs('/src/people/PersonDetail.jsx'), async (route) => {
      await gate;
      await route.continue();
    });
    await p.goto(`${CLIENT_URL}/people`);
    await p.getByText(/Select a person/).waitFor();
    await p.getByRole('link', { name: 'Lê Hoàng Cường' }).click();
    const skeleton = p.locator('.skeleton[role="status"][aria-busy="true"]');
    await skeleton.waitFor();
    check('Ex1 Suspense skeleton visible while PersonDetail chunk is delayed', await skeleton.isVisible());
    await shot(p, path.join(EX1, '06-suspense-skeleton.png'));
    release();
    await p.locator('dl.person-details').waitFor();
    await c.close();
  }

  // 07 — mobile
  {
    const c = await browser.newContext({ viewport: MOBILE });
    const p = await c.newPage();
    await p.goto(`${CLIENT_URL}/people/nguyen-van-an`);
    await p.locator('dl.person-details').waitFor();
    const cols = await p.locator('.people-frame').evaluate((el) => getComputedStyle(el).gridTemplateColumns);
    check('Ex1 mobile grid collapses to 1 column', cols.trim().split(/\s+/).length === 1, `grid-template-columns = "${cols}"`);
    await shot(p, path.join(EX1, '07-people-mobile.png'));
    await c.close();
  }

  // 08 — code splitting: request JS khi vào /people rồi click sang /people/:id
  {
    const c = await browser.newContext({ viewport: DESKTOP });
    const p = await c.newPage();
    let phase = 'A';
    const rows = { A: [], B: [] };
    p.on('requestfinished', async (req) => {
      const url = new URL(req.url());
      if (url.origin !== CLIENT_URL || req.resourceType() !== 'script') return;
      const res = await req.response();
      rows[phase].push(`${req.method()} ${res?.status() ?? '-'} ${url.pathname}${url.search}`);
    });
    await p.goto(`${CLIENT_URL}/people`);
    await p.getByText(/Select a person/).waitFor();
    await p.waitForLoadState('networkidle');
    phase = 'B';
    await p.getByRole('link', { name: 'Nguyễn Văn An' }).click();
    await p.locator('dl.person-details').waitFor();
    await p.waitForLoadState('networkidle');
    await sleep(300);
    await c.close();

    const inA = rows.A.some((r) => r.includes('/src/people/PersonDetail.jsx'));
    const inB = rows.B.some((r) => r.includes('/src/people/PersonDetail.jsx'));
    check('Ex1 PersonDetail.jsx NOT requested on /people', !inA);
    check('Ex1 PersonDetail.jsx requested only after navigating to /people/:id', inB);

    // Production build: xác nhận Rollup tách PersonDetail thành chunk riêng
    const outDir = mkdtempSync(path.join(tmpdir(), 'lab04-build-'));
    const build = spawnSync(`npx vite build --outDir "${outDir}" --emptyOutDir`, {
      cwd: path.join(ROOT, 'client'),
      shell: true,
      encoding: 'utf8',
      env: { ...process.env, NO_COLOR: '1', FORCE_COLOR: '0' },
    });
    rmSync(outDir, { recursive: true, force: true });
    // Vite in đường dẫn tương đối tới outDir tạm → thay bằng <tmp-outDir> cho gọn
    const buildOut = `${build.stdout ?? ''}${build.stderr ?? ''}`.replace(/\S*lab04-build-[A-Za-z0-9]+/g, '<tmp-outDir>');
    check('Ex1 production build emits a separate PersonDetail chunk', /PersonDetail-[\w-]+\.js/.test(buildOut));

    const text = [
      `# Code-splitting evidence — tools/evidence/capture.mjs — ${new Date().toISOString()}`,
      `# App.jsx: const PersonDetail = lazy(() => import('./people/PersonDetail'))`,
      `# Vite dev server serves unbundled ESM, so each module is its own request.`,
      '',
      `## Phase A — full load of ${CLIENT_URL}/people (${rows.A.length} JS requests)`,
      ...rows.A,
      '',
      `PersonDetail.jsx requested in phase A: ${inA ? 'YES' : 'NO'}`,
      '',
      `## Phase B — click NavLink "Nguyễn Văn An" → /people/nguyen-van-an (${rows.B.length} new JS requests)`,
      ...rows.B,
      '',
      `PersonDetail.jsx requested in phase B: ${inB ? 'YES' : 'NO'}`,
      '',
      `## Production build — npx vite build (client/, temporary outDir, exit ${build.status})`,
      buildOut.trimEnd(),
    ].join('\n');
    writeFileSync(path.join(LOGS, 'chunks.txt'), `${text}\n`);
    await renderText(browser, 'evidence/logs/chunks.txt — route-level code splitting', text, path.join(EX1, '08-code-splitting-network.png'));
  }

  const clientTests = readFileSync(path.join(LOGS, 'client-tests.txt'), 'utf8');
  await renderText(browser, 'evidence/logs/client-tests.txt — cd client && npm run test:run -- --reporter=verbose', clientTests, path.join(EX1, '09-client-tests.png'));
}

// ---------------------------------------------------------------- exercise 2
const VALID_FORM = {
  'Full name': 'Nguyễn Văn An',
  Email: 'an.nguyen@example.com',
  Age: '21',
  Password: 'secret123',
  'Confirm password': 'secret123',
};

async function fillForm(page, overrides = {}) {
  for (const [label, value] of Object.entries({ ...VALID_FORM, ...overrides })) {
    await page.getByLabel(label, { exact: true }).fill(value);
  }
}

async function exercise2(browser) {
  const ctx = await browser.newContext({ viewport: DESKTOP });
  const page = await ctx.newPage();
  const open = async () => {
    await page.goto(`${CLIENT_URL}/form`);
    await page.getByRole('heading', { name: 'Context Form Engine' }).waitFor();
  };

  await open();
  check('Ex2 empty form shows no errors', (await page.getByRole('alert').count()) === 0);
  await shot(page, path.join(EX2, '01-form-empty.png'));

  await page.getByLabel('Email', { exact: true }).focus();
  await page.keyboard.press('Tab');
  await page.getByText('Email is required').waitFor();
  check('Ex2 blur Email → "Email is required" only', (await page.getByRole('alert').count()) === 1);
  await shot(page, path.join(EX2, '02-field-blur-error.png'));

  await open();
  await page.getByRole('button', { name: 'Submit' }).click();
  const errorCount = await page.getByRole('alert').count();
  check('Ex2 empty submit shows 5 errors', errorCount === 5, `${errorCount} alerts`);
  await shot(page, path.join(EX2, '03-submit-empty-errors.png'));

  await open();
  await fillForm(page, { 'Confirm password': 'secret124' });
  await page.getByRole('button', { name: 'Submit' }).click();
  await page.getByText('Passwords do not match').waitFor();
  await shot(page, path.join(EX2, '04-cross-field-mismatch.png'));

  await open();
  await fillForm(page);
  await page.getByRole('button', { name: 'Submit' }).click();
  const inspector = page.locator('dl.json-inspector');
  await inspector.waitFor();
  const inspectorText = await inspector.textContent();
  check('Ex2 ShowData hides password and drops confirmPassword',
    !inspectorText.includes('secret123') && !inspectorText.includes('confirmPassword'));
  await shot(page, path.join(EX2, '05-valid-submit-showdata.png'));
  await ctx.close();

  const m = await browser.newContext({ viewport: MOBILE });
  const mp = await m.newPage();
  await mp.goto(`${CLIENT_URL}/form`);
  await mp.getByRole('heading', { name: 'Context Form Engine' }).waitFor();
  await shot(mp, path.join(EX2, '06-form-mobile.png'));
  await m.close();

  // Trích các dòng của src/form + dòng tổng kết từ client-tests.txt (không chỉnh sửa nội dung)
  const lines = readFileSync(path.join(LOGS, 'client-tests.txt'), 'utf8').split(/\r?\n/);
  const excerpt = lines.filter((l) => l.includes('src/form/') || /^\s*(Test Files|Tests)\s/.test(l)).join('\n');
  await renderText(browser, 'evidence/logs/client-tests.txt — excerpt: lines matching "src/form/" + summary', excerpt, path.join(EX2, '07-client-tests-form.png'));
}

// ---------------------------------------------------------------- exercise 3
async function exercise3(browser, seeds) {
  // reducedMotion → index.css tắt transition, ảnh không bị chụp giữa lúc chuyển màu
  const ctx = await browser.newContext({ viewport: DESKTOP, reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  const cdp = await ctx.newCDPSession(page);
  await cdp.send('Network.enable');

  const consoleLines = [];
  page.on('console', (msg) => consoleLines.push(`[${msg.type()}] ${msg.text()}`));
  page.on('pageerror', (err) => consoleLines.push(`[pageerror] Uncaught ${err.stack ?? err.message}`));

  // Ghi mọi request /api/messages
  let phase = 'initial-load';
  const t0 = Date.now();
  const requests = [];
  const byReq = new Map();
  page.on('request', (req) => {
    if (!req.url().includes('/api/messages')) return;
    const row = { n: requests.length + 1, phase, t: Date.now() - t0, method: req.method(), url: req.url(), result: 'pending', errorText: '' };
    requests.push(row);
    byReq.set(req, row);
  });
  page.on('requestfinished', async (req) => {
    const row = byReq.get(req);
    if (!row) return;
    const res = await req.response();
    row.result = `finished ${res?.status() ?? '?'}`;
    row.done = Date.now() - t0;
  });
  page.on('requestfailed', (req) => {
    const row = byReq.get(req);
    if (!row) return;
    row.result = 'failed';
    row.errorText = req.failure()?.errorText ?? '';
    row.done = Date.now() - t0;
  });

  // getByRole({ name, exact: true }) không khớp toggle button có aria-pressed ở Playwright 1.65 → lọc theo text chính xác
  const channelButton = (id) => page.locator('.channel-switcher button').filter({ hasText: new RegExp(`^${id}$`) });
  const feed = page.locator('.forum-feed');
  const waitForText = (text) => feed.getByText(text, { exact: true }).waitFor({ timeout: 60000 });

  // 01 nasa
  await page.goto(`${CLIENT_URL}/forum`);
  await waitForText(seeds.nasa[0].text);
  await shot(page, path.join(EX3, '01-forum-nasa.png'));

  // 02 esports-tribunal
  phase = 'switch-to-esports-tribunal';
  await channelButton('esports-tribunal').click();
  await waitForText(seeds['esports-tribunal'][0].text);
  check('Ex3 URL synced to ?channel=esports-tribunal', page.url().endsWith('/forum?channel=esports-tribunal'), page.url());
  await shot(page, path.join(EX3, '02-forum-esports-tribunal.png'));

  // 03 notNasa → 404, 08 POST notNasa → 404 (cùng một lần ghé kênh → đúng 1 console.error)
  phase = 'switch-to-notNasa';
  await channelButton('notNasa').click();
  const loadError = page.locator('.forum-feed [role="alert"]');
  await loadError.waitFor();
  check('Ex3 notNasa load error text', (await loadError.textContent()).includes('Could not load #notNasa: Unknown forum'), await loadError.textContent());
  await shot(page, path.join(EX3, '03-forum-notnasa-404.png'));

  phase = 'post-notNasa';
  await page.getByLabel('Author', { exact: true }).fill('Evidence Bot');
  await page.getByLabel('Message', { exact: true }).fill('This forum should not exist');
  await page.getByRole('button', { name: 'Post message' }).click();
  await page.getByText('Could not post: Unknown forum').waitFor();
  await shot(page, path.join(EX3, '08-post-notnasa-error.png'));

  // 04 Slow 3G loading — tải lại trang (không throttle) để bỏ lỗi POST cũ của notNasa khỏi khung hình
  phase = 'reload-esports-tribunal';
  await page.goto(`${CLIENT_URL}/forum?channel=esports-tribunal`);
  await waitForText(seeds['esports-tribunal'][0].text);
  phase = 'slow3g-switch-to-nasa';
  await cdp.send('Network.emulateNetworkConditions', SLOW_3G);
  await channelButton('nasa').click();
  const status = page.getByRole('status');
  await status.waitFor();
  check('Ex3 Slow 3G shows "Loading messages…"', (await status.textContent()).includes('Loading messages…'));
  await shot(page, path.join(EX3, '04-loading-slow3g.png'));
  await waitForText(seeds.nasa[0].text);

  // 05 rapid switching nasa ⇄ esports-tribunal (4 lần) dưới Slow 3G
  phase = 'slow3g-rapid-switch';
  const sequence = ['esports-tribunal', 'nasa', 'esports-tribunal', 'nasa'];
  const uiChecks = [];
  for (const id of sequence) {
    await channelButton(id).click();
    // Đợi React commit lần click (aria-pressed=true) rồi mới kiểm tra — tránh đo lúc UI còn ở kênh cũ
    await page.locator('.channel-switcher button[aria-pressed="true"]').filter({ hasText: new RegExp('^' + id + '$') }).waitFor({ timeout: 10000 });
    const other = id === 'nasa' ? 'esports-tribunal' : 'nasa';
    const leaked = [];
    for (const m of seeds[other]) if (await feed.getByText(m.text, { exact: true }).count()) leaked.push(m.text);
    uiChecks.push(`after click "${id}": aria-pressed=${await channelButton(id).getAttribute('aria-pressed')}, messages of "${other}" visible: ${leaked.length ? leaked.join(' | ') : 'none'}`);
    await sleep(400);
  }
  const last = sequence.at(-1);
  await waitForText(seeds[last][0].text);
  await sleep(500);
  const otherLast = last === 'nasa' ? 'esports-tribunal' : 'nasa';
  const leakedFinal = [];
  for (const m of seeds[otherLast]) if (await feed.getByText(m.text, { exact: true }).count()) leakedFinal.push(m.text);
  uiChecks.push(`final: channel "${last}" rendered, messages of "${otherLast}" visible: ${leakedFinal.length ? leakedFinal.join(' | ') : 'none'}`);
  check('Ex3 after rapid switch only the last channel is shown', leakedFinal.length === 0 && uiChecks.every((l) => l.endsWith('none')));
  await shot(page, path.join(EX3, '05b-after-rapid-switch.png'));
  await cdp.send('Network.emulateNetworkConditions', NO_THROTTLE);

  // 06 validation, 07 success (nasa)
  phase = 'post-nasa';
  await page.getByLabel('Author', { exact: true }).fill('');
  await page.getByLabel('Message', { exact: true }).fill('');
  await page.getByRole('button', { name: 'Post message' }).click();
  await page.getByText('Author is required').waitFor();
  await page.getByText('Message is required').waitFor();
  await shot(page, path.join(EX3, '06-post-validation.png'));

  const newText = `Hello NASA — evidence run ${new Date().toISOString()}`;
  await page.getByLabel('Author', { exact: true }).fill('Evidence Bot');
  await page.getByLabel('Message', { exact: true }).fill(newText);
  await page.getByRole('button', { name: 'Post message' }).click();
  await waitForText(newText);
  await shot(page, path.join(EX3, '07-post-success.png'));
  await sleep(500);
  await ctx.close();

  // --- logs
  const pad = (s, n) => String(s).padEnd(n);
  const rapid = requests.filter((r) => r.phase === 'slow3g-rapid-switch');
  const abortedRapid = rapid.filter((r) => r.errorText === 'net::ERR_ABORTED').length;
  const net = [
    `# /api/messages requests — tools/evidence/capture.mjs — ${new Date().toISOString()}`,
    `# Captured with page.on('request' | 'requestfinished' | 'requestfailed').`,
    `# Slow 3G via CDP Network.emulateNetworkConditions ${JSON.stringify(SLOW_3G)}`,
    `# t = ms since capture start; done = ms when the request settled`,
    '',
    `${pad('#', 4)}${pad('phase', 28)}${pad('t', 8)}${pad('done', 8)}${pad('method', 8)}${pad('result', 16)}${pad('errorText', 18)}url`,
    ...requests.map((r) => `${pad(r.n, 4)}${pad(r.phase, 28)}${pad(r.t, 8)}${pad(r.done ?? '-', 8)}${pad(r.method, 8)}${pad(r.result, 16)}${pad(r.errorText || '-', 18)}${r.url}`),
    '',
    `## Rapid switch (Slow 3G) click sequence: ${sequence.join(' → ')}`,
    `requests: ${rapid.length}, aborted (net::ERR_ABORTED): ${abortedRapid}, finished: ${rapid.filter((r) => r.result.startsWith('finished')).length}`,
    '',
    '## UI checks during rapid switch',
    ...uiChecks,
  ].join('\n');
  writeFileSync(path.join(LOGS, 'abort-network.txt'), `${net}\n`);
  check('Ex3 rapid switch aborted stale requests', abortedRapid >= 3, `${abortedRapid} of ${rapid.length} aborted`);
  await renderText(browser, 'evidence/logs/abort-network.txt — AbortController cancels stale requests', net, path.join(EX3, '05-abort-canceled-requests.png'));

  const consoleText = consoleLines.join('\n');
  writeFileSync(path.join(LOGS, 'browser-console.txt'), `${consoleText}\n`);
  const notNasaErrors = consoleLines.filter((l) => l.includes('[useForumMessages] GET notNasa failed')).length;
  check('Ex3 console has exactly 1 "[useForumMessages] GET notNasa failed"', notNasaErrors === 1, `${notNasaErrors} line(s)`);
  check('Ex3 console has no AbortError', !/AbortError/.test(consoleText));
  check('Ex3 console has no "Uncaught (in promise)" / pageerror', !/Uncaught|\[pageerror\]/.test(consoleText));
  await renderText(browser, 'evidence/logs/browser-console.txt — page.on("console") during the forum session', consoleText, path.join(EX3, '09-browser-console.png'));

  // 12 mobile
  const m = await browser.newContext({ viewport: MOBILE });
  const mp = await m.newPage();
  await mp.goto(`${CLIENT_URL}/forum`);
  await mp.locator('.forum-feed').getByText(seeds.nasa[0].text, { exact: true }).waitFor();
  await shot(mp, path.join(EX3, '12-forum-mobile.png'));
  await m.close();
}

// ---------------------------------------------------------------- main
async function main() {
  for (const f of ['client-tests.txt', 'server-tests.txt']) {
    if (!existsSync(path.join(LOGS, f))) throw new Error(`Missing evidence/logs/${f} — run the test suites first (see evidence/README.md).`);
  }
  if ((await isUp(CLIENT_URL)) || (await isUp(`${API_URL}/api/messages/nasa`))) {
    throw new Error('Port 5173 or 4000 is already in use — stop running dev servers first so this script can own the server log.');
  }

  const serverOut = [];
  startDev('server', path.join(ROOT, 'server'), serverOut);
  startDev('client', path.join(ROOT, 'client'));
  let browser;
  try {
    await waitFor(`${API_URL}/api/messages/nasa`, 'server');
    await waitFor(CLIENT_URL, 'client');

    // Seed text của 2 kênh để kiểm tra UI không lẫn kênh
    const seeds = {};
    for (const id of ['nasa', 'esports-tribunal']) seeds[id] = await (await fetch(`${API_URL}/api/messages/${id}`)).json();

    browser = await chromium.launch();
    await exercise1(browser);
    await exercise2(browser);
    await exercise3(browser, seeds);

    const serverTests = readFileSync(path.join(LOGS, 'server-tests.txt'), 'utf8');
    await renderText(browser, 'evidence/logs/server-tests.txt — cd server && npm run test:run -- --reporter=verbose', serverTests, path.join(EX3, '11-server-tests.png'));

    await sleep(500);
    const serverLog = serverOut.join('').replace(/\r\n/g, '\n');
    writeFileSync(path.join(LOGS, 'server-log.txt'), serverLog);
    check('Server log has GET /api/messages/notNasa 404', /GET \/api\/messages\/notNasa 404/.test(serverLog));
    check('Server log has POST /api/messages/nasa 201', /POST \/api\/messages\/nasa 201/.test(serverLog));
    check('Server log has POST /api/messages/notNasa 404', /POST \/api\/messages\/notNasa 404/.test(serverLog));
    await renderText(browser, 'evidence/logs/server-log.txt — stdout of `npm run dev` (server/) during capture', serverLog, path.join(EX3, '10-server-log.png'));
  } finally {
    await browser?.close();
    stopAll();
  }

  const failed = summary.filter((l) => l.startsWith('FAIL'));
  writeFileSync(path.join(LOGS, 'capture-summary.txt'), `# tools/evidence/capture.mjs — ${new Date().toISOString()}\n${summary.join('\n')}\n`);
  log(`done — ${summary.length - failed.length}/${summary.length} checks passed`);
  if (failed.length) process.exitCode = 1;
}

main().catch((err) => {
  console.error('[capture] FAILED:', err);
  stopAll();
  process.exit(1);
});
