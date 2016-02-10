var Events = function() {
  this._listeners = {};
};

Events.prototype.emit = function(event) {
  var args = Array.prototype.slice.call(arguments);

  var callbacks = this._listeners[event];
  if (callbacks == null) {
    return;
  }
  for (var i = 0; i < callbacks.length; i++) {
    var callback = callbacks[i];
    callback.apply(null, args);
  }
};

Events.prototype.on = function(event, callback) {
  var callbacks = this._listeners[event];
  if (callbacks == null) {
    callbacks = this._listeners[event] = [];
  }
  callbacks.push(callback);
};

Events.prototype.off = function(event, callback) {
  var callbacks = this._listeners[event];
  if (callbacks == null) {
    return;
  }
  arrayUtils.remove(callbacks, callback);
};

Events.prototype.apply = function(obj) {
  obj.emit = this.emit;
  obj.on = this.on;
  obj.off = this.off;
  obj._listeners = {};
};

module.exports = Events;