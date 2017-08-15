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
	var saved = JSON.stringify(data);
  window.localStorage.setItem('b_saves', saved);
  return saved;
};

PrefabService.prototype.reset = function() {
  window.localStorage.setItem('b_saves', '');
};

module.exports = function() {
  return new PrefabService();
};