var Serialization = require('../core/serialization');
var expect = require('chai').expect;
var THREE = require('three');

describe('Serialization', function() {
  describe('getTransformer', function() {
    it('serializes using key', function() {
      var obj = {
        legs: 4,
        name: 'frog'
      };

      var transformer = Serialization.getTransformer({
        'legs': 'legs',
        'name': 'name'
      });

      var payload = transformer.serialize(obj);

      expect(payload.legs).to.equal(4);
      expect(payload.name).to.equal('frog');
    });

    it('serializes using transformer', function() {
      var obj = {
        position: new THREE.Vector3(1, 2, 3)
      };

      var transformer = Serialization.getTransformer({
        'position': {
          serialize: function(vector) {
            return vector.toArray();
          },
          deserialize: function(vector, payload) {
            vector.fromArray(payload);
          }
        }
      });

      var payload = transformer.serialize(obj);
      expect(payload.position).to.eql([1, 2, 3]);
    });

    it('deserializes using key', function() {
      var obj = {};
      var transformer = Serialization.getTransformer({
        'legs': 'legs',
        'name': 'name'
      });

      var payload = {
        'legs': 4,
        'name': 'frog'
      };

      transformer.deserialize(obj, payload);

      expect(obj.legs).to.equal(4);
      expect(obj.name).to.equal('frog');
    });

    it('deserializes using transformer', function() {
      var obj = {
        position: new THREE.Vector3(0, 0, 0)
      };
      var transformer = Serialization.getTransformer({
        'position': {
          serialize: function(vector) {
            return vector.toArray();
          },
          deserialize: function(vector, payload) {
            vector.fromArray(payload);
          }
        }
      });
      var payload = {
        'position': [1, 2, 3]
      }
      transformer.deserialize(obj, payload);

      expect(obj.position.equals(new THREE.Vector3(1, 2, 3))).to.be.true;
    });
  });
});