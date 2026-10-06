(function (root) {
  'use strict';

  // Minimum gap between two kicks, so one drum hit does not fire twice.
  var MIN_BEAT_GAP_MS = 220;
  // A kick is a sharp rise in bass: clearly above the recent average, and
  // higher than the previous reading. A multiplicative threshold does not work
  // here, because a loud bass sits near 1 and a ×1.35 threshold can never be met.
  var BEAT_MARGIN = 0.12;
  var BEAT_RISE = 0.05;
  // Speed of the rolling average used as the moving threshold.
  var AVERAGE_SPEED = 0.05;
  // The average starts at 0, so the first frames would all look like kicks.
  // About half a second of readings is needed before it means anything.
  var WARMUP_FRAMES = 30;

  // Pure beat detector, kept free of DOM and audio APIs so it can be tested.
  // state: { average, previous, lastBeatAt, frames } (mutated), bass: 0..1,
  // now: ms. Returns true when a kick is detected at `now`.
  function detectBeat(state, bass, now) {
    state.frames = (state.frames || 0) + 1;
    var rise = bass - (state.previous || 0);
    var isBeat =
      state.frames > WARMUP_FRAMES &&
      bass > state.average + BEAT_MARGIN &&
      rise > BEAT_RISE &&
      now - state.lastBeatAt > MIN_BEAT_GAP_MS;
    state.previous = bass;
    state.average += (bass - state.average) * AVERAGE_SPEED;
    if (isBeat) {
      state.lastBeatAt = now;
    }
    return isBeat;
  }

  function init(options) {
    options = options || {};
    var audioSrc = options.src;
    var button = options.button;
    var wave = options.wave;
    var AudioCtx = window.AudioContext || window.webkitAudioContext;

    if (!button || !audioSrc || !wave || !AudioCtx || !window.Audio) {
      if (button) {
        button.hidden = true;
      }
      return;
    }

    var reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    // preload none: visitors who never switch the sound on do not download
    // the track at all.
    var audio = new Audio(audioSrc);
    audio.loop = true;
    audio.preload = 'none';

    var context = null;
    var analyser = null;
    var bins = null;
    var playing = false;
    var wanted = false;
    var beatState = { average: 0, lastBeatAt: -Infinity, frames: 0 };
    var frameId = 0;
    // With a known tempo the kicks are placed on a grid read from the
    // track's own clock (audio.currentTime): exact for a produced beat, and
    // immune to analysis noise. `offset` is the time of the first kick.
    var bpm = options.bpm || 0;
    var offset = options.offset || 0;
    var gridIndex = -1;

    // The audio graph is built on the first click: browsers only allow an
    // AudioContext to start after a user gesture.
    function ensureGraph() {
      if (context) {
        return;
      }
      context = new AudioCtx();
      var source = context.createMediaElementSource(audio);
      analyser = context.createAnalyser();
      // 512 samples gives ~94 Hz per bin: the kick lives in the first bins.
      analyser.fftSize = 512;
      // The default dB window (-100..-30) saturates on a loud bass: every
      // reading sits at the top and no kick can stand out. This window keeps
      // the bass below the ceiling so its peaks stay readable.
      analyser.minDecibels = -80;
      analyser.maxDecibels = -5;
      bins = new Uint8Array(analyser.frequencyBinCount);
      source.connect(analyser);
      analyser.connect(context.destination);
    }

    function setLabel() {
      button.textContent = wanted ? 'Couper le son' : 'Activer le son';
      button.setAttribute('aria-pressed', String(wanted));
    }

    function loop(now) {
      if (!playing) {
        return;
      }
      analyser.getByteFrequencyData(bins);
      var bass = (bins[0] + bins[1] + bins[2]) / 3 / 255;

      if (reduced.matches) {
        wave.setLevel(0);
      } else {
        wave.setLevel(Math.min(1, bass * 1.5));
        if (bpm) {
          var index = Math.floor((audio.currentTime - offset) / (60 / bpm));
          if (index >= 0 && index !== gridIndex) {
            gridIndex = index;
            wave.pulse(1);
          }
        } else if (detectBeat(beatState, bass, now)) {
          wave.pulse(0.6 + bass * 0.8);
        }
      }
      frameId = requestAnimationFrame(loop);
    }

    function start() {
      try {
        ensureGraph();
      } catch (error) {
        button.hidden = true;
        return;
      }
      if (context.state === 'suspended') {
        context.resume();
      }
      wanted = true;
      setLabel();
      audio.play().then(function () {
        playing = true;
        beatState = { average: 0, lastBeatAt: -Infinity, frames: 0 };
        frameId = requestAnimationFrame(loop);
      }).catch(function () {
        wanted = false;
        setLabel();
      });
    }

    function stop() {
      wanted = false;
      playing = false;
      cancelAnimationFrame(frameId);
      audio.pause();
      wave.setLevel(0);
      setLabel();
    }

    button.addEventListener('click', function () {
      if (wanted) {
        stop();
      } else {
        start();
      }
    });

    // Sound stops with the tab and resumes when the visitor comes back, as
    // long as they had switched it on.
    document.addEventListener('visibilitychange', function () {
      if (document.visibilityState === 'hidden' && playing) {
        playing = false;
        cancelAnimationFrame(frameId);
        audio.pause();
        wave.setLevel(0);
      } else if (document.visibilityState === 'visible' && wanted && !playing) {
        audio.play().then(function () {
          playing = true;
          frameId = requestAnimationFrame(loop);
        }).catch(function () {});
      }
    });

    setLabel();
  }

  var api = { init: init, detectBeat: detectBeat };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  } else {
    root.BeatReplyMusicSync = api;
  }
})(typeof window !== 'undefined' ? window : this);
