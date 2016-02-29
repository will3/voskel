var array = {
  indexOf: function(array, element) {
    for (var i = 0; i < array.length; i++) {
      if (array[i] === element) {
        return i;
      }
    }
    return -1;
  },

  includes: function(array, element) {
    return this.indexOf(array, element) !== -1;
  },

  remove: function(array, element) {
    var index = this.indexOf(array, element);
    if (index !== -1) {
      array.splice(index, 1);
    }
  },

  clone: function(array) {
    var copy = [];
    for (var i = 0; i < array.length; i++) {
      copy[i] = array[i];
    }
    return copy;
  }
};

module.exports = array;