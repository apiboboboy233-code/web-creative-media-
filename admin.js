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

// Inisialisasi Firebase
const app = firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore(); // Inisialisasi Firestore

// ==============================================
// 2. KONFIGURASI CLOUDINARY (Milikmu)
// ==============================================
const CLOUD_NAME = "djpqexgfn";
const UPLOAD_PRESET = "Creative_Media"; 
const CLOUDINARY_URL = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;
// ==============================================


// Ambil elemen HTML
const adminEmailDisplay = document.getElementById('admin-email-display');
const logoutButton = document.getElementById('logout-button');

// ==============================================
// 3. PENJAGA AUTENTIKASI (AUTH GUARD)
// ==============================================
auth.onAuthStateChanged((user) => {
    if (user) {
        // --- PENGGUNA SUDAH LOGIN ---
        adminEmailDisplay.textContent = user.email;

        // Aktifkan SEMUA listener setelah login
        setupGalleryUploadListener(); 
        setupProfileUploadListener(); 
        setupKegiatanUploadListener();
        setupAbsensiResetListener(); 

        // Langsung muat daftar data
        muatDaftarProfilAdmin(); 
        muatDaftarKegiatanAdmin();
        muatDaftarKontakMasuk(); 
        muatDaftarGaleriAdmin(); // (BARU!) Panggil fungsi muat galeri

    } else {
        // --- PENGGUNA TIDAK LOGIN ---
        console.warn("Akses ditolak! Pengguna tidak login.");
        alert("Anda harus login untuk mengakses halaman ini.");
        window.location.href = 'login.html';
    }
});

// ==============================================
// 4. FUNGSI LOGOUT
// (Kode ini tidak berubah)
// ==============================================
logoutButton.addEventListener('click', () => {
    auth.signOut()
        .then(() => {
            alert("Anda berhasil logout.");
            window.location.href = 'login.html';
        })
        .catch((error) => {
            console.error("Error saat logout:", error);
            alert("Terjadi error saat mencoba logout.");
        });
});

// ==============================================
// 5. LOGIKA UPLOAD GALERI 
// (Ada sedikit tambahan)
// ==============================================
function setupGalleryUploadListener() {
    const uploadForm = document.getElementById('upload-form');
    if (!uploadForm) return; 

    const uploadButton = document.getElementById('upload-button');
    const uploadStatus = document.getElementById('upload-status');
    
    const judulInput = document.getElementById('karya-judul');
    const pembuatInput = document.getElementById('karya-pembuat');
    const fileInput = document.getElementById('karya-file');

    uploadForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const file = fileInput.files[0];
        const judul = judulInput.value;
        const pembuat = pembuatInput.value;

        if (!file || !judul || !pembuat) {
            alert("Semua field galeri harus diisi!");
            return;
        }

        uploadStatus.style.display = 'block';
        uploadStatus.textContent = "Status: Mengupload gambar ke Cloudinary...";
        uploadButton.disabled = true;

        try {
            const imageUrl = await uploadKeCloudinary(file);
            uploadStatus.textContent = "Status: Menyimpan data ke Firestore...";

            await db.collection('karya').add({
                judul: judul,
                pembuat: pembuat,
                urlGambar: imageUrl,
                dibuatPada: firebase.firestore.FieldValue.serverTimestamp()
            });

            uploadStatus.textContent = "Status: Berhasil diupload!";
            alert("Karya baru berhasil ditambahkan!");
            uploadForm.reset();
            muatDaftarGaleriAdmin(); // (BARU!) Refresh daftar galeri

        } catch (error) {
            console.error("Error saat upload galeri:", error);
            alert("Terjadi kesalahan: " + error.message);
            uploadStatus.textContent = `Status: Gagal! (${error.message})`;
        } finally {
            uploadButton.disabled = false;
            setTimeout(() => { uploadStatus.style.display = 'none'; }, 3000);
        }
    });
}


// ==============================================
// 6. LOGIKA UPLOAD PROFIL 
// (Kode ini tidak berubah)
// ==============================================
function setupProfileUploadListener() {
    const uploadForm = document.getElementById('profil-upload-form');
    if (!uploadForm) return; 

    const uploadButton = document.getElementById('profil-upload-button');
    const uploadStatus = document.getElementById('profil-upload-status');
    
    const namaInput = document.getElementById('profil-nama');
    const kelasInput = document.getElementById('profil-kelas');
    const jabatanInput = document.getElementById('profil-jabatan');
    const keahlianInput = document.getElementById('profil-keahlian');
    const fileInput = document.getElementById('profil-file');

    uploadForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const file = fileInput.files[0];
        const nama = namaInput.value;
        const kelas = kelasInput.value;
        const jabatan = jabatanInput.value;
        const keahlian = keahlianInput.value;

        if (!file || !nama || !kelas || !jabatan || !keahlian) {
            alert("Semua field profil harus diisi!");
            return;
        }

        uploadStatus.style.display = 'block';
        uploadStatus.textContent = "Status: Mengupload foto profil ke Cloudinary...";
        uploadButton.disabled = true;

        try {
            const imageUrl = await uploadKeCloudinary(file); // Pakai fungsi helper
            uploadStatus.textContent = "Status: Menyimpan data profil ke Firestore...";

            await db.collection('profil').add({
                nama: nama,
                kelas: kelas,
                jabatan: jabatan,
                keahlian: keahlian,
                urlFoto: imageUrl,
                dibuatPada: firebase.firestore.FieldValue.serverTimestamp()
            });

            uploadStatus.textContent = "Status: Anggota baru berhasil ditambah!";
            alert("Anggota baru berhasil ditambahkan!");
            uploadForm.reset();
            muatDaftarProfilAdmin(); // Refresh daftar

        } catch (error) {
            console.error("Error saat upload profil:", error);
            alert("Terjadi kesalahan: " + error.message);
            uploadStatus.textContent = `Status: Gagal! (${error.message})`;
        } finally {
            uploadButton.disabled = false;
            setTimeout(() => { uploadStatus.style.display = 'none'; }, 3000);
        }
    });
}

// ==============================================
// 7. LOGIKA UPLOAD KEGIATAN
// (Kode ini tidak berubah)
// ==============================================
function setupKegiatanUploadListener() {
    const uploadForm = document.getElementById('kegiatan-upload-form');
    if (!uploadForm) return; // Cek jika form-nya ada

    const uploadButton = document.getElementById('kegiatan-upload-button');
    const uploadStatus = document.getElementById('kegiatan-upload-status');
    
    // Elemen Form
    const judulInput = document.getElementById('kegiatan-judul');
    const kategoriInput = document.getElementById('kegiatan-kategori');
    const deskripsiInput = document.getElementById('kegiatan-deskripsi');
    const fileInput = document.getElementById('kegiatan-file');

    uploadForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const file = fileInput.files[0];
        const judul = judulInput.value;
        const kategori = kategoriInput.value;
        const deskripsi = deskripsiInput.value;

        if (!file || !judul || !kategori || !deskripsi) {
            alert("Semua field kegiatan harus diisi!");
            return;
        }

        uploadStatus.style.display = 'block';
        uploadStatus.textContent = "Status: Mengupload gambar kegiatan ke Cloudinary...";
        uploadButton.disabled = true;

        try {
            const imageUrl = await uploadKeCloudinary(file); // Pakai fungsi helper
            uploadStatus.textContent = "Status: Menyimpan data kegiatan ke Firestore...";

            // Simpan ke koleksi 'kegiatan'
            await db.collection('kegiatan').add({
                judul: judul,
                kategori: kategori,
                deskripsi: deskripsi,
                urlGambar: imageUrl,
                dibuatPada: firebase.firestore.FieldValue.serverTimestamp()
            });

            uploadStatus.textContent = "Status: Kegiatan baru berhasil diposting!";
            alert("Kegiatan baru berhasil diposting!");
            uploadForm.reset();
            muatDaftarKegiatanAdmin(); // Refresh daftar

        } catch (error) {
            console.error("Error saat upload kegiatan:", error);
            alert("Terjadi kesalahan: " + error.message);
            uploadStatus.textContent = `Status: Gagal! (${error.message})`;
        } finally {
            uploadButton.disabled = false;
            setTimeout(() => { uploadStatus.style.display = 'none'; }, 3000);
        }
    });
}


// ==============================================
// 8. FUNGSI HELPER UPLOAD CLOUDINARY
// (Kode ini tidak berubah)
// ==============================================
async function uploadKeCloudinary(file) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', UPLOAD_PRESET);

    const response = await fetch(CLOUDINARY_URL, {
        method: 'POST',
        body: formData
    });
    const data = await response.json();
    
    if (!data.secure_url) {
        throw new Error(data.error.message || 'Gagal upload ke Cloudinary');
    }
    return data.secure_url;
}


// ==============================================
// 9. FUNGSI MEMUAT & HAPUS PROFIL 
// (Kode ini tidak berubah)
// ==============================================
async function muatDaftarProfilAdmin() {
    const container = document.getElementById('profil-admin-list-container');
    const loading = document.getElementById('profil-list-loading');
    if (!container || !loading) return;

    loading.style.display = 'block';
    container.innerHTML = ''; 
    container.appendChild(loading); 

    try {
        const snapshot = await db.collection('profil').orderBy('dibuatPada', 'desc').get();

        if (snapshot.empty) {
            loading.textContent = "Belum ada anggota yang ditambahkan.";
            return;
        }

        loading.style.display = 'none'; 

        snapshot.forEach(doc => {
            const profil = doc.data();
            const docId = doc.id;
            const item = document.createElement('div');
            item.className = 'admin-list-item';
            item.innerHTML = `
                <img src="${profil.urlFoto}" alt="${profil.nama}" style="border-radius: 50%;">
                <div class="admin-list-info">
                    <h5>${profil.nama}</h5>
                    <p>${profil.jabatan} | ${profil.kelas}</p>
                </div>
                <button class="btn-hapus" data-id="${docId}" data-collection="profil">Hapus</button>
            `;
            container.appendChild(item);
        });

        // Setup listener hapus
        container.querySelectorAll('.btn-hapus').forEach(button => {
            button.addEventListener('click', (e) => {
                const id = e.target.getAttribute('data-id');
                const collection = e.target.getAttribute('data-collection');
                hapusDokumen(id, collection, muatDaftarProfilAdmin);
            });
        });

    } catch (error) {
        console.error("Error memuat daftar profil:", error);
        loading.textContent = "Gagal memuat daftar. Cek console.";
    }
}

// ==============================================
// 10. FUNGSI MEMUAT & HAPUS KEGIATAN
// (Kode ini tidak berubah)
// ==============================================
async function muatDaftarKegiatanAdmin() {
    const container = document.getElementById('kegiatan-admin-list-container');
    const loading = document.getElementById('kegiatan-list-loading');
    if (!container || !loading) return;

    loading.style.display = 'block';
    container.innerHTML = ''; 
    container.appendChild(loading); 

    try {
        const snapshot = await db.collection('kegiatan').orderBy('dibuatPada', 'desc').get();

        if (snapshot.empty) {
            loading.textContent = "Belum ada kegiatan yang diposting.";
            return;
        }

        loading.style.display = 'none'; 

        snapshot.forEach(doc => {
            const kegiatan = doc.data();
            const docId = doc.id;
            const item = document.createElement('div');
            item.className = 'admin-list-item';
            item.innerHTML = `
                <img src="${kegiatan.urlGambar}" alt="${kegiatan.judul}">
                <div class="admin-list-info">
                    <h5>${kegiatan.judul}</h5>
                    <p>Kategori: ${kegiatan.kategori}</p>
                </div>
                <button class="btn-hapus" data-id="${docId}" data-collection="kegiatan">Hapus</button>
            `;
            container.appendChild(item);
        });

        // Setup listener hapus
        container.querySelectorAll('.btn-hapus').forEach(button => {
            button.addEventListener('click', (e) => {
                const id = e.target.getAttribute('data-id');
                const collection = e.target.getAttribute('data-collection');
                hapusDokumen(id, collection, muatDaftarKegiatanAdmin);
            });
        });

    } catch (error) {
        console.error("Error memuat daftar kegiatan:", error);
        loading.textContent = "Gagal memuat daftar. Cek console.";
    }
}

// ==============================================
// 11. (BARU!) FUNGSI MEMUAT & HAPUS GALERI
// ==============================================
async function muatDaftarGaleriAdmin() {
    const container = document.getElementById('gallery-admin-list-container');
    const loading = document.getElementById('gallery-list-loading');
    if (!container || !loading) return;

    loading.style.display = 'block';
    container.innerHTML = ''; 
    container.appendChild(loading); 

    try {
        // Ambil dari koleksi 'karya'
        const snapshot = await db.collection('karya').orderBy('dibuatPada', 'desc').get();

        if (snapshot.empty) {
            loading.textContent = "Belum ada karya yang diupload.";
            return;
        }

        loading.style.display = 'none'; 

        snapshot.forEach(doc => {
            const karya = doc.data();
            const docId = doc.id;
            const item = document.createElement('div');
            item.className = 'admin-list-item';
            
            // Sesuaikan HTML-nya untuk galeri
            item.innerHTML = `
                <img src="${karya.urlGambar}" alt="${karya.judul}">
                <div class="admin-list-info">
                    <h5>${karya.judul}</h5>
                    <p>Oleh: ${karya.pembuat}</p>
                </div>
                <button class="btn-hapus" data-id="${docId}" data-collection="karya">Hapus</button>
            `;
            container.appendChild(item);
        });

        // Setup listener hapus (pakai fungsi yang sama)
        container.querySelectorAll('.btn-hapus').forEach(button => {
            button.addEventListener('click', (e) => {
                const id = e.target.getAttribute('data-id');
                const collection = e.target.getAttribute('data-collection');
                
                // Panggil hapusDokumen, tapi callback-nya adalah muatDaftarGaleriAdmin
                hapusDokumen(id, collection, muatDaftarGaleriAdmin);
            });
        });

    } catch (error) {
        console.error("Error memuat daftar galeri:", error);
        loading.textContent = "Gagal memuat daftar galeri. Cek console.";
    }
}


// ==============================================
// 12. FUNGSI HELPER HAPUS DOKUMEN
// (Kode ini tidak berubah, hanya pindah nomor)
// ==============================================
async function hapusDokumen(id, collectionName, callbackRefresh) {
    if (!confirm(`Yakin ingin menghapus item ini dari koleksi '${collectionName}'? Data tidak bisa dikembalikan.`)) {
        return;
    }

    try {
        await db.collection(collectionName).doc(id).delete();
        alert("Item berhasil dihapus!");
        callbackRefresh(); 
        
    } catch (error) {
        console.error(`Error menghapus dari ${collectionName}:`, error);
        alert(`Gagal menghapus item. Error: ${error.message}`);
    }
}


// ==============================================
// 13. (BARU!) FUNGSI MEMUAT KONTAK MASUK
// (Kode ini tidak berubah, hanya pindah nomor)
// ==============================================
async function muatDaftarKontakMasuk() {
    const container = document.getElementById('kontak-admin-list-container');
    const loading = document.getElementById('kontak-list-loading');
    if (!container || !loading) return;

    loading.style.display = 'block';
    container.innerHTML = ''; 
    container.appendChild(loading); 

    try {
        // Ambil data dari koleksi 'kontakMasuk', urutkan berdasarkan terbaru
        const snapshot = await db.collection('kontakMasuk')
                                 .orderBy('diterimaPada', 'desc')
                                 .get();

        if (snapshot.empty) {
            loading.textContent = "Belum ada pesan yang masuk.";
            return;
        }

        loading.style.display = 'none'; 

        snapshot.forEach(doc => {
            const pesan = doc.data();
            const docId = doc.id;

            // Format tanggal
            const tanggal = pesan.diterimaPada ? pesan.diterimaPada.toDate().toLocaleDateString('id-ID', {
                day: '2-digit', month: 'short', year: 'numeric',
                hour: '2-digit', minute: '2-digit'
            }) : 'Waktu tidak diketahui';

            const item = document.createElement('div');
            item.className = 'kontak-admin-item';
            item.innerHTML = `
                <div class="kontak-header">
                    <div class="kontak-info">
                        <h5>${pesan.nama}</h5>
                        <p><strong>Kelas:</strong> ${pesan.kelas || '<em>(tidak diisi)</em>'}</p>
                        <p><strong>Telepon:</strong> ${pesan.telepon}</p>
                    </div>
                    <div>
                        <p class="kontak-tanggal">${tanggal} WIB</p>
                    </div>
                </div>
                <p class="kontak-pesan">${pesan.pesan}</p>
                <button class="btn-hapus" data-id="${docId}" data-collection="kontakMasuk" style="margin-top: 1rem;">
                    Hapus Pesan
                </button>
            `;
            container.appendChild(item);
        });

        // Setup listener hapus (PAKAI ULANG FUNGSI YANG SAMA!)
        container.querySelectorAll('.btn-hapus').forEach(button => {
            button.addEventListener('click', (e) => {
                const id = e.target.getAttribute('data-id');
                const collection = e.target.getAttribute('data-collection');
                // Panggil hapusDokumen, tapi callback-nya adalah muatDaftarKontakMasuk
                hapusDokumen(id, collection, muatDaftarKontakMasuk); 
            });
        });

    } catch (error) {
        console.error("Error memuat daftar kontak:", error);
        loading.textContent = "Gagal memuat pesan masuk. Cek console.";
    }
}


// ==============================================
// 14. LOGIKA MANAJEMEN ABSENSI
// (Kode ini tidak berubah, hanya pindah nomor)
// ==============================================

function setupAbsensiResetListener() {
    const resetButton = document.getElementById('reset-absensi-button');
    const resetStatus = document.getElementById('reset-absensi-status');
    if (!resetButton || !resetStatus) return;

    resetButton.addEventListener('click', async () => {
        const konfirmasi1 = confirm(
            "PERINGATAN: Ini akan MENGHAPUS SEMUA rekap absensi.\n\nYakin ingin melanjutkan?"
        );
        if (!konfirmasi1) {
            alert("Aksi dibatalkan.");
            return;
        }
        const konfirmasi2 = prompt(
            "Untuk konfirmasi final, ketik 'RESET' (huruf besar) di bawah ini:"
        );
        if (konfirmasi2 !== "RESET") {
            alert("Aksi dibatalkan. Data absensi aman.");
            return;
        }

        resetStatus.style.display = 'block';
        resetStatus.textContent = 'Status: Sedang mereset data absensi...';
        resetButton.disabled = true;

        try {
            await resetAbsensiFirestore();
            resetStatus.textContent = 'Status: SEMUA data absensi berhasil direset!';
            alert("Rekap absensi berhasil dikosongkan.");

        } catch (error) {
            console.error("Error saat reset absensi:", error);
            resetStatus.textContent = `Status: Gagal! (${error.message})`;
            alert(`Gagal mereset absensi: ${error.message}`);
        } finally {
            resetButton.disabled = false;
            setTimeout(() => { resetStatus.style.display = 'none'; }, 4000);
        }
    });
}

async function resetAbsensiFirestore() {
    const koleksiRef = db.collection('absensi');
    const snapshot = await koleksiRef.get();

    if (snapshot.empty) {
        console.log("Koleksi absensi sudah kosong.");
        return; 
    }
    
    const promises = [];
    snapshot.forEach(doc => {
        promises.push(doc.ref.delete());
    });
    
    await Promise.all(promises);
    console.log(`Berhasil menghapus ${snapshot.size} dokumen absensi.`);
}
