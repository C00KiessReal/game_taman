// 1. KONFIGURASI FIREBASE
const firebaseConfig = {
    apiKey: "AIzaSyAgrAl1_FGvOvo8xAJOqdrqVH9F1HCDiWw",
    authDomain: "project-game-636ff.firebaseapp.com",
    databaseURL: "https://project-game-636ff-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "project-game-636ff",
    storageBucket: "project-game-636ff.firebasestorage.app",
    messagingSenderId: "1036449209834",
    appId: "1:1036449209834:web:284c003a3ef15e7e8b6693"
};

// Inisialisasi Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

const playerId = 'player_' + Math.floor(Math.random() * 10000);
const playersRef = db.ref('players');
const chatRef = db.ref('chats');

// 2. SETUP THREE.JS (Dunia & Taman)
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87CEEB); 
scene.fog = new THREE.Fog(0x87CEEB, 10, 50);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.getElementById('game-container').appendChild(renderer.domElement);

const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);
const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
dirLight.position.set(20, 30, 20);
dirLight.castShadow = true;
dirLight.shadow.camera.left = -50;
dirLight.shadow.camera.right = 50;
dirLight.shadow.camera.top = 50;
dirLight.shadow.camera.bottom = -50;
scene.add(dirLight);

const grassGeometry = new THREE.PlaneGeometry(200, 200);
const grassMaterial = new THREE.MeshLambertMaterial({ color: 0x55aa55 }); 
const grass = new THREE.Mesh(grassGeometry, grassMaterial);
grass.rotation.x = -Math.PI / 2;
grass.receiveShadow = true;
scene.add(grass);

// GENERATOR POHON
function createTree(x, z) {
    const treeGroup = new THREE.Group();
    const trunkGeo = new THREE.CylinderGeometry(0.3, 0.4, 2, 8);
    const trunkMat = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.position.y = 1; 
    trunk.castShadow = true;
    treeGroup.add(trunk);

    const leavesGeo = new THREE.ConeGeometry(1.5, 3, 8);
    const leavesMat = new THREE.MeshLambertMaterial({ color: 0x228B22 });
    const leaves = new THREE.Mesh(leavesGeo, leavesMat);
    leaves.position.y = 3;
    leaves.castShadow = true;
    treeGroup.add(leaves);

    treeGroup.position.set(x, 0, z);
    scene.add(treeGroup);
}

for(let i = 0; i < 40; i++) {
    let randomX = (Math.random() - 0.5) * 150;
    let randomZ = (Math.random() - 0.5) * 150;
    createTree(randomX, randomZ);
}

// 3. KARAKTER PEMAIN (Kucing Berdiri 2 Kaki)
function createPlayerModel(catColorHex) {
    const playerGroup = new THREE.Group();

    // Fallback warna jika data dari database kosong
    const safeColor = catColorHex || 0xffffff; 
    const catMat = new THREE.MeshLambertMaterial({ color: safeColor });
    const darkMat = new THREE.MeshLambertMaterial({ color: 0x222222 }); 
    const pinkMat = new THREE.MeshLambertMaterial({ color: 0xffaaaa }); 
    const whiteMat = new THREE.MeshLambertMaterial({ color: 0xffffff }); 

    const bodyGeo = new THREE.SphereGeometry(0.35, 32, 16);
    const body = new THREE.Mesh(bodyGeo, catMat);
    body.scale.set(1, 1.4, 1); 
    body.position.y = 0.9; 
    body.castShadow = true;
    playerGroup.add(body);

    const headGeo = new THREE.SphereGeometry(0.38, 32, 32);
    const head = new THREE.Mesh(headGeo, catMat);
    head.position.set(0, 1.6, 0); 
    head.castShadow = true;
    playerGroup.add(head);

    const earGeo = new THREE.ConeGeometry(0.12, 0.25, 16);
    const leftEar = new THREE.Mesh(earGeo, catMat);
    leftEar.position.set(-0.2, 1.85, 0);
    leftEar.rotation.z = 0.3;
    leftEar.castShadow = true;
    playerGroup.add(leftEar);

    const rightEar = new THREE.Mesh(earGeo, catMat);
    rightEar.position.set(0.2, 1.85, 0);
    rightEar.rotation.z = -0.3;
