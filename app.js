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

// 3. GENERATOR KARAKTER TETAP (ANIME STYLE)
function createAvatarModel(gender) {
    const group = new THREE.Group();
    const isMale = (gender === 'male');

    // Pewarnaan Hardcode sesuai Referensi Gambar
    const skinMat = new THREE.MeshLambertMaterial({ color: 0xffe0bd }); 
    const hairMat = new THREE.MeshLambertMaterial({ color: isMale ? 0xe6e6fa : 0x2b2b2b }); 
    const shirtMat = new THREE.MeshLambertMaterial({ color: isMale ? 0xcbd0eb : 0xffffff }); 
    const pantsMat = new THREE.MeshLambertMaterial({ color: isMale ? 0x5c4f74 : 0x2b427a }); 
    const shoeMat = new THREE.MeshLambertMaterial({ color: isMale ? 0x5c4f74 : 0x222222 }); 
    const bagMat = new THREE.MeshLambertMaterial({ color: 0x8b3a3a }); 
    const whiteMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
    const blackMat = new THREE.MeshLambertMaterial({ color: 0x222222 });
    const redMat = new THREE.MeshLambertMaterial({ color: 0xcc1111 });

    // KEPALA
    const headGroup = new THREE.Group(); headGroup.position.y = 1.6;
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.35, 32, 32), skinMat); head.castShadow = true; headGroup.add(head);

    // MATA & WAJAH
    const lEye = new THREE.Mesh(new THREE.SphereGeometry(0.08, 16, 16), whiteMat); lEye.position.set(-0.12, 0.05, -0.3);
    const lPupil = new THREE.Mesh(new THREE.SphereGeometry(0.05, 16, 16), blackMat); lPupil.position.set(-0.12, 0.05, -0.34);
    const rEye = new THREE.Mesh(new THREE.SphereGeometry(0.08, 16, 16), whiteMat); rEye.position.set(0.12, 0.05, -0.3);
    const rPupil = new THREE.Mesh(new THREE.SphereGeometry(0.05, 16, 16), blackMat); rPupil.position.set(0.12, 0.05, -0.34);
    const mouth = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.015, 0.02), redMat); mouth.position.set(0, -0.1, -0.33);
    headGroup.add(lEye, lPupil, rEye, rPupil, mouth);

    // RAMBUT & AKSESORIS
    if (isMale) {
        const hairBase = new THREE.Mesh(new THREE.SphereGeometry(0.37, 16, 16), hairMat); hairBase.position.y = 0.05; headGroup.add(hairBase);
        for(let i=0; i<15; i++) {
            const spike = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.3, 4), hairMat);
            spike.position.set((Math.random()-0.5)*0.5, 0.2+(Math.random()*0.2), (Math.random()-0.5)*0.5);
            spike.lookAt(0, 0, 0); spike.rotation.x -= Math.PI; headGroup.add(spike);
        }
    } else {
        const hairBase = new THREE.Mesh(new THREE.SphereGeometry(0.38, 32, 32, 0, Math.PI*2, 0, Math.PI/1.5), hairMat);
        hairBase.position.y = 0.05; headGroup.add(hairBase);
        
        const ribbonCenter = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.1), redMat); ribbonCenter.position.set(0, 0.38, 0); headGroup.add(ribbonCenter);
        const lBow = new THREE.Mesh(new THREE.ConeGeometry(0.15, 0.2, 4), redMat); lBow.position.set(-0.15, 0.38, 0); lBow.rotation.z = Math.PI/2; headGroup.add(lBow);
        const rBow = new THREE.Mesh(new THREE.ConeGeometry(0.15, 0.2, 4), redMat); rBow.position.set(0.15, 0.38, 0); rBow.rotation.z = -Math.PI/2; headGroup.add(rBow);
    }
    group.add(headGroup);

    // BADAN
    const torsoGeo = isMale ? new THREE.BoxGeometry(0.5, 0.6, 0.3) : new THREE.BoxGeometry(0.45, 0.55, 0.28);
    const torso = new THREE.Mesh(torsoGeo, shirtMat); torso.position.y = 1.05; torso.castShadow = true; group.add(torso);

    if (!isMale) { 
        const skirt = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.35, 0.25, 16), pantsMat); skirt.position.y = 0.75; skirt.castShadow = true; group.add(skirt);
        const tie = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.2, 4), redMat); tie.position.set(0, 1.2, -0.15); tie.rotation.x = Math.PI; group.add(tie);
    }

    // RANSEL PUNGGUNG
    const bag = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.4, 0.2), bagMat); bag.position.set(0, 1.1, 0.25); bag.castShadow = true; group.add(bag);
    const bagPocket = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.2, 0.1), bagMat); bagPocket.position.set(0, 1.05, 0.35); group.add(bagPocket);

    // TANGAN
    const lArmPivot = new THREE.Group(); lArmPivot.position.set(isMale ? -0.35 : -0.3, 1.3, 0);
    const lArm = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.5, 0.15), skinMat); lArm.position.y = -0.25;
    const lSleeve = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.25, 0.17), isMale? shirtMat : whiteMat); lSleeve.position.y = -0.1;
    lArmPivot.add(lArm, lSleeve); group.add(lArmPivot);

    const rArmPivot = new THREE.Group(); rArmPivot.position.set(isMale ? 0.35 : 0.3, 1.3, 0);
    const rArm = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.5, 0.15), skinMat); rArm.position.y = -0.25;
    const rSleeve = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.25, 0.17), isMale? shirtMat : whiteMat); rSleeve.position.y = -0.1;
    rArmPivot.add(rArm, rSleeve); group.add(rArmPivot);

    // KAKI & SEPATU
    const legGeo = new THREE.BoxGeometry(0.18, 0.5, 0.18);
    const shoeGeo = isMale ? new THREE.BoxGeometry(0.25, 0.2, 0.35) : new THREE.BoxGeometry(0.2, 0.15, 0.25);
    
    const lLegPivot = new THREE.Group(); lLegPivot.position.set(-0.15, 0.75, 0);
    const lLeg = new THREE.Mesh(legGeo, isMale ? pantsMat : skinMat); lLeg.position.y = -0.25;
    const lShoe = new THREE.Mesh(shoeGeo, shoeMat); lShoe.position.set(0, isMale ? -0.5 : -0.55, 0.05);
    if(!isMale) { const sock = new THREE.Mesh(new THREE.BoxGeometry(0.19, 0.3, 0.19), whiteMat); sock.position.y = -0.35; lLegPivot.add(sock); } 
    else { const short = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.3, 0.2), pantsMat); short.position.y = -0.15; lLegPivot.add(short); }
    lLegPivot.add(lLeg, lShoe); group.add(lLegPivot);

    const rLegPivot = new THREE.Group(); rLegPivot.position.set(0.15, 0.75, 0);
    const rLeg = new THREE.Mesh(legGeo, isMale ? pantsMat : skinMat); rLeg.position.y = -0.25;
    const rShoe = new THREE.Mesh(shoeGeo, shoeMat); rShoe.position.set(0, isMale ? -0.5 : -0.55, 0.05);
    if(!isMale) { const sock = new THREE.Mesh(new THREE.BoxGeometry(0.19, 0.3, 0.19), whiteMat); sock.position.y = -0.35; rLegPivot.add(sock); } 
    else { const short = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.3, 0.2), pantsMat); short.position.y = -0.15; rLegPivot.add(short); }
    rLegPivot.add(rLeg, rShoe); group.add(rLegPivot);

    // Senter (Tertanam)
    const flashlight = new THREE.SpotLight(0xffffee, 0); flashlight.position.set(0, 1.15, -0.2); flashlight.target.position.set(0, 0.5, -5); flashlight.angle = Math.PI / 6; flashlight.penumbra = 0.5; flashlight.distance = 25; group.add(flashlight); group.add(flashlight.target);

    group.userData = { leftArm: lArmPivot, rightArm: rArmPivot, leftLeg: lLegPivot, rightLeg: rLegPivot, flashlight: flashlight, isMoving: false, head: headGroup };
    return group;
}

let player; const otherPlayers = {};

// 4. SISTEM LOGIN (ANTI-MACET 100%)
const playBtn = document.getElementById('play-btn');
const userInput = document.getElementById('username-input');

// Bisa Tekan Enter di Keyboard untuk Login
if (userInput) {
    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') playBtn.click();
    });
}

if (playBtn) {
    playBtn.addEventListener('click', () => {
        const inputName = userInput.value.trim();
        
        // Peringatan jika nama kosong (Tanpa Alert)
        if (!inputName) { 
            playBtn.innerText = "Ketik Nama Dulu!";
            setTimeout(() => { playBtn.innerText = "Main Sekarang 🚀"; }, 2000);
            return; 
        }
        
        playBtn.innerText = "Memuat Game..."; 
        playerName = inputName;
        // Bersihkan simbol yang bikin error Firebase
        playerId = "user_" + playerName.replace(/[\.\#\$\[\]\/]/g, ""); 
        playerGender = document.getElementById('gender-select').value;
        
        // Cek Database dengan Proteksi Anti-Lag (.catch)
        usersRef.child(playerId).once('value').then(snap => {
            if(snap.exists()) {
                playerGender = snap.val().gender || playerGender; // Pakai gender lama
            } else {
                usersRef.child(playerId).set({ gender: playerGender });
            }
            masukGame();
        }).catch((err) => {
            console.error("Firebase Delay, Paksa Masuk!");
            masukGame(); // Tetap masuk meskipun internet lag
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
    
    playersRef.child(playerId).set({ name: playerName, gender: playerGender, x:0, y:0, z:0, rY:0, isMoving:false });
    playersRef.child(playerId).onDisconnect().remove();
    window.addEventListener("beforeunload", () => playersRef.child(playerId).remove());

    const joystickZone = document.getElementById('joystick-zone');
    if(joystickZone && typeof nipplejs !== 'undefined') {
        manager = nipplejs.create({ zone: joystickZone, mode: 'static', position: { left: '50%', top: '50%' }, color: 'white', size: 100 });
        manager.on('move', (evt, data) => { isJoystickActive = true; joystickForce = Math.min(data.force, 1); joystickAngle = data.angle.radian; });
        manager.on('end', () => { isJoystickActive = false; joystickForce = 0; });
    }
}

// 5. KAMERA & KONTROL LENGKAP
let cameraMode = 'TPP';
function toggleCam() { if(isGameStarted) { cameraMode = cameraMode === 'TPP' ? 'FPP' : 'TPP'; player.visible = cameraMode === 'TPP'; } }
window.addEventListener('keydown', e => { if(e.key.toLowerCase()==='c') toggleCam(); });
document.getElementById('cam-btn')?.addEventListener('click', toggleCam);

function updateNametag(mesh, nameText, id, isSelf = false) {
    const container = document.getElementById('nametags-container'); if(!container) return;
    let div = document.getElementById('tag_' + id);
    if (!div) { div = document.createElement('div'); div.id = 'tag_' + id; div.className = 'nametag'; div.innerText = nameText; container.appendChild(div); }
    if (isSelf && cameraMode === 'FPP') { div.style.display = 'none'; return; }

    const vector = new THREE.Vector3(); mesh.getWorldPosition(vector); vector.y += 2.5; vector.project(camera); 
    if (vector.z < 1 && vector.z > -1) { div.style.display = 'block'; div.style.left = (vector.x * 0.5 + 0.5) * window.innerWidth + 'px'; div.style.top = (vector.y * -0.5 + 0.5) * window.innerHeight + 'px'; } else { div.style.display = 'none'; }
}

playersRef.on('value', snap => {
    if(!isGameStarted) return;
    const data = snap.val();
    for (let id in data) {
        if (id === playerId || data[id].x === undefined) continue; 
        if (!otherPlayers[id]) {
            const mesh = createAvatarModel(data[id].gender || "male"); scene.add(mesh); otherPlayers[id] = mesh;
        }
        otherPlayers[id].position.set(data[id].x, data[id].y, data[id].z);
        if(data[id].rY !== undefined) otherPlayers[id].rotation.y = data[id].rY;
        otherPlayers[id].userData.isMoving = data[id].isMoving;
        otherPlayers[id].userData.name = data[id].name;
    }
    for (let id in otherPlayers) {
        if (!data || !data[id]) { scene.remove(otherPlayers[id]); delete otherPlayers[id]; const tag = document.getElementById('tag_' + id); if(tag) tag.remove(); }
    }
});

let lookAngle = 0, lookPitch = 0.2, isDragging = false, prevX = 0, prevY = 0;
const gc = document.getElementById('game-container');
gc.addEventListener('mousedown', e => { isDragging = true; prevX = e.clientX; prevY = e.clientY; }); window.addEventListener('mouseup', () => isDragging = false);
window.addEventListener('mousemove', e => {
    if(isDragging && isGameStarted) { lookAngle -= (e.clientX - prevX)*0.005; lookPitch += (e.clientY - prevY)*0.005; lookPitch = Math.max(-1.4, Math.min(1.4, lookPitch)); prevX = e.clientX; prevY = e.clientY; }
});
gc.addEventListener('touchstart', e => { if(e.touches[0].target === renderer.domElement){ isDragging=true; prevX=e.touches[0].clientX; prevY=e.touches[0].clientY; }}); window.addEventListener('touchend', () => isDragging=false);
window.addEventListener('touchmove', e => {
    if(isDragging && isGameStarted) { lookAngle -= (e.touches[0].clientX - prevX)*0.005; lookPitch += (e.touches[0].clientY - prevY)*0.005; lookPitch = Math.max(-1.4, Math.min(1.4, lookPitch)); prevX=e.touches[0].clientX; prevY=e.touches[0].clientY; }
});

const keys = {}; window.addEventListener('keydown', e => keys[e.key.toLowerCase()] = true); window.addEventListener('keyup', e => keys[e.key.toLowerCase()] = false);

const speed = 0.15; let wasMoving = false, joystickAngle = 0, joystickForce = 0, isJoystickActive = false, velocityY = 0, gravity = -0.015, jumpStrength = 0.3, floorHeight = 0, isGrounded = true;
function triggerJump() { if (isGrounded && isGameStarted) { velocityY = jumpStrength; isGrounded = false; } }
window.addEventListener('keydown', e => { if(e.key === ' ') triggerJump(); });
document.getElementById('jump-btn')?.addEventListener('touchstart', e => { e.preventDefault(); triggerJump(); });
document.getElementById('jump-btn')?.addEventListener('mousedown', e => { e.preventDefault(); triggerJump(); });

function handleMovement() {
    if(!isGameStarted) return;
    let lDx=0, lDz=0;
    if(keys['w']||keys['arrowup']) lDz-=1; if(keys['s']||keys['arrowdown']) lDz+=1; if(keys['a']||keys['arrowleft']) lDx-=1; if(keys['d']||keys['arrowright']) lDx+=1;
    
    let isMoving = false, worldAngle = 0, dx = 0, dz = 0;
    if (isJoystickActive) { worldAngle = lookAngle + (joystickAngle - Math.PI / 2); dx = -Math.sin(worldAngle)*joystickForce; dz = -Math.cos(worldAngle)*joystickForce; isMoving = true; } 
    else if (lDx!==0 || lDz!==0) { worldAngle = lookAngle + Math.atan2(-lDx, -lDz); dx = -Math.sin(worldAngle); dz = -Math.cos(worldAngle); isMoving = true; }

    if (isMoving) { player.position.x += dx * speed; player.position.z += dz * speed; if (cameraMode === 'TPP') player.rotation.y = worldAngle; } 
    if (cameraMode === 'FPP') player.rotation.y = lookAngle;

    // GRAVITASI LOMPATAN
    if (!isGrounded || player.position.y > floorHeight) {
        velocityY += gravity; player.position.y += velocityY;
        const distToTramp = Math.hypot(player.position.x - trampoline.position.x, player.position.z - trampoline.position.z);
        if (distToTramp < 3 && player.position.y <= 0.75 && velocityY < 0) { velocityY = 0.55; isGrounded = false; } 
        else if (player.position.y <= floorHeight) { player.position.y = floorHeight; velocityY = 0; isGrounded = true; }
    }

    if(cameraMode==='TPP') {
        camera.position.set(player.position.x + Math.sin(lookAngle)*Math.cos(lookPitch)*10, Math.max(0.5, player.position.y + 1.5 + Math.sin(lookPitch)*10), player.position.z + Math.cos(lookAngle)*Math.cos(lookPitch)*10);
        camera.lookAt(player.position.x, player.position.y+1.5, player.position.z);
    } else {
        camera.position.set(player.position.x, player.position.y+1.6, player.position.z);
        camera.lookAt(player.position.x - Math.sin(lookAngle)*Math.cos(lookPitch)*5, camera.position.y - Math.sin(lookPitch)*5, player.position.z - Math.cos(lookAngle)*Math.cos(lookPitch)*5);
    }
    playersRef.child(playerId).set({ name: playerName, gender: playerGender, x:player.position.x, y:player.position.y, z:player.position.z, rY:player.rotation.y, isMoving: isMoving });
    wasMoving = isMoving;
}

function anim(m, mv) {
    if(!m || !m.userData) return;
    if(mv) { const t = Date.now()*0.015; m.userData.leftLeg.rotation.x = Math.sin(t)*0.8; m.userData.rightLeg.rotation.x = Math.sin(t+Math.PI)*0.8; m.userData.leftArm.rotation.x = Math.sin(t+Math.PI)*0.8; m.userData.rightArm.rotation.x = Math.sin(t)*0.8; } 
    else { m.userData.leftLeg.rotation.x = 0; m.userData.rightLeg.rotation.x = 0; m.userData.leftArm.rotation.x = 0; m.userData.rightArm.rotation.x = 0; }
}

let gameTime = 0;
function animate() {
    requestAnimationFrame(animate);
    gameTime += 0.001; const sunIntensity = Math.sin(gameTime); 
    scene.background = new THREE.Color().setHSL(0.55, 0.5, Math.max(0.05, (sunIntensity+1)/2*0.6+0.1)); scene.fog.color = scene.background;
    dirLight.intensity = Math.max(0, sunIntensity*0.8); ambientLight.intensity = Math.max(0.1, sunIntensity*0.4+0.1);

    if(isGameStarted) {
        handleMovement(); const isNight = sunIntensity < 0.2; player.userData.flashlight.intensity = isNight ? 1 : 0;
        anim(player, wasMoving); updateNametag(player, playerName + " (Kamu)", playerId, true); 
        for(let id in otherPlayers) { if(otherPlayers[id].userData.flashlight) otherPlayers[id].userData.flashlight.intensity = isNight ? 1 : 0; anim(otherPlayers[id], otherPlayers[id].userData.isMoving); updateNametag(otherPlayers[id], otherPlayers[id].userData.name, id, false); }
    } else { camera.position.set(Math.sin(Date.now()*0.0005)*20, 10, Math.cos(Date.now()*0.0005)*20); camera.lookAt(0,2,0); }
    renderer.render(scene, camera);
}
animate();

const ci = document.getElementById('chat-input'), cb = document.getElementById('chat-box');
ci?.addEventListener('keypress', e => { if(e.key==='Enter'&&ci.value){ chatRef.push({name:playerName, message:ci.value}); ci.value=""; }});
chatRef.on('child_added', s => { if(cb){ cb.innerHTML += `<div><strong style="color: #333;">${s.val().name}:</strong> ${s.val().message}</div>`; cb.scrollTop = cb.scrollHeight; }});
window.addEventListener('resize', () => { renderer.setSize(window.innerWidth, window.innerHeight); camera.aspect = window.innerWidth/window.innerHeight; camera.updateProjectionMatrix(); });
