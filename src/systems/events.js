var arrayUtils = require('../utils/arrayutils');

module.exports = function(app) {
  var listeners = {};

  return {
    emit: function(event) {
      var args = Array.prototype.slice.call(arguments);

      var callbacks = listeners[event];
      if (callbacks == null) {
        return;
      }
      for (var i = 0; i < callbacks.length; i++) {
        var callback = callbacks[i];
        callback.apply(null, args);
      }
    },

    on: function(event, callback) {
      var callbacks = listeners[event];
      if (callbacks == null) {
        callbacks = listeners[event] = [];
      }
      callbacks.push(callback);
    },

    removeListener: function(event, callback) {
      var callbacks = listeners[event];
      if (callbacks == null) {
        return;
      }
      arrayUtils.remove(callbacks, callback);
    }
  };
};