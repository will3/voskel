var Stats = require('stats.js');

module.exports = function(app) {
  var stats = new Stats();
  stats.domElement.style.position = 'absolute';
  stats.domElement.style.right = '0px';
  stats.domElement.style.bottom = '0px';

  document.body.appendChild(stats.domElement);

  var renderer = app.get('renderer');
  renderer.on('before render', function() {
    stats.begin();
  });

  renderer.on('after render', function() {
    stats.end();
  });
};