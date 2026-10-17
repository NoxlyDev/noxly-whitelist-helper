import { REPLY_FOOTER } from '../../shared/constants.js';

/** All user-facing reply text lives here, separate from the Discord builder code. */
export const replyContent = {
  main:
    '## 🚫 Kamu belum masuk whitelist\n' +
    'Ketik salah satu di **console server**, lalu coba join lagi:\n\n' +
    '**1. Matikan whitelist**\n' +
    '`whitelist off`\n\n' +
    '**2. Tambahkan nama kamu** *(disarankan)*\n' +
    '`whitelist add <username>`',

  other:
    '**Command lain**\n' +
    '`whitelist on` aktifkan · `whitelist remove <nama>` hapus pemain\n' +
    '`whitelist list` lihat daftar · `whitelist reload` muat ulang file\n\n' +
    '-# Console tanpa `/`, di game pakai `/` (harus OP). Bedrock baru: `allowlist`.\n' +
    `-# ${REPLY_FOOTER}`,
} as const;
