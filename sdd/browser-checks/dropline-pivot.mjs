import { chromium } from 'playwright';

const URL = process.env.TARGET_URL || 'http://localhost:8130/index.html';
const results = [];
const ok = (name, cond, detail = '') => results.push({ name, pass: !!cond, detail: String(detail) });

const b = await chromium.launch();

// ---- Task 1: no canvas renderer left behind -----------------------------------
{
  const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
  const errs = [];
  p.on('pageerror', e => errs.push('pageerror: ' + e.message));
  p.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
  await p.goto(URL, { waitUntil: 'networkidle' });

  const hasCanvas = await p.evaluate(() => !!document.getElementById('ambient-bg'));
  ok('#ambient-bg canvas is gone', !hasCanvas);
  ok('no console / page errors on load', errs.length === 0, errs.join(' | ') || 'clean');
  await p.close();
}

await b.close();
const wI = Math.max(...results.map(r => r.name.length));
for (const r of results) console.log(`${r.pass ? 'PASS' : 'FAIL'}  ${r.name.padEnd(wI)}  ${r.detail}`);
const failed = results.filter(r => !r.pass);
console.log(`\n${results.length - failed.length}/${results.length} checks pass`);
process.exit(failed.length ? 1 : 0);
