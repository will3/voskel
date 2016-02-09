module.exports = function() {
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
  var frameRate = 48.0;
  var systems = [];
  var bindings = {};

  function attach(object, factory) {
    var args = [object];
    if (factory.$inject != null) {
      factory.$inject.forEach(function(dep) {
        args.push(resolve(dep));
      });
    }
    var component = factory.apply(null, args);

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

  function use(factory) {
    var args = Array.prototype.slice.call(arguments, 1);
    args.splice(0, 0, app);
    var system = factory.apply(null, args);
    systems.push(system);
    return system;
  };

  function tick() {
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

  var app = {
    start: start,
    use: use,
    attach: attach,
    value: value,
    getComponent: getComponent
  };

  return app;
};