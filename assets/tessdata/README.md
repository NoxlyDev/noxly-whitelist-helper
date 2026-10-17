# Tesseract language data

| File | Ukuran | SHA-256 |
|---|---|---|
| `eng.traineddata` | 5199098 bytes | `5dc5d8d640a212c9d6184921ba103b186f50e0fed9ee716c53e6b312b400d747` |

Model OCR bahasa Inggris untuk Tesseract. Dipakai oleh `tesseract.js` lewat opsi `langPath`
(`gzip: false`, `cacheMethod: 'none'`), jadi bot **tidak perlu internet** saat berjalan.

> **Sumber/versi asli tidak tercatat** di repo lama. Jika Anda tahu asalnya (mis. `tessdata_best`
> atau `tessdata_fast`), catat di sini. Verifikasi integritas:
>
> ```bash
> sha256sum assets/tessdata/eng.traineddata
> ```

Lisensi model: Apache-2.0 (proyek [tesseract-ocr/tessdata](https://github.com/tesseract-ocr/tessdata)).
Teks Indonesia ikut terbaca karena memakai aksara Latin; pencocokan toleran terhadap kesalahan OCR (lihat `docs/detection-pipeline.md`).
