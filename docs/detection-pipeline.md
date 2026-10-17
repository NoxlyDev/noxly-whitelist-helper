# Pipeline deteksi

Murni OCR (Tesseract) + pencocokan teks; tidak ada model AI generatif.

## Stage 1 — cepat (selalu jalan)

Tiga resep dijalankan paralel (maks `OCR_CONCURRENCY`), berhenti begitu ada yang cocok:

| Resep                 | PSM | Tujuan                                          |
| --------------------- | --- | ----------------------------------------------- |
| `psm11-inverted-1200` | 11  | teks UI/dialog (sparse text)                    |
| `psm11-pixel-1600`    | 11  | UI kecil / font pixel (resize `nearest` + blur) |
| `psm6-inverted-1200`  | 6   | blok teks seragam                               |

## Stage 2 — berat (hanya jika ada "petunjuk")

Dijalankan hanya bila stage 1 belum cocok **dan** `hasHint()` menemukan jejak kalimat inti
(`notinvited`, `tidakdiundang`, dst. dengan toleransi 30%). Ini mencegah error screen lain atau
gambar acak membayar biaya stage 2.

Resep: deskew ±3° dan ±5°, anti-blur/gelap (`linear`), dan teks gelap di latar terang.

## Penilaian

1. Semua teks OCR digabung, dinormalisasi (huruf kecil, hanya a–z).
2. Tiap sinyal di `config/signals.json` dicari dengan `fuzzyIncludes`; batas edit = `floor(panjang * tolerance)`.
3. Sinyal yang cocok menambah `weight` ke skor.
4. **Lolos** jika semua sinyal `required` cocok **dan** skor ≥ `minScore`.

Dengan `core` (bobot 4, wajib) dan `minScore: 5`, screenshot yang di-crop pun lolos selama ada minimal satu sinyal pendukung.

## Menambah / mengubah sinyal

Edit `config/signals.json` — tidak perlu menyentuh kode. Berkas divalidasi saat start:
nama harus unik dan `minScore` tidak boleh melebihi total bobot. Tambahkan fixture
di `tests/fixtures/` lalu jalankan `npm test`.

## Menguji gambar

```bash
npm run check:image -- screenshot.png
```

## Suite regresi

`tests/fixtures/positive` harus cocok, `tests/fixtures/negative` tidak boleh cocok. Fixture bawaan
disintesis; **tambahkan screenshot Minecraft asli** (EN/ID, miring, blur, crop) untuk jaminan yang lebih kuat.
