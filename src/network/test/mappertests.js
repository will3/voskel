var Mapper = require('../mapper');

var factory = function() {
  return {
    position: {
      x: 1,
      y: 2,
      z: 3
    },
    health: 3
  };
};

factory.$type = 'type';
factory.$replicate = ['position', 'health'];
factory.$replicateOnCreate = ['position'];
factory.$transform = {
  'position': {
    serialize: function(obj, key) {
      var value = obj[key];
      return [value.x, value.y, value.z].join(',');
    },
    deserialize: function(obj, key, value) {
      var coords = value.split(',');
      var position = obj[key];
      position.x = parseFloat(coords[0]);
      position.y = parseFloat(coords[1]);
      position.z = parseFloat(coords[2]);
    }
  }
};

describe('Mapper', function() {
  describe('create', function() {
    it('create entity', function() {

    });
  });

  describe('update', function() {

  });

  describe('serialize', function() {

  });
})