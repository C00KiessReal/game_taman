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
const usersRef = db.ref('users');
const playersRef = db.ref('players');
const chatRef = db.ref('chats');

let playerId = "";
let playerName = "";
let isGameStarted = false;

let myAvatarConfig = {
    gender: "male", skin: "#ffcc99", hairColor: "#e6e6fa", // Silver/ungu muda ala Killua
    bodyScale: 1.0, shirt: "#d8d8eb", pants: "#5c4f74", shoes: "#663366"
};

// 2. SETUP THREE.JS
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87CEEB); 
scene.fog = new THREE.Fog(0x87CEEB, 10, 60);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.getElementById('game-container').appendChild(renderer.domElement);

const ambientLight = new THREE.AmbientLight(0xffffff, 0.6); scene.add(ambientLight);
const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
dirLight.position.set(20, 30, 20); dirLight.castShadow = true;
dirLight.shadow.camera.left = -50; dirLight.shadow.camera.right = 50;
dirLight.shadow.camera.top = 50; dirLight.shadow.camera.bottom = -50;
scene.add(dirLight);

// Lingkungan
const grass = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), new THREE.MeshLambertMaterial({ color: 0x55aa55 }));
grass.rotation.x = -Math.PI / 2; grass.receiveShadow = true; scene.add(grass);
const path = new THREE.Mesh(new THREE.PlaneGeometry(10, 200), new THREE.MeshLambertMaterial({ color: 0xaaaaaa }));
path.rotation.x = -Math.PI / 2; path.position.y = 0.01; path.receiveShadow = true; scene.add(path);
const fountain = new THREE.Mesh(new THREE.BoxGeometry(6, 1, 6), new THREE.MeshLambertMaterial({ color: 0x888888 }));
fountain.position.set(0, 0.5, 0); fountain.castShadow = true; scene.add(fountain);
const water = new THREE.Mesh(new THREE.BoxGeometry(5, 1.2, 5), new THREE.MeshLambertMaterial({ color: 0x00aaff, transparent: true, opacity: 0.8 }));
water.position.set(0, 0.5, 0); scene.add(water);

// 3. GENERATOR KARAKTER CHIBI ANIME
function createAvatarModel(config) {
    const group = new THREE.Group();
    const skinMat = new THREE.MeshLambertMaterial({ color: config.skin }); 
    const hairMat = new THREE.MeshLambertMaterial({ color: config.hairColor });
    const shirtMat = new THREE.MeshLambertMaterial({ color: config.shirt }); 
    const pantsMat = new THREE.MeshLambertMaterial({ color: config.pants }); 
    const shoeMat = new THREE.MeshLambertMaterial({ color: config.shoes }); 
    const bagMat = new THREE.MeshLambertMaterial({ color: 0x8b3a3a }); // Cokelat kemerahan tas
    const whiteMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
    const blackMat = new THREE.MeshLambertMaterial({ color: 0x222222 });

    const isMale = config.gender === 'male';

    // KEPALA (Besar ala Chibi)
    const headGroup = new THREE.Group();
    headGroup.position.y = 1.6;
    
    const headGeo = new THREE.SphereGeometry(0.35, 32, 32);
    const head = new THREE.Mesh(headGeo, skinMat);
    head.castShadow = true; headGroup.add(head);

    // Wajah & Mata Anime Besar
    const eyeGeo = new THREE.SphereGeometry(0.08, 16, 16);
    const pupilGeo = new THREE.SphereGeometry(0.05, 16, 16);
    
    const lEye = new THREE.Mesh(eyeGeo, whiteMat); lEye.position.set(-0.12, 0.05, -0.3);
    const lPupil = new THREE.Mesh(pupilGeo, blackMat); lPupil.position.set(-0.12, 0.05, -0.34);
    const rEye = new THREE.Mesh(eyeGeo, whiteMat); rEye.position.set(0.12, 0.05, -0.3);
    const rPupil = new THREE.Mesh(pupilGeo, blackMat); rPupil.position.set(0.12, 0.05, -0.34);
    headGroup.add(lEye, lPupil, rEye, rPupil);

    const mouth = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.015, 0.02), new THREE.MeshLambertMaterial({color: 0x994444}));
    mouth.position.
