var cpr = require('../../cpr/cpr');

module.exports = function(editor) {
  var bar = cpr({
    onPick: function(obj, index) {
      editor.prefabIndex = index;
      editor.load(editor.prefabs[index]);
    },
    blockWidth: 48,
    blockHeight: 48
  });

  bar.domElement.style.bottom = '120px';

  return bar;
};