(function (root) {
  'use strict';

  function init(options) {
    options = options || {};
    var button = options.button;

    if (!button || !options.src || !window.Audio) {
      if (button) {
        button.hidden = true;
      }
      return;
    }

    // preload none: visitors who never switch the sound on do not download
    // the track at all.
    var audio = new Audio(options.src);
    audio.loop = true;
    audio.preload = 'none';

    var wanted = false;

    function setLabel() {
      button.textContent = wanted ? 'Couper le son' : 'Activer le son';
      button.setAttribute('aria-pressed', String(wanted));
    }

    button.addEventListener('click', function () {
      if (wanted) {
        wanted = false;
        audio.pause();
        setLabel();
        return;
      }
      wanted = true;
      setLabel();
      audio.play().catch(function () {
        wanted = false;
        setLabel();
      });
    });

    // No visibility handler on purpose: the sound keeps playing when the
    // visitor switches tab.

    setLabel();
  }

  root.BeatReplyMusicToggle = { init: init };
})(typeof window !== 'undefined' ? window : this);
