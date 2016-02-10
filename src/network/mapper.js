var Mapper = function() {
  this.bindings = {};
};

Mapper.prototype.register = function(type, binding) {
  this.bindings[type] = binding;
};

Mapper.prototype.spawn = function(type, payload) {
  var binding = this.bindings[type];
  binding.spawn(payload);
};

Mapper.prototype.update = function(entity) {
  var type = entity._type;
  var binding = this.bindings[type];
  binding.update(payload);
};

Mapper.prototype.serialize = function(entity) {
  var type = entity._type;
  var binding = this.bindings[type];
  return binding.serialize(entity);
};

module.exports = Mapper;