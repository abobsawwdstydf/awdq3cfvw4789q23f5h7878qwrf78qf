import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

if (!process.env.JWT_SECRET) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET не задан в .env — нельзя запускать в production без секрета!');
  }
  console.error('  ⚠ JWT_SECRET не задан в .env — используется dev-значение. Укажите безопасный секрет в продакшене!');
}

// Initialise message encryption (AES-256-GCM)
if (process.env.ENCRYPTION_KEY) {
  console.log('  🔒 Шифрование сообщений включено (AES-256-GCM)');
} else {
  console.warn('  ⚠ ENCRYPTION_KEY не задан — сообщения хранятся без шифрования. Для продакшена задайте 64-символьный hex-ключ.');
}

export const config = {
  port: Number(process.env.PORT) || 3001,
  jwtSecret: process.env.JWT_SECRET || 'Nexo-dev-fallback-not-for-production',
  corsOrigins: process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(',').map(s => s.trim())
    : ['http://localhost:5173', 'http://localhost:3000'],
  uploadsDir: 'uploads',
  minPasswordLength: 8,
  maxRegistrationsPerIp: Number(process.env.MAX_REGISTRATIONS_PER_IP) || 5,
  requireEmailVerification: process.env.REQUIRE_EMAIL_VERIFICATION === 'true',
  captchaAfterFailures: Number(process.env.CAPTCHA_AFTER_FAILURES) || 3,
  turnUrl: process.env.TURN_URL || '',
  turnSecret: process.env.TURN_SECRET || '',
  stunUrls: (process.env.STUN_URLS || 'stun:stun.l.google.com:19302,stun:stun1.l.google.com:19302')
    .split(',').map(s => s.trim()).filter(Boolean),
  // Redis
  redisUrl: process.env.REDIS_URL || '',
  // Discord webhooks
  discordWebhookUrls: process.env.DISCORD_WEBHOOK_URLS
    ? process.env.DISCORD_WEBHOOK_URLS.split(',').map(s => s.trim())
    : [],
  // Telegram
  telegramBotTokens: process.env.TELEGRAM_BOT_TOKENS
    ? process.env.TELEGRAM_BOT_TOKENS.split(',').map(s => s.trim())
    : [],
  telegramChannelIds: process.env.TELEGRAM_CHANNEL_IDS
    ? process.env.TELEGRAM_CHANNEL_IDS.split(',').map(s => s.trim())
    : [],
  // Encryption
  encryptionKey: process.env.ENCRYPTION_KEY || '',
  encryptionEnabled: !!process.env.ENCRYPTION_KEY,
  // Database encryption
  dbEncryptionEnabled: process.env.DB_ENCRYPTION_ENABLED === 'true',
  // Master key
  masterKey: process.env.MASTER_KEY || '',
  // File limits
  maxFileSize: Number(process.env.MAX_FILE_SIZE) || 20 * 1024 * 1024 * 1024,
  chunkSize: Number(process.env.CHUNK_SIZE) || 19922944,
};
