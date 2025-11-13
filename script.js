// ==============================================
// 1. KONFIGURASI FIREBASE
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
const db = firebase.firestore(); // Inisialisasi Firestore


// Menunggu sampai semua konten HTML selesai dimuat
document.addEventListener('DOMContentLoaded', () => {

    // ==================== NAVIGASI HALAMAN (SPA) ====================
    // (Kode ini tidak berubah, sudah benar)
    const navLinks = document.querySelectorAll('.nav-link');
    const pages = document.querySelectorAll('.page');
    const navMenu = document.querySelector('.nav-menu');
    const navToggle = document.getElementById('nav-toggle');

    function showPage(pageId) {
        pages.forEach(page => page.classList.remove('active'));
        navLinks.forEach(link => link.classList.remove('active'));

        const targetPage = document.getElementById(pageId);
        if (targetPage) targetPage.classList.add('active');

        const activeLink = document.querySelector(`.nav-link[href="#${pageId}"]`);
        if (activeLink) activeLink.classList.add('active');

        navMenu.classList.remove('active');
    }

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault(); 
            const pageId = link.getAttribute('href').substring(1); 
            showPage(pageId);
            window.scrollTo(0, 0);
        });
    });

    navToggle.addEventListener('click', () => {
        navMenu.classList.toggle('active');
    });

    // Cek jika ada hash di URL (misal: creativemedia.com/#profil)
    const initialPage = window.location.hash.substring(1) || 'home';
    showPage(initialPage);


    // ==================== FUNGSI ABSENSI (FIRESTORE) ====================
    // (Kode ini tidak berubah, sudah benar)
    
    // --- Ambil Elemen ---
    const absensiNamaSelect = document.getElementById('absensi-nama');
    const absensiButtonsContainer = document.querySelector('.absensi-buttons');
    const rekapBody = document.getElementById('absensi-rekap-body');
    const rekapLoading = document.getElementById('rekap-loading');

    // --- Cache (Penyimpanan sementara) ---
    let namaSudahAbsenHariIni = [];

    async function muatProfilUntukAbsensi() {
        if (!absensiNamaSelect) return;

        try {
            const snapshot = await db.collection('profil').orderBy('nama', 'asc').get();
            
            if (snapshot.empty) {
                absensiNamaSelect.innerHTML = '<option value="" disabled selected>Belum ada anggota</option>';
                return;
            }

            let optionsHtml = '<option value="" disabled selected>-- Pilih Nama Anggota --</option>';
            snapshot.forEach(doc => {
                const profil = doc.data();
                optionsHtml += `<option value="${profil.nama}">${profil.nama}</option>`;
            });

            absensiNamaSelect.innerHTML = optionsHtml;

        } catch (error) {
            console.error("Error memuat profil untuk absensi:", error);
            absensiNamaSelect.innerHTML = '<option value="" disabled selected>Gagal memuat nama</option>';
        }
    }

    function muatRekapAbsensi() {
        if (!rekapBody || !rekapLoading) return;

        const today = new Date();
        const awalHari = new Date(today.setHours(0, 0, 0, 0));
        const akhirHari = new Date(today.setHours(23, 59, 59, 999));

        db.collection('absensi')
          .where('waktuAbsen', '>=', awalHari)
          .where('waktuAbsen', '<=', akhirHari)
          .orderBy('waktuAbsen', 'asc')
          .onSnapshot(
            (snapshot) => {
                if (snapshot.empty) {
                    rekapLoading.innerHTML = '<td colspan="3" style="text-align: center;">Belum ada yang absen hari ini.</td>';
                    rekapBody.innerHTML = ''; 
                    namaSudahAbsenHariIni = []; 
                    return;
                }

                let html = '';
                let namaCacheBaru = []; 

                snapshot.forEach(doc => {
                    const absen = doc.data();
                    const waktu = absen.waktuAbsen.toDate().toLocaleDateString('id-ID', {
                        day: '2-digit', month: 'short', year: 'numeric',
                        hour: '2-digit', minute: '2-digit'
                    }) + ' WIB';
                    
                    html += `
                        <tr style="color: ${absen.status === 'Hadir' ? '#4CAF50' : (absen.status === 'Izin' ? '#FFC107' : '#F44336')};">
                            <td>${absen.nama}</td>
                            <td>${waktu}</td>
                            <td>${absen.status}</td>
                        </tr>
                    `;
                    namaCacheBaru.push(absen.nama); 
                });

                rekapBody.innerHTML = html;
                rekapLoading.style.display = 'none';
                namaSudahAbsenHariIni = namaCacheBaru; 

                cekKetersediaanNama();

            }, (error) => {
                console.error("Error memuat rekap absensi:", error);
                rekapLoading.innerHTML = '<td colspan="3" style="text-align: center;">Gagal memuat rekap.</td>';
            });
    }

    function cekKetersediaanNama() {
        if (!absensiNamaSelect || !absensiButtonsContainer) return;
        
        const namaDipilih = absensiNamaSelect.value;
        const buttons = absensiButtonsContainer.querySelectorAll('.btn');
        const sudahAbsen = namaSudahAbsenHariIni.includes(namaDipilih);
        
        buttons.forEach(button => {
            button.disabled = sudahAbsen || !namaDipilih;
        });
    }
    
    if (absensiNamaSelect) {
        absensiNamaSelect.addEventListener('change', cekKetersediaanNama);
    }

    function setupAbsensiListener() {
        if (!absensiButtonsContainer || !absensiNamaSelect) return;

        absensiButtonsContainer.addEventListener('click', async (e) => {
            if (!e.target.matches('.btn')) return;

            const button = e.target;
            const nama = absensiNamaSelect.value;
            const status = button.getAttribute('data-status');

            if (!nama) {
                alert('Silakan pilih nama terlebih dahulu!');
                return;
            }
            
            if (namaSudahAbsenHariIni.includes(nama)) {
                alert(`${nama} sudah tercatat absen hari ini!`);
                return;
            }

            absensiButtonsContainer.querySelectorAll('.btn').forEach(btn => btn.disabled = true);

            try {
                await db.collection('absensi').add({
                    nama: nama,
                    status: status,
                    waktuAbsen: firebase.firestore.FieldValue.serverTimestamp()
                });
                
                alert(`Absensi untuk ${nama} (${status}) berhasil dicatat!`);
                absensiNamaSelect.value = ''; 

            } catch (error) {
                console.error("Error menyimpan absensi:", error);
                alert("Gagal menyimpan absensi. Coba lagi.");
            }
        });
    }

    // ============================================================================


    // ==================== (BARU!) FUNGSI FORM KONTAK (FIRESTORE) ====================
    function setupKontakFormListener() {
        const kontakForm = document.getElementById('kontak-form');
        if (!kontakForm) return;

        const submitButton = document.getElementById('kontak-submit-button');
        const statusMessage = document.getElementById('kontak-status-message');

        kontakForm.addEventListener('submit', async (e) => {
            e.preventDefault(); // Mencegah halaman reload

            // Ambil data dari form
            const nama = document.getElementById('nama').value;
            const kelas = document.getElementById('kelas-jurusan').value;
            const telepon = document.getElementById('telepon').value;
            const pesan = document.getElementById('pesan').value;
            
            // Validasi sederhana
            if (!nama || !telepon || !pesan) {
                alert("Nama, Telepon, dan Pesan wajib diisi!");
                return;
            }

            // Tampilkan status "mengirim"
            submitButton.disabled = true;
            submitButton.textContent = "Mengirim...";
            statusMessage.textContent = "Status: Sedang mengirim pesan...";
            statusMessage.style.color = "#333";

            try {
                // Simpan ke koleksi baru 'kontakMasuk'
                await db.collection('kontakMasuk').add({
                    nama: nama,
                    kelas: kelas,
                    telepon: telepon,
                    pesan: pesan,
                    diterimaPada: firebase.firestore.FieldValue.serverTimestamp(),
                    dibaca: false // (Opsional) status "belum dibaca"
                });

                // Berhasil
                statusMessage.textContent = "Pesan berhasil terkirim! Terima kasih.";
                statusMessage.style.color = "#4CAF50"; // Hijau
                kontakForm.reset(); // Kosongkan form

            } catch (error) {
                // Gagal
                console.error("Error mengirim pesan kontak:", error);
                statusMessage.textContent = "Gagal mengirim pesan. Coba lagi nanti.";
                statusMessage.style.color = "#F44336"; // Merah
            } finally {
                // Kembalikan tombol ke normal
                submitButton.disabled = false;
                submitButton.textContent = "Kirim Pesan";
                // Hapus pesan status setelah 5 detik
                setTimeout(() => { statusMessage.textContent = ""; }, 5000);
            }
        });
    }
    // ============================================================================


    // ==================== AMBIL ELEMEN LIGHTBOX ====================
    // (Kode ini tidak berubah, sudah benar)
    const lightboxContainer = document.getElementById('lightbox-container');
    const lightboxImage = document.querySelector('.lightbox-image');
    const lightboxClose = document.querySelector('.lightbox-close');


    // ==================== FUNGSI PROFIL ANGGOTA (Firestore) ====================
    // (Kode ini tidak berubah, sudah benar)
    const profilContainer = document.getElementById('profile-grid-container');
    const profilLoading = document.getElementById('profil-loading');

    async function muatProfilAnggota() {
        if (!profilContainer) return; 

        try {
            const snapshot = await db.collection('profil')
                                     .orderBy('dibuatPada', 'desc')
                                     .get();
            
            if (snapshot.empty) {
                profilLoading.textContent = "Belum ada data anggota yang ditambahkan.";
                return;
            }
            profilContainer.innerHTML = '';

            snapshot.forEach(doc => {
                const profil = doc.data();
                const item = document.createElement('div');
                item.className = 'profile-card';
                item.innerHTML = `
                    <img src="${profil.urlFoto}" alt="Foto ${profil.nama}" class="profile-img">
                    <h3>${profil.nama}</h3>
                    <p class="profile-class">${profil.kelas}</p>
                    <p class="profile-role">${profil.jabatan}</p>
                    <span class="profile-skill">Keahlian: ${profil.keahlian}</span>
                `;
                profilContainer.appendChild(item);
            });

        } catch (error) {
            console.error("Error mengambil data profil:", error);
            profilLoading.textContent = "Gagal memuat profil. Coba refresh halaman.";
        }
    }


    // ==================== FUNGSI KEGIATAN (Firestore) ====================
    // (Kode ini tidak berubah, sudah benar)
    const kegiatanContainer = document.getElementById('kegiatan-grid-container');
    const kegiatanLoading = document.getElementById('kegiatan-loading');

    async function muatKegiatan() {
        if (!kegiatanContainer) return; 

        try {
            const snapshot = await db.collection('kegiatan')
                                     .orderBy('dibuatPada', 'desc')
                                     .get();
            
            if (snapshot.empty) {
                kegiatanLoading.textContent = "Belum ada kegiatan yang diposting.";
                return;
            }

            kegiatanContainer.innerHTML = '';

            snapshot.forEach(doc => {
                const kegiatan = doc.data();
                
                const item = document.createElement('article');
                item.className = 'kegiatan-card';
                
                item.innerHTML = `
                    <img src="${kegiatan.urlGambar}" alt="${kegiatan.judul}">
                    <div class="kegiatan-content">
                        <span class="kegiatan-kategori">${kegiatan.kategori}</span>
                        <h3>${kegiatan.judul}</h3>
                        <p>${kegiatan.deskripsi}</p>
                    </div>
                `;
                
                kegiatanContainer.appendChild(item);
            });

        } catch (error) {
            console.error("Error mengambil data kegiatan:", error);
            kegiatanLoading.textContent = "Gagal memuat kegiatan. Coba refresh halaman.";
        }
    }


    // ==================== FUNGSI GALERI (Firestore) ====================
    // (Kode ini tidak berubah, sudah benar)
    const galeriContainer = document.getElementById('gallery-grid-container');
    const galeriLoading = document.getElementById('gallery-loading');

    async function muatKaryaGaleri() {
        if (!galeriContainer) return; 

        try {
            const snapshot = await db.collection('karya')
                                     .orderBy('dibuatPada', 'desc')
                                     .get();
            
            if (snapshot.empty) {
                galeriLoading.textContent = "Belum ada karya yang diupload.";
                return;
            }
            galeriContainer.innerHTML = '';

            snapshot.forEach(doc => {
                const karya = doc.data();
                const item = document.createElement('div');
                item.className = 'gallery-item';
                item.innerHTML = `
                    <img src="${karya.urlGambar}" alt="${karya.judul}">
                    <div class="gallery-overlay">
                        <h3>${karya.judul}</h3>
                        <p>Oleh: ${karya.pembuat}</p>
                    </div>
                `;
                galeriContainer.appendChild(item);
            });

        } catch (error) {
            console.error("Error mengambil data galeri:", error);
            galeriLoading.textContent = "Gagal memuat karya. Coba refresh halaman.";
        }
    }

    
    // ==================== LOGIKA EVENT LISTENER LIGHTBOX ====================
    // (Kode ini tidak berubah, sudah benar)
    if (galeriContainer) {
        galeriContainer.addEventListener('click', (e) => {
            const item = e.target.closest('.gallery-item');
            if (item) {
                const img = item.querySelector('img');
                if (img) {
                    const imageUrl = img.src;
                    lightboxImage.src = imageUrl;
                    lightboxContainer.classList.add('active');
                }
            }
        });
    }

    if (lightboxClose) {
        lightboxClose.addEventListener('click', () => {
            lightboxContainer.classList.remove('active');
            lightboxImage.src = ""; 
        });
    }

    if (lightboxContainer) {
        lightboxContainer.addEventListener('click', (e) => {
            if (e.target === lightboxContainer) {
                lightboxContainer.classList.remove('active');
                lightboxImage.src = "";
            }
        });
    }
    // ============================================================================

    // Panggil semua fungsi untuk memuat data saat halaman dibuka
    muatKaryaGaleri();
    muatProfilAnggota();
    muatKegiatan(); 
    
    // Panggil fungsi-fungsi absensi
    muatProfilUntukAbsensi(); 
    muatRekapAbsensi();      
    setupAbsensiListener();  
    
    // (BARU!) Panggil fungsi kontak
    setupKontakFormListener(); 
});
