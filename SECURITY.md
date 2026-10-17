# Kebijakan Keamanan

## Melaporkan kerentanan

Jangan membuka issue publik untuk masalah keamanan. Gunakan **GitHub → Security → Report a vulnerability**
(private advisory) atau hubungi maintainer secara langsung. Kami berusaha merespons dalam 7 hari.

## Versi yang didukung

Hanya rilis mayor terbaru (`2.x`).

## Praktik yang diterapkan

- Token hanya lewat environment; tidak pernah di kode. `.env` ada di `.gitignore`. Token disensor dari log.
- Unduhan gambar dibatasi: HTTPS, allowlist host Discord CDN, timeout, batas ukuran, validasi magic bytes.
- Container berjalan non-root, filesystem read-only, `cap_drop: ALL`.
- Dependabot, `npm audit`, dan CodeQL berjalan di CI.

## Jika token bocor

1. Developer Portal → Bot → **Reset Token** (segera).
2. Perbarui `.env` / secret di server.
3. Jika token pernah ter-commit, anggap bocor selamanya (riwayat git) — reset tetap wajib.
