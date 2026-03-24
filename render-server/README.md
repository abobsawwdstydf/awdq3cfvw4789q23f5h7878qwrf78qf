# Nexo Messenger - Ultra Secure Server

**Многоуровневое шифрование (30 этапов)** + **STUN пул (200+ серверов)** + **Файлы в Discord/Telegram**.

## 🔐 Шифрование

### 30 этапов шифрования:

1. **Этапы 1-10:** AES-256-GCM (10 раундов с разными IV)
2. **Этапы 11-15:** ChaCha20-Poly1305 (5 раундов)
3. **Этапы 16-20:** AES-256-CBC (5 раундов)
4. **Этапы 21-25:** Blowfish (5 раундов)
5. **Этапы 26-28:** Triple DES (3 раунда)
6. **Этап 29:** XOR с ключом
7. **Этап 30:** Сжатие + Base64

**Без ключа расшифровать НЕВОЗМОЖНО!**

### Уровни:

```
Клиент → AES-256 → Сервер → 30 этапов → Discord/Telegram/БД
```

## 🚀 Быстрый старт

### Установка
```bash
npm install
```

### Инициализация БД
```bash
node init-db.js
```

### Запуск
```bash
node server.js
```

## 📦 Для Render

### Build Command
```bash
npm install && npx prisma generate
```

### Start Command
```bash
node server.js
```

### Переменные окружения

**Обязательные (11):**

```env
NODE_ENV=production
PORT=3001
JWT_SECRET=твой-64-char-secret
ENCRYPTION_KEY=твой-64-char-hex-key
MASTER_KEY=твой-64-char-secret
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
CORS_ORIGINS=*
DISCORD_WEBHOOK_URLS=https://...
TELEGRAM_BOT_TOKENS=...
TELEGRAM_CHANNEL_IDS=-100...
```

## 📁 Структура

```
render-server/
├── server.js           # Весь сервер (30 этапов шифрования)
├── init-db.js          # Инициализация БД
├── package.json        # Зависимости
└── uploads/            # Временные файлы
```

## 📞 WebRTC - STUN пул (200+)

### Автоматическое распределение:

- **200+ STUN серверов** в пуле
- **5 случайных** выбираются для каждого звонка
- **Балансировка нагрузки**
- **Автоматическая замена** при отказе

### Основные пулы:

- **Google:** 5 серверов (stun.l.google.com:19302 и др.)
- **Mozilla:** stun.services.mozilla.com:3478
- **Europa:** 50+ серверов
- **Россия/СНГ:** 20+ серверов
- **Азия:** 10+ серверов
- **Океания:** 5+ серверов
- **Остальные:** 100+ серверов

## 🎯 Тестовые аккаунты

После `node init-db.js`:

| Логин | Пароль |
|-------|--------|
| evgeniy | demo123 |
| anastasia | demo123 |
| artem | demo123 |
| polina | demo123 |
| daniil | demo123 |
| vladimir | demo123 |

## 📊 API Endpoints

### Health check:
```bash
GET /api/health
```

**Ответ:**
```json
{
  "status": "ok",
  "encryption": "ULTRA (30 rounds + combo)",
  "stunServers": 200,
  "discord": "1 webhooks",
  "telegram": "1 bots"
}
```

### ICE серверы:
```bash
GET /api/ice-servers
```

**Ответ:**
```json
{
  "iceServers": [
    {
      "urls": [
        "stun.stunprotocol.org:3478",
        "stun.mit.de:3478",
        "stun.ekiga.net:3478",
        "stun.freeswitch.org:3478",
        "stun.ooma.com:3478"
      ]
    }
  ],
  "totalAvailable": 200
}
```

## 🔧 Особенности

### Шифрование:
- ✅ 30 этапов (AES + ChaCha20 + Blowfish + 3DES + XOR)
- ✅ PBKDF2 для деривации ключей (100,000 итераций)
- ✅ Потоковое шифрование файлов
- ✅ Шифрование БД и кэша

### Файлы:
- ✅ Discord через вебхуки (25MB чанки)
- ✅ Telegram через ботов (50MB чанки)
- ✅ Автоматическая сборка при скачивании

### WebRTC:
- ✅ 200+ STUN серверов
- ✅ Автоматическое распределение
- ✅ Redis блокировка (мульти-девайс)

## 🐛 Troubleshooting

### "Cannot find module"
```bash
npm install
```

### "Decryption failed"
- Проверь `ENCRYPTION_KEY` (64 hex символа)
- Проверь `MASTER_KEY` (64 символа)

### "STUN failed"
- Сервер автоматически выбирает другие STUN
- Проверь firewall (порты 3478, 19302)

---

**Nexo Messenger** - Максимальная защита! 🔒
