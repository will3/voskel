var SaveService = function() {};

SaveService.prototype.load = function() {
  try {
    var saves = JSON.parse(window.localStorage.getItem('b_saves'));
    return saves;
  } catch (err) {
    return [];
  }
};

SaveService.prototype.save = function(data) {
  window.localStorage.setItem('b_saves', JSON.stringify(data));
};

SaveService.prototype.reset = function() {
  window.localStorage.setItem('b_saves', '');
};

module.exports = function() {
  return new SaveService();
};