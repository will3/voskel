var cpr = require('../../cpr/cpr');

module.exports = function(editor) {
  var data = [{
    button: 'plus',
    src: '/images/plus.png'
  }, {
    button: 'minus',
    src: '/images/minus.png'
  }, {
    button: 'clone',
    src: '/images/clone.png'
  }];

  var bar = cpr({
    data: data,
    blockWidth: 32,
    blockHeight: 32,
    disableHighlight: true,
    onPick: function(obj) {
      var button = obj.button;

      if (button === 'plus') {
        editor.createNew();
      } else if (button === 'minus') {
        editor.removeSelected();
      } else if (button === 'clone') {
        editor.createClone();
      }
    }
  });

  bar.domElement.style.bottom = '180px';
};