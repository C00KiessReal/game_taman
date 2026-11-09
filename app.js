import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';

// Setup Scene, Camera, Renderer
const container = document.getElementById('canvas-container');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x222222);

const camera = new THREE.PerspectiveCamera(
  45,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.set(0, 0.8, 1.5);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.shadowMap.enabled = true;
container.appendChild(renderer.domElement);

// Orbit Controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.target.set(0, 0.4, 0);

// Pencahayaan
const ambientLight = new THREE.AmbientLight(0xffffff, 1.5);
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 2.0);
dirLight.position.set(5, 10, 7.5);
dirLight.castShadow = true;
scene.add(dirLight);

// Grid Helper (Lantai)
const gridHelper = new THREE.GridHelper(10, 10);
scene.add(gridHelper);

// Memuat Tekstur Kinetik (colormap.png)
const textureLoader = new THREE.TextureLoader();
const colorMapTexture = textureLoader.load('colormap.png', (tx) => {
  tx.colorSpace = THREE.SRGBColorSpace;
  tx.flipY = false;
});

// Memuat Model 3D OBJ (character-male-b.obj atau character-female-b.obj)
const objLoader = new OBJLoader();
objLoader.load(
  'character-male-b.obj', // Ubah nama file sesuai model yang ingin dipanggil
  (object) => {
    object.traverse((child) => {
      if (child.isMesh) {
        child.material = new THREE.MeshStandardMaterial({
          map: colorMapTexture,
          roughness: 0.6,
          metalness: 0.1
        });
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    object.position.set(0, 0, 0);
    scene.add(object);
  },
  (xhr) => {
    console.log(`Proses memuat: ${((xhr.loaded / xhr.total) * 100).toFixed(2)}%`);
  },
  (error) => {
    console.error('Terjadi kesalahan saat memuat model OBJ:', error);
  }
);

// Respon Ukuran Jendela Browser
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Render Loop
function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}

animate();
