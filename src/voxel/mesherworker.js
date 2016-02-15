var mesher = require('../voxel/mesher');

self.addEventListener('message', function(e) {
  var data = e.data.data;
  var shape = e.data.shape;

  var result = mesher(data, shape);

  self.postMessage(result);

}, false);