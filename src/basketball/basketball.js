import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

export async function renderBasketball(container) {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  const renderer = new THREE.WebGLRenderer();

  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  let basketball;

  // Load GLTF Model
  const loader = new GLTFLoader();
  loader.load(
    "src/images/scene.gltf",
    function (gltf) {
      basketball = gltf.scene;
      scene.add(gltf.scene);
    },
    undefined,
    function (error) {
      console.error(error);
    }
  );

  // Camera positioning
  camera.position.x = 5;
  camera.position.y = 2;
  camera.position.z = 5;

  // Orbit controls
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;

  const light = new THREE.PointLight(0xffffff, 100, 100);
  light.position.set(5, 5, 5);
  scene.add(light);

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
  scene.add(ambientLight);

  // Animation loop
  function animate() {
    requestAnimationFrame(animate);
    if (basketball) {
      //basketball.rotation.x +=0.005;
      basketball.rotation.y += 0.005;
    }
    controls.update();
    renderer.render(scene, camera);
  }

  animate();
}
