var events = require('./events');
var Stats = require('stats.js');

var modules = {};

module.exports = function(name) {
  "use strict";

  function guid() {
    function s4() {
      return Math.floor((1 + Math.random()) * 0x10000)
        .toString(16)
        .substring(1);
    }
    return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
      s4() + '-' + s4() + s4() + s4();
  }

  var app = {};
  var map = {};
  var frameRate = 60.0;
  var systems = [];
  var bindings = {};

  function attach(object, factory) {
    var args = [object];
    if (factory.$inject != null) {
      factory.$inject.forEach(function(dep) {
        args.push(resolve(dep));
      });
    }

    var component = new(Function.prototype.bind.apply(factory, [null].concat(args)));

    if (component != null) {
      component.object = object;
      if (object._id == null) object._id = guid();
      if (component._id == null) component._id = guid();
      var components = map[object._id];
      if (components == null) components = map[object._id] = {};
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
    stats.begin();
    for (var i = 0; i < systems.length; i++) {
      var system = systems[i];
      if (system.tick != null) system.tick();
    }

    for (var i in map) {
      var components = map[i];
      for (var j in components) {
        var component = components[j];
        if (component.tick != null) component.tick();
      }
    }

    for (var i = 0; i < systems.length; i++) {
      var system = systems[i];
      if (system.lateTick != null) system.lateTick();
    }

    setTimeout(tick, 1000 / frameRate);
    stats.end();
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
    var components = map[object._id];
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

  function registerComponent(type, constructor) {
    componentBindings[type] = constructor;
  };

  function createComponent(type) {
    var constructor = componentBindings[type];
    if (constructor == null) {
      throw new Error('binding not found for type: ' + type);
    }
    var component = new constructor();
    component.app = this;
  };

  var app = {
    start: start,
    use: use,
    attach: attach,
    value: value,
    getComponent: getComponent,
    loadAssembly: loadAssembly,
    get: resolve,
    registerComponent: registerComponent,
    createComponent: createComponent
  };

  var stats = new Stats();
  stats.domElement.style.position = 'absolute';
  stats.domElement.style.right = '0px';
  stats.domElement.style.bottom = '40px';

  document.body.appendChild(stats.domElement);

  events.prototype.apply(app);

  if (name != null) {
    modules[name] = app;
  }

  return app;
};

module.exports.modules = modules;