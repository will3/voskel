var PrefabService = function() {};

PrefabService.prototype.load = function() {
  try {
    var saves = JSON.parse(window.localStorage.getItem('b_saves') || []);
    return saves;
  } catch (err) {
    return [];
  }
};

PrefabService.prototype.save = function(data) {
  window.localStorage.setItem('b_saves', JSON.stringify(data));
};

PrefabService.prototype.reset = function() {
  window.localStorage.setItem('b_saves', '');
};

module.exports = function() {
  return new PrefabService();
};