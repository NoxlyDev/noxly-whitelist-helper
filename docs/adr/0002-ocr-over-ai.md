# ADR 0002 — OCR murni, bukan model AI generatif

- **Status:** Diterima (mewarisi keputusan v1)
- **Konteks:** Kita hanya perlu mengenali satu dialog error yang teksnya tetap (EN/ID).
- **Keputusan:** Tesseract OCR + fuzzy matching + skor multi-sinyal. Tanpa API eksternal.
- **Konsekuensi:** Gratis, cepat (± 0,5–2 dtk), offline, deterministik, dan privat (gambar tidak keluar dari server). Akurasi bergantung preprocessing; ditutup oleh stage 2 dan suite regresi.
- **Alternatif:** Model vision (lebih fleksibel, tetapi berbayar, lambat, dan mengirim gambar pengguna ke pihak ketiga).
