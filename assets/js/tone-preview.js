(function (root) {
  'use strict';

  // Matches the real tone presets the bot personality setting supports
  // (see memory: bot personality config shipped 2026-08-24) — same WAV
  // pricing as the hero demo, just rephrased per tone.
  var TONES = {
    Naturel: 'La licence WAV est à 70 €. Tu veux que je t’envoie le catalogue ?',
    Professionnel: 'Bonjour, la licence WAV est proposée à 70 €. Souhaitez-vous consulter le catalogue ?',
    Familier: 'Yes, c’est 70 € la WAV ! Je t’envoie le catalogue ?',
  };

  function getTonePreview(tone) {
    var preview = TONES[tone];
    if (!preview) {
      throw new Error('Unknown tone: ' + tone);
    }
    return preview;
  }

  function initTonePreview(doc) {
    doc = doc || document;
    var previewEl = doc.getElementById('tone-preview');
    var toneButtons = doc.querySelectorAll('[data-tone]');
    if (!previewEl || !toneButtons.length) {
      return;
    }

    for (var i = 0; i < toneButtons.length; i++) {
      toneButtons[i].addEventListener('click', function (event) {
        var button = event.currentTarget;
        for (var j = 0; j < toneButtons.length; j++) {
          var other = toneButtons[j];
          var isActive = other === button;
          other.classList.toggle('active', isActive);
          other.setAttribute('aria-pressed', String(isActive));
        }
        previewEl.textContent = getTonePreview(button.getAttribute('data-tone'));
      });
    }
  }

  var api = {
    TONES: TONES,
    getTonePreview: getTonePreview,
    initTonePreview: initTonePreview,
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  } else {
    root.BeatReplyTonePreview = api;
  }
})(typeof window !== 'undefined' ? window : this);
