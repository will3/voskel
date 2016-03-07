var cpr = require('./cpr');
var popup = require('./popup');

module.exports = function(editor) {
  // download.png
  var data = [{
    src: '/images/icons/download_light.png',
    srcActive: '/images/icons/download_dark.png',
    button: 'download'
  }];

  var bar = cpr({
    data: data,
    customPlacement: true,
    blockWidth: 32,
    blockHeight: 32,
    hideHighlight: true,
    onPick: function(obj) {
      var button = obj.button;

      if (button === 'download') {
        editor.downloadJSON(editor.serialize(), 'blocks');
      }
    },
    isButton: true
  });

  var gui = document.getElementById('gui');
  gui.appendChild(bar.domElement);

  bar.domElement.classList.add('toolbar');

  bar.domElement.style.position = 'absolute';
  bar.domElement.style.left = 20 + 'px';
  bar.domElement.style.top = 120 + 'px';
};