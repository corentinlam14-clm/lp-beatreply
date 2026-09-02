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

// ---- Task 2: palette + fonts ---------------------------------------------------
{
  const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
  await p.goto(URL, { waitUntil: 'networkidle' });

  const palette = await p.evaluate(() => {
    const root = getComputedStyle(document.documentElement);
    const h1 = document.querySelector('h1');
    const body = document.body;
    return {
      htmlBg: getComputedStyle(document.documentElement).backgroundColor,
      primaryRgb: root.getPropertyValue('--primary-rgb').trim(),
      secondaryRgb: root.getPropertyValue('--secondary-rgb').trim(),
      cyanRgb: root.getPropertyValue('--cyan-rgb').trim(),
      h1Font: h1 && getComputedStyle(h1).fontFamily,
      bodyFont: getComputedStyle(body).fontFamily,
    };
  });
  ok('html background is the Dropline near-black', palette.htmlBg === 'rgb(10, 10, 15)', palette.htmlBg);
  ok('--primary-rgb is the Dropline blue', palette.primaryRgb === '61 107 255', palette.primaryRgb);
  ok('--secondary-rgb is the Dropline magenta', palette.secondaryRgb === '255 46 154', palette.secondaryRgb);
  ok('--cyan-rgb is defined (Dropline pale cyan)', palette.cyanRgb === '142 217 255', palette.cyanRgb);
  ok('h1 uses Unbounded', palette.h1Font && palette.h1Font.includes('Unbounded'), palette.h1Font);
  ok('body uses IBM Plex Sans', palette.bodyFont && palette.bodyFont.includes('IBM Plex Sans'), palette.bodyFont);
  await p.close();
}

await b.close();
const wI = Math.max(...results.map(r => r.name.length));
for (const r of results) console.log(`${r.pass ? 'PASS' : 'FAIL'}  ${r.name.padEnd(wI)}  ${r.detail}`);
const failed = results.filter(r => !r.pass);
console.log(`\n${results.length - failed.length}/${results.length} checks pass`);
process.exit(failed.length ? 1 : 0);
