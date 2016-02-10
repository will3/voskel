var THREE = require('three');

var ndarray = require('ndarray');
var b = require('./b');
var blocks = require('./components/blocks');
var character = require('./components/character');

var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);

var renderer = new THREE.WebGLRenderer();
renderer.setClearColor(0xf6f6f6);
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

var ssaoPass, effectComposer;

function render() {
  requestAnimationFrame(render);

  // Render depth into depthRenderTarget
  scene.overrideMaterial = depthMaterial;
  renderer.render(scene, camera, depthRenderTarget, true);

  // Render renderPass and SSAO shaderPass
  scene.overrideMaterial = null;
  effectComposer.render();

  renderer.render(scene, camera);
};

function onWindowResize() {
  var width = window.innerWidth;
  var height = window.innerHeight;

  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);

  // Resize renderTargets
  ssaoPass.uniforms['size'].value.set(width, height);

  var pixelRatio = renderer.getPixelRatio();
  var newWidth = Math.floor(width / pixelRatio) || 1;
  var newHeight = Math.floor(height / pixelRatio) || 1;
  depthRenderTarget.setSize(newWidth, newHeight);
  effectComposer.setSize(newWidth, newHeight);
}

function initPostprocessing() {

  // Setup render pass
  var renderPass = new THREE.RenderPass(scene, camera);

  // Setup depth pass
  var depthShader = THREE.ShaderLib["depthRGBA"];
  var depthUniforms = THREE.UniformsUtils.clone(depthShader.uniforms);

  depthMaterial = new THREE.ShaderMaterial({
    fragmentShader: depthShader.fragmentShader,
    vertexShader: depthShader.vertexShader,
    uniforms: depthUniforms,
    blending: THREE.NoBlending
  });

  var pars = {
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter
  };
  depthRenderTarget = new THREE.WebGLRenderTarget(window.innerWidth, window.innerHeight, pars);

  // Setup SSAO pass
  ssaoPass = new THREE.ShaderPass(THREE.SSAOShader);
  ssaoPass.renderToScreen = true;
  //ssaoPass.uniforms[ "tDiffuse" ].value will be set by ShaderPass
  ssaoPass.uniforms["tDepth"].value = depthRenderTarget;
  ssaoPass.uniforms['size'].value.set(window.innerWidth, window.innerHeight);
  ssaoPass.uniforms['cameraNear'].value = camera.near;
  ssaoPass.uniforms['cameraFar'].value = camera.far;
  ssaoPass.uniforms['onlyAO'].value = false;
  ssaoPass.uniforms['aoClamp'].value = 1;
  ssaoPass.uniforms['lumInfluence'].value = 0.5;

  // Add pass to effect composer
  effectComposer = new THREE.EffectComposer(renderer);
  effectComposer.addPass(renderPass);
  effectComposer.addPass(ssaoPass);
}

var app = b();
require('./scenario')(app, scene, camera);
app.start();

// Set up render loop
initPostprocessing();
render();
window.addEventListener('resize', onWindowResize, false);