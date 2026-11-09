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
        otherPlayers[id].userData.isJumping = data[id].isJumping; // Sync status lompat pemain lain
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
    
    // Update data ke Firebase (termasuk isJumping)
    playersRef.child(playerId).set({ 
        name: playerName, gender: playerGender, 
        x: player.position.x, y: player.position.y, z: player.position.z, 
        rY: player.rotation.y, 
        isMoving: isMoving,
        isJumping: !isGrounded
    });
    
    wasMoving = isMoving;
}

// 6. SISTEM ANIMASI GLTF
function updateAnimations(mesh, isMoving, isJumping, delta) {
    if (!mesh || !mesh.userData.mixer) return;
    
    mesh.userData.mixer.update(delta);

    const anims = mesh.userData.animations;
    if (!anims) return;

    let targetAnim = 'idle';
    if (isJumping) {
        targetAnim = 'jump';
    } else if (isMoving) {
        targetAnim = 'walk'; // Ganti jadi 'sprint' kalau ada tombol lari
    }

    const nextAction = anims[targetAnim];
    const currentAction = mesh.userData.currentAction;

    // Lakukan transisi silang (crossfade) agar perubahan gerak halus
    if (nextAction && currentAction !== nextAction) {
        nextAction.reset().fadeIn(0.2).play();
        if (currentAction) currentAction.fadeOut(0.2);
        mesh.userData.currentAction = nextAction;
    }
}

// 7. GAME LOOP UTAMA
const clock = new THREE.Clock();
let gameTime = 0;

function animate() {
    requestAnimationFrame(animate);
    
    const delta = clock.getDelta();
    gameTime += 0.001; 
    
    // Siklus Siang Malam
    const sunIntensity = Math.sin(gameTime); 
    scene.background = new THREE.Color().setHSL(0.55, 0.5, Math.max(0.05, (sunIntensity+1)/2*0.6+0.1)); scene.fog.color = scene.background;
    dirLight.intensity = Math.max(0, sunIntensity*0.8); ambientLight.intensity = Math.max(0.1, sunIntensity*0.4+0.1);

    if(isGameStarted) {
        handleMovement(); 
        const isNight = sunIntensity < 0.2; 
        
        // Update Animasi, Senter, & Nametag (Pemain Lokal)
        if (player.userData.flashlight) player.userData.flashlight.intensity = isNight ? 1 : 0;
        updateAnimations(player, wasMoving, !isGrounded, delta); 
        updateNametag(player, playerName + " (Kamu)", playerId, true); 
        
        // Update Animasi, Senter, & Nametag (Pemain Lain via Firebase)
        for(let id in otherPlayers) { 
            const p = otherPlayers[id];
            if(p.userData.flashlight) p.userData.flashlight.intensity = isNight ? 1 : 0; 
            updateAnimations(p, p.userData.isMoving, p.userData.isJumping, delta); 
            updateNametag(p, p.userData.name, id, false); 
        }
    } else { 
        // Kamera muter saat di layar login
        camera.position.set(Math.sin(Date.now()*0.0005)*20, 10, Math.cos(Date.now()*0.0005)*20); camera.lookAt(0,2,0); 
    }
    
    renderer.render(scene, camera);
}
animate();

// 8. CHAT SYSTEM & RESIZE
const ci = document.getElementById('chat-input'), cb = document.getElementById('chat-box');
ci?.addEventListener('keypress', e => { if(e.key==='Enter'&&ci.value){ chatRef.push({name:playerName, message:ci.value}); ci.value=""; }});
chatRef.on('child_added', s => { if(cb){ cb.innerHTML += `<div><strong style="color: #333;">${s.val().name}:</strong> ${s.val().message}</div>`; cb.scrollTop = cb.scrollHeight; }});
window.addEventListener('resize', () => { renderer.setSize(window.innerWidth, window.innerHeight); camera.aspect = window.innerWidth/window.innerHeight; camera.updateProjectionMatrix(); });
