(function (root) {
  'use strict';

  // Mirrors our real bot behavior (see memory: AI closes standard sales,
  // escalates to the beatmaker only for negotiation) and the real pricing
  // grid (MP3 40 € · WAV 70 € · Stems 150 €) — kept consistent rather than
  // inventing demo-only numbers.
  //
  // {lien} is replaced by the link of the shop chosen above the demo.
  // botWithoutShop is the reply when the beatmaker has no shop link: the real
  // bot then never offers a link and says the beatmaker will send something
  // to listen to (respond.ts). Fictional prods and links: nothing on this
  // public page points to a real beatmaker.   and ‑ (non-breaking
  // space and hyphen) keep "! :", the titles and the links on one line on
  // phones.
  var SCENARIOS = [
    {
      client: 'Salut ! Combien pour une WAV ?',
      bot: 'La licence WAV est à 70 €. Tu veux le lien de ma boutique pour écouter les prods ?',
      botWithoutShop: 'La licence WAV est à 70 €. Tu cherches quel style de prod ?',
    },
    {
      client: 'Salut, je cherche une prod West Coast.',
      bot: 'Avec plaisir ! Tu cherches quelque chose de chill ou plutôt énergique ?',
    },
    {
      client: 'Je voudrais négocier une exclusivité.',
      bot: 'Bien sûr. Je laisse le beatmaker reprendre la conversation pour en discuter avec toi.',
    },
    // The assistant shares the shop link without being asked for it (Lucas's
    // idea), as the real bot does: a buyer who wants to listen to a catalogue
    // prod with no link of its own gets the shop link plus the section to look
    // in (respond.ts).
    {
      client: 'Salut ! T’aurais de la trap à me faire écouter ?',
      bot:
        'Grave ! J’ai de la trap avec Midnight Soul, 140 BPM en C Minor.\n' +
        'Tu peux l’écouter sur ma boutique, dans la rubrique "Trap" :\n' +
        '{lien}',
      botWithoutShop:
        'Grave ! J’ai de la trap avec Midnight Soul, 140 BPM en C Minor.\n' +
        'Le beatmaker t’envoie de quoi l’écouter directement.',
    },
    // A buyer who asks for the catalogue gets the shop link alone, as the real
    // bot does: it sends that link when asked, once, and never says
    // "catalogue" to the buyer (respond.ts).
    {
      client: 'Yo ! Tu peux m’envoyer ton catalogue ?',
      bot:
        'Bien sûr ! Toutes mes prods sont sur ma boutique :\n' +
        '{lien}\n' +
        'Si tu cherches un style en particulier, dis‑moi et je te guide.',
      botWithoutShop:
        'Dis‑moi quel style tu cherches et je te présente les prods qui collent.\n' +
        'Le beatmaker t’envoie de quoi les écouter directement.',
    },
    // Recognising the prod of a reel shared in DM is a Premium feature (the
    // beatmaker links the reel to the prod in the catalogue), hence the badge.
    {
      client: 'J’adore la prod de ce reel ! Je peux l’écouter ?',
      bot:
        'Merci ! C’est Velvet Night, 92 BPM en A Minor.\n' +
        'Tu peux l’écouter sur ma boutique, dans la rubrique "R&B" :\n' +
        '{lien}',
      botWithoutShop:
        'Merci ! C’est Velvet Night, 92 BPM en A Minor.\n' +
        'Le beatmaker t’envoie de quoi l’écouter directement.',
      premium: true,
    },
  ];

  // null = no shop link: the replies use botWithoutShop.
  var SHOPS = {
    beatstars: { link: 'beatstars.com/ton‑nom', note: 'Les liens envoyés par l’assistant mènent à ta boutique BeatStars.' },
    airbit: { link: 'airbit.com/ton‑nom', note: 'Les liens envoyés par l’assistant mènent à ta boutique Airbit.' },
    untitled: { link: 'untitled.stream/ton‑nom', note: 'Les liens envoyés par l’assistant mènent à ta page Untitled.' },
    none: { link: null, note: 'Sans boutique en ligne, l’assistant présente tes prods et tu envoies toi-même de quoi les écouter.' },
  };

  var LINK_PATTERN = /((?:beatstars\.com|airbit\.com|untitled\.stream)\/\S+)/;

  function getScenario(index, shop) {
    var scenario = SCENARIOS[index];
    if (!scenario) {
      throw new Error('Unknown scenario index: ' + index);
    }
    var shopConfig = SHOPS[shop || 'beatstars'];
    if (!shopConfig) {
      throw new Error('Unknown shop: ' + shop);
    }
    var bot = shopConfig.link
      ? scenario.bot.replace('{lien}', shopConfig.link)
      : scenario.botWithoutShop || scenario.bot;
    return { client: scenario.client, bot: bot, premium: Boolean(scenario.premium) };
  }

  function createBubble(doc, text, outgoing, label) {
    var bubble = doc.createElement('div');
    bubble.className = 'bubble' + (outgoing ? ' out' : '');
    if (label) {
      var labelEl = doc.createElement('small');
      labelEl.textContent = label;
      bubble.appendChild(labelEl);
    }
    // Links are shown as links (copper, underlined) but not clickable: they
    // are examples, not real shops.
    var parts = text.split(LINK_PATTERN);
    for (var i = 0; i < parts.length; i++) {
      if (i % 2 === 1) {
        var link = doc.createElement('span');
        link.className = 'demo-link';
        link.textContent = parts[i];
        bubble.appendChild(link);
      } else if (parts[i]) {
        bubble.appendChild(doc.createTextNode(parts[i]));
      }
    }
    return bubble;
  }

  function initHeroDemoChat(doc) {
    doc = doc || document;
    var root = doc.getElementById('hero-demo');
    if (!root) {
      return;
    }

    var messagesEl = doc.getElementById('hero-demo-messages');
    var statusEl = doc.getElementById('hero-demo-status');
    var takeButton = doc.getElementById('hero-demo-take');
    var input = doc.getElementById('hero-demo-input');
    var sendButton = doc.getElementById('hero-demo-send');
    var controlNote = doc.getElementById('hero-demo-control');
    var composer = doc.getElementById('hero-demo-composer');
    var shopNote = doc.getElementById('hero-demo-shop-note');
    var scenarioButtons = root.querySelectorAll('[data-scenario]');
    var shopButtons = doc.querySelectorAll('[data-shop]');

    var current = 0;
    var shop = 'beatstars';
    var manual = false;

    function renderMessages() {
      messagesEl.textContent = '';
      var scenario = getScenario(current, shop);
      var label = 'BeatReply · Assistant IA' + (scenario.premium ? ' · Premium' : '');
      messagesEl.appendChild(createBubble(doc, scenario.client, false));
      messagesEl.appendChild(createBubble(doc, scenario.bot, true, label));
    }

    function updateControls() {
      takeButton.textContent = manual ? 'Réactiver l’assistant' : 'Prendre la main';
      statusEl.textContent = manual ? 'Tu gères cet échange' : 'L’assistant répond';
      input.disabled = !manual;
      sendButton.disabled = !manual;
      input.placeholder = manual ? 'Écris un message test…' : 'Reprends la main pour répondre';
    }

    function selectIn(buttons, selected) {
      for (var j = 0; j < buttons.length; j++) {
        var isActive = buttons[j] === selected;
        buttons[j].classList.toggle('active', isActive);
        buttons[j].setAttribute('aria-pressed', String(isActive));
      }
    }

    for (var i = 0; i < scenarioButtons.length; i++) {
      scenarioButtons[i].addEventListener('click', function (event) {
        current = Number(event.currentTarget.getAttribute('data-scenario'));
        selectIn(scenarioButtons, event.currentTarget);
        renderMessages();
      });
    }

    for (var k = 0; k < shopButtons.length; k++) {
      shopButtons[k].addEventListener('click', function (event) {
        shop = event.currentTarget.getAttribute('data-shop');
        selectIn(shopButtons, event.currentTarget);
        if (shopNote) {
          shopNote.textContent = SHOPS[shop].note;
        }
        renderMessages();
      });
    }

    takeButton.addEventListener('click', function () {
      manual = !manual;
      updateControls();
      if (manual) {
        input.focus();
      }
    });

    composer.addEventListener('submit', function (event) {
      event.preventDefault();
      if (!manual || !input.value.trim()) {
        return;
      }
      messagesEl.appendChild(createBubble(doc, input.value.trim(), true, 'Toi · Démonstration'));
      input.value = '';
      controlNote.textContent = 'Message ajouté à cet aperçu. Aucun envoi sur Instagram.';
    });

    renderMessages();
    updateControls();
  }

  var api = {
    SCENARIOS: SCENARIOS,
    SHOPS: SHOPS,
    getScenario: getScenario,
    initHeroDemoChat: initHeroDemoChat,
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  } else {
    root.BeatReplyHeroDemoChat = api;
  }
})(typeof window !== 'undefined' ? window : this);
