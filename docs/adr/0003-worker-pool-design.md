# ADR 0003 — Pool worker Tesseract per PSM

- **Status:** Diterima
- **Konteks:** Membuat worker Tesseract mahal (memuat model ± 5 MB). Setiap resep memerlukan PSM tertentu, dan PSM adalah parameter worker.
- **Keputusan:** Dua pool pre-warm (PSM 11 dan PSM 6), ukuran bergantung CPU. Worker dipinjam/dikembalikan; permintaan yang menunggu diantrekan. Pool dibuat oleh `createOcrService`, bukan saat import, dan punya `shutdown()` yang men-terminate worker.
- **Konsekuensi:** Gambar pertama cepat (warmup di start); resource dapat dibersihkan dan mudah di-mock di test.
- **Alternatif:** Satu worker yang ganti parameter tiap panggilan (lebih hemat RAM, tetapi serial dan rawan race).
