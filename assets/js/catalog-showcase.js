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

  var api = {
    activeBarCount: activeBarCount,
    WAVEFORM_HEIGHTS: WAVEFORM_HEIGHTS,
    PLAYBACK_DURATION_MS: PLAYBACK_DURATION_MS
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  } else {
    root.BeatReplyCatalogShowcase = api;
  }
})(typeof window !== 'undefined' ? window : this);
