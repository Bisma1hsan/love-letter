# ✉️ A Letter For You — Interactive Digital Letter

Website surat digital interaktif berbasis HTML, CSS, dan Vanilla JavaScript dengan animasi amplop, transisi kelopak bunga, efek mesin ketik (*typewriter*), pemutar musik latar, serta galeri memori rahasia bergaya Polaroid.

## ✨ Fitur Utama

- **Animasi Amplop & Segel Lilin**: Pembukaan amplop interaktif yang diikuti efek kelopak bunga bermekaran dan berguguran sebelum kertas surat muncul.
- **Efek Mesin Ketik (*Typewriter*)**: Teks surat diketik secara bertahap dengan jeda alami pada tanda baca dan pergantian paragraf.
- **6 Pilihan Tema Warna**: Mendukung tema `blush-cream`, `sage`, `dusty-rose`, `midnight`, `crimson`, dan `obsidian` yang dapat diganti melalui konfigurasi maupun parameter URL.
- **Kustomisasi Tipografi & Tekstur Kertas**: Pilihan gaya tulisan tangan (*Caveat*, *Cormorant Garamond*, *Dancing Script*, *Shadows Into Light*, *Indie Flower*), ukuran huruf, serta opsi tekstur serat kertas (`handmade`).
- **Gerbang Kata Sandi (*Password Gate*)**: Proteksi opsional dengan petunjuk rahasia (*hint*) sebelum amplop terbuka.
- **Pemutar Musik Latar**: Pemutar audio melayang (*floating action button*) yang otomatis memutar lagu saat amplop dibuka.
- **Memori Rahasia (*Polaroid Carousel*)**: Modal pop-up yang menampilkan foto atau video kenangan lengkap dengan *caption* dan navigasi geser.
- **Simpan Surat ke PNG**: Ekspor tampilan kertas surat menjadi gambar beresolusi tinggi (format 9:16 siap unggah ke Instagram Story) menggunakan `html2canvas`.

## 📁 Struktur Proyek

```text
letter-for-you/
├── index.html                  # Halaman utama & struktur elemen UI
├── style.css                   # Styling tema, animasi amplop, dan tata letak kertas
├── config.js                   # Pusat pengaturan isi surat, tema, lagu, dan foto
├── script.js                   # Logika animasi, typewriter, audio, dan ekspor PNG
├── i18n.js                     # Dukungan lokalisasi teks antarmuka
├── particles.js                # Efek partikel latar & latar depan
├── letter-download-flow.js     # Alur render dan unduh gambar PNG pada desktop & mobile
└── assets/
    ├── flower1.png             # Aset kelopak bunga transisi 1
    ├── flower2.png             # Aset kelopak bunga transisi 2
    ├── natural-paper.png       # Tekstur serat kertas
    ├── music.mp3               # File audio musik latar (opsional lokal)
    └── favicon/                # Ikon tab browser & manifest
