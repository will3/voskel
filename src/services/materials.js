var THREE = require('three');

var textureLoader = new THREE.TextureLoader();

function loadLambertMaterial(source) {
  var texture = textureLoader.load(source);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;

  return new THREE.MeshLambertMaterial({
    map: texture
  });
};

function loadBasicMaterial(source) {
  var texture = textureLoader.load(source);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;

  texture.magFilter = THREE.NearestFilter;
  
  return new THREE.MeshBasicMaterial({
    map: texture
  });
};

materials = {
  '1': loadLambertMaterial('images/1.png'),
  'placeholder': loadBasicMaterial('images/placeholder.png')
}

module.exports = materials;