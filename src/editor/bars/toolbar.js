var cpr = require('../../cpr/cpr');
var EditorTools = require('../editortools');

module.exports = function(editor) {
  var toolTip = document.createElement('div');
  toolTip.style.position = 'absolute';
  toolTip.style.visibility = 'hidden';
  toolTip.style.width = '100px';
  toolTip.style.backgroundColor = '#666666';
  toolTip.style.color = '#f6f6f6';
  toolTip.style.padding = '5px';

  var container = document.getElementById('container');

  var bar = cpr({
    data: [{
      src: '/images/plus.png',
      toolname: EditorTools.Pen,
      toolTip: 'pen tool (left mouse)'
    }, {
      src: '/images/sampler.png',
      toolname: EditorTools.Sample,
      toolTip: 'sample tool (right mouse)'
    }, {
      src: '/images/lasso.png',
      toolname: EditorTools.Select,
      toolTip: 'lasso tool (3)'
    }, {
      src: '/images/camera.png',
      toolname: EditorTools.Camera,
      toolTip: 'camera tool (click and hold empty space)'
    }],
    blockWidth: 32,
    blockHeight: 32,
    onPick: function(obj) {
      editor.toolName = obj.toolname;
      editor.updateTool();
    },
    onHover: function(obj, index) {
      var mouse = bar.mouse;
      toolTip.style.visibility = 'visible';
      var rect = bar.domElement.getBoundingClientRect();
      toolTip.style.left = mouse.clientX - rect.left + 'px';
      toolTip.style.top = mouse.clientY - rect.top + 'px';
      if (toolTip.innerHTML !== obj.toolTip) {
        toolTip.innerHTML = obj.toolTip;
      }
    },
    onLeave: function(e) {
      if (e.toElement && e.toElement.id === 'canvas') {
        toolTip.style.visibility = 'hidden';
      }
    },
    customPlacement: true
  });

  container.appendChild(bar.domElement);

  bar.domElement.appendChild(toolTip);
  bar.domElement.style.position = 'absolute';
  bar.domElement.style.top = '20px';
  bar.domElement.style.left = '20px';

  return bar;
};