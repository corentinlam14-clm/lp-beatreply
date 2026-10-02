const test = require('node:test');
const assert = require('node:assert/strict');
const { SCENARIOS, getScenario } = require('../assets/js/hero-demo-chat.js');

test('getScenario returns the pricing scenario with the real WAV price', () => {
  const scenario = getScenario(0);
  assert.match(scenario.client, /WAV/);
  assert.match(scenario.bot, /70 €/);
});

test('getScenario returns the West Coast style-clarifying scenario', () => {
  const scenario = getScenario(1);
  assert.match(scenario.client, /West Coast/);
  assert.match(scenario.bot, /chill|énergique/);
});

test('getScenario returns the exclusivity scenario that escalates to the beatmaker', () => {
  const scenario = getScenario(2);
  assert.match(scenario.client, /exclusivité/);
  assert.match(scenario.bot, /beatmaker/);
});

test('getScenario throws on an unknown index', () => {
  assert.throws(() => getScenario(99), /Unknown scenario index: 99/);
});

test('SCENARIOS has exactly 3 entries', () => {
  assert.equal(SCENARIOS.length, 3);
});
