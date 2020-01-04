import anime from "animejs";
import {
  BackSide,
  Color,
  CubeTexture,
  CubeTextureLoader,
  HalfFloatType,
  IcosahedronBufferGeometry,
  Mesh,
  PerspectiveCamera,
  Scene,
  ShaderMaterial,
  Uniform,
  Vector2,
  WebGLRenderer,
  WebGLRenderTarget
} from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { createGUI } from "./gui";
// tslint:disable:no-var-requires
const Stats = require("stats.js");
// tslint:enable:no-var-requires

const guiOptions = {
  refractionIndex: 1.5,
  color: "#FFFFFF",
  dispersion: 0.1,
  roughness: 0.9,
  animation: true,
  geometry: "icosahedron"
};

const canvas = document.getElementById("canvas") as HTMLCanvasElement;
const renderer = new WebGLRenderer({ canvas });
renderer.setSize(canvas.offsetWidth, canvas.offsetHeight, false);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.autoClear = false;

const backScene = new Scene();
const scene = new Scene();
const camera = new PerspectiveCamera(
  60,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.z = 5;
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.autoRotate = true;

if (
  !(
    renderer.getContext().getExtension("OES_texture_half_float") &&
    renderer.getContext().getExtension("OES_texture_half_float_linear")
  )
) {
  alert("This demo is not supported on your device.");
}
const renderTarget = new WebGLRenderTarget(
  canvas.offsetWidth,
  canvas.offsetHeight,
  {
    depthBuffer: false,
    type: HalfFloatType
  }
);

const geometry = new IcosahedronBufferGeometry();
const backMaterial = new ShaderMaterial({
  vertexShader: `
  varying vec3 vWorldNormal;

  void main() {
    vWorldNormal = (modelMatrix * vec4(normal, 0.0)).xyz;
    vWorldNormal = -normalize(vec3(-vWorldNormal.x, vWorldNormal.yz));

  	gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }`,
  fragmentShader: `
  varying vec3 vWorldNormal;

  void main() {
    gl_FragColor.rgb = vWorldNormal;
  }`,
  side: BackSide,
  depthWrite: false,
  depthTest: false
});
const material = new ShaderMaterial({
  uniforms: {
    resolution: new Uniform(
      new Vector2(canvas.offsetWidth, canvas.offsetHeight).multiplyScalar(
        window.devicePixelRatio
      )
    ),
    backNormals: new Uniform(renderTarget.texture),
    envMap: new Uniform(CubeTexture.DEFAULT_IMAGE),
    refractionIndex: new Uniform(guiOptions.refractionIndex),
    color: new Uniform(new Color(guiOptions.color)),
    dispersion: new Uniform(guiOptions.dispersion),
    roughness: new Uniform(guiOptions.roughness)
  },
  vertexShader: `
  varying vec3 vWorldCameraDir;
  varying vec3 vWorldNormal;
  varying vec3 vViewNormal;

  void main() {
    vec4 worldPosition = modelMatrix * vec4( position, 1.0);

    vWorldCameraDir = worldPosition.xyz - cameraPosition;
    vWorldCameraDir = normalize(vec3(-vWorldCameraDir.x, vWorldCameraDir.yz));

    vWorldNormal = (modelMatrix * vec4(normal, 0.0)).xyz;
    vWorldNormal = normalize(vec3(-vWorldNormal.x, vWorldNormal.yz));

		vViewNormal = normalize( modelViewMatrix * vec4(normal, 0.0)).xyz;

  	gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }`,
  fragmentShader: `
  #define REF_WAVELENGTH 579.0
  #define RED_WAVELENGTH 650.0
  #define GREEN_WAVELENGTH 525.0
  #define BLUE_WAVELENGTH 440.0

  uniform vec2 resolution;
  uniform sampler2D backNormals;
  uniform samplerCube envMap;
  uniform float refractionIndex;
  uniform vec3 color;
  uniform float dispersion;
  uniform float roughness;
  varying vec3 vWorldCameraDir;
  varying vec3 vWorldNormal;
  varying vec3 vViewNormal;

  vec4 refractLight(float wavelength, vec3 backFaceNormal) {
    float index = 1.0 / mix(refractionIndex, refractionIndex * REF_WAVELENGTH / wavelength, dispersion);
    vec3 dir = vWorldCameraDir;
    dir = refract(dir, vWorldNormal, index);
    dir = refract(dir, backFaceNormal, index);
    return textureCube(envMap, dir);
  }

  vec3 fresnelSchlick(float cosTheta, vec3 F0)
  {
    return F0 + (1.0 - F0) * pow(1.0 + cosTheta, 5.0);
  }

  void main() {
    vec3 backFaceNormal = texture2D(backNormals, gl_FragCoord.xy / resolution).rgb;

    float r = refractLight(RED_WAVELENGTH, backFaceNormal).r;
    float g = refractLight(GREEN_WAVELENGTH, backFaceNormal).g;
    float b = refractLight(BLUE_WAVELENGTH, backFaceNormal).b;

    vec3 fresnel = fresnelSchlick(dot(vec3(0.0,0.0,-1.0), vViewNormal), vec3(0.04));
    vec3 reflectedColor = textureCube(envMap, reflect(vWorldCameraDir, vWorldNormal)).rgb * saturate((1.0 - roughness) + fresnel);

    gl_FragColor.rgb = vec3(r,g,b) * color + reflectedColor;
  }`
});

const backMesh = new Mesh(geometry, backMaterial);
backScene.add(backMesh);
const mesh = new Mesh(geometry, material);
scene.add(mesh);
scene.background = new CubeTextureLoader()
  .setPath("./resources/cubemap/")
  .load(
    ["px.png", "nx.png", "py.png", "ny.png", "pz.png", "nz.png"],
    (texture: CubeTexture) => {
      material.uniforms.envMap.value = texture;
    }
  );

const animation = anime({
  targets: mesh.rotation,
  x: 2 * Math.PI,
  y: 2 * Math.PI,
  z: 2 * Math.PI,
  duration: 15000,
  easing: "easeOutBounce",
  loop: true,
  autoplay: guiOptions.animation,
  update: () => {
    backMesh.rotation.copy(mesh.rotation);
  },
  complete: () => {
    mesh.rotation.set(0, 0, 0);
    backMesh.rotation.set(0, 0, 0);
  }
});

const stats = new Stats();
stats.dom.style.cssText =
  "position:fixed;bottom:0;left:0;cursor:pointer;opacity:0.9;z-index:10000";
canvas.parentElement.appendChild(stats.dom);
createGUI(guiOptions, { material, animation, mesh, backMesh });

window.addEventListener("resize", (event: UIEvent) => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(canvas.offsetWidth, canvas.offsetHeight, false);
  renderTarget.setSize(canvas.offsetWidth, canvas.offsetHeight);
  material.uniforms.resolution.value.set(
    window.devicePixelRatio * canvas.offsetWidth,
    window.devicePixelRatio * canvas.offsetHeight
  );
});

function render() {
  renderer.setRenderTarget(renderTarget);
  renderer.clearColor();
  renderer.render(backScene, camera);
  renderer.setRenderTarget(null);
  renderer.clearColor();
  renderer.render(scene, camera);
}

function animate() {
  requestAnimationFrame(animate);
  stats.begin();
  controls.update();
  render();
  stats.end();
}
animate();
