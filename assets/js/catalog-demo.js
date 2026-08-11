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

  var api = {
    getStyleData: getStyleData,
    DEFAULT_STYLE: DEFAULT_STYLE
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  } else {
    root.BeatReplyCatalogDemo = api;
  }
})(typeof window !== 'undefined' ? window : this);
