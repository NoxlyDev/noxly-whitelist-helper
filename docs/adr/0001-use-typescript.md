# ADR 0001 — Memakai TypeScript (strict) dan ESM

- **Status:** Diterima
- **Konteks:** Struktur `Signal`, hasil OCR, dan konfigurasi dipakai lintas modul. Di JavaScript murni, salah nama field (mis. `min_score` vs `minScore`) baru ketahuan saat runtime.
- **Keputusan:** TypeScript dengan `strict` dan `noUncheckedIndexedAccess`, ESM (`"type": "module"`), Node ≥ 22 LTS.
- **Konsekuensi:** Ada langkah build (`tsc`); `tsx` untuk dev. Bug tipe tertangkap saat compile. ESM adalah standar Node modern.
- **Alternatif:** JavaScript + JSDoc `@ts-check` (lebih ringan, perlindungan lebih lemah).
