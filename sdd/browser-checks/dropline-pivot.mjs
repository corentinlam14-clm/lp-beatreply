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

// ---- Task 3: material tokens recolored -----------------------------------------
{
  const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
  await p.goto(URL, { waitUntil: 'networkidle' });
  const tint = await p.evaluate(() =>
    getComputedStyle(document.documentElement).getPropertyValue('--mat-structural-tint').trim()
  );
  ok('material tint is cool blue-violet, not warm orange', tint === 'rgba(90, 110, 255, 0.06)', tint);
  await p.close();
}

// ---- Task 4: aurora waveform ---------------------------------------------------
{
  const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
  await p.goto(URL, { waitUntil: 'networkidle' });

  const count = await p.evaluate(() => document.querySelectorAll('.wave-field').length);
  ok('exactly 2 .wave-field instances (hero + cta-final)', count === 2, count);

  const noOrbs = await p.evaluate(() =>
    document.querySelectorAll('.glow-orb-1, .glow-orb-2').length === 0
  );
  ok('old glow-orb divs are gone', noOrbs);

  // animates without interaction: sample a .wave-loop's transform twice, 1s apart
  const getTransform = () => p.evaluate(() => {
    const el = document.querySelector('.wave-loop-a');
    return getComputedStyle(el).transform;
  });
  const t1 = await getTransform();
  await p.waitForTimeout(1000);
  const t2 = await getTransform();
  ok('.wave-loop-a animates with no interaction', t1 !== t2, `${t1} -> ${t2}`);

  // no scroll coupling: scroll to bottom, confirm no console error and the field is still animating
  await p.evaluate(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'instant' }));
  await p.waitForTimeout(200);
  const stillThere = await p.evaluate(() => document.querySelectorAll('.wave-field').length === 2);
  ok('both .wave-field instances survive a full-page scroll', stillThere);

  await p.close();
}

// ---- Task 5: glass buttons + cards ---------------------------------------------
{
  const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
  await p.goto(URL, { waitUntil: 'networkidle' });

  const styles = await p.evaluate(() => {
    const btn = document.querySelector('.btn-primary');
    const card = document.querySelector('.glass-surface');
    return {
      btnBackdrop: btn && getComputedStyle(btn).backdropFilter,
      cardBackdrop: card && getComputedStyle(card).backdropFilter,
    };
  });
  ok('.btn-primary has a backdrop-filter', styles.btnBackdrop && styles.btnBackdrop !== 'none', styles.btnBackdrop);
  ok('.glass-surface has a backdrop-filter (card weight)', styles.cardBackdrop && styles.cardBackdrop !== 'none', styles.cardBackdrop);

  const sweepExists = await p.evaluate(() => {
    for (const ss of document.styleSheets) {
      let cr; try { cr = ss.cssRules; } catch (e) { continue; }
      for (const r of cr) {
        if (r.selectorText && /\.btn-primary::before/.test(r.selectorText)) return true;
      }
    }
    return false;
  });
  ok('a ::before sweep rule targets .btn-primary', sweepExists);
  await p.close();
}

// ---- Task 6: scroll-driven reveals ----------------------------------------------
{
  const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
  await p.goto(URL, { waitUntil: 'networkidle' });

  const usesViewTimeline = await p.evaluate(() => {
    const el = document.querySelector('.scroll-reveal');
    return el && getComputedStyle(el).animationTimeline !== 'auto' && getComputedStyle(el).animationTimeline !== 'normal';
  });
  ok('.scroll-reveal uses animation-timeline: view()', usesViewTimeline);

  const noObserverScript = await p.evaluate(() => !window.IntersectionObserver || !document.querySelector('.scroll-reveal.is-visible'));
  // is-visible is only ever added by the old IO script — its absence after a normal
  // page load (no scrolling triggered) indicates the IO script no longer runs.
  ok('no element carries the old IO-driven is-visible class on load', noObserverScript);

  await p.close();
}

// ---- Task 7: floating stats + marquee -------------------------------------------
{
  const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
  await p.goto(URL, { waitUntil: 'networkidle' });

  const statCount = await p.evaluate(() => document.querySelectorAll('.hero-stat').length);
  ok('all 3 hero stats carry .hero-stat', statCount === 3, statCount);

  const marquee = await p.evaluate(() => {
    const band = document.querySelector('.marquee-band');
    const track = document.querySelector('.marquee-track');
    return {
      hasBand: !!band,
      ariaHidden: band && band.getAttribute('aria-hidden'),
      itemCount: track ? track.querySelectorAll('span').length : 0,
    };
  });
  ok('.marquee-band exists and is aria-hidden', marquee.hasBand && marquee.ariaHidden === 'true', JSON.stringify(marquee));
  ok('.marquee-track content is duplicated for seamless looping (even, >= 16 spans)',
     marquee.itemCount >= 16 && marquee.itemCount % 2 === 0, marquee.itemCount);

  const getTransform = () => p.evaluate(() => {
    const el = document.querySelector('.marquee-track');
    return el ? getComputedStyle(el).transform : 'missing';
  });
  const m1 = await getTransform();
  await p.waitForTimeout(1000);
  const m2 = await getTransform();
  ok('.marquee-track animates with no interaction', m1 !== m2 && m1 !== 'missing', `${m1} -> ${m2}`);

  await p.close();
}

// ---- Task 8: accessibility fallbacks + full regression --------------------------
{
  const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
  await p.goto(URL, { waitUntil: 'networkidle' });

  // reduced transparency: buttons/cards go opaque, no blur
  const rtRuleTargets = await p.evaluate(() => {
    const found = { btn: false, card: false };
    for (const ss of document.styleSheets) {
      let cr; try { cr = ss.cssRules; } catch (e) { continue; }
      for (const r of cr) {
        if (r.type === CSSRule.MEDIA_RULE && /prefers-reduced-transparency:\s*reduce/.test(r.conditionText || r.media.mediaText)) {
          if (/\.btn-primary/.test(r.cssText)) found.btn = true;
          if (/\.glass-surface/.test(r.cssText)) found.card = true;
        }
      }
    }
    return found;
  });
  ok('prefers-reduced-transparency covers .btn-primary', rtRuleTargets.btn);
  ok('prefers-reduced-transparency covers .glass-surface', rtRuleTargets.card);

  await p.close();
}

// ---- Task 8: reduced motion — everything animated goes static -------------------
{
  const p = await b.newPage({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' });
  await p.goto(URL, { waitUntil: 'networkidle' });
  await p.waitForTimeout(300);

  const sample = () => p.evaluate(() => ({
    waveA: getComputedStyle(document.querySelector('.wave-loop-a')).transform,
    marquee: getComputedStyle(document.querySelector('.marquee-track')).transform,
    stat: getComputedStyle(document.querySelector('.hero-stat')).transform,
  }));
  const s1 = await sample();
  await p.waitForTimeout(700);
  const s2 = await sample();
  ok('aurora is static under prefers-reduced-motion', s1.waveA === s2.waveA, `${s1.waveA} / ${s2.waveA}`);
  ok('marquee is static under prefers-reduced-motion', s1.marquee === s2.marquee, `${s1.marquee} / ${s2.marquee}`);
  ok('stat float is static under prefers-reduced-motion', s1.stat === s2.stat, `${s1.stat} / ${s2.stat}`);

  const revealsVisible = await p.evaluate(() =>
    Array.from(document.querySelectorAll('.scroll-reveal')).every(el => getComputedStyle(el).opacity === '1')
  );
  ok('all .scroll-reveal elements are visible under prefers-reduced-motion', revealsVisible);

  await p.close();
}

// ---- Task 8: no-regression sweep over every remaining section -------------------
{
  const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
  await p.goto(URL, { waitUntil: 'networkidle' });

  const sections = await p.evaluate(() => {
    const ids = ['solutions', 'catalog-showcase', 'process', 'cta-final'];
    return ids.map((id) => {
      const el = document.getElementById(id);
      return { id, height: el ? el.getBoundingClientRect().height : 0 };
    });
  });
  for (const s of sections) {
    ok(`#${s.id} renders with height > 40px`, s.height > 40, s.height);
  }

  for (const width of [390, 768, 1440]) {
    const p2 = await b.newPage({ viewport: { width, height: 900 } });
    await p2.goto(URL, { waitUntil: 'networkidle' });
    const hasHScroll = await p2.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
    ok(`no horizontal scroll at ${width}px`, !hasHScroll);
    await p2.close();
  }

  await p.close();
}

await b.close();
const wI = Math.max(...results.map(r => r.name.length));
for (const r of results) console.log(`${r.pass ? 'PASS' : 'FAIL'}  ${r.name.padEnd(wI)}  ${r.detail}`);
const failed = results.filter(r => !r.pass);
console.log(`\n${results.length - failed.length}/${results.length} checks pass`);
process.exit(failed.length ? 1 : 0);
