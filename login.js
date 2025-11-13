// File: login.js (Versi yang sudah dirapikan)

// ==============================================
// 1. KONFIGURASI FIREBASE (Milikmu)
// ==============================================
const firebaseConfig = {
  apiKey: "AIzaSyCeT2a4gihJhqL-Pr-DM7iXgMKJq4UMZwQ",
  authDomain: "creativemedia-website.firebaseapp.com",
  projectId: "creativemedia-website",
  storageBucket: "creativemedia-website.firebasestorage.app",
  messagingSenderId: "210473878731",
  appId: "1:210473878731:web:3ee72989ab1030062dc74e"
};
// ==============================================


// Inisialisasi Firebase (Hanya satu kali)
const app = firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();

// Ambil elemen HTML
const loginForm = document.getElementById('login-form');
const emailInput = document.getElementById('admin-email');
const passwordInput = document.getElementById('admin-password');
const errorMessage = document.getElementById('login-error-message');


// Fungsi untuk menangani proses login
loginForm.addEventListener('submit', (e) => {
    e.preventDefault(); // Mencegah form melakukan reload halaman

    const email = emailInput.value;
    const password = passwordInput.value;

    // Lakukan proses Sign In dengan Firebase
    auth.signInWithEmailAndPassword(email, password)
        .then((userCredential) => {
            // LOGIN BERHASIL!
            alert("Login Berhasil! Selamat datang Admin.");
            window.location.href = 'admin.html'; // Arahkan ke admin.html

        })
        .catch((error) => {
            // LOGIN GAGAL!
            errorMessage.style.display = 'block'; // Tampilkan pesan error
            console.error("Kode Error Firebase:", error.code);
            passwordInput.value = ''; 
        });
});
