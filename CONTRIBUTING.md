# Kontribusi

## Setup

```bash
nvm use            # Node 22
npm ci
cp .env.example .env
npm run dev
```

Husky memasang hook git saat `npm ci`: pre-commit menjalankan Prettier + ESLint pada file yang berubah,
commit-msg memeriksa format Conventional Commits.

## Alur

1. Buat branch `type/deskripsi` (mis. `feat/image-size-limit`, `fix/cooldown-leak`).
2. Tulis kode **dan test**. Logika murni masuk `src/core`; I/O di `src/services`; Discord di `src/discord`.
3. Pastikan lulus lokal:
   ```bash
   npm run lint && npm run typecheck && npm run test:coverage && npm run build
   ```
4. Buka PR memakai template. CI harus hijau.

## Commit

[Conventional Commits](https://www.conventionalcommits.org/): `feat(ocr): add deskew recipe`, `fix(discord): ignore DMs`, `refactor`, `docs`, `test`, `chore`, `ci`.

## Gaya kode

- File `kebab-case.ts`; tipe `PascalCase`; fungsi/variabel `camelCase`; konstanta `UPPER_SNAKE_CASE`.
- Kode, nama, komentar, dan log dalam bahasa Inggris. Teks yang tampil ke pengguna Discord dalam bahasa Indonesia.
- Tidak ada `console.*` di `src/` (pakai logger).
- Tidak ada side effect saat import; rakit dependency di `src/app.ts`.

## Mengubah deteksi

Setiap perubahan pada `config/signals.json` atau `src/services/ocr/recipes.ts` **wajib** disertai fixture di
`tests/fixtures/positive` atau `negative`. Perubahan tidak boleh menimbulkan false positive pada fixture negatif.

## Coverage

Minimum: 80% baris, dan 90% untuk `src/core/**` (ditegakkan di `vitest.config.ts`).
