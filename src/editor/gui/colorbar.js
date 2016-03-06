var cpr = require('../../cpr/cpr');

module.exports = function(editor) {
  var bar = cpr({
    data: editor.palette,
    onPick: function(color) {
      editor.selectedColor = color.isClearColor ? null : color;
    }
  });

  return bar;
};