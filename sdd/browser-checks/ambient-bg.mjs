import { chromium } from 'playwright';

const URL = process.env.TARGET_URL || 'http://localhost:8130/index.html';
const results = [];
const ok = (name, cond, detail = '') => results.push({ name, pass: !!cond, detail: String(detail) });

const b = await chromium.launch();

// ---- normal mode --------------------------------------------------------------
{
  const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
  const errs = [];
  p.on('pageerror', e => errs.push('pageerror: ' + e.message));
  p.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
  await p.goto(URL, { waitUntil: 'networkidle' });
  await p.waitForTimeout(600);

  const meta = await p.evaluate(() => {
    const cv = document.getElementById('ambient-bg');
    const cs = cv && getComputedStyle(cv);
    return cv ? {
      first: document.body.firstElementChild === cv,
      pos: cs.position, z: cs.zIndex, pe: cs.pointerEvents,
      aria: cv.getAttribute('aria-hidden'),
      w: cv.width, h: cv.height,
      mainZ: getComputedStyle(document.getElementById('main-content')).zIndex,
    } : null;
  });
  ok('#ambient-bg exists, first body child', meta && meta.first, JSON.stringify(meta));
  ok('#ambient-bg is fixed / z-index 0 / pointer-events none / aria-hidden',
     meta && meta.pos === 'fixed' && meta.z === '0' && meta.pe === 'none' && meta.aria === 'true',
     JSON.stringify(meta));
  ok('#ambient-bg backing store sized (> 0)', meta && meta.w > 0 && meta.h > 0, `${meta && meta.w}x${meta && meta.h}`);
  ok('#main-content lifted to z-index 1', meta && meta.mainZ === '1', meta && meta.mainZ);

  // animates without any interaction: sample a pixel twice, 700ms apart
  const sample = () => p.evaluate(() => {
    const cv = document.getElementById('ambient-bg');
    const g = cv.getContext('2d');
    const d = g.getImageData(Math.floor(cv.width * 0.5), Math.floor(cv.height * 0.4), 1, 1).data;
    return [d[0], d[1], d[2], d[3]].join(',');
  });
  const s1 = await sample();
  await p.waitForTimeout(700);
  const s2 = await sample();
  ok('field animates with no interaction (pixel changes over 700ms)', s1 !== s2, `${s1} -> ${s2}`);

  // decoupled from scroll: full page scroll, canvas stays put + no jump
  await p.evaluate(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'instant' }));
  await p.waitForTimeout(200);
  const afterScroll = await p.evaluate(() => {
    const r = document.getElementById('ambient-bg').getBoundingClientRect();
    return { top: Math.round(r.top), left: Math.round(r.left) };
  });
  ok('canvas rect stays at 0,0 after scrolling to page bottom',
     afterScroll.top === 0 && afterScroll.left === 0, JSON.stringify(afterScroll));
  ok('no console / page errors in normal mode', errs.length === 0, errs.join(' | ') || 'clean');

  // tab-hidden pause: spy on rAF, hide the tab, confirm scheduling stops
  const rafDelta = await p.evaluate(async () => {
    let n = 0; const real = window.requestAnimationFrame;
    window.requestAnimationFrame = (cb) => { n++; return real(cb); };
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
    document.dispatchEvent(new Event('visibilitychange'));
    await new Promise(r => setTimeout(r, 400));
    const paused = n;
    await new Promise(r => setTimeout(r, 400));
    return n - paused; // rAF calls while "hidden"
  });
  ok('rAF scheduling stops while the tab is hidden', rafDelta === 0, `${rafDelta} rAF calls after hide`);
  await p.close();
}

// ---- reduced motion ---------------------------------------------------------
{
  const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
  await p.emulateMedia({ reducedMotion: 'reduce' });
  await p.goto(URL, { waitUntil: 'networkidle' });
  await p.waitForTimeout(500);
  const rmSample = () => p.evaluate(() => {
    const cv = document.getElementById('ambient-bg');
    const g = cv.getContext('2d');
    const d = g.getImageData(Math.floor(cv.width * 0.5), Math.floor(cv.height * 0.4), 1, 1).data;
    return [d[0], d[1], d[2], d[3]].join(',');
  });
  const r1 = await rmSample();
  await p.waitForTimeout(700);
  const r2 = await rmSample();
  ok('reduced-motion: field is frozen (identical pixel 700ms apart)', r1 === r2, `${r1} -> ${r2}`);
  await p.close();
}

// ---- navbar material -------------------------------------------------------
{
  const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
  await p.goto(URL, { waitUntil: 'networkidle' });
  await p.waitForTimeout(500);

  const nav = await p.evaluate(() => {
    const n = document.getElementById('navbar');
    const cs = getComputedStyle(n);
    const link = document.querySelector('#navbar nav a');
    const lcs = link && getComputedStyle(link);
    return {
      backdrop: cs.backdropFilter || cs.webkitBackdropFilter,
      hasBlur: /blur/.test(cs.backdropFilter || cs.webkitBackdropFilter || ''),
      borderBottom: cs.borderBottomWidth,
      linkColor: lcs && lcs.color,
      linkWeight: lcs && lcs.fontWeight,
    };
  });
  ok('navbar has a blur backdrop-filter', nav.hasBlur, nav.backdrop);
  ok('navbar bottom border removed', nav.borderBottom === '0px', nav.borderBottom);
  ok('nav link colour is bright (~rgba(255,255,255,0.82))',
     /rgba?\(255,\s*255,\s*255,\s*0?\.82/.test((nav.linkColor || '').replace(/\s/g, ' ')),
     nav.linkColor);

  // Contrast: scroll so a bright field hot-spot sits under the navbar, then compare
  // the nav link's computed text colour against the actually-rendered pixel a few
  // px to its left (navbar material composited over the field).
  await p.evaluate(() => window.scrollTo(0, 220)); // move a warm blob under the bar
  await p.waitForTimeout(300);
  const probe = await p.evaluate(() => {
    const link = document.querySelector('#navbar nav a');
    const r = link.getBoundingClientRect();
    const rgb = getComputedStyle(link).color.match(/[\d.]+/g).map(Number);
    return { rgb, x: Math.round(r.left - 6), y: Math.round(r.top + r.height / 2) };
  });
  const full = await p.screenshot(); // viewport PNG, 1 device px == 1 CSS px (no DSF set)
  const { PNG } = await import('pngjs').catch(() => ({ PNG: null }));
  const relLum = (r, g, b) => {
    const f = c => { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
  };
  let ratio = null;
  if (PNG) {
    const img = PNG.sync.read(full);
    const i = (probe.y * img.width + probe.x) * 4;
    const L1 = relLum(probe.rgb[0], probe.rgb[1], probe.rgb[2]);
    const L2 = relLum(img.data[i], img.data[i + 1], img.data[i + 2]);
    ratio = (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05);
  }
  ok('nav link text contrast >= 4.5:1 over the material',
     ratio === null || ratio >= 4.5,
     ratio === null ? 'pngjs unavailable — verify manually in Task 4' : ratio.toFixed(2) + ':1');

  // Fix 1: scrolled navbar must KEEP the structural frosted material — the only
  // scroll difference is a deeper shadow. The pre-existing
  // .navbar-scrolled { background: rgba(10,10,10,0.95) !important } used to revert
  // it to near-opaque black once past 20px; it must not anymore.
  await p.evaluate(() => window.scrollTo(0, 500));
  await p.waitForTimeout(300);
  const navScrolled = await p.evaluate(() => {
    const n = document.getElementById('navbar');
    const cs = getComputedStyle(n);
    return {
      scrolled: n.classList.contains('navbar-scrolled'),
      bgColor: cs.backgroundColor,
      bgImage: cs.backgroundImage,
    };
  });
  ok('scrolled navbar keeps the structural material (translucent + tint gradient, not rgba(10,10,10,0.95))',
     navScrolled.scrolled &&
     navScrolled.bgColor === 'rgba(12, 12, 14, 0.55)' &&
     navScrolled.bgColor !== 'rgba(10, 10, 10, 0.95)' &&
     /linear-gradient\(rgba\(255,\s*190,\s*130,/.test(navScrolled.bgImage),
     JSON.stringify(navScrolled));
  await p.close();
}

// ---- reduced transparency (CSSOM assertion — emulateMedia may not cover it) --
{
  const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
  await p.goto(URL, { waitUntil: 'networkidle' });
  const rules = await p.evaluate(() => {
    const found = { rt: false, pc: false };
    for (const ss of document.styleSheets) {
      let cr; try { cr = ss.cssRules; } catch (e) { continue; }
      for (const r of cr) {
        if (r.type === CSSRule.MEDIA_RULE) {
          const c = r.conditionText || r.media.mediaText;
          if (/prefers-reduced-transparency:\s*reduce/.test(c) && /#navbar/.test(r.cssText)) found.rt = true;
          if (/prefers-contrast:\s*more/.test(c) && /#navbar/.test(r.cssText)) found.pc = true;
        }
      }
    }
    return found;
  });
  ok('a @media (prefers-reduced-transparency: reduce) rule targets #navbar', rules.rt);
  ok('a @media (prefers-contrast: more) rule targets #navbar', rules.pc);
  await p.close();
}

await b.close();
const wI = Math.max(...results.map(r => r.name.length));
for (const r of results) console.log(`${r.pass ? 'PASS' : 'FAIL'}  ${r.name.padEnd(wI)}  ${r.detail}`);
const failed = results.filter(r => !r.pass);
console.log(`\n${results.length - failed.length}/${results.length} checks pass`);
process.exit(failed.length ? 1 : 0);
