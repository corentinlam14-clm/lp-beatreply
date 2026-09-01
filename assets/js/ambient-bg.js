(function (root) {
  'use strict';

  // ---------------------------------------------------------------------------
  // Pure field math (unit-tested)
  // ---------------------------------------------------------------------------

  // Four warm light blobs. bx/by = rest position (fraction of viewport),
  // sx/sy = drift speed per axis (cycles per second), phase = start offset,
  // r = size multiplier.
  var BLOBS = [
    { hue: '#FF9D42', bx: 0.30, by: 0.55, sx: 0.10, sy: 0.07, phase: 0, r: 0.95 },
    { hue: '#C97B24', bx: 0.72, by: 0.32, sx: 0.07, sy: 0.12, phase: 2, r: 1.15 },
    { hue: '#FFC978', bx: 0.52, by: 0.78, sx: 0.14, sy: 0.05, phase: 4, r: 0.70 },
    { hue: '#7A430F', bx: 0.16, by: 0.18, sx: 0.05, sy: 0.09, phase: 1, r: 1.25 }
  ];

  var DRIFT = 0.12;          // fraction of the viewport a blob wanders from base
  var RADIUS_FACTOR = 0.672; // radius = RADIUS_FACTOR * max(w, h) * blob.r
  var PEAK_ALPHA = 0x33;     // centre alpha byte  (~0.20) — "intermediate" intensity
  var MID_ALPHA = 0x13;      // 42%-stop alpha byte (~0.075)
  var BG_COLOR = '#060608';
  var TWO_PI = Math.PI * 2;

  function blobCenter(blob, t, w, h) {
    return {
      x: (blob.bx + DRIFT * Math.sin(t * blob.sx * TWO_PI + blob.phase)) * w,
      y: (blob.by + DRIFT * Math.cos(t * blob.sy * TWO_PI + blob.phase)) * h
    };
  }

  function blobRadius(blob, w, h) {
    return Math.max(w, h) * RADIUS_FACTOR * blob.r;
  }

  function alphaHex(n) {
    n = Math.round(n);
    if (n < 0) { n = 0; } else if (n > 255) { n = 255; }
    return (n < 16 ? '0' : '') + n.toString(16);
  }

  // Paint one frame. `ctx` is a 2D context already scaled to DPR; w/h are CSS px.
  function paintField(ctx, w, h, t) {
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = BG_COLOR;
    ctx.fillRect(0, 0, w, h);
    ctx.globalCompositeOperation = 'lighter';
    for (var i = 0; i < BLOBS.length; i++) {
      var blob = BLOBS[i];
      var c = blobCenter(blob, t, w, h);
      var radius = blobRadius(blob, w, h);
      var grad = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, radius);
      grad.addColorStop(0, blob.hue + alphaHex(PEAK_ALPHA));
      grad.addColorStop(0.42, blob.hue + alphaHex(MID_ALPHA));
      grad.addColorStop(1, blob.hue + '00');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);
    }
    ctx.globalCompositeOperation = 'source-over';
  }

  // ---------------------------------------------------------------------------
  // Browser lifecycle
  // ---------------------------------------------------------------------------

  function start(doc) {
    doc = doc || (typeof document !== 'undefined' ? document : null);
    if (!doc) { return null; }

    var canvas = doc.getElementById('ambient-bg');
    if (!canvas || typeof canvas.getContext !== 'function' || !root.requestAnimationFrame) {
      return null;
    }
    var ctx = canvas.getContext('2d');
    if (!ctx) { return null; }

    var dpr = Math.min(root.devicePixelRatio || 1, 1.5);
    var cssW = 1, cssH = 1;
    var rafId = null;
    var startTime = 0;
    var needsFit = true;

    function fit() {
      cssW = canvas.clientWidth || root.innerWidth || 1;
      cssH = canvas.clientHeight || root.innerHeight || 1;
      canvas.width = Math.max(1, Math.round(cssW * dpr));
      canvas.height = Math.max(1, Math.round(cssH * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    var reduceMq = typeof root.matchMedia === 'function'
      ? root.matchMedia('(prefers-reduced-motion: reduce)')
      : null;
    function motionReduced() { return !!(reduceMq && reduceMq.matches); }

    function frame(now) {
      rafId = null;
      if (needsFit) { fit(); needsFit = false; }
      if (!startTime) { startTime = now; }
      paintField(ctx, cssW, cssH, (now - startTime) / 1000);
      if (!motionReduced()) { rafId = root.requestAnimationFrame(frame); }
    }

    function play() {
      if (rafId === null) {
        startTime = 0; // re-base time so a pause doesn't cause a visible jump
        rafId = root.requestAnimationFrame(frame);
      }
    }
    function pause() {
      if (rafId !== null) { root.cancelAnimationFrame(rafId); rafId = null; }
    }

    fit();
    needsFit = false;

    root.addEventListener('resize', function () { needsFit = true; play(); }, { passive: true });

    doc.addEventListener('visibilitychange', function () {
      if (doc.hidden) { pause(); } else if (!motionReduced()) { play(); }
    });

    if (reduceMq) {
      var onMotionChange = function () { pause(); play(); };
      if (reduceMq.addEventListener) { reduceMq.addEventListener('change', onMotionChange); }
      else if (reduceMq.addListener) { reduceMq.addListener(onMotionChange); }
    }

    play(); // paints the first frame; if motion is reduced, frame() will not reschedule
    return { play: play, pause: pause, fit: fit };
  }

  // ---------------------------------------------------------------------------
  // Exports
  // ---------------------------------------------------------------------------

  var api = {
    BLOBS: BLOBS,
    DRIFT: DRIFT,
    RADIUS_FACTOR: RADIUS_FACTOR,
    PEAK_ALPHA: PEAK_ALPHA,
    blobCenter: blobCenter,
    blobRadius: blobRadius,
    alphaHex: alphaHex,
    paintField: paintField,
    start: start
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  } else {
    root.BeatReplyAmbientBg = api;
  }
})(typeof window !== 'undefined' ? window : this);
