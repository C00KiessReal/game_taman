import * as THREE from 'three';
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set, onValue, onDisconnect } from 'firebase/database';

// ==========================================
// 1. KONFIGURASI FIREBASE REALTIME DATABASE
// ==========================================
// Masukkan config dari Firebase Console milikmu di sini
const firebaseConfig = {
  apiKey: "API_KEY_KAMU",
  authDomain: "PROJECT_ID.firebaseapp.com",
  databaseURL: "https://PROJECT_ID-default-rtdb.firebaseio.com",
  projectId: "PROJECT_ID",
  storageBucket: "PROJECT_ID.appspot.com",
  messagingSenderId: "SENDER_ID",
  appId: "APP_ID"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// ==========================================
// 2. SETUP SCENE, CAMERA, & RENDERER
// ==========================================
const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0x87CEEB, 20, 100);

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

// Pencahayaan
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
dirLight.position.set(20, 40, 20);
dirLight.castShadow = true;
dirLight.shadow.camera.left = -50;
dirLight.shadow.camera.right = 50;
dirLight.shadow.camera.top = 50;
dirLight.shadow.camera.bottom = -50;
scene.add(dirLight);

// Lantai (Ground)
const groundGeometry = new THREE.PlaneGeometry(200, 200);
const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x4B7942, roughness: 0.8 });
const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

// ==========================================
// 3. AVATAR KUCING & STATE MULTIPLAYER
// ==========================================
const playerId = `cat_${Math.random().toString(36).substring(2, 9)}`;
const otherPlayers = {};
let isFPP = false; 

// Fungsi membuat avatar kucing sederhana (Placeholder)
function createCatAvatar(colorHex) {
  const group = new THREE.Group();
  
  // Badan
  const bodyGeo = new THREE.CapsuleGeometry(0.4, 0.8, 4, 8);
  const bodyMat = new THREE.MeshStandardMaterial({ color: colorHex });
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.position.y = 0.8;
  body.castShadow = true;
  group.add(body);

  // Kepala
  const headGeo = new THREE.BoxGeometry(0.6, 0.6, 0.6);
  const head = new THREE.Mesh(headGeo, bodyMat);
  head.position.y = 1.7;
  head.castShadow = true;
  group.add(head);

  return group;
}

// Pemain Lokal (Kucing Oren)
const localPlayer = createCatAvatar(0xFFA500); 
scene.add(localPlayer);

// ==========================================
// 4. KONTROL KAMERA (FPP / TPP)
// ==========================================
function updateCamera() {
  if (isFPP) {
    // First-Person Perspective: Kamera diletakkan di posisi kepala
    camera.position.set(localPlayer.position.x, localPlayer.position.y + 1.7, localPlayer.position.z + 0.2);
    camera.lookAt(localPlayer.position.x, localPlayer.position.y + 1.7, localPlayer.position.z - 5);
  } else {
    // Third-Person Perspective: Kamera di belakang dan atas karakter
    camera.position.set(localPlayer.position.x, localPlayer.position.y + 4, localPlayer.position.z + 6);
    camera.lookAt(localPlayer.position);
  }
}

// ==========================================
// 5. INPUT & PERGERAKAN (W/A/S/D)
// ==========================================
const keys = { w: false, a: false, s: false, d: false };

window.addEventListener('keydown', (e) => {
  const key = e.key.toLowerCase();
  if (keys.hasOwnProperty(key)) keys[key] = true;
  if (key === 'c') isFPP = !isFPP; // Toggle Kamera
});

window.addEventListener('keyup', (e) => {
  const key = e.key.toLowerCase();
  if (keys.hasOwnProperty(key)) keys[key] = false;
});

const speed = 0.15;
function movePlayer() {
  let hasMoved = false;

  if (keys.w) { localPlayer.position.z -= speed; hasMoved = true; }
  if (keys.s) { localPlayer.position.z += speed; hasMoved = true; }
  if (keys.a) { localPlayer.position.x -= speed; hasMoved = true; }
  if (keys.d) { localPlayer.position.x += speed; hasMoved = true; }

  updateCamera();

  // Hanya kirim data ke Firebase jika ada pergerakan untuk menghemat bandwidth
  if (hasMoved) syncPosition();
}

// ==========================================
// 6. SINKRONISASI FIREBASE
// ==========================================
const playerRef = ref(db, `players/${playerId}`);

// Hapus data pemain dari database saat window ditutup / jaringan terputus
onDisconnect(playerRef).remove();

function syncPosition() {
  set(playerRef, {
    x: localPlayer.position.x,
    y: localPlayer.position.y,
    z: localPlayer.position.z
  });
}

// Mendengarkan pergerakan pemain lain dari server
onValue(ref(db, 'players'), (snapshot) => {
  const data = snapshot.val() || {};
  
  // Update atau tambahkan pemain yang masuk
  for (const id in data) {
    if (id === playerId) continue; // Abaikan diri sendiri
    
    if (!otherPlayers[id]) {
      // Kucing pemain lain berwarna Abu-abu
      otherPlayers[id] = createCatAvatar(0x888888); 
      scene.add(otherPlayers[id]);
    }
    
    // Update posisi pemain lain dengan mulus (opsional bisa ditambahkan interpolasi di sini)
    otherPlayers[id].position.set(data[id].x, data[id].y, data[id].z);
  }
  
  // Hapus avatar pemain yang sudah keluar dari server (disconnect)
  for (const id in otherPlayers) {
    if (!data[id]) {
      scene.remove(otherPlayers[id]);
      delete otherPlayers[id];
    }
  }
});

// ==========================================
// 7. RENDER LOOP & RESIZE EVENT
// ==========================================
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

function animate() {
  requestAnimationFrame(animate);
  movePlayer();
  renderer.render(scene, camera);
}

// Pastikan posisi awal terkirim ke server saat pertama kali masuk
syncPosition();
animate();
