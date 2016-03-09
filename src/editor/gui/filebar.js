var cpr = require('./cpr');
var popup = require('./popup');

module.exports = function(editor) {
  // download.png
  var data = [{
    src: '/images/icons/undo_light.png',
    srcActive: '/images/icons/undo_dark.png',
    button: 'undo'
  },{
    src: '/images/icons/redo_light.png',
    srcActive: '/images/icons/redo_dark.png',
    button: 'redo'
  },{
    src: '/images/icons/download_light.png',
    srcActive: '/images/icons/download_dark.png',
    button: 'save'
  }];

  var bar = cpr({
    data: data,
    customPlacement: true,
    blockWidth: 32,
    blockHeight: 32,
    hideHighlight: true,
    onPick: function(obj) {
      var button = obj.button;

      if(button === 'save') {
        editor.save();
      }else if(button === 'undo') {
        editor.undo();
      }else if(button === 'redo') {
        editor.redo();
      }
      // if (button === 'download') {
      //   editor.downloadJSON(editor.serialize(), 'blocks');
      // }
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