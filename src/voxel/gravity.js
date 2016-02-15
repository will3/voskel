var Gravity = function(dir, axis, positive) {
  this.dir = dir || new THREE.Vector3();
  this.axis = axis || '';
  this.positive = positive || '';

  this.clone = function() {
    return new Gravity(this.dir, this.axis, this.positive);
  };

  this.equals = function(gravity) {
    return this.dir.equals(gravity.dir);
  };

  this.isNone = function() {
    return this.dir.length() === 0;
  };
};

module.exports = Gravity;