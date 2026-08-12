(function (root) {
  'use strict';

  var WAVEFORM_HEIGHTS = [40, 65, 45, 80, 55, 90, 60, 40, 75, 50, 65, 45];
  var PLAYBACK_DURATION_MS = 8000;

  function activeBarCount(elapsedMs) {
    if (elapsedMs <= 0) {
      return 0;
    }
    if (elapsedMs >= PLAYBACK_DURATION_MS) {
      return WAVEFORM_HEIGHTS.length;
    }
    return Math.floor((elapsedMs / PLAYBACK_DURATION_MS) * WAVEFORM_HEIGHTS.length);
  }

  var playbackState = { cardIndex: -1, elapsedMs: 0, timerId: null };
  var REDUCED_MOTION_HOLD_MS = 1500;

  function setPlayIcon(card, isPlaying) {
    var playIcon = card.querySelector('[data-showcase-icon-play]');
    var pauseIcon = card.querySelector('[data-showcase-icon-pause]');
    playIcon.classList.toggle('hidden', isPlaying);
    pauseIcon.classList.toggle('hidden', !isPlaying);

    var button = card.querySelector('[data-showcase-play]');
    var title = card.querySelector('[data-showcase-title]').textContent;
    button.setAttribute('aria-label', (isPlaying ? 'Mettre en pause ' : 'Écouter un extrait de ') + title);
  }

  function setCardProgress(card, elapsedMs) {
    var bars = card.querySelectorAll('[data-showcase-bar]');
    var active = activeBarCount(elapsedMs);
    for (var i = 0; i < bars.length; i++) {
      bars[i].classList.toggle('bg-primary', i < active);
      bars[i].classList.toggle('bg-primary/25', i >= active);
    }
  }

  function stopPlayback(cards) {
    if (playbackState.timerId !== null) {
      clearInterval(playbackState.timerId);
      playbackState.timerId = null;
    }
    if (playbackState.cardIndex !== -1) {
      setCardProgress(cards[playbackState.cardIndex], 0);
      setPlayIcon(cards[playbackState.cardIndex], false);
    }
    playbackState.cardIndex = -1;
    playbackState.elapsedMs = 0;
  }

  function startPlayback(cards, index) {
    stopPlayback(cards);
    playbackState.cardIndex = index;
    playbackState.elapsedMs = 0;
    setPlayIcon(cards[index], true);

    var prefersReducedMotion = window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      setCardProgress(cards[index], PLAYBACK_DURATION_MS);
      playbackState.timerId = setInterval(function () {
        stopPlayback(cards);
      }, REDUCED_MOTION_HOLD_MS);
      return;
    }

    playbackState.timerId = setInterval(function () {
      playbackState.elapsedMs += 100;
      setCardProgress(cards[index], playbackState.elapsedMs);
      if (playbackState.elapsedMs >= PLAYBACK_DURATION_MS) {
        stopPlayback(cards);
      }
    }, 100);
  }

  function renderShowcase(doc, root, cards, styleKey) {
    stopPlayback(cards);

    var data = window.BeatReplyCatalogDemo.getStyleData(styleKey);

    var chips = root.querySelectorAll('[data-showcase-style]');
    for (var i = 0; i < chips.length; i++) {
      var isActive = chips[i].getAttribute('data-showcase-style') === styleKey;
      chips[i].setAttribute('aria-pressed', String(isActive));
      chips[i].classList.toggle('accent-gradient', isActive);
      chips[i].classList.toggle('text-background', isActive);
      chips[i].classList.toggle('bg-primary-muted', !isActive);
      chips[i].classList.toggle('text-primary', !isActive);
      chips[i].classList.toggle('border-primary/20', !isActive);
    }

    for (var j = 0; j < cards.length; j++) {
      var track = data.tracks[j];
      var card = cards[j];

      var cover = card.querySelector('[data-showcase-cover]');
      cover.classList.remove('showcase-cover-rnbswag', 'showcase-cover-westcoast', 'showcase-cover-trap');
      cover.classList.add('showcase-cover-' + styleKey);

      card.querySelector('[data-showcase-title]').textContent = track.title;
      card.querySelector('[data-showcase-meta]').textContent = data.label + ' · ' + track.bpm + ' BPM · ' + track.key;

      setPlayIcon(card, false);
      setCardProgress(card, 0);
    }
  }

  function initCatalogShowcase(doc) {
    doc = doc || document;
    if (!window.BeatReplyCatalogDemo) {
      return;
    }
    var root = doc.getElementById('catalog-showcase');
    if (!root) {
      return;
    }

    var cards = root.querySelectorAll('[data-showcase-card]');

    var chips = root.querySelectorAll('[data-showcase-style]');
    for (var i = 0; i < chips.length; i++) {
      chips[i].addEventListener('click', function (event) {
        renderShowcase(doc, root, cards, event.currentTarget.getAttribute('data-showcase-style'));
      });
    }

    for (var j = 0; j < cards.length; j++) {
      (function (index) {
        var playButton = cards[index].querySelector('[data-showcase-play]');
        playButton.addEventListener('click', function () {
          if (playbackState.cardIndex === index) {
            stopPlayback(cards);
          } else {
            startPlayback(cards, index);
          }
        });
      })(j);
    }

    renderShowcase(doc, root, cards, window.BeatReplyCatalogDemo.DEFAULT_STYLE);
  }

  var api = {
    activeBarCount: activeBarCount,
    WAVEFORM_HEIGHTS: WAVEFORM_HEIGHTS,
    PLAYBACK_DURATION_MS: PLAYBACK_DURATION_MS,
    initCatalogShowcase: initCatalogShowcase
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  } else {
    root.BeatReplyCatalogShowcase = api;
  }
})(typeof window !== 'undefined' ? window : this);
