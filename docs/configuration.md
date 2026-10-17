# Konfigurasi

Konfigurasi dibaca dari environment variable dan divalidasi dengan zod saat start.
Nilai kosong (`KEY=`) diperlakukan sebagai tidak diisi. Jika ada yang tidak valid, proses berhenti dengan exit code 1
dan menyebut **semua** variabel yang bermasalah.

| Variabel                | Tipe    | Default                | Aturan                                                 |
| ----------------------- | ------- | ---------------------- | ------------------------------------------------------ |
| `DISCORD_TOKEN`         | string  | — (wajib)              | tidak boleh kosong                                     |
| `CHANNEL_IDS`           | daftar  | kosong = semua channel | ID numerik 17–20 digit, dipisah koma                   |
| `COOLDOWN_SECONDS`      | integer | `15`                   | ≥ 0 (`0` = nonaktif)                                   |
| `LOG_LEVEL`             | enum    | `info`                 | `fatal` `error` `warn` `info` `debug` `trace` `silent` |
| `NODE_ENV`              | enum    | `development`          | `production` mematikan log "pretty"                    |
| `MAX_IMAGE_BYTES`       | integer | `8388608`              | ≥ 1                                                    |
| `FETCH_TIMEOUT_MS`      | integer | `10000`                | ≥ 1                                                    |
| `OCR_CONCURRENCY`       | integer | otomatis (min(3, CPU)) | ≥ 1                                                    |
| `OCR_RECIPE_TIMEOUT_MS` | integer | `30000`                | ≥ 1                                                    |
| `HEALTH_FILE`           | path    | `/tmp/noxly-healthy`   | file heartbeat untuk HEALTHCHECK                       |

## Menjalankan dengan `.env`

Saat start, bot otomatis membaca file `.env` **di folder proyek** (bukan folder tempat terminal berada),
sehingga `npm start` dan `npm run dev` sama-sama bekerja. Variabel yang sudah ada di environment
(Docker `env_file`, systemd `EnvironmentFile`, panel hosting) **tidak ditimpa** oleh file.

Loader ini menangani kasus khas Windows: file UTF-16 (hasil `echo ... > .env` di PowerShell),
UTF-8 dengan BOM (Notepad), dan baris CRLF.

Jika `DISCORD_TOKEN` tidak terbaca, pesan error menampilkan lokasi `.env` yang dicari, apakah file ditemukan,
dan nama variabel yang berhasil dibaca (tanpa nilainya). Penyebab paling sering di Windows:
file bernama `.env.txt` (aktifkan _File name extensions_ di Explorer) atau `.env` tersimpan di folder lain.

## File konfigurasi lain

| File                             | Isi                           |
| -------------------------------- | ----------------------------- |
| `config/signals.json`            | Sinyal deteksi dan `minScore` |
| `src/discord/replies/content.ts` | Teks balasan                  |
| `src/shared/constants.ts`        | Brand, footer, batas bawaan   |
