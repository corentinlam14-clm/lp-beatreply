const test = require('node:test');
const assert = require('node:assert/strict');
const { SCENARIOS, getScenario } = require('../assets/js/hero-demo-chat.js');

test('getScenario returns the pricing scenario with the real WAV price', () => {
  const scenario = getScenario(0);
  assert.match(scenario.client, /WAV/);
  assert.match(scenario.bot, /70\s€/);
  assert.match(scenario.bot, /boutique/);
  assert.doesNotMatch(scenario.bot, /catalogue/);
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

test('getScenario returns the listening scenario: the shop link comes unasked, with its section', () => {
  const scenario = getScenario(3);
  assert.match(scenario.client, /écouter/);
  assert.doesNotMatch(scenario.client, /lien|catalogue|boutique/);
  assert.match(scenario.bot, /Midnight\sSoul, 140\sBPM en C\sMinor/);
  assert.match(scenario.bot, /rubrique "Trap"/);
  assert.equal(scenario.bot.match(/beatstars\.com\/\S+/g).length, 1);
});

test('getScenario returns the catalogue scenario: just the shop link, once, without saying "catalogue"', () => {
  const scenario = getScenario(4);
  assert.match(scenario.client, /catalogue/);
  assert.equal(scenario.bot.match(/beatstars\.com\/\S+/g).length, 1);
  assert.doesNotMatch(scenario.bot, /catalogue|BPM/);
});

test('getScenario returns the reel scenario, marked Premium: the prod is recognised and the shop link sent', () => {
  const scenario = getScenario(5);
  assert.equal(scenario.premium, true);
  assert.match(scenario.client, /reel/);
  assert.match(scenario.bot, /Velvet\sNight, 92\sBPM en A\sMinor/);
  assert.equal(scenario.bot.match(/beatstars\.com\/\S+/g).length, 1);
});

test('only the reel scenario is marked Premium', () => {
  const premium = SCENARIOS.map((_, index) => getScenario(index).premium);
  assert.deepEqual(premium, [false, false, false, false, false, true]);
});

test('the shop link follows the chosen platform', () => {
  for (const [shop, domain] of [['airbit', 'airbit.com'], ['untitled', 'untitled.stream']]) {
    for (const index of [3, 4, 5]) {
      const bot = getScenario(index, shop).bot;
      assert.equal(bot.split(domain + '/').length - 1, 1, `${shop} #${index}`);
      assert.doesNotMatch(bot, /beatstars/);
    }
  }
});

test('without a shop, no link is sent and the beatmaker sends something to listen to', () => {
  for (let index = 0; index < SCENARIOS.length; index++) {
    const bot = getScenario(index, 'none').bot;
    assert.doesNotMatch(bot, /\.com\/|\.stream\/|boutique|\{lien\}/, `#${index}`);
  }
  for (const index of [3, 4, 5]) {
    assert.match(getScenario(index, 'none').bot, /beatmaker t’envoie de quoi l/);
  }
});

test('getScenario throws on an unknown index or shop', () => {
  assert.throws(() => getScenario(99), /Unknown scenario index: 99/);
  assert.throws(() => getScenario(0, 'soundcloud'), /Unknown shop: soundcloud/);
});

test('SCENARIOS has exactly 6 entries', () => {
  assert.equal(SCENARIOS.length, 6);
});
