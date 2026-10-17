# Changelog

Format mengikuti [Keep a Changelog](https://keepachangelog.com/) dan [Semantic Versioning](https://semver.org/).

## [2.0.0]

Restrukturisasi total. Panduan upgrade: [docs/migration-v2.md](docs/migration-v2.md).

### Changed
- **BREAKING:** TypeScript (strict) + ESM, Node ≥ 22. Jalankan `npm run build` sebelum `npm start`.
- `.env` dibaca otomatis dari folder proyek oleh `npm start` maupun `npm run dev`.
- **BREAKING:** `DEBUG=true` diganti `LOG_LEVEL`; `npm run test:image` diganti `npm run check:image`.
- Kode dipecah menjadi `config`, `core`, `services`, `discord`, `shared`; teks balasan dan sinyal deteksi dipisah dari logika.
- Konfigurasi divalidasi (zod) dan fail-fast; loader `.env` kustom dan fallback token dihapus.
- Logging terstruktur dengan pino (token disensor).
- Loader `.env` tangguh (UTF-16/BOM/CRLF, aman untuk Windows) dengan diagnosis saat token tidak terbaca.

### Added
- Unduh gambar aman (allowlist host, timeout, batas ukuran, magic bytes).
- Graceful shutdown, handler `unhandledRejection`/`uncaughtException`, heartbeat + Docker `HEALTHCHECK`.
- Timeout per resep OCR; kegagalan resep dicatat.
- Test suite (unit, integrasi, regresi fixture) dengan ambang coverage.
- ESLint, Prettier, husky, commitlint, CI, Dockerfile multi-stage, Dependabot, CodeQL, dokumentasi lengkap dan ADR.

### Security
- Upgrade `sharp` ke 0.35.5 (advisory libvips / libheif / librsvg); `npm audit --omit=dev` bersih.

### Fixed
- Kebocoran memori kecil pada cooldown (entri tidak pernah dihapus).
- Error OCR tidak lagi ditelan diam-diam.
- Race kecil saat shutdown di tengah warmup.
- Heartbeat Docker kini opt-in (`HEALTH_FILE`) dan peringatan gagal-tulis hanya dicatat sekali; sebelumnya aktif di semua OS dengan path Linux.

## [1.0.0]

Rilis awal (struktur flat, JavaScript CommonJS).
