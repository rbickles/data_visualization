import * as THREE from "three";

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

  const textureLoader = new THREE.TextureLoader();
  const ballTexture = textureLoader.load("src/images/basketball.jpg");
  ballTexture.repeat.set(5, 5); // Increases tiling, making dimples smaller
  ballTexture.wrapS = THREE.MirroredRepeatWrapping; // Reflects texture instead of hard reset
  ballTexture.wrapT = THREE.MirroredRepeatWrapping;
  ballTexture.minFilter = THREE.LinearFilter; // Smoothens small details
  ballTexture.magFilter = THREE.LinearMipMapLinearFilter;

  const geometry = new THREE.SphereGeometry(4, 32, 32);

  const material = new THREE.MeshStandardMaterial({
    map: ballTexture,
    roughness: 0.8,
    metalness: 0.1,
  });

  const basketball = new THREE.Mesh(geometry, material);
  scene.add(basketball);

  const directional_light = new THREE.DirectionalLight(0xffffff, 1);
  directional_light.position.set(-5, 10, 5);
  directional_light.castShadow = true;
  scene.add(directional_light);

  const ambientLight = new THREE.AmbientLight(0xffffff, 2);
  scene.add(ambientLight);



  camera.position.z = 10;
  const animate = () => {
    requestAnimationFrame(animate);

    basketball.rotation.y += 0.01;
    renderer.render(scene, camera);
  };
  animate();
}
