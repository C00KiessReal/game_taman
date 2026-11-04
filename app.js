// 1. KONFIGURASI FIREBASE
const firebaseConfig = {
  apiKey: "AIzaSyAgrAl1_FGvOvo8xAJOqdrqVH9F1HCDiWw",
  authDomain: "project-game-636ff.firebaseapp.com",
  // Tambahkan baris databaseURL ini:
  databaseURL: "https://project-game-636ff-default-rtdb.asia-southeast1.firebasedatabase.app", 
  projectId: "project-game-636ff",
  storageBucket: "project-game-636ff.firebasestorage.app",
  messagingSenderId: "1036449209834",
  appId: "1:1036449209834:web:284c003a3ef15e7e8b6693"
};

// Inisialisasi Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// Lanjut ke kode ID Unik untuk pemain saat ini...
const playerId = 'player_' + Math.floor(Math.random() * 10000);
// ... (biarkan sisa kode di bawahnya tetap sama)
