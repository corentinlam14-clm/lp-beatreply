(function (root) {
  'use strict';

  // Copper family, hardcoded to match the :root tokens in index.html
  // (--primary, --primary-hover, --secondary) — same approach catalog-demo.js
  // already used for its own data, kept consistent rather than reading
  // computed CSS custom properties at runtime.
  var STROKE_CORE = '#E87C3A';
  var STROKE_HIGHLIGHT = '#FFD9AE';
  var GLOW_COLOR = '#FFA568';
  var IMPULSE_COLOR = '255, 197, 140';

  var LINE_COUNT = 9;
  var CENTER_LINE_INDEX = 4;

  function init(options) {
    options = options || {};
    var canvas = options.canvas;
    var container = options.container;
    var pauseButton = options.pauseButton;

    if (!canvas || !container || !canvas.getContext) {
      return;
    }

    var ctx = canvas.getContext('2d');
    var reduced = window.matchMedia('(prefers-reduced-motion: reduce)');

    var w = container.clientWidth || 1200;
    var h = container.clientHeight || 700;
    var time = 0;
    var last = 0;
    var paused = reduced.matches;
    var impulses = [];
    var mx = 0.5, my = 0.5, px = 0.5, py = 0.5;

    function resize() {
      w = container.clientWidth;
      h = container.clientHeight;
      var density = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = w * density;
      canvas.height = h * density;
      ctx.setTransform(density, 0, 0, density, 0, 0);
      draw();
    }

    function draw() {
      ctx.clearRect(0, 0, w, h);
      ctx.globalCompositeOperation = 'screen';

      for (var i = 0; i < LINE_COUNT; i++) {
        var path = new Path2D();
        for (var x = -10; x < w + 12; x += 6) {
          var u = x / w;
          var y = h * 0.56 + (i - 4) * 11
            + Math.sin(u * 7.2 - time * 0.5 + i * 0.12) * h * 0.16
            + Math.sin(u * 12 + time * 0.3) * h * 0.03;
          y += Math.exp(-Math.pow((u - px) * 4, 2)) * (py - 0.5) * 60;
          for (var b = 0; b < impulses.length; b++) {
            var imp = impulses[b];
            var dist = Math.abs(u - imp.x);
            y += Math.sin(dist * 22 - imp.age * 9)
              * Math.exp(-imp.age * 1.4)
              * Math.exp(-Math.pow((dist - imp.age * 0.2) * 5, 2)) * 48;
          }
          if (x === -10) {
            path.moveTo(x, y);
          } else {
            path.lineTo(x, y);
          }
        }

        ctx.strokeStyle = STROKE_CORE;
        ctx.shadowColor = GLOW_COLOR;
        ctx.shadowBlur = 24;
        ctx.lineWidth = 10;
        ctx.globalAlpha = 0.14;
        ctx.stroke(path);

        ctx.lineWidth = 3;
        ctx.globalAlpha = 0.32;
        ctx.stroke(path);

        ctx.shadowBlur = 6;
        ctx.lineWidth = i === CENTER_LINE_INDEX ? 2 : 1.3;
        ctx.globalAlpha = i === CENTER_LINE_INDEX ? 1 : 0.55;
        ctx.strokeStyle = STROKE_HIGHLIGHT;
        ctx.stroke(path);
      }

      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;
      for (var k = 0; k < impulses.length; k++) {
        var imp2 = impulses[k];
        ctx.beginPath();
        ctx.ellipse(imp2.x * w, imp2.y * h, 10 + imp2.age * 140, 8 + imp2.age * 70, 0, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(' + IMPULSE_COLOR + ', ' + Math.max(0, 0.22 - imp2.age * 0.09) + ')';
        ctx.stroke();
      }
      ctx.globalCompositeOperation = 'source-over';
    }

    function setPaused(value) {
      paused = value;
      if (pauseButton) {
        pauseButton.setAttribute('aria-pressed', String(paused));
        pauseButton.textContent = paused ? 'Animer le fond' : 'Mettre en pause';
      }
      if (paused) {
        draw();
      }
    }

    if (pauseButton) {
      pauseButton.addEventListener('click', function () {
        setPaused(!paused);
      });
    }
    reduced.addEventListener('change', function (event) {
      setPaused(event.matches);
    });

    container.addEventListener('pointermove', function (event) {
      var rect = container.getBoundingClientRect();
      mx = (event.clientX - rect.left) / w;
      my = (event.clientY - rect.top) / h;
    });

    container.addEventListener('click', function (event) {
      if (event.target.closest('a, button')) {
        return;
      }
      var rect = container.getBoundingClientRect();
      impulses.push({
        x: (event.clientX - rect.left) / w,
        y: (event.clientY - rect.top) / h,
        age: 0,
      });
      if (impulses.length > 5) {
        impulses.shift();
      }
      if (paused) {
        draw();
      }
    });

    function frame(now) {
      var dt = last ? Math.min((now - last) / 1000, 0.04) : 0;
      last = now;
      if (!paused && document.visibilityState !== 'hidden' && container.getBoundingClientRect().bottom > 0) {
        time += dt;
        px += (mx - px) * 0.04;
        py += (my - py) * 0.04;
        for (var i = 0; i < impulses.length; i++) {
          impulses[i].age += dt;
        }
        impulses = impulses.filter(function (imp) {
          return imp.age < 2.8;
        });
        draw();
      }
      requestAnimationFrame(frame);
    }

    if (typeof ResizeObserver !== 'undefined') {
      new ResizeObserver(resize).observe(container);
    } else {
      window.addEventListener('resize', resize);
    }
    resize();
    setPaused(paused);
    requestAnimationFrame(frame);
  }

  var api = { init: init };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  } else {
    root.BeatReplyCopperWave = api;
  }
})(typeof window !== 'undefined' ? window : this);
