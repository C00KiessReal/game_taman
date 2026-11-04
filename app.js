// 1. KONFIGURASI FIREBASE
const firebaseConfig = {
    apiKey: "AIzaSyAgrAl1_FGvOvo8xAJOqdrqVH9F1HCDiWw",
    authDomain: "project-game-636ff.firebaseapp.com",
    // Gunakan URL Singapore (asia-southeast1) jika kamu memilih server Singapore tadi
    databaseURL: "https://project-game-636ff-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "project-game-636ff",
    storageBucket: "project-game-636ff.firebasestorage.app",
    messagingSenderId: "1036449209834",
    appId: "1:1036449209834:web:284c003a3ef15e7e8b6693",
    measurementId: "G-0WK4CEHWPG"
};

// Inisialisasi Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// ID Unik untuk pemain saat ini
const playerId = 'player_' + Math.floor(Math.random() * 10000);
const playersRef = db.ref('players');
const chatRef = db.ref('chats');

// 2. SETUP THREE.JS (Dunia & Taman)
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87CEEB); // Langit siang hari
scene.fog = new THREE.Fog(0x87CEEB, 10, 50);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.getElementById('game-container').appendChild(renderer.domElement);

// Pencahayaan
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);
const dirLight = new THREE.DirectionalLight(0xffffff, 0.6);
dirLight.position.set(10, 20, 10);
dirLight.castShadow = true;
scene.add(dirLight);

// Lantai (Rumput Taman)
const grassGeometry = new THREE.PlaneGeometry(100, 100);
const grassMaterial = new THREE.MeshLambertMaterial({ color: 0x7CFC00 });
const grass = new THREE.Mesh(grassGeometry, grassMaterial);
grass.rotation.x = -Math.PI / 2;
grass.receiveShadow = true;
scene.add(grass);

// 3. KARAKTER PEMAIN (Bentuk Kapsul Imut Sementara)
const playerGeometry = new THREE.CapsuleGeometry(1, 1.5, 1);
const playerMaterial = new THREE.MeshLambertMaterial({ color: Math.random() * 0xffffff }); // Warna random per pemain
const player = new THREE.Mesh(playerGeometry, playerMaterial);
player.position.y = 1;
player.castShadow = true;
scene.add(player);

camera.position.set(0, 5, 10);
camera.lookAt(player.position);

// Objek Pemain Lain
const otherPlayers = {};

// 4. LOGIKA MULTIPLAYER
// Sync pergerakan pemain ini ke database
function updatePlayerPosition() {
    playersRef.child(playerId).set({
        x: player.position.x,
        y: player.position.y,
        z: player.position.z,
        color: playerMaterial.color.getHex()
    });
}

// Hapus pemain saat keluar browser
window.addEventListener("beforeunload", () => {
    playersRef.child(playerId).remove();
});

// Render pemain lain
playersRef.on('value', (snapshot) => {
    const data = snapshot.val();
    for (let id in data) {
        if (id === playerId) continue; // Abaikan diri sendiri
        
        if (!otherPlayers[id]) {
            // Buat karakter untuk pemain baru yang join
            const mat = new THREE.MeshLambertMaterial({ color: data[id].color });
            const mesh = new THREE.Mesh(playerGeometry, mat);
            scene.add(mesh);
            otherPlayers[id] = mesh;
        }
        // Update posisi pemain lain
        otherPlayers[id].position.set(data[id].x, data[id].y, data[id].z);
    }
    // Hapus pemain yang disconnect
    for (let id in otherPlayers) {
        if (!data || !data[id]) {
            scene.remove(otherPlayers[id]);
            delete otherPlayers[id];
        }
    }
});

// 5. KONTROL PC (WASD)
const keys = {};
window.addEventListener('keydown', (e) => keys[e.key.toLowerCase()] = true);
window.addEventListener('keyup', (e) => keys[e.key.toLowerCase()] = false);

const speed = 0.1;
function handleMovement() {
    let moved = false;
    if (keys['w']) { player.position.z -= speed; moved = true; }
    if (keys['s']) { player.position.z += speed; moved = true; }
    if (keys['a']) { player.position.x -= speed; moved = true; }
    if (keys['d']) { player.position.x += speed; moved = true; }
    
    if (moved) {
        // Kamera mengikuti pemain
        camera.position.x = player.position.x;
        camera.position.z = player.position.z + 10;
        updatePlayerPosition();
    }
}

// 6. SISTEM CHAT
const chatInput = document.getElementById('chat-input');
const chatBox = document.getElementById('chat-box');

chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && chatInput.value !== "") {
        chatRef.push({
            id: playerId,
            message: chatInput.value
        });
        chatInput.value = "";
    }
});

chatRef.on('child_added', (snapshot) => {
    const chat = snapshot.val();
    const msgEl = document.createElement('div');
    msgEl.innerHTML = `<strong>${chat.id.substring(0, 8)}:</strong> ${chat.message}`;
    chatBox.appendChild(msgEl);
