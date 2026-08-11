(function (root) {
  'use strict';

  var CATALOG_DATA = {
    rnbswag: {
      label: 'R&B/Swag',
      totalCount: 18,
      clientMessage: "Salut, t'as un truc R&B/Swag stylé ?",
      tracks: [
        { title: 'Swaggy', bpm: 98, key: 'A Min' },
        { title: 'Real Love', bpm: 122, key: 'F# Min' },
        { title: 'Snake', bpm: 93, key: 'C# Min' }
      ]
    },
    westcoast: {
      label: 'West Coast',
      totalCount: 21,
      clientMessage: "Yo t'as un type beat West Coast, tempo genre 100 ?",
      tracks: [
        { title: 'Hood', bpm: 98, key: 'F Min' },
        { title: 'San Andreas', bpm: 99, key: 'G Min' },
        { title: 'Cali', bpm: 103, key: 'D# Min' }
      ]
    },
    trap: {
      label: 'Trap',
      totalCount: 11,
      clientMessage: "T'as de la trap qui tape fort ?",
      tracks: [
        { title: 'TrapHouse', bpm: 139, key: 'C Min' },
        { title: 'Jungle', bpm: 127, key: 'D# Min' },
        { title: 'RockMySoul', bpm: 120, key: 'D# Min' }
      ]
    }
  };

  var DEFAULT_STYLE = 'westcoast';

  function getStyleData(styleKey) {
    var data = CATALOG_DATA[styleKey];
    if (!data) {
      throw new Error('Unknown style key: ' + styleKey);
    }
    return data;
  }

  function renderStyle(doc, root, styleKey) {
    var data = getStyleData(styleKey);

    var chips = root.querySelectorAll('[data-style]');
    for (var i = 0; i < chips.length; i++) {
      var isActive = chips[i].getAttribute('data-style') === styleKey;
      chips[i].setAttribute('aria-pressed', String(isActive));
      chips[i].classList.toggle('accent-gradient', isActive);
      chips[i].classList.toggle('text-background', isActive);
      chips[i].classList.toggle('bg-primary-muted', !isActive);
      chips[i].classList.toggle('text-primary', !isActive);
      chips[i].classList.toggle('border-primary/20', !isActive);
    }

    var clientMessageEl = root.querySelector('[data-demo-client-message]');
    clientMessageEl.textContent = data.clientMessage;

    var cardsEl = root.querySelector('[data-demo-track-cards]');
    cardsEl.textContent = '';
    for (var j = 0; j < data.tracks.length; j++) {
      var track = data.tracks[j];
      var card = doc.createElement('div');
      card.className = 'rounded-md bg-background/10 px-3 py-2';

      var titleEl = doc.createElement('p');
      titleEl.className = 'text-body-sm font-semibold';
      titleEl.textContent = track.title;

      var metaEl = doc.createElement('p');
      metaEl.className = 'text-caption text-background/70';
      metaEl.textContent = track.bpm + ' BPM · ' + track.key;

      card.appendChild(titleEl);
      card.appendChild(metaEl);
      cardsEl.appendChild(card);
    }

    var countEl = root.querySelector('[data-demo-count]');
    countEl.textContent = data.totalCount + ' prods disponibles en ' + data.label;
  }

  function initCatalogDemo(doc) {
    doc = doc || document;
    var root = doc.getElementById('hero-demo');
    if (!root) {
      return;
    }

    var chips = root.querySelectorAll('[data-style]');
    for (var i = 0; i < chips.length; i++) {
      chips[i].addEventListener('click', function (event) {
        renderStyle(doc, root, event.currentTarget.getAttribute('data-style'));
      });
    }

    renderStyle(doc, root, DEFAULT_STYLE);
  }

  var api = {
    getStyleData: getStyleData,
    DEFAULT_STYLE: DEFAULT_STYLE,
    initCatalogDemo: initCatalogDemo
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  } else {
    root.BeatReplyCatalogDemo = api;
  }
})(typeof window !== 'undefined' ? window : this);
