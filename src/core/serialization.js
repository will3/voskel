function getTransformer(map) {
  return {
    serialize: function(obj) {
      var payload = {};
      for (var key in map) {
        var transform = map[key];
        if (typeof transform === 'string') {
          payload[key] = obj[transform];
        } else {
          payload[key] = transform.serialize(obj[key]);
        }
      }
      return payload;
    },

    deserialize: function(obj, payload) {
      for (var key in payload) {
        var value = payload[key];
        var transform = map[key];
        if (typeof transform === 'string') {
          obj[key] = payload[transform];
        } else {
          transform.deserialize(obj[key], payload[key]);
        }
      }
    }
  }
};

module.exports = {
  getTransformer: getTransformer
};