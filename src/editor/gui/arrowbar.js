var cpr = require('../../cpr/cpr');

module.exports = function(editor) {
  var data = [{
    src: '/images/arrow1.png',
    index: 0,
    tooltip: 'move right (D)'
  }, {
    src: '/images/arrow2.png',
    index: 1,
    tooltip: 'move left (A)'
  }, {
    src: '/images/arrow3.png',
    index: 2,
    tooltip: 'move front (W)'
  }, {
    src: '/images/arrow4.png',
    index: 3,
    tooltip: 'move back (S)'
  }, {
    src: '/images/arrow5.png',
    index: 4,
    tooltip: 'move up (R)'
  }, {
    src: '/images/arrow6.png',
    index: 5,
    tooltip: 'move down (F)'
  }];

  var bar = cpr({
    data: data,
    blockWidth: 32,
    blockHeight: 32,
    hideHighlight: true,
    customPlacement: true,
    showTooltip: true,
    paddingRight: 5,
    onPick: function(obj) {
      var index = obj.index;

      var offset = null;
      if (index === 0) {
        offset = new THREE.Vector3(1, 0, 0);
      } else if (index === 1) {
        offset = new THREE.Vector3(-1, 0, 0);
      } else if (index === 2) {
        offset = new THREE.Vector3(0, 0, -1);
      } else if (index === 3) {
        offset = new THREE.Vector3(0, 0, 1);
      } else if (index === 4) {
        offset = new THREE.Vector3(0, 1, 0);
      } else if (index === 5) {
        offset = new THREE.Vector3(0, -1, 0);
      }

      editor.applyOffset(offset);
    }
  });

  var gui = document.getElementById('gui');
  gui.appendChild(bar.domElement);
  
  bar.domElement.classList.add('arrowbar');
  bar.domElement.style.position = 'absolute';
  bar.domElement.style.top = '80px';
  bar.domElement.style.left = '20px';
};