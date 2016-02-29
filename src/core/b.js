var events = require('./events');

var idCount = 0;

function getNextId() {
  return idCount++;
}

var Engine = function() {
  this.entityMap = {};
  this.lookup = {};
  this.frameRate = 60.0;
  this.systems = [];
  this.bindings = {};
};

Engine.prototype.attach = function(object, factory) {
  var args = [object];
  var component;
  var self = this;

  if (typeof factory === 'function') {
    if (factory.$inject != null) {
      factory.$inject.forEach(function(dep) {
        args.push(self.resolve(dep));
      });
    }
    component = new(Function.prototype.bind.apply(factory, [null].concat(args)));
  } else {
    component = factory;
  }

  if (component != null) {
    component.object = object;

    if (object._id == null) {
      object._id = getNextId();
      this.lookup[object._id] = object;
    }

    if (component._id == null) {
      component._id = getNextId();
      this.lookup[component._id] = component;
    }

    var components = this.entityMap[object._id];
    if (components == null) components = this.entityMap[object._id] = {};
    components[component._id] = component;

    for (var i = 0; i < this.systems.length; i++) {
      var system = this.systems[i];
      if (system.onAttach != null) system.onAttach(object, component);
    }
  }

  return component;
};

Engine.prototype.use = function(type, system) {
  var hasType = typeof type === 'string';
  if (!hasType) {
    system = type;
  }

  if (system != null) {
    this.systems.push(system);
    if (hasType) {
      this.value(type, system);
    }
  }

  return system;
};

Engine.prototype.tick = function() {
  this.emit('beforeTick');

  for (var i = 0; i < this.systems.length; i++) {
    var system = this.systems[i];
    if (system.tick != null) system.tick();
  }

  for (var i in this.entityMap) {
    var components = this.entityMap[i];
    for (var j in components) {
      var component = components[j];
      if (component.tick != null) component.tick();
    }
  }

  for (var i = 0; i < this.systems.length; i++) {
    var system = this.systems[i];
    if (system.lateTick != null) system.lateTick();
  }

  this.emit('afterTick');
};

Engine.prototype.start = function() {
  var self = this;
  var interval = function() {
    self.tick();
    setTimeout(interval, 1000 / this.frameRate);
  }
  interval();
};

Engine.prototype.value = function(type, object) {
  this.bindings[type] = {
    value: object
  };
};

Engine.prototype.resolve = function(type, context) {
  var binding = this.bindings[type];
  if (binding == null) {
    throw new Error('binding for type ' + type + ' not found');
  }

  if (binding.factory != null) {
    return binding.factory(context);
  }

  if (binding.value != null) {
    return binding.value;
  }

  return undefined;
};

Engine.prototype.get = function(type, context) {
  return this.resolve(type, context);
};

Engine.prototype.getComponent = function(object, type) {
  var components = this.entityMap[object._id];
  for (var id in components) {
    if (components[id].type === type) {
      return components[id];
    }
  }
};

Engine.prototype.loadAssembly = function(assembly) {
  return assembly(this);
};

events.prototype.apply(Engine.prototype);

module.exports = function() {
  return new Engine();
};