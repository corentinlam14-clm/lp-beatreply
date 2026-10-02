const test = require('node:test');
const assert = require('node:assert/strict');
const { TONES, getTonePreview } = require('../assets/js/tone-preview.js');

test('Naturel tone quotes the real WAV price', () => {
  assert.match(getTonePreview('Naturel'), /70 €/);
});

test('Professionnel tone uses vouvoiement', () => {
  assert.match(getTonePreview('Professionnel'), /Souhaitez-vous/);
});

test('Familier tone uses tutoiement and informal phrasing', () => {
  assert.match(getTonePreview('Familier'), /Yes/);
});

test('getTonePreview throws on an unknown tone', () => {
  assert.throws(() => getTonePreview('Robotique'), /Unknown tone: Robotique/);
});

test('TONES has exactly the 3 supported presets', () => {
  assert.deepEqual(Object.keys(TONES), ['Naturel', 'Professionnel', 'Familier']);
});
