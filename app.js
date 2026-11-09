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
let playerGender = "male";
let isGameStarted = false;

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
const trampoline = new THREE.Mesh(new THREE.CylinderGeometry(3, 3, 0.5, 32), new THREE.MeshLambertMaterial({ color: 0xff3333 }));
trampoline.position.set(-15, 0.25, -15); trampoline.castShadow = true; trampoline.receiveShadow = true; scene.add(trampoline);

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

// ==========================================
// 3. GENERATOR KARAKTER (GLTF 3D MODEL)
// ==========================================
const gltfLoader = new THREE.GLTFLoader();

function createAvatarModel(gender) {
    const group = new THREE.Group();
    
    // Senter (Tertanam agar malam hari tetap terang)
    const flashlight = new THREE.SpotLight(0xffffee, 0); 
    flashlight.position.set(0, 1.15, -0.2); 
    flashlight.target.position.set(0, 0.5, -5); 
    flashlight.angle = Math.PI / 6; flashlight.penumbra = 0.5; flashlight.distance = 25; 
    group.add(flashlight); group.add(flashlight.target);

    // Setup userData awal
    group.userData = { 
        flashlight: flashlight, 
        isMoving: false, 
        isJumping: false,
        mixer: null,
        animations: {},
        currentAction: null
    };

    // Placeholder sementara selagi model GLTF di-download
    const placeholder = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1.5, 0.5), new THREE.MeshBasicMaterial({color: 0x888888, wireframe: true}));
    placeholder.position.y = 0.75;
    group.add(placeholder);

    // Load Model GLTF
    gltfLoader.load(
        'assets/character-male-a.gltf', // Pastikan folder dan nama file sesuai!
        function (gltf) {
            group.remove(placeholder); // Hapus kotak placeholder
            
            const model = gltf.scene;
            model.traverse(function (child) {
                if (child.isMesh) {
                    child.castShadow = true;
                }
            });

            // Putar model 180 derajat jika karakter membelakangi kamera saat dimuat
            model.rotation.y = Math.PI; 
            
            group.add(model);

            // Setup Animasi
            const mixer = new THREE.AnimationMixer(model);
            const anims = {};
            gltf.animations.forEach((clip) => {
                anims[clip.name] = mixer.clipAction(clip);
            });

            group.userData.mixer = mixer;
            group.userData.animations = anims;
            
            // Mainkan Idle
            if (anims['idle']) {
                group.userData.currentAction = anims['idle'];
                group.userData.currentAction.play();
            }
        },
        undefined,
        function (error) {
            console.error("Gagal memuat GLTF:", error);
        }
    );

    return group;
}

let player; const otherPlayers = {};

// 4. SISTEM LOGIN
const playBtn = document.getElementById('play-btn');
const userInput = document.getElementById('username-input');

if (userInput) {
    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') playBtn.click();
    });
}

if (playBtn) {
    playBtn.addEventListener('click', () => {
        const inputName = userInput.value.trim();
        if (!inputName) { 
            playBtn.innerText = "Ketik Nama Dulu!";
            setTimeout(() => { playBtn.innerText = "Main Sekarang 🚀"; }, 2000);
            return; 
        }
        
        playBtn.innerText = "Memuat Game..."; 
        playerName = inputName;
        playerId = "user_" + playerName.replace(/[\.\#\$\[\]\/]/g, ""); 
        playerGender = document.getElementById('gender-select').value;
        
        usersRef.child(playerId).once('value').then(snap => {
            if(snap.exists()) {
                playerGender = snap.val().gender || playerGender;
            } else {
                usersRef.child(playerId).set({ gender: playerGender });
            }
            masukGame();
        }).catch((err) => {
            console.error("Firebase Delay, Paksa Masuk!");
            masukGame(); 
        });
    });
}

let manager;
function masukGame() {
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('game-ui').style.display = 'block';
    isGameStarted = true;
    
    player = createAvatarModel(playerGender); scene.add(player);
    camera.position.set(0, 5, 10);
    
    playersRef.child(playerId).set({ name: playerName, gender: playerGender, x:0, y:0, z:0, rY:0, isMoving:false, isJumping: false });
    playersRef.child(playerId).onDisconnect().remove();
    window.addEventListener("beforeunload", () => playersRef.child(playerId).remove());

    const joystickZone = document.getElementById('joystick-zone');
    if(joystickZone && typeof nipplejs !== 'undefined') {
        manager = nipplejs.create({ zone: joystickZone, mode: 'static', position: { left: '50%', top: '50%' }, color: 'white', size: 100 });
        manager.on('move', (evt, data) => { isJoystickActive = true; joystickForce = Math.min(data.force,
