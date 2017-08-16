// var Stats = require('stats.js');

module.exports = function(scene, camera, container) {
  var renderer = new THREE.WebGLRenderer();
  renderer.setClearColor(0x222222);
  renderer.setSize(window.innerWidth, window.innerHeight);

  container = container || document.body;
  container.appendChild(renderer.domElement);

  var renderer, camera;
  var ssaoPass, effectComposer;

  var system = {};
  system.renderer = renderer;

  // var stats = new Stats();
  // stats.domElement.style.position = 'absolute';
  // stats.domElement.style.right = '0px';
  // stats.domElement.style.bottom = '0px';

  // document.body.appendChild(stats.domElement);

  var ssao = false;

  var ambient = new THREE.AmbientLight(new THREE.Color("rgb(60%, 60%, 60%)"));
  var light = new THREE.DirectionalLight(0xffffff, 0.6);
  light.position.set(0.8, 1, 0.5);
  scene.add(light);
  scene.add(ambient);

  function render() {
    requestAnimationFrame(render);

    // stats.begin();

    if (ssao) {
      // Render depth into depthRenderTarget
      scene.overrideMaterial = depthMaterial;
      renderer.render(scene, camera, depthRenderTarget, true);

      // Render renderPass and SSAO shaderPass
      scene.overrideMaterial = null;
      effectComposer.render();
    } else {
      renderer.render(scene, camera);
    }

    // stats.end();
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

  // Set up render loop
  initPostprocessing();
  render();

  window.addEventListener('resize', onWindowResize, false);

  return system;
};