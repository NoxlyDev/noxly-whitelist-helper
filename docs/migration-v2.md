# Migrasi v1 → v2

## Breaking changes

| v1                                 | v2                                                    | Tindakan                                            |
| ---------------------------------- | ----------------------------------------------------- | --------------------------------------------------- |
| Node ≥ 18                          | **Node ≥ 22**                                         | Upgrade Node (`.nvmrc` disediakan)                  |
| `npm start` menjalankan `index.js` | `npm run build && npm start`                          | Build dulu; `npm run dev` untuk development         |
| `DEBUG=true`                       | `LOG_LEVEL=debug`                                     | Ganti variabel (default sekarang `info`)            |
| `npm run test:image -- x.png`      | `npm run check:image -- x.png`                        | Ganti perintah                                      |
| Edit `config.js` untuk sinyal      | Edit `config/signals.json`                            | Pindahkan perubahan lokal; `min_score` → `minScore` |
| Edit `reply.js` untuk teks         | Edit `src/discord/replies/content.ts`                 | Pindahkan teks                                      |
| Token boleh di `config.js`         | Hanya lewat environment                               | Pindahkan ke `.env`                                 |
| `.env` dibaca loader kustom        | Loader bawaan (tetap membaca `.env` di folder proyek) | Tidak ada tindakan                                  |
| `eng.traineddata` di root          | `assets/tessdata/eng.traineddata`                     | Tidak ada tindakan                                  |

## Perubahan perilaku (disengaja)

- Gambar hanya diunduh dari `cdn.discordapp.com` / `media.discordapp.net` via HTTPS, maks `MAX_IMAGE_BYTES`, dengan timeout.
- Data bukan gambar (cek magic bytes) ditolak sebelum OCR.
- Resep OCR yang gagal/timeout dicatat sebagai `warn` (sebelumnya diam).
- Cooldown tidak lagi bocor memori.
- Shutdown (`Ctrl+C`/SIGTERM) menutup worker OCR dengan bersih.
- Default log lebih tenang (`info`); skor deteksi tampil pada `LOG_LEVEL=debug`.

## Yang tidak berubah

Logika deteksi (resep preprocessing, stage 1/2, fuzzy matching, bobot, `minScore`), teks balasan,
cooldown (hanya dimulai saat gambar cocok), batas 3 gambar per pesan, dan intents Discord.
