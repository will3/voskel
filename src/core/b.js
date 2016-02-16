var events = require('./events');

var modules = {};

module.exports = function(name) {
  "use strict";

  var idCount = 0;

  function getNextId() {
    return idCount++;
  }

  var app = {};
  var entityMap = {};
  var lookup = {};
  var frameRate = 60.0;
  var systems = [];
  var bindings = {};

  function attach(object, factory) {
    var args = [object];
    var component;

    if (typeof factory === 'function') {
      if (factory.$inject != null) {
        factory.$inject.forEach(function(dep) {
          args.push(resolve(dep));
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
        lookup[object._id] = object;
      }

      if (component._id == null) {
        component._id = getNextId();
        lookup[component._id] = component;
      }

      var components = entityMap[object._id];
      if (components == null) components = entityMap[object._id] = {};
      components[component._id] = component;

      for (var i = 0; i < systems.length; i++) {
        var system = systems[i];
        if (system.onAttach != null) system.onAttach(object, component);
      }
    }

    return component;
  };

  function use(type, system) {
    var hasType = typeof type === 'string';
    if (!hasType) {
      system = type;
    }

    if (system != null) {
      systems.push(system);
      if (hasType) {
        value(type, system);
      }
    }

    return system;
  };

  function tick() {
    app.emit('beforeTick');

    for (var i = 0; i < systems.length; i++) {
      var system = systems[i];
      if (system.tick != null) system.tick();
    }

    for (var i in entityMap) {
      var components = entityMap[i];
      for (var j in components) {
        var component = components[j];
        if (component.tick != null) component.tick();
      }
    }

    for (var i = 0; i < systems.length; i++) {
      var system = systems[i];
      if (system.lateTick != null) system.lateTick();
    }

    app.emit('afterTick');

    setTimeout(tick, 1000 / frameRate);
  };

  function start() {
    // Start loop
    tick();
  };

  function value(type, object) {
    bindings[type] = {
      value: object
    };
  };

  function resolve(type) {
    var binding = bindings[type];
    if (binding == null) {
      throw new Error('binding for type ' + type + ' not found');
    }
    if (binding.value != null) {
      return binding.value;
    }
    return undefined;
  };

  function getComponent(object, type) {
    var components = entityMap[object._id];
    for (var id in components) {
      if (components[id].type === type) {
        return components[id];
      }
    }
  };

  var entityBindings = {};
  var entityIdCount = 0;
  var entities = {};

  function loadAssembly(assembly) {
    return assembly(this);
  };

  var componentBindings = {};

  var app = {
    start: start,
    tick: tick,
    use: use,
    attach: attach,
    value: value,
    getComponent: getComponent,
    loadAssembly: loadAssembly,
    get: resolve
  };

  events.prototype.apply(app);

  if (name != null) {
    modules[name] = app;
  }

  return app;
};

module.exports.modules = modules;