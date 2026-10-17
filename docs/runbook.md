# Runbook

| Gejala                                                          | Kemungkinan penyebab                                                      | Tindakan                                                                                                                        |
| --------------------------------------------------------------- | ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Proses langsung exit dengan `Invalid environment configuration` | Env salah/kurang                                                          | Baca daftar variabel di pesan; cocokkan dengan `.env.example`                                                                   |
| `DISCORD_TOKEN: Required` padahal `.env` ada                    | File bernama `.env.txt`, salah folder, atau baris `DISCORD_TOKEN=` kosong | Baca 3 baris diagnosis di bawah pesan error (lokasi, ditemukan/tidak, variabel terbaca)                                         |
| Bot online tapi tidak membalas                                  | **Message Content Intent** belum aktif                                    | Developer Portal → Bot → aktifkan intent                                                                                        |
| Bot online tapi tidak membalas di satu channel                  | `CHANNEL_IDS` tidak memuat channel itu                                    | Tambahkan ID channel atau kosongkan variabel                                                                                    |
| Screenshot valid tidak terdeteksi                               | OCR gagal pada gambar tertentu                                            | `LOG_LEVEL=debug` lihat skor/sinyal; `npm run check:image -- file.png`; tambah varian teks di `config/signals.json` dan fixture |
| Banyak `OCR recipe failed` / `timed out`                        | CPU/RAM kurang                                                            | Turunkan `OCR_CONCURRENCY`, naikkan `OCR_RECIPE_TIMEOUT_MS` / RAM                                                               |
| `Image host not allowed`                                        | URL bukan Discord CDN                                                     | Normal untuk URL non-Discord; ubah `ALLOWED_IMAGE_HOSTS` di `src/shared/constants.ts` jika memang perlu                         |
| `Image too large`                                               | Gambar > `MAX_IMAGE_BYTES`                                                | Naikkan batas jika wajar                                                                                                        |
| `could not write heartbeat file`                                | `HEALTH_FILE` diisi tapi path salah/folder                                | Hapus baris `HEALTH_FILE` dari `.env` (hanya untuk Docker)                                                                      |
| Container `unhealthy`                                           | Bot tidak terhubung ke Discord                                            | `docker compose logs bot`; periksa token / jaringan                                                                             |
| Pesan balasan gagal terkirim                                    | Permission kurang / pesan sudah dihapus                                   | Periksa permission _Send Messages_, _Read Message History_                                                                      |

## Log

Format JSON (produksi) dengan field `userId`, `channelId`, `score`, `stage`, `durationMs`, `signals`.
Token otomatis disensor. Contoh memfilter: `docker compose logs bot | jq 'select(.level>=40)'`.
