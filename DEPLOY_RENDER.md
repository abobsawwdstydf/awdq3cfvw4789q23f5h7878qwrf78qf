# 🚀 ДЕПЛОЙ NEXO MESSENGER НА RENDER

## 📋 Быстрый старт (5 минут)

### Шаг 1: Подготовь GitHub

```bash
# В терминале в папке проекта
git init
git add .
git commit -m "Nexo Messenger v2.0 - Pure Node.js"
git branch -M main
git remote add origin https://github.com/abobsawwdstydf/awdq3cfvw4789q23f5h7878qwrf78qf.git
git push -u origin main
```

### Шаг 2: Создай сервис на Render

1. **Зайди на https://render.com**
2. **Войди через GitHub**
3. **Нажми New + → Web Service**
4. **Подключи репозиторий** `awdq3cfvw4789q23f5h7878qwrf78qf`

### Шаг 3: Настрой сервис

| Поле | Значение |
|------|----------|
| **Name** | `nexo-messenger` |
| **Region** | `Frankfurt, Germany` |
| **Branch** | `main` |
| **Root Directory** | `render-server` |
| **Runtime** | `Node` |
| **Build Command** | `npm install && npx prisma generate` |
| **Start Command** | `node server.js` |
| **Instance Type** | `Starter` (бесплатно) |

### Шаг 4: Добавь переменные окружения

Нажми **Advanced** → **Add Environment Variable** и добавь:

```env
NODE_ENV=production
PORT=3001

# JWT Secret (64 символа)
JWT_SECRET=36427af4278b7198dc850c7235c4c85feda7275d89fe3d360c79a1af94579765

# Encryption Key (64 символа hex)
ENCRYPTION_KEY=36427af4278b7198dc850c7235c4c85feda7275d89fe3d360c79a1af94579765

# Database (Neon DB)
DATABASE_URL=postgresql://neondb_owner:npg_DOzU4jR8arce@ep-wandering-dawn-an3qfdn4-pooler.c-6.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require

# Redis Cloud
REDIS_URL=redis://default:Hvu31YHncn7em8jyUpYdpqj0WBC6Y438@redis-17601.c328.europe-west3-1.gce.cloud.redislabs.com:17601

# CORS
CORS_ORIGINS=*

# Discord Webhooks
DISCORD_WEBHOOK_URLS=https://discord.com/api/webhooks/1485562630663049298/N2zoK3IJrfFEEuzQldGF835RHUkb3qBS7WFHDknhJ6ZsmoZfF8tLtl_GyHxfMgcjbYbs,https://discord.com/api/webhooks/1485563746725265418/2mDS_yV88cn3rzPifyLmLdSVJxm3mkC-CdkvCBUv-lFU_NCbGP9hQ5ajjiUFoGGxDZQ7

# Telegram
TELEGRAM_BOT_TOKENS=8758209438:AAEnaXcJ7ke88fjjHNPwQVTt_u9LYrSzPFk,8748554768:AAEnJcHklmilbjih9glo3GITnQXSx4YmM_8,8554202189:AAGN0wLfcgkqK3KJ9XOJFl40rp2kjkIcm1Y,8744960493:AAHB5bn3VxlZWKJjCr70yLYJnVTyXp2zHIs,8687986079:AAGPYjnq4gdXCkf2wT81f0l2tQalKCIIyds,8141008503:AAEaCM1RrN2ppbZmUzhpW4EeLUgT1qQ2QS0,8758985233:AAF7QfRApnccaByBYa1qjGs7u-erQ47OZcQ,8733182475:AAFBitv4g4LVRuvGnssyqHQpttBydeAda9Y,8774720953:AAGvExABKj4Z-DYfKdqF-OMEdoeySeOeOoY,8674460757:AAFm7WVkDx4ISkx22toTQyrQUeGQfLdF8QM

TELEGRAM_CHANNEL_IDS=-1003850596987,-1003878106202,-1003738083520,-1003868880877

# Limits
MAX_FILE_SIZE=53687091200
CHUNK_SIZE=19922944
MAX_REGISTRATIONS_PER_IP=22

# WebRTC
STUN_URLS=stun:stun.l.google.com:19302,stun:stun1.l.google.com:19302
```

### Шаг 5: Deploy!

1. **Нажми "Create Web Service"**
2. **Жди ~2-3 минуты** (первый деплой)
3. **Проверь логи** - должна быть надпись `⚡ Nexo Server v2.0.0 running on port 3001`

### Шаг 6: Инициализация базы

1. **В панели Render открой Shell** (кнопка вверху)
2. **Выполни команду:**
   ```bash
   node init-db.js
   ```
3. **Увидишь:** `✅ Database initialized!`

## ✅ Проверка

### Провери здоровье сервиса:
```bash
curl https://nexo-messenger.onrender.com/api/health
```

### Ожидаемый ответ:
```json
{
  "status": "ok",
  "name": "Nexo Server",
  "version": "2.0.0"
}
```

## 🎯 Тестовые аккаунты

После инициализации базы доступны аккаунты:

| Логин | Пароль |
|-------|--------|
| evgeniy | demo123 |
| anastasia | demo123 |
| artem | demo123 |
| polina | demo123 |
| daniil | demo123 |
| vladimir | demo123 |

## 📱 Фронтенд (веб-клиент)

Фронтенд собирается отдельно:

```bash
# Локально для разработки
npm run dev

# Сборка для production
npm run build
```

Для хостинга фронтенда:
- **Vercel** (бесплатно): подключи GitHub репозиторий
- **Netlify** (бесплатно): drag & drop папки `apps/web/dist`
- **Render Static Site** (бесплатно): создай Static Site сервис

## 🔄 Авто-обновление

При каждом пуше в ветку `main`:
1. GitHub триггерит деплой
2. Render автоматически пересобирает
3. Новый деплой заменяет старый

## 🐛 Troubleshooting

### "Build failed"
```bash
# Проверь логи на Render
# Обычно проблема с зависимостями
npm install --legacy-peer-deps
```

### "Database connection failed"
- Проверь `DATABASE_URL` в переменных
- Убедись что Neon DB активен
- Проверь что SSL включен (`?sslmode=require`)

### "Redis connection failed"
- Проверь `REDIS_URL`
- Убедись что Redis Cloud активен
- Проверь firewall настройки

### "Port already in use"
- Render сам управляет портом через `PORT` env
- Не меняй PORT в настройках Render

### "Cannot find module '@prisma/client'"
```bash
# В Shell на Render:
npx prisma generate
```

## 📊 Мониторинг

### Логи
Render → Твой сервис → **Logs**

### Метрики
Render → Твой сервис → **Metrics**

### База данных
Neon Dashboard → **Metrics**

## 🎨 Кастомизация

### Свой домен
1. Render → Settings → **Custom Domain**
2. Добавь домен
3. Настрой DNS у регистратора

### SSL
Render автоматически предоставляет HTTPS через Let's Encrypt

## 💰 Тарифы Render

### Starter (бесплатно)
- 0.1 CPU
- 512MB RAM
- 750 часов/месяц
- Автосон через 15 мин неактивности

### Standard ($7/мес)
- 0.5 CPU
- 2GB RAM
- Без автосона
- Приоритетная поддержка

## 📞 Поддержка

При проблемах:
1. Проверь логи на Render
2. Проверь консоль браузера (F12)
3. Проверь переменные окружения
4. Напиши в Issues на GitHub

---

**Готово!** Твой мессенджер работает на Render! 🎉

**URL:** `https://nexo-messenger.onrender.com`
