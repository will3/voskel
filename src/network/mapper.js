var Mapper = function() {
  this.bindings = {};
  this.app = null;
};

var defaultTransformer = {
  serialize: function(object, key) {
    return object[key];
  },
  deserialize: function(object, key, value) {
    object[key] = value;
  }
};

// Register entity binding
// Binding in the following format:
// factory: 												factory function
// factory.$replicate: []						list of keys to replicate for the life time of the entity
// factory.$replicateOnCreate: [] 	list of keys to replicate on creation only
// factory.$transforms							transforms to apply for key value
Mapper.prototype.register = function(factory) {
  var type = factory.$type;
  this.bindings[type] = factory;
};

// Create an entity of type, and update its state using payload
Mapper.prototype.create = function(type, payload) {
  var binding = this.bindings[type];
  var entity = this.app.createEntity(type);

  var replicateOnCreate = binding.factory.$replicateOnCreate || [];

  for (var i = 0; i < replicateOnCreate.length; i++) {
    var key = replicateOnCreate[i];
    this._baseSet(entity, key, payload[key]);
  }

  return entity;
};

// Update entity state
Mapper.prototype.update = function(entity, payload) {
  var binding = this.bindings[type];

  var replicate = binding.factory.$replicate || [];
  var transforms = binding.factory.$transforms || {};

  for (var i = 0; i < replicate.length; i++) {
    var key = replicate[i];
    var transform = transforms[key] || defaultTransformer;
    this._baseSet(entity, key, payload[key], transform);
  }
};

// Serialize Entity state into payload
Mapper.prototype.serialize = function(entity) {
  var type = entity._type;
  var binding = this.bindings[type];

  var replicate = binding.factory.$replicate || [];
  var transforms = binding.factory.$transforms || {};

  var payload = {};
  for (var i = 0; i < replicate.length; i++) {
    var key = replicate[i];
    var transform = transforms[key] || defaultTransformer;

  }
};

Mapper.prototype._baseGet = function(entity, key, transform) {
  var path = key.split('.');
  for (var i = 0; i < path.length - 1; i++) {
    entity = entity[path[i]];
  }

  var key = path[path.length - 1];

  return transform.serialize(entity, key);
}

Mapper.prototype._baseSet = function(entity, key, value, transform) {
  var path = key.split('.');
  for (var i = 0; i < path.length - 1; i++) {
    entity = entity[path[i]];
  }

  var key = path[path.length - 1];
  transform.deserialize(entity, key, value);
};

module.exports = Mapper;