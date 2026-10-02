(function (root) {
  'use strict';

  // Mirrors our real bot behavior (see memory: AI closes standard sales,
  // escalates to the beatmaker only for negotiation) and the real pricing
  // grid shown in the catalog showcase section (MP3 40 € · WAV 70 € ·
  // Stems 150 €) — kept consistent rather than inventing demo-only numbers.
  var SCENARIOS = [
    {
      client: 'Salut ! Combien pour une WAV ?',
      bot: 'La licence WAV est à 70 €. Tu veux le reste de la grille (MP3 40 € · Stems 150 €) et le catalogue ?',
    },
    {
      client: 'Salut, je cherche une prod West Coast.',
      bot: 'Avec plaisir ! Tu cherches quelque chose de chill ou plutôt énergique ?',
    },
    {
      client: 'Je voudrais négocier une exclusivité.',
      bot: 'Bien sûr, je laisse le beatmaker reprendre la conversation pour en discuter avec toi.',
    },
  ];

  function getScenario(index) {
    var scenario = SCENARIOS[index];
    if (!scenario) {
      throw new Error('Unknown scenario index: ' + index);
    }
    return scenario;
  }

  function createBubble(doc, text, outgoing, label) {
    var bubble = doc.createElement('div');
    bubble.className = outgoing
      ? 'self-end rounded-lg rounded-tr-none accent-gradient px-4 py-3 max-w-[85%] text-body-sm text-background font-medium'
      : 'self-start rounded-lg rounded-tl-none bg-surface-elevated px-4 py-3 max-w-[85%] text-body-sm text-text-secondary';
    if (label) {
      var labelEl = doc.createElement('span');
      labelEl.className = 'block text-caption mb-1 ' + (outgoing ? 'text-background/70' : 'text-text-ghost');
      labelEl.textContent = label;
      bubble.appendChild(labelEl);
    }
    bubble.appendChild(doc.createTextNode(text));
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
    var scenarioButtons = root.querySelectorAll('[data-scenario]');

    var current = 0;
    var manual = false;

    function renderMessages() {
      messagesEl.textContent = '';
      var scenario = getScenario(current);
      messagesEl.appendChild(createBubble(doc, scenario.client, false));
      messagesEl.appendChild(createBubble(doc, scenario.bot, true, 'BeatReply · Assistant IA'));
    }

    function updateControls() {
      takeButton.textContent = manual ? 'Réactiver l’assistant' : 'Prendre la main';
      statusEl.textContent = manual ? 'Tu gères cet échange' : 'L’assistant répond';
      input.disabled = !manual;
      sendButton.disabled = !manual;
      input.placeholder = manual ? 'Écris un message test…' : 'Reprends la main pour répondre';
    }

    for (var i = 0; i < scenarioButtons.length; i++) {
      scenarioButtons[i].addEventListener('click', function (event) {
        var button = event.currentTarget;
        current = Number(button.getAttribute('data-scenario'));
        for (var j = 0; j < scenarioButtons.length; j++) {
          var other = scenarioButtons[j];
          var isActive = other === button;
          other.setAttribute('aria-pressed', String(isActive));
          other.classList.toggle('bg-primary/10', isActive);
          other.classList.toggle('text-text-primary', isActive);
          other.classList.toggle('text-text-secondary', !isActive);
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
    getScenario: getScenario,
    initHeroDemoChat: initHeroDemoChat,
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  } else {
    root.BeatReplyHeroDemoChat = api;
  }
})(typeof window !== 'undefined' ? window : this);
