# Deployment

## Docker (disarankan)

```bash
cp .env.example .env     # isi DISCORD_TOKEN
docker compose up -d --build
docker compose logs -f bot
```

Image multi-stage berbasis `node:22-slim` (glibc — **jangan** ganti ke Alpine, binary `sharp` butuh glibc),
berjalan sebagai user `node`, filesystem read-only, `HEALTHCHECK` membaca file heartbeat
(ditulis tiap 30 detik selama bot terhubung ke Discord).

Status: `docker inspect --format '{{.State.Health.Status}}' noxly-whitelist-helper`

Image rilis dipublikasikan ke GHCR oleh workflow `release.yml` saat tag `vX.Y.Z` dibuat.

## PM2

```bash
npm ci && npm run build
pm2 start dist/main.js --name noxly-whitelist-helper
pm2 save
```

## systemd

```ini
[Unit]
Description=NoxlyDev Whitelist Helper
After=network-online.target

[Service]
WorkingDirectory=/opt/noxly-whitelist-helper
EnvironmentFile=/opt/noxly-whitelist-helper/.env
ExecStart=/usr/bin/node dist/main.js
Restart=on-failure
User=noxly

[Install]
WantedBy=multi-user.target
```

## Sumber daya

Tiap worker Tesseract memakai ± 100–200 MB RAM. Pool default berisi `max(2, min(4, CPU))` worker PSM 11
ditambah satu lebih sedikit untuk PSM 6. Di mesin kecil, 768 MB RAM adalah batas yang masuk akal (sudah diset di `docker-compose.yml`).

## Rilis

```bash
npm version <patch|minor|major>   # memperbarui package.json + tag
git push --follow-tags
```
