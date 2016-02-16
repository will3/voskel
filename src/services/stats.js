var Stats = require('stats.js');

module.exports = function(app) {
  app.on('beforeTick', function() {
    stats.begin();
  });

  app.on('afterTick', function() {
    stats.end();
  });

  var stats = new Stats();
  stats.domElement.style.position = 'absolute';
  stats.domElement.style.right = '0px';
  stats.domElement.style.bottom = '50px';
  document.body.appendChild(stats.domElement);

  return stats.domElement;
};