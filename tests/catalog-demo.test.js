const test = require('node:test');
const assert = require('node:assert/strict');
const { getStyleData, DEFAULT_STYLE } = require('../assets/js/catalog-demo.js');

test('getStyleData returns West Coast data with 21 total tracks and 3 sample tracks', () => {
  const data = getStyleData('westcoast');
  assert.equal(data.label, 'West Coast');
  assert.equal(data.totalCount, 21);
  assert.equal(data.tracks.length, 3);
  assert.deepEqual(
    data.tracks.map((t) => t.title),
    ['Hood', 'San Andreas', 'Cali']
  );
});

test('getStyleData returns R&B/Swag data with 18 total tracks', () => {
  const data = getStyleData('rnbswag');
  assert.equal(data.label, 'R&B/Swag');
  assert.equal(data.totalCount, 18);
  assert.equal(data.tracks.length, 3);
});

test('getStyleData returns Trap data with 11 total tracks', () => {
  const data = getStyleData('trap');
  assert.equal(data.label, 'Trap');
  assert.equal(data.totalCount, 11);
  assert.equal(data.tracks.length, 3);
});

test('getStyleData throws on an unknown style key', () => {
  assert.throws(() => getStyleData('lofi'), /Unknown style key: lofi/);
});

test('DEFAULT_STYLE is westcoast', () => {
  assert.equal(DEFAULT_STYLE, 'westcoast');
});
