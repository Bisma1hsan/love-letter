window.STANDALONE_CONFIG = {
  // 1. IDENTITAS & JUDUL SURAT
  "recipientName": "Shalfaa", // Nama yang muncul di bagian depan amplop ("for ...")
  "title": "Happy 4th Anniversary, my one and only.", // Judul utama di atas surat
  "date": "22 November 2026", // Tanggal surat
  "salutation": "Dearest Fani,", // Sapaan pembuka di dalam kertas surat
  "from": "Forever yours, Bisma.", // Tanda tangan penutup di bawah surat

  // 2. ISI SURAT (Gunakan \n\n untuk membuat paragraf baru)
  "letter_body": "Selamat merayakan 4 tahun yaa!\n\nKalau dihitung-hitung, 1.460 hari bareng Fani itu rasanya jauh lebih banyak ketawanya daripada pusingnya. Yaa walaupun kadang tetap ada  drama kecil-kecilannya juga sii. ixixixixixii. \n\nTapi justru dari situ kita jadi belajar banyak hal bareng-bareng. Makasih yaa udah selalu sabar, mau bertahan di berbagai kondisi, dan mau diajak tumbuh bareng dari fase kita yang dulu masih kecik dan serba bingung sampai akhirnya bisa ada di titik ini.\n\nNggak kerasa banget ternyata udah sejauh ini kita jalan beriringan, melewati hari-hari yang seru maupun hari-hari yang capek. Terima kasih juga udah selalu jadi tempat pulang paling nyaman buat Bisma.\n\nBisma cuma berharap kita masih tetap bisa bersama di tahun berikutnyaa, makin saling ngertiin, makin dewasa ngadepin apa pun, dan masih bisa terus ketawa bareng kayak gini. Semoga stok sabar Fani buat Bisma juga nggak pernah habis yaa.\n\nSelamat merayakan tahun keempat sayangg.\n\nFrom Bisma aka BOBII.",

  // 3. TAMPILAN & GAYA HURUF
  // Pilihan tema: "blush-cream", "sage", "dusty-rose", "midnight", "crimson", "obsidian"
  "theme": "crimson",
  // Pilihan font isi surat: "caveat", "cormorant", "dancing", "shadows", "indie"
  "fontFamily": "caveat",
  // Pilihan ukuran huruf: "size-small", "size-medium", "size-large"
  "fontSize": "size-medium",
  // Tekstur kertas: "" (polos) atau "handmade" (bertekstur serat kertas)
  "paperTexture": "",

  // 4. KEAMANAN (Opsional — kosongkan "" jika amplop langsung terbuka tanpa password)
  "login_password": "22112022",
  "login_hint": "Tanggal jadian kita?",

  // 5. MUSIK LATAR (Bisa pakai file lokal di folder assets/ atau URL langsung)
  "playlist": [
    {
      "url": "./assets/music.mp3",
      "title": "Sampai Jadi Debu",
      "artist": "Banda Neira"
    }
  ],

  // 6. MEMORI RAHASIA / POLAROID (Bisa isi 1 atau banyak foto/video sekaligus)
  "secretMediaList": [
    // {
    //   "url": "./assets/foto1.jpg",
    //   "caption": "Us. Always. ♡"
    // },
    // {
    //   "url": "./assets/foto2.jpg",
    //   "caption": "Every moment with you ♡"
    // }
  ]
};