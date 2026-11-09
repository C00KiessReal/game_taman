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
    mouth.position.set(0, -0.1, -0.33); headGroup.add(mouth);

    // RAMBUT SESUAI REFERENSI
    if (isMale) {
        // Rambut Spiky Killua
        const hairBase = new THREE.Mesh(new THREE.SphereGeometry(0.37, 16, 16), hairMat);
        hairBase.position.y = 0.05; headGroup.add(hairBase);
        
        // Duri-duri rambut
        for(let i=0; i<15; i++) {
            const spike = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.3, 4), hairMat);
            spike.position.set((Math.random()-0.5)*0.5, 0.2+(Math.random()*0.2), (Math.random()-0.5)*0.5);
            spike.lookAt(0, 0, 0); spike.rotation.x -= Math.PI;
            headGroup.add(spike);
        }
    } else {
        // Rambut Bob Perempuan + Pita Merah Besar
        const hairBase = new THREE.Mesh(new THREE.SphereGeometry(0.38, 32, 32, 0, Math.PI*2, 0, Math.PI/1.5), hairMat);
        hairBase.position.y = 0.05; headGroup.add(hairBase);
        
        const ribbonMat = new THREE.MeshLambertMaterial({color: 0xcc1111});
        const ribbonCenter = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.1), ribbonMat);
        ribbonCenter.position.set(0, 0.38, 0); headGroup.add(ribbonCenter);
        const lBow = new THREE.Mesh(new THREE.ConeGeometry(0.15, 0.2, 4), ribbonMat);
        lBow.position.set(-0.15, 0.38, 0); lBow.rotation.z = Math.PI/2; headGroup.add(lBow);
        const rBow = new THREE.Mesh(new THREE.ConeGeometry(0.15, 0.2, 4), ribbonMat);
        rBow.position.set(0.15, 0.38, 0); rBow.rotation.z = -Math.PI/2; headGroup.add(rBow);
    }
    group.add(headGroup);

    // BADAN (TORSO)
    const torsoGeo = isMale ? new THREE.BoxGeometry(0.5, 0.6, 0.3) : new THREE.BoxGeometry(0.45, 0.55, 0.28);
    const torso = new THREE.Mesh(torsoGeo, shirtMat);
    torso.position.y = 1.05; torso.castShadow = true; group.add(torso);

    // Rok untuk perempuan
    if (!isMale) {
        const skirt = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.35, 0.25, 16), pantsMat);
        skirt.position.y = 0.75; skirt.castShadow = true; group.add(skirt);
    }

    // RANSEL (BACKPACK)
    const bag = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.4, 0.2), bagMat);
    bag.position.set(0, 1.1, 0.25); bag.castShadow = true; group.add(bag);
    const bagPocket = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.2, 0.1), bagMat);
    bagPocket.position.set(0, 1.05, 0.35); group.add(bagPocket);

    // TANGAN & KAKI
    const armPivotY = 1.3;
    const lArmPivot = new THREE.Group(); lArmPivot.position.set(isMale ? -0.35 : -0.3, armPivotY, 0);
    const lArm = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.5, 0.15), skinMat); lArm.position.y = -0.25;
    const lSleeve = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.25, 0.17), shirtMat); lSleeve.position.y = -0.1;
    lArmPivot.add(lArm, lSleeve); group.add(lArmPivot);

    const rArmPivot = new THREE.Group(); rArmPivot.position.set(isMale ? 0.35 : 0.3, armPivotY, 0);
    const rArm = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.5, 0.15), skinMat); rArm.position.y = -0.25;
    const rSleeve = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.25, 0.17), shirtMat); rSleeve.position.y = -0.1;
    rArmPivot.add(rArm, rSleeve); group.add(rArmPivot);

    // Kaki & Sepatu
    const legGeo = new THREE.BoxGeometry(0.18, 0.5, 0.18);
    const shoeGeo = isMale ? new THREE.BoxGeometry(0.25, 0.2, 0.35) : new THREE.BoxGeometry(0.2, 0.15, 0.25);
    
    const lLegPivot = new THREE.Group(); lLegPivot.position.set(-0.15, 0.75, 0);
    const lLeg = new THREE.Mesh(legGeo, isMale ? pantsMat : skinMat); lLeg.position.y = -0.25;
    const lShoe = new THREE.Mesh(shoeGeo, shoeMat); lShoe.position.set(0, isMale ? -0.5 : -0.55, 0.05);
    if(!isMale){ // Kaos kaki putih perempuan
        const sock = new THREE.Mesh(new THREE.BoxGeometry(0.19, 0.3, 0.19), whiteMat);
        sock.position.y = -0.35; lLegPivot.add(sock);
    } else { // Celana pendek laki-laki
        const short = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.3, 0.2), pantsMat);
        short.position.y = -0.15; lLegPivot.add(short);
    }
    lLegPivot.add(lLeg, lShoe); group.add(lLegPivot);

    const rLegPivot = new THREE.Group(); rLegPivot.position.set(0.15, 0.75, 0);
    const rLeg = new THREE.Mesh(legGeo, isMale ? pantsMat : skinMat); rLeg.position.y = -0.25;
    const rShoe = new THREE.Mesh(shoeGeo, shoeMat); rShoe.position.set(0, isMale ? -0.5 : -0.55, 0.05);
    if(!isMale){ 
        const sock = new THREE.Mesh(new THREE.BoxGeometry(0.19, 0.3, 0.19), whiteMat);
        sock.position.y = -0.35; rLegPivot.add(sock);
    } else {
        const short = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.3, 0.2), pantsMat);
        short.position.y = -0.15; rLegPivot.add(short);
    }
    rLegPivot.add(rLeg, rShoe); group.add(rLegPivot);

    group.scale.setScalar(config.bodyScale || 1);
    group.userData = { leftArm: lArmPivot, rightArm: rArmPivot, leftLeg: lLegPivot, rightLeg: rLegPivot, isMoving: false, head: headGroup };
    return group;
}

let player; 
const otherPlayers = {};

// 4. LOGIN & DATABASE
document.getElementById('play-btn')?.addEventListener('click', () => {
    const inputName = document.getElementById('username-input').value.trim();
    if (!inputName) return alert("Ketik Username dulu!");
    
    playerName = inputName;
    playerId = "user_" + playerName.replace(/[\.\#\$\[\]\/]/g, ""); 
    document.getElementById('play-btn').innerText = "Memuat...";

    myAvatarConfig = {
        gender: document.getElementById('gender-select').value,
        skin: document.getElementById('skin-input').value,
        hairColor: document.getElementById('hair-color-input').value,
        bodyScale: parseFloat(document.getElementById('body-scale-input').value),
        shirt: document.getElementById('shirt-input').value,
        pants: document.getElementById('pants-input').value,
        shoes: document.getElementById('shoes-input').value
    };

    usersRef.child(playerId).once('value').then(snap => {
        if(snap.exists()) myAvatarConfig = snap.val();
        else usersRef.child(playerId).set(myAvatarConfig);
        masukGame();
    }).catch(() => masukGame());
});

function masukGame() {
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('game-ui').style.display = 'block';
    isGameStarted = true;
    player = createAvatarModel(myAvatarConfig); scene.add(player);
    camera.position.set(0, 5, 10);
    
    playersRef.child(playerId).set({ name: playerName, x:0, y:0, z:0, rY:0, isMoving:false, config: myAvatarConfig });
    playersRef.child(playerId).onDisconnect().remove();
    window.addEventListener("beforeunload", () => playersRef.child(playerId).remove());
}

let cameraMode = 'TPP';
function toggleCam() {
    if(!isGameStarted) return;
    cameraMode = cameraMode === 'TPP' ? 'FPP' : 'TPP';
    player.visible = cameraMode === 'TPP';
}
window.addEventListener('keydown', e => { if(e.key.toLowerCase()==='c') toggleCam(); });
document.getElementById('cam-btn')?.addEventListener('click', toggleCam);

// 5. KONTROL & MULTIPLAYER
playersRef.on('value', snap => {
    if(!isGameStarted) return;
    const data = snap.val();
    for (let id in data) {
        if (id === playerId || data[id].x === undefined) continue; 
        if (!otherPlayers[id]) {
            const mesh = createAvatarModel(data[id].config || myAvatarConfig); scene.add(mesh); otherPlayers[id] = mesh;
        }
        otherPlayers[id].position.set(data[id].x, data[id].y, data[id].z);
        if(data[id].rY !== undefined) otherPlayers[id].rotation.y = data[id].rY;
        otherPlayers[id].userData.isMoving = data[id].isMoving;
    }
    for (let id in otherPlayers) {
        if (!data || !data[id]) { scene.remove(otherPlayers[id]); delete otherPlayers[id]; }
    }
});

const keys = {}; window.addEventListener('keydown', e => keys[e.key.toLowerCase()] = true); window.addEventListener('keyup', e => keys[e.key.toLowerCase()] = false);

let lookAngle = 0, lookPitch = 0.2, isDragging = false, prevX = 0, prevY = 0;
const gc = document.getElementById('game-container');
gc.addEventListener('mousedown', e => { isDragging = true; prevX = e.clientX; prevY = e.clientY; });
window.addEventListener('mouseup', () => isDragging = false);
window.addEventListener('mousemove', e => {
    if(isDragging && isGameStarted) {
        lookAngle -= (e.clientX - prevX)*0.005; lookPitch += (e.clientY - prevY)*0.005;
        lookPitch = Math.max(-1.4, Math.min(1.4, lookPitch)); prevX = e.clientX; prevY = e.clientY;
    }
});
gc.addEventListener('touchstart', e => { if(e.touches[0].target === renderer.domElement){ isDragging=true; prevX=e.touches[0].clientX; prevY=e.touches[0].clientY; }});
window.addEventListener('touchend', () => isDragging=false);
window.addEventListener('touchmove', e => {
    if(isDragging && isGameStarted) {
        lookAngle -= (e.touches[0].clientX - prevX)*0.005; lookPitch += (e.touches[0].clientY - prevY)*0.005;
        lookPitch = Math.max(-1.4, Math.min(1.4, lookPitch)); prevX=e.touches[0].clientX; prevY=e.touches[0].clientY;
    }
});

function anim(m, mv) {
    if(!m) return;
    if(mv) {
        const t = Date.now()*0.015;
        m.userData.leftLeg.rotation.x = Math.sin(t)*0.8; m.userData.rightLeg.rotation.x = Math.sin(t+Math.PI)*0.8;
        m.userData.leftArm.rotation.x = Math.sin(t+Math.PI)*0.8; m.userData.rightArm.rotation.x = Math.sin(t)*0.8;
    } else {
        m.userData.leftLeg.rotation.x = 0; m.userData.rightLeg.rotation.x = 0; m.userData.leftArm.rotation.x = 0; m.userData.rightArm.rotation.x = 0;
    }
}

function handleMovement() {
    if(!isGameStarted) return;
    let lDx=0, lDz=0;
    if(keys['w']) lDz-=1; if(keys['s']) lDz+=1; if(keys['a']) lDx-=1; if(keys['d']) lDx+=1;
    let mv = false;
    if(lDx!==0 || lDz!==0) {
        const a = lookAngle + Math.atan2(-lDx, -lDz);
        player.position.x += -Math.sin(a)*0.15; player.position.z += -Math.cos(a)*0.15;
        if(cameraMode==='TPP') player.rotation.y = a;
        mv = true;
    }
    if(cameraMode==='FPP') player.rotation.y = lookAngle;

    if(cameraMode==='TPP') {
        camera.position.set(player.position.x + Math.sin(lookAngle)*Math.cos(lookPitch)*10, Math.max(0.5, player.position.y + 1.5 + Math.sin(lookPitch)*10), player.position.z + Math.cos(lookAngle)*Math.cos(lookPitch)*10);
        camera.lookAt(player.position.x, player.position.y+1.5, player.position.z);
    } else {
        camera.position.set(player.position.x, player.position.y+1.6, player.position.z);
        camera.lookAt(player.position.x - Math.sin(lookAngle)*Math.cos(lookPitch)*5, camera.position.y - Math.sin(lookPitch)*5, player.position.z - Math.cos(lookAngle)*Math.cos(lookPitch)*5);
    }
    playersRef.child(playerId).update({ x:player.position.x, y:player.position.y, z:player.position.z, rY:player.rotation.y, isMoving:mv });
    anim(player, mv);
}

// 6. LOOP UTAMA
function animate() {
    requestAnimationFrame(animate);
    if(isGameStarted) {
        handleMovement();
        for(let id in otherPlayers) anim(otherPlayers[id], otherPlayers[id].userData.isMoving);
    } else {
        camera.position.set(Math.sin(Date.now()*0.0005)*20, 10, Math.cos(Date.now()*0.0005)*20); camera.lookAt(0,2,0);
    }
    renderer.render(scene, camera);
}
animate();

const ci = document.getElementById('chat-input'), cb = document.getElementById('chat-box');
ci?.addEventListener('keypress', e => { if(e.key==='Enter'&&ci.value){ chatRef.push({name:playerName, message:ci.value}); ci.value=""; }});
chatRef.on('child_added', s => { if(cb){ cb.innerHTML += `<div><strong>${s.val().name}:</strong> ${s.val().message}</div>`; cb.scrollTop = cb.scrollHeight; }});
window.addEventListener('resize', () => { renderer.setSize(window.innerWidth, window.innerHeight); camera.aspect = window.innerWidth/window.innerHeight; camera.updateProjectionMatrix(); });
