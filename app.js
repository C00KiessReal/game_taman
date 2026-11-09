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
let myColor = "#ffffff";
let isGameStarted = false;

// 2. SETUP THREE.JS LINGKUNGAN TAMAN
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87CEEB); 
scene.fog = new THREE.Fog(0x87CEEB, 10, 60);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.getElementById('game-container').appendChild(renderer.domElement);

const ambientLight = new THREE.AmbientLight(0xffffff, 0.5); scene.add(ambientLight);
const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
dirLight.position.set(20, 30, 20); dirLight.castShadow = true;
dirLight.shadow.camera.left = -50; dirLight.shadow.camera.right = 50;
dirLight.shadow.camera.top = 50; dirLight.shadow.camera.bottom = -50;
scene.add(dirLight);

const grass = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), new THREE.MeshLambertMaterial({ color: 0x55aa55 }));
grass.rotation.x = -Math.PI / 2; grass.receiveShadow = true; scene.add(grass);

const path = new THREE.Mesh(new THREE.PlaneGeometry(10, 200), new THREE.MeshLambertMaterial({ color: 0xaaaaaa }));
path.rotation.x = -Math.PI / 2; path.position.y = 0.01; path.receiveShadow = true; scene.add(path);

const fountain = new THREE.Mesh(new THREE.BoxGeometry(6, 1, 6), new THREE.MeshLambertMaterial({ color: 0x888888 }));
fountain.position.set(0, 0.5, 0); fountain.castShadow = true; scene.add(fountain);
const water = new THREE.Mesh(new THREE.BoxGeometry(5, 1.2, 5), new THREE.MeshLambertMaterial({ color: 0x00aaff, transparent: true, opacity: 0.8 }));
water.position.set(0, 0.5, 0); scene.add(water);

const trampoline = new THREE.Mesh(new THREE.CylinderGeometry(3, 3, 0.5, 32), new THREE.MeshLambertMaterial({ color: 0xff3333 }));
trampoline.position.set(-15, 0.25, -15); trampoline.castShadow = true; trampoline.receiveShadow = true; scene.add(trampoline);
const trampCenter = new THREE.Mesh(new THREE.CylinderGeometry(2.5, 2.5, 0.52, 32), new THREE.MeshLambertMaterial({ color: 0x111111 }));
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
for(let i = 0; i < 60; i++) { createTree((Math.random() - 0.5) * 150, (Math.random() - 0.5) * 150); }

// 3. MODEL MANUSIA (ROBLOX R6 STYLE)
function createHumanModel(shirtColorHex) {
    const group = new THREE.Group();
    const skinMat = new THREE.MeshLambertMaterial({ color: 0xffcc99 }); 
    const shirtMat = new THREE.MeshLambertMaterial({ color: shirtColorHex || 0xff3366 }); 
    const pantsMat = new THREE.MeshLambertMaterial({ color: 0x1a237e }); 
    const shoeMat = new THREE.MeshLambertMaterial({ color: 0x222222 }); 

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.28, 32, 32), skinMat);
    head.position.y = 1.7; head.castShadow = true; group.add(head);

    const eyeW = new THREE.Mesh(new THREE.SphereGeometry(0.06, 16, 16), new THREE.MeshLambertMaterial({color: 0xffffff}));
    const eyeB = new THREE.Mesh(new THREE.SphereGeometry(0.03, 16, 16), new THREE.MeshLambertMaterial({color: 0x000000}));
    const lEye = eyeW.clone(); lEye.position.set(-0.1, 1.75, -0.23); group.add(lEye);
    const lPupil = eyeB.clone(); lPupil.position.set(-0.1, 1.75, -0.27); group.add(lPupil);
    const rEye = eyeW.clone(); rEye.position.set(0.1, 1.75, -0.23); group.add(rEye);
    const rPupil = eyeB.clone(); rPupil.position.set(0.1, 1.75, -0.27); group.add(rPupil);

    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.7, 0.3), shirtMat);
    torso.position.y = 1.15; torso.castShadow = true; group.add(torso);

    const armGeo = new THREE.BoxGeometry(0.2, 0.7, 0.2);
    const legGeo = new THREE.BoxGeometry(0.25, 0.7, 0.25);
    const shoeGeo = new THREE.BoxGeometry(0.26, 0.15, 0.3);

    const lArmPivot = new THREE.Group(); lArmPivot.position.set(-0.4, 1.4, 0);
    const lArm = new THREE.Mesh(armGeo, skinMat); lArm.position.set(0, -0.35, 0); lArm.castShadow = true;
    const lSleeve = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.35, 0.22), shirtMat); lSleeve.position.set(0, -0.15, 0);
    lArmPivot.add(lArm); lArmPivot.add(lSleeve); group.add(lArmPivot);

    const rArmPivot = new THREE.Group(); rArmPivot.position.set(0.4, 1.4, 0);
    const rArm = new THREE.Mesh(armGeo, skinMat); rArm.position.set(0, -0.35, 0); rArm.castShadow = true;
    const rSleeve = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.35, 0.22), shirtMat); rSleeve.position.set(0, -0.15, 0);
    rArmPivot.add(rArm); rArmPivot.add(rSleeve); group.add(rArmPivot);

    const lLegPivot = new THREE.Group(); lLegPivot.position.set(-0.15, 0.8, 0);
    const lLeg = new THREE.Mesh(legGeo, pantsMat); lLeg.position.set(0, -0.35, 0); lLeg.castShadow = true;
    const lShoe = new THREE.Mesh(shoeGeo, shoeMat); lShoe.position.set(0, -0.65, -0.02);
    lLegPivot.add(lLeg); lLegPivot.add(lShoe); group.add(lLegPivot);

    const rLegPivot = new THREE.Group(); rLegPivot.position.set(0.15, 0.8, 0);
    const rLeg = new THREE.Mesh(legGeo, pantsMat); rLeg.position.set(0, -0.35, 0); rLeg.castShadow = true;
    const rShoe = new THREE.Mesh(shoeGeo, shoeMat); rShoe.position.set(0, -0.65, -0.02);
    rLegPivot.add(rLeg); rLegPivot.add(rShoe); group.add(rLegPivot);

    const flashlight = new THREE.SpotLight(0xffffee, 0);
    flashlight.position.set(0, 1.15, -0.2); flashlight.target.position.set(0, 0.5, -5);
    flashlight.angle = Math.PI / 6; flashlight.penumbra = 0.5; flashlight.distance = 25;
    group.add(flashlight); group.add(flashlight.target);

    group.userData = {
        leftArm: lArmPivot, rightArm: rArmPivot, leftLeg: lLegPivot, rightLeg: rLegPivot,
        flashlight: flashlight, isMoving: false, head: head
    };
    return group;
}

let player; 
const otherPlayers = {};

// 4. SISTEM LOGIN & SAVE DATA (Diperbarui)
const playBtn = document.getElementById('play-btn');
const userInput = document.getElementById('username-input');

if (userInput) {
    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') playBtn.click(); // Bisa tekan Enter untuk Login
    });
}

if(playBtn) {
    playBtn.addEventListener('click', () => {
        const inputName = userInput.value.trim();
        
        if (!inputName) { 
            playBtn.innerText = "Ketik Nama Dulu!";
            setTimeout(() => { playBtn.innerText = "Main Sekarang!"; }, 2000);
            return; 
        }
        
        playBtn.innerText = "Memuat Game..."; // Ubah teks agar player tahu sedang loading
        playerName = inputName;
        // Bersihkan nama dari simbol yang diblokir Firebase
        playerId = "user_" + playerName.replace(/[\.\#\$\[\]\/]/g, ""); 

        // Cek Firebase dengan sistem Anti-Macet (.then)
        usersRef.child(playerId).once('value').then((snapshot) => {
            if (snapshot.exists()) {
                myColor = snapshot.val().color; // Ambil baju lama
            } else {
                myColor = document.getElementById('color-input').value; // Baju baru
                usersRef.child(playerId).set({ color: myColor, created: Date.now() });
            }
            masukKeTaman();
        }).catch((err) => {
            console.error("Error Firebase:", err);
            // JIKA ERROR (Lag), TETAP PAKSA MASUK KE GAME (Anti-Softlock)
            myColor = document.getElementById('color-input').value;
            masukKeTaman();
        });
    });
}

// Fungsi transisi ke taman
function masukKeTaman() {
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('game-ui').style.display = 'block';
    startGame();
}

let cameraMode = 'TPP';
let manager; 

function startGame() {
    isGameStarted = true;
    
    player = createHumanModel(myColor);
    scene.add(player);
    camera.position.set(0, 5, 10);
    
    playersRef.child(playerId).set({
        name: playerName, x: 0, y: 0, z: 0, rY: 0, isMoving: false, color: myColor 
    });

    playersRef.child(playerId).onDisconnect().remove();
    window.addEventListener("beforeunload", () => { playersRef.child(playerId).remove(); });

    const joystickZone = document.getElementById('joystick-zone');
    if(joystickZone && typeof nipplejs !== 'undefined') {
        manager = nipplejs.create({ zone: joystickZone, mode: 'static', position: { left: '50%', top: '50%' }, color: 'white', size: 100 });
        manager.on('move', (evt, data) => {
            isJoystickActive = true;
            joystickForce = Math.min(data.force, 1);
            joystickAngle = data.angle.radian;
        });
        manager.on('end', () => { isJoystickActive = false; joystickForce = 0; });
    }
}

function toggleCameraMode() {
    if(!isGameStarted) return;
    cameraMode = (cameraMode === 'TPP') ? 'FPP' : 'TPP';
    player.visible = (cameraMode === 'TPP');
}
window.addEventListener('keydown', (e) => { if(e.key.toLowerCase() === 'c') toggleCameraMode(); });
const camBtn = document.getElementById('cam-btn');
if(camBtn) {
    camBtn.addEventListener('touchstart', (e) => { e.preventDefault(); toggleCameraMode(); });
    camBtn.addEventListener('mousedown', (e) => { e.preventDefault(); toggleCameraMode(); });
}

const nametagsContainer = document.getElementById('nametags-container');
function updateNametag(mesh, nameText, id, isSelf = false) {
    if(!nametagsContainer) return;
    let div = document.getElementById('tag_' + id);
    if (!div) {
        div = document.createElement('div'); div.id = 'tag_' + id; div.className = 'nametag';
        div.innerText = nameText; nametagsContainer.appendChild(div);
    }
    if (isSelf && cameraMode === 'FPP') { div.style.display = 'none'; return; }

    const vector = new THREE.Vector3(); mesh.getWorldPosition(vector);
    vector.y += 2.2; vector.project(camera); 
    
    if (vector.z < 1 && vector.z > -1) {
        div.style.display = 'block';
        div.style.left = (vector.x * 0.5 + 0.5) * window.innerWidth + 'px';
        div.style.top = (vector.y * -0.5 + 0.5) * window.innerHeight + 'px';
    } else { div.style.display = 'none'; }
}

playersRef.on('value', (snapshot) => {
    if(!isGameStarted) return;
    const data = snapshot.val();
    for (let id in data) {
        if (id === playerId || data[id].x === undefined) continue; 
        
        if (!otherPlayers[id]) {
            const mesh = createHumanModel(data[id].color); scene.add(mesh); otherPlayers[id] = mesh;
        }
        otherPlayers[id].position.set(data[id].x, data[id].y, data[id].z);
        if (data[id].rY !== undefined) otherPlayers[id].rotation.y = data[id].rY;
        otherPlayers[id].userData.isMoving = data[id].isMoving || false;
        otherPlayers[id].userData.name = data[id].name || "Anon";
    }
    for (let id in otherPlayers) {
        if (!data || !data[id]) {
            scene.remove(otherPlayers[id]); delete otherPlayers[id];
            const oldTag = document.getElementById('tag_' + id); if (oldTag) oldTag.remove();
        }
    }
});

// 5. KAMERA 360 & KONTROL MANUSIA
let lookAngle = 0; let lookPitch = 0.2;
let isDraggingCamera = false; let previousMouseX = 0; let previousMouseY = 0; let dragTouchId = null;
const gameContainer = document.getElementById('game-container');

if(gameContainer) {
    gameContainer.addEventListener('mousedown', (e) => { isDraggingCamera = true; previousMouseX = e.clientX; previousMouseY = e.clientY; });
    window.addEventListener('mouseup', () => { isDraggingCamera = false; });
    window.addEventListener('mousemove', (e) => {
        if (isDraggingCamera && isGameStarted) {
            lookAngle -= (e.clientX - previousMouseX) * 0.005; 
            lookPitch += (e.clientY - previousMouseY) * 0.005; 
            lookPitch = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, lookPitch));
            previousMouseX = e.clientX; previousMouseY = e.clientY;
        }
    });

    gameContainer.addEventListener('touchstart', (e) => {
        for (let i = 0; i < e.changedTouches.length; i++) {
            if (e.changedTouches[i].target === renderer.domElement) {
                isDraggingCamera = true; dragTouchId = e.changedTouches[i].identifier;
                previousMouseX = e.changedTouches[i].clientX; previousMouseY = e.changedTouches[i].
