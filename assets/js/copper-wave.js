(function (root) {
  'use strict';

  function init(options) {
    options = options || {};
    var canvas = options.canvas;
    var container = options.container;
    var pauseButton = options.pauseButton;

    if (!canvas || !container || !canvas.getContext) {
      return;
    }

    var ctx = canvas.getContext('2d');
    var bg = document.createElement('canvas');
    var bgCtx = bg.getContext('2d');
    var reduced = window.matchMedia('(prefers-reduced-motion: reduce)');

    var w = 1200, h = 850, time = 0, last = 0;
    var paused = reduced.matches;
    var impulses = [];
    var mx = 0.7, my = 0.5, px = 0.7, py = 0.5;
    // Driven by the music (see music-sync.js): level swells the wave's
    // amplitude, pulses are kick impulses spawned at a random horizontal spot.
    var level = 0, levelTarget = 0;

    function resize() {
      w = container.clientWidth;
      h = container.clientHeight;
      var d = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = w * d;
      canvas.height = h * d;
      ctx.setTransform(d, 0, 0, d, 0, 0);
      bg.width = canvas.width;
      bg.height = canvas.height;
      bgCtx.setTransform(d, 0, 0, d, 0, 0);
      paintBackground();
      draw();
    }

    // The base fill and radial glow never change, so they are painted once per
    // resize and blitted each frame instead of being recreated every frame.
    function paintBackground() {
      bgCtx.fillStyle = '#0b0a09';
      bgCtx.fillRect(0, 0, w, h);

      var glow = bgCtx.createRadialGradient(w * 0.75, h * 0.6, 0, w * 0.75, h * 0.6, w * 0.7);
      glow.addColorStop(0, '#8d421a35');
      glow.addColorStop(1, '#0b0a0900');
      bgCtx.fillStyle = glow;
      bgCtx.fillRect(0, 0, w, h);
    }

    function draw() {
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
      ctx.drawImage(bg, 0, 0, w, h);

      ctx.globalCompositeOperation = 'screen';
      ctx.lineJoin = 'round';
      for (var i = 0; i < 11; i++) {
        var path = new Path2D();
        for (var x = -10; x < w + 12; x += 5) {
          var u = x / w;
          var y = h * 0.64 + (i - 5) * 13
            + Math.sin(u * 7.5 - time * 0.55 + i * 0.105) * h * 0.19 * (1 + level * 0.6)
            + Math.sin(u * 13 + time * 0.35) * h * 0.035;
          y += Math.exp(-Math.pow((u - px) * 4, 2)) * (py - 0.5) * 70;
          for (var b = 0; b < impulses.length; b++) {
            var imp = impulses[b];
            var dist = Math.abs(u - imp.x);
            y += Math.sin(dist * 24 - imp.age * 10)
              * Math.exp(-imp.age * 1.5)
              * Math.exp(-Math.pow((dist - imp.age * 0.2) * 5, 2)) * 55 * imp.strength;
          }
          if (x === -10) {
            path.moveTo(x, y);
          } else {
            path.lineTo(x, y);
          }
        }
        // Soft halo as two wide translucent strokes. shadowBlur on every line
        // every frame was the main cost behind the stutter.
        ctx.strokeStyle = '#ff863e';
        ctx.lineWidth = 12;
        ctx.globalAlpha = 0.05;
        ctx.stroke(path);

        ctx.lineWidth = 4;
        ctx.globalAlpha = 0.14;
        ctx.stroke(path);

        ctx.strokeStyle = '#ffdab3';
        ctx.lineWidth = i === 5 ? 1.7 : 1;
        ctx.globalAlpha = i === 5 ? 0.95 : 0.4;
        ctx.stroke(path);
      }
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
    }

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
      addImpulse((event.clientX - rect.left) / w, 1);
    });

    function addImpulse(x, strength) {
      impulses.push({
        x: x,
        age: 0,
        strength: strength,
      });
      if (impulses.length > 5) {
        impulses.shift();
      }
      if (paused) {
        draw();
      }
    }

    function pauseLabel() {
      if (!pauseButton) {
        return;
      }
      pauseButton.textContent = paused ? 'Animer le fond' : 'Mettre en pause';
      pauseButton.setAttribute('aria-pressed', String(paused));
    }

    if (pauseButton) {
      pauseButton.addEventListener('click', function () {
        paused = !paused;
        pauseLabel();
      });
    }
    reduced.addEventListener('change', function (event) {
      paused = event.matches;
      pauseLabel();
    });

    function frame(now) {
      var dt = last ? Math.min((now - last) / 1000, 0.04) : 0;
      last = now;
      if (!paused && document.visibilityState !== 'hidden' && container.getBoundingClientRect().bottom > 0) {
        time += dt;
        px += (mx - px) * 0.04;
        py += (my - py) * 0.04;
        level += (levelTarget - level) * 0.2;
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
    pauseLabel();
    requestAnimationFrame(frame);

    return {
      pulse: function (strength) {
        addImpulse(0.15 + Math.random() * 0.7, strength);
      },
      setLevel: function (value) {
        levelTarget = Math.max(0, Math.min(1, value));
      },
    };
  }

  var api = { init: init };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  } else {
    root.BeatReplyCopperWave = api;
  }
})(typeof window !== 'undefined' ? window : this);
