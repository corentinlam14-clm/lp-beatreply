const test = require('node:test');
const assert = require('node:assert/strict');
const { detectBeat } = require('../assets/js/music-sync.js');

function freshState() {
  return { average: 0, lastBeatAt: -Infinity, frames: 0 };
}

test('a steady bass level never counts as a kick', () => {
  const state = freshState();
  let beats = 0;
  for (let t = 0; t < 3000; t += 16) {
    if (detectBeat(state, 0.3, t)) beats++;
  }
  // Only the first few frames can trip the floor while the average warms up.
  assert.ok(beats <= 1, `expected at most 1 beat, got ${beats}`);
});

test('a sharp bass spike after a quiet stretch is a kick', () => {
  const state = freshState();
  for (let t = 0; t < 500; t += 16) detectBeat(state, 0.1, t);
  assert.equal(detectBeat(state, 0.9, 520), true);
});

test('two spikes inside the minimum gap fire only once', () => {
  const state = freshState();
  for (let t = 0; t < 500; t += 16) detectBeat(state, 0.1, t);
  assert.equal(detectBeat(state, 0.9, 520), true);
  assert.equal(detectBeat(state, 0.9, 600), false);
});

test('a spike after the gap fires again', () => {
  const state = freshState();
  for (let t = 0; t < 500; t += 16) detectBeat(state, 0.1, t);
  detectBeat(state, 0.9, 520);
  for (let t = 536; t < 900; t += 16) detectBeat(state, 0.1, t);
  assert.equal(detectBeat(state, 0.9, 920), true);
});
