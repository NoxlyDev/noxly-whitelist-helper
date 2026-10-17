# NoxlyDev Whitelist Helper

[![CI](https://github.com/NoxlyDev/noxly-whitelist-helper/actions/workflows/ci.yml/badge.svg)](../../actions/workflows/ci.yml)
![Node](https://img.shields.io/badge/node-%E2%89%A522-339933)
![License](https://img.shields.io/badge/license-ISC-blue)

Bot Discord by **NoxlyDev**. Mendeteksi screenshot Minecraft _"You're not invited to play on this server"_
(Inggris **dan Indonesia**, OCR murni tanpa AI generatif), lalu membalas dengan pesan **Components V2**
berisi cara memperbaikinya:

1. `whitelist off`
2. `whitelist add <username>` _(disarankan)_
3. Penjelasan command whitelist lain (`on`, `remove`, `list`, `reload`, alias `allowlist` di Bedrock)

## Fitur

- OCR 2 tahap: resep cepat dulu (early-exit), resep berat (deskew, anti-blur) hanya jika ada petunjuk
- Skor multi-sinyal + kalimat inti wajib, dengan fuzzy matching yang toleran terhadap salah baca OCR
- Cooldown per pengguna, filter channel, batas 3 gambar per pesan
- Unduh gambar aman: HTTPS + allowlist host Discord CDN, timeout, batas ukuran, validasi magic bytes
- Konfigurasi tervalidasi (fail-fast), log terstruktur (pino), graceful shutdown, healthcheck Docker

## Quick start

Prasyarat: **Node.js ≥ 22** (`nvm use`), dan token bot dari [Discord Developer Portal](https://discord.com/developers/applications).

```bash
npm ci
cp .env.example .env        # isi DISCORD_TOKEN
npm run dev                 # development (auto-reload)
```

Bot membaca `.env` otomatis dari folder proyek (aman untuk file UTF-16/BOM dari Windows).
Di Developer Portal → Bot, aktifkan **Message Content Intent**.
Permission bot: View Channel, Send Messages, Embed Links, Read Message History.

### Produksi

```bash
npm run build && npm start
# atau
docker compose up -d --build
```

Detail: [docs/deployment.md](docs/deployment.md).

## Konfigurasi

Semua lewat environment variable (lihat [`.env.example`](.env.example) dan [docs/configuration.md](docs/configuration.md)).

| Variabel           | Wajib | Default       | Keterangan                                              |
| ------------------ | ----- | ------------- | ------------------------------------------------------- |
| `DISCORD_TOKEN`    | ✅    | —             | Token bot                                               |
| `CHANNEL_IDS`      |       | semua channel | ID channel dipantau, pisahkan koma                      |
| `COOLDOWN_SECONDS` |       | `15`          | Jeda per pengguna                                       |
| `LOG_LEVEL`        |       | `info`        | `trace` … `error`, `silent` (menggantikan `DEBUG=true`) |
| `MAX_IMAGE_BYTES`  |       | `8388608`     | Batas ukuran gambar                                     |
| `FETCH_TIMEOUT_MS` |       | `10000`       | Timeout unduh gambar                                    |
| `OCR_CONCURRENCY`  |       | otomatis      | Resep OCR paralel                                       |

Aturan deteksi (teks sinyal, bobot, skor minimum) ada di [`config/signals.json`](config/signals.json), bukan di kode.
Teks balasan ada di [`src/discord/replies/content.ts`](src/discord/replies/content.ts).

## Perintah

| Perintah                             | Fungsi                                                 |
| ------------------------------------ | ------------------------------------------------------ |
| `npm run dev`                        | Jalankan dengan auto-reload                            |
| `npm run build` / `npm start`        | Compile dan jalankan                                   |
| `npm test` / `npm run test:coverage` | Test / test + coverage                                 |
| `npm run lint` / `npm run format`    | ESLint / Prettier                                      |
| `npm run typecheck`                  | Cek tipe TypeScript                                    |
| `npm run check:image -- gambar.png`  | Uji deteksi lokal pada gambar (pengganti `test:image`) |

## Struktur proyek

```
src/
├── main.ts               entry point, signal handling
├── app.ts                composition root
├── config/               validasi env + loader signals.json
├── core/                 logika murni (normalize, fuzzy, evaluate) — tanpa I/O
├── services/
│   ├── ocr/              worker pool, resep preprocessing, stage runner
│   ├── image/            unduh gambar aman
│   └── cooldown/         cooldown dengan TTL
├── discord/              client, event, filter, balasan Components V2
└── shared/               logger, error, konstanta, health
```

Penjelasan lengkap: [docs/architecture.md](docs/architecture.md).

## Kontribusi

Lihat [CONTRIBUTING.md](CONTRIBUTING.md). Laporan keamanan: [SECURITY.md](SECURITY.md).
Pindah dari v1? Baca [docs/migration-v2.md](docs/migration-v2.md).

## Lisensi

[ISC](LICENSE) © NoxlyDev
