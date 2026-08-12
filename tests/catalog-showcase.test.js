const test = require('node:test');
const assert = require('node:assert/strict');
const {
  activeBarCount,
  WAVEFORM_HEIGHTS,
  PLAYBACK_DURATION_MS
} = require('../assets/js/catalog-showcase.js');

test('WAVEFORM_HEIGHTS has exactly 12 bars', () => {
  assert.equal(WAVEFORM_HEIGHTS.length, 12);
});

test('PLAYBACK_DURATION_MS is 8000', () => {
  assert.equal(PLAYBACK_DURATION_MS, 8000);
});

test('activeBarCount is 0 at the very start', () => {
  assert.equal(activeBarCount(0), 0);
});

test('activeBarCount is 12 (all bars) once duration is reached', () => {
  assert.equal(activeBarCount(8000), 12);
});

test('activeBarCount is 12 (all bars) past the duration', () => {
  assert.equal(activeBarCount(9000), 12);
});

test('activeBarCount is 6 at exactly half the duration', () => {
  assert.equal(activeBarCount(4000), 6);
});

test('activeBarCount rounds down for a non-exact fraction', () => {
  assert.equal(activeBarCount(1000), 1);
});
