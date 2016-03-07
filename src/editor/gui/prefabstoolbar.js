var cpr = require('./cpr');

module.exports = function(editor) {
  var input = editor.input;
  var data = [{
    button: 'plus',
    src: '/images/icons/plus_light.png',
    srcActive: '/images/icons/plus_dark.png',
    tooltip: 'Create new'
  }, {
    button: 'minus',
    src: '/images/icons/minus_light.png',
    srcActive: '/images/icons/minus_dark.png',
    tooltip: 'Remove selected'
  }, {
    button: 'clone',
    src: '/images/icons/clone_light.png',
    srcActive: '/images/icons/clone_dark.png',
    tooltip: 'Clone selected'
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
    },
    customPlacement: true,
    isButton: true
  });

  var gui = document.getElementById('gui');
  gui.appendChild(bar.domElement);

  bar.domElement.style.position = 'absolute';
  bar.domElement.style.left = '20px';
  bar.domElement.style.bottom = '180px';
};