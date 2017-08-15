var Cache = function() {};

Cache.prototype.get = function(key) {
  try {
    return JSON.parse(window.localStorage.getItem(key));
  } catch (err) {
    return null;
  }
};

Cache.prototype.set = function(key, value) {
  window.localStorage.setItem(key, JSON.stringify(value));
};

module.exports = function() {
  return new Cache();
};