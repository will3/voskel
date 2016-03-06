var cpr = require('../../cpr/cpr');
var popup = require('./popup');

module.exports = function(editor) {
  // download.png
  var data = [{
    src: '/images/download.png',
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
    }
  });

  var gui = document.getElementById('gui');
  gui.appendChild(bar.domElement);

  bar.domElement.classList.add('toolbar');

  bar.domElement.style.position = 'absolute';
  bar.domElement.style.left = 20 + 'px';
  bar.domElement.style.top = 140 + 'px';
};