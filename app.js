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

// GENERATOR POHON TAMAN
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

// 3. MODEL KARAKTER KUCING (Berdiri 2 Kaki)
function createPlayerModel(catColorHex) {
    const playerGroup = new THREE.Group();

    const safeColor = catColorHex || 0xffffff; 
    const catMat = new THREE.MeshLambertMaterial({ color: safeColor });
    const darkMat = new THREE.MeshLambertMaterial({ color: 0x222222 }); 
    const pinkMat = new THREE.MeshLambertMaterial({ color: 0xffaaaa }); 
    const whiteMat = new THREE.MeshLambertMaterial({ color: 0xffffff }); 

    // Badan Tegak (Oval)
    const bodyGeo = new THREE.SphereGeometry(0.35, 32, 16);
    const body = new THREE.Mesh(bodyGeo, catMat);
    body.scale.set(1, 1.4, 1); 
    body.position.y = 0.9; 
    body.castShadow = true;
    playerGroup.add(body);

    // Kepala
    const headGeo = new THREE.SphereGeometry(0.38, 32, 32);
    const head = new THREE.Mesh(headGeo, catMat);
    head.position.set(0, 1.6, 0); 
    head.castShadow = true;
    playerGroup.add(head);

    // Telinga
    const earGeo = new THREE.ConeGeometry(0.12, 0.25, 16);
    const leftEar = new THREE.Mesh(earGeo, catMat);
    leftEar.position.set(-0.2, 1.85, 0);
    leftEar.rotation.z = 0.3;
    leftEar.castShadow = true;
    playerGroup.add(leftEar);

    const rightEar = new THREE.Mesh(earGeo, catMat);
    rightEar.position.set(0.2, 1.85, 0);
    rightEar.rotation.z = -0.3;
    rightEar.castShadow = true;
    playerGroup.add(rightEar);

    // Mata
    const eyeWhiteGeo = new THREE.SphereGeometry(0.09, 16, 16);
    const eyePupilGeo = new THREE.SphereGeometry(0.04, 16, 16);
    
    const leftEyeW = new THREE.Mesh(eyeWhiteGeo, whiteMat);
    leftEyeW.position.set(-0.15, 1.65, -0.32);
    playerGroup.add(leftEyeW);
    const leftEyeP = new THREE.Mesh(eyePupilGeo, darkMat);
    leftEyeP.position.set(-0.15, 1.65, -0.40);
    playerGroup.add(leftEyeP);

    const rightEyeW = new THREE.Mesh(eyeWhiteGeo, whiteMat);
    rightEyeW.position.set(0.15, 1.65, -0.32);
    playerGroup.add(rightEyeW);
    const rightEyeP = new THREE.Mesh(eyePupilGeo, darkMat);
    rightEyeP.position.set(0.15, 1.65, -0.40);
    playerGroup.add(rightEyeP);

    // Hidung
    const noseGeo = new THREE.SphereGeometry(0.05, 16, 16);
    const nose = new THREE.Mesh(noseGeo, pinkMat);
    nose.position.set(0, 1.55, -0.36);
    playerGroup.add(nose);

    // Kaki
    const legGeo = new THREE.CylinderGeometry(0.1, 0.1, 0.45, 16);
    const leftLeg = new THREE.Mesh(legGeo, catMat);
    leftLeg.position.set(-0.15, 0.22, 0);
    leftLeg.castShadow = true;
    playerGroup.add(leftLeg);

    const rightLeg = new THREE.Mesh(legGeo, catMat);
    rightLeg.position.set(0.15, 0.22, 0);
    rightLeg.castShadow = true;
    playerGroup.add(rightLeg);

    // Tangan
    const armGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.5, 16);
    const leftArm = new THREE.Mesh(armGeo, catMat);
    leftArm.position.set(-0.45, 1.0, 0);
    leftArm.rotation.z = 0.4; 
    leftArm.castShadow = true;
    playerGroup.add(leftArm);

    const rightArm = new THREE.Mesh(armGeo, catMat);
    rightArm.position.set(0.45, 1.0, 0);
    rightArm.rotation.z = -0.4;
    rightArm.castShadow = true;
    playerGroup.add(rightArm);

    // Ekor
    const tailGeo = new THREE.CylinderGeometry(0.06, 0.03, 0.7, 16);
    const tail = new THREE.Mesh(tailGeo, catMat);
    tail.position.set(0, 0.6, 0.35);
    tail.rotation.x = -0.5; 
    tail.castShadow = true;
    playerGroup.add(tail);

    playerGroup.userData = {
        leftLeg: leftLeg,
        rightLeg: rightLeg,
        leftArm: leftArm,
        rightArm: rightArm,
        isMoving: false
    };

    return playerGroup;
}

const myColor = Math.random() * 0xffffff;
const player = createPlayerModel(myColor);
scene.add(player);
camera.position.set(0, 5, 10);

const otherPlayers = {};

// 4. LOGIKA MULTIPLAYER
function updatePlayerPosition(isMoving) {
    playersRef.child(playerId).set({
        x: player.position.x,
        y: player.position.y,
        z: player.position.z,
        rY: player.rotation.y, 
        isMoving: isMoving,    
        color: myColor 
    });
}

window.addEventListener("beforeunload", () => {
    playersRef.child(playerId).remove();
});

playersRef.on('value', (snapshot) => {
    const data = snapshot.val();
    
    for (let id in data) {
        if (id === playerId) continue; 
        
        if (data[id].x === undefined || data[id].y === undefined || data[id].z === undefined) {
            continue; 
        }
        
        if (!otherPlayers[id]) {
            const mesh = createPlayerModel(data[id].color);
            scene.add(mesh);
            otherPlayers[id] = mesh;
        }
        
        otherPlayers[id].position.set(data[id].x, data[id].y, data[id].z);
        if (data[id].rY !== undefined) {
            otherPlayers[id].rotation.y = data[id].rY;
        }
        otherPlayers[id].userData.isMoving = data[id].isMoving || false;
    }
    
    for (let id in otherPlayers) {
        if (!data || !data[id] || data[id].x === undefined) {
            scene.remove(otherPlayers[id]);
            delete otherPlayers[id];
        }
    }
});

// 5. KONTROL & ANIMASI
const keys = {};
window.addEventListener('keydown', (e) => keys[e.key.toLowerCase()] = true);
window.addEventListener('keyup', (e) => keys[e.key.toLowerCase()] = false);

const speed = 0.15; 
let wasMoving = false;

function handleMovement() {
    let dx = 0;
    let dz = 0;
    
    if (keys['w'] || keys['arrowup']) dz -= 1;
    if (keys['s'] || keys['arrowdown']) dz += 1;
    if (keys['a'] || keys['arrowleft']) dx -= 1;
    if (keys['d'] || keys['arrowright']) dx += 1;
    
    if (dx !== 0 || dz !== 0) {
        const length = Math.sqrt(dx * dx + dz * dz);
        dx = (dx / length) * speed;
        dz = (dz / length) * speed;

        player.position.x += dx;
        player.position.z += dz;
        
        const angle = Math.atan2(dx, dz);
        player.rotation.y = angle;
        
        camera.position.x = player.position.x;
        camera.position.z = player.position.z + 8;
        camera.position.y = player.position.y + 4;
        
        updatePlayerPosition(true);
        wasMoving = true;
    } else {
        if (wasMoving) {
            updatePlayerPosition(false);
            wasMoving = false;
        }
    }
}

function animateLimbs(model, isMoving) {
    if (!model || !model.userData) return;

    if (isMoving) {
        const time = Date.now() * 0.015; 
        model.userData.leftLeg.rotation.x = Math.sin(time) * 0.6;
        model.userData.rightLeg.rotation.x = Math.sin(time + Math.PI) * 0.6;
        model.userData.leftArm.rotation.x = Math.sin(time + Math.PI) * 0.6;
        model.userData.rightArm.rotation.x = Math.sin(time) * 0.6;
    } else {
        model.userData.leftLeg.rotation.x = 0;
        model.userData.rightLeg.rotation.x = 0;
        model.userData.leftArm.rotation.x = 0;
        model.userData.rightArm.rotation.x = 0;
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
    msgEl.style.marginBottom = "5px";
    const nameTag = chat.id ? chat.id.substring(7, 11) : "Anon";
    msgEl.innerHTML = '<strong style="color: #333;">Kucing_' + nameTag + ':</strong> ' + chat.message;
    chatBox.appendChild(msgEl);
    chatBox.scrollTop = chatBox.scrollHeight;
});

// 7. RENDER LOOP 
function animate() {
    requestAnimationFrame(animate);
    handleMovement();
    
    animateLimbs(player, wasMoving);
    
    for(let id in otherPlayers) {
        animateLimbs(otherPlayers[id], otherPlayers[id].userData.isMoving);
    }
    
    camera.lookAt(player.position.x, player.position.y + 1, player.position.z);
    
    renderer.render(scene, camera);
}
animate();
updatePlayerPosition(false);

// 8. RESPONSIF LAYAR
window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
});
