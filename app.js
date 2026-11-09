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

firebase.initializeApp(firebaseConfig);
const db = firebase.database();
const playerId = 'player_' + Math.floor(Math.random() * 10000);
const playerName = "Kucing_" + playerId.substring(7, 11);
const playersRef = db.ref('players');
const chatRef = db.ref('chats');

// 2. SETUP THREE.JS
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87CEEB); 
scene.fog = new THREE.Fog(0x87CEEB, 10, 60);

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
dirLight.shadow.camera.left = -50; dirLight.shadow.camera.right = 50;
dirLight.shadow.camera.top = 50; dirLight.shadow.camera.bottom = -50;
scene.add(dirLight);

const grassGeometry = new THREE.PlaneGeometry(200, 200);
const grassMaterial = new THREE.MeshLambertMaterial({ color: 0x55aa55 }); 
const grass = new THREE.Mesh(grassGeometry, grassMaterial);
grass.rotation.x = -Math.PI / 2;
grass.receiveShadow = true;
scene.add(grass);

// -- DEKORASI TAMAN --
const pathGeo = new THREE.PlaneGeometry(10, 200);
const pathMat = new THREE.MeshLambertMaterial({ color: 0xaaaaaa });
const path = new THREE.Mesh(pathGeo, pathMat);
path.rotation.x = -Math.PI / 2; path.position.y = 0.01; path.receiveShadow = true;
scene.add(path);

const fountainGeo = new THREE.BoxGeometry(6, 1, 6);
const fountainMat = new THREE.MeshLambertMaterial({ color: 0x888888 });
const fountain = new THREE.Mesh(fountainGeo, fountainMat);
fountain.position.set(0, 0.5, 0); fountain.castShadow = true; scene.add(fountain);
const waterGeo = new THREE.BoxGeometry(5, 1.2, 5);
const waterMat = new THREE.MeshLambertMaterial({ color: 0x00aaff, transparent: true, opacity: 0.8 });
const water = new THREE.Mesh(waterGeo, waterMat);
water.position.set(0, 0.5, 0); scene.add(water);

const trampGeo = new THREE.CylinderGeometry(3, 3, 0.5, 32);
const trampMat = new THREE.MeshLambertMaterial({ color: 0xff3333 });
const trampoline = new THREE.Mesh(trampGeo, trampMat);
trampoline.position.set(-15, 0.25, -15);
trampoline.castShadow = true; trampoline.receiveShadow = true;
scene.add(trampoline);
const trampCenterGeo = new THREE.CylinderGeometry(2.5, 2.5, 0.52, 32);
const trampCenterMat = new THREE.MeshLambertMaterial({ color: 0x111111 });
const trampCenter = new THREE.Mesh(trampCenterGeo, trampCenterMat);
trampCenter.position.set(-15, 0.25, -15); scene.add(trampCenter);

function createTree(x, z) {
    if(Math.abs(x) < 6 && Math.abs(z) < 6) return;
    const treeGroup = new THREE.Group();
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.4, 2, 8), new THREE.MeshLambertMaterial({ color: 0x8B4513 }));
    trunk.position.y = 1; trunk.castShadow = true; treeGroup.add(trunk);
    const leaves = new THREE.Mesh(new THREE.ConeGeometry(1.5, 3, 8), new THREE.MeshLambertMaterial({ color: 0x228B22 }));
    leaves.position.y = 3; leaves.castShadow = true; treeGroup.add(leaves);
    treeGroup.position.set(x, 0, z); scene.add(treeGroup);
}
for(let i = 0; i < 60; i++) {
    createTree((Math.random() - 0.5) * 150, (Math.random() - 0.5) * 150);
}

// 3. MODEL KARAKTER
function createPlayerModel(catColorHex) {
    const playerGroup = new THREE.Group();
    const catMat = new THREE.MeshLambertMaterial({ color: catColorHex || 0xffffff });
    const darkMat = new THREE.MeshLambertMaterial({ color: 0x222222 }); 
    const pinkMat = new THREE.MeshLambertMaterial({ color: 0xffaaaa }); 
    const whiteMat = new THREE.MeshLambertMaterial({ color: 0xffffff }); 

    const body = new THREE.Mesh(new THREE.SphereGeometry(0.35, 32, 16), catMat);
    body.scale.set(1, 1.4, 1); body.position.y = 0.9; body.castShadow = true; playerGroup.add(body);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.38, 32, 32), catMat);
    head.position.set(0, 1.6, 0); head.castShadow = true; playerGroup.add(head);
    
    const leftEar = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.25, 16), catMat);
    leftEar.position.set(-0.2, 1.85, 0); leftEar.rotation.z = 0.3; playerGroup.add(leftEar);
    const rightEar = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.25, 16), catMat);
    rightEar.position.set(0.2, 1.85, 0); rightEar.rotation.z = -0.3; playerGroup.add(rightEar);
    
    const lEyeW = new THREE.Mesh(new THREE.SphereGeometry(0.09, 16, 16), whiteMat);
    lEyeW.position.set(-0.15, 1.65, -0.32); playerGroup.add(l
