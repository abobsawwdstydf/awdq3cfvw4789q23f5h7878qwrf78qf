# 🚀 Nexo Messenger - Деплой на Render

## 📋 Быстрый старт (10 минут)

### Шаг 1: Подготовь GitHub

```bash
git init
git add .
git commit -m "Nexo Messenger v2.0 - Ultra Secure"
git branch -M main
git remote add origin https://github.com/abobsawwdstydf/awdq3cfvw4789q23f5h7878qwrf78qf.git
git push -u origin main
```

### Шаг 2: Создай сервис на Render

1. **Зайди на https://render.com**
2. **Войди через GitHub**
3. **New + → Web Service**
4. **Подключи репозиторий**

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

**Обязательные (11 переменных):**

```env
# Server
NODE_ENV=production
PORT=3001

# JWT Secret (64 символа)
JWT_SECRET=36427af4278b7198dc850c7235c4c85feda7275d89fe3d360c79a1af94579765

# Encryption Key (64 hex символа) - ВСЁ шифруется!
ENCRYPTION_KEY=36427af4278b7198dc850c7235c4c85feda7275d89fe3d360c79a1af94579765

# Master Key для многоуровневого шифрования
MASTER_KEY=0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef

# Database (Neon DB)
DATABASE_URL=postgresql://neondb_owner:npg_DOzU4jR8arce@ep-wandering-dawn-an3qfdn4-pooler.c-6.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require

# Redis Cloud (обязательно для звонков)
REDIS_URL=redis://default:Hvu31YHncn7em8jyUpYdpqj0WBC6Y438@redis-17601.c328.europe-west3-1.gce.cloud.redislabs.com:17601

# CORS
CORS_ORIGINS=*

# Discord Webhooks (для файлов)
DISCORD_WEBHOOK_URLS=https://discord.com/api/webhooks/1485562630663049298/N2zoK3IJrfFEEuzQldGF835RHUkb3qBS7WFHDknhJ6ZsmoZfF8tLtl_GyHxfMgcjbYbs

# Telegram (для файлов)
TELEGRAM_BOT_TOKENS=8758209438:AAEnaXcJ7ke88fjjHNPwQVTt_u9LYrSzPFk
TELEGRAM_CHANNEL_IDS=-1003850596987

# Лимиты
MAX_FILE_SIZE=53687091200
CHUNK_SIZE=20971520
MAX_REGISTRATIONS_PER_IP=22
```

### Шаг 5: Deploy!

1. **Нажми "Create Web Service"**
2. **Жди 3-5 минут** (первый деплой)
3. **Проверь логи** - должна быть надпись:
   ```
   ⚡ Nexo Server v2.0.0 - ULTRA SECURE
   🔒 Encryption: ULTRA (30 rounds + combo)
   📞 WebRTC: ENABLED (200+ STUN servers)
   ```

### Шаг 6: Инициализация базы

1. **В панели Render открой Shell**
2. **Выполни:**
   ```bash
   node init-db.js
   ```
3. **Увидишь:** `✅ Database initialized!`

## ✅ Проверка

### Health check:
```bash
curl https://nexo-messenger.onrender.com/api/health
```

**Ответ:**
```json
{
  "status": "ok",
  "name": "Nexo Server",
  "version": "2.0.0",
  "encryption": "ULTRA (30 rounds + combo)",
  "discord": "1 webhooks",
  "telegram": "1 bots",
  "stunServers": 200
}
```

### ICE серверы:
```bash
curl https://nexo-messenger.onrender.com/api/ice-servers -H "Authorization: Bearer YOUR_TOKEN"
```

## 🎯 Тестовые аккаунты

После инициализации:

| Логин | Пароль |
|-------|--------|
| evgeniy | demo123 |
| anastasia | demo123 |
| artem | demo123 |
| polina | demo123 |
| daniil | demo123 |
| vladimir | demo123 |

## 🔐 Шифрование

### 30 этапов шифрования:

1. **Этапы 1-10:** AES-256-GCM (разные IV)
2. **Этапы 11-15:** ChaCha20-Poly1305
3. **Этапы 16-20:** AES-256-CBC
4. **Этапы 21-25:** Blowfish
5. **Этапы 26-28:** Triple DES
6. **Этап 29:** XOR с ключом
7. **Этап 30:** Сжатие + Base64

**Без ключа расшифровать НЕВОЗМОЖНО!**

### Что шифруется:
- ✅ Сообщения (30 этапов)
- ✅ Файлы (потоковое шифрование)
- ✅ Цитаты (30 этапов)
- ✅ Контент (всё)
- ✅ Базы данных (шифрование на уровне приложения)
- ✅ Кэш Redis (шифрование)

### Уровни шифрования:

```
Клиент → Шифрование (AES-256) → Сервер
       ↓
Сервер → Шифрование (30 этапов) → Discord/Telegram
       ↓
БД → Шифрование полей → Хранение
```

## 📞 WebRTC звонки

### STUN серверы (200+ штук):

**Автоматическое распределение:**
- Сервер выбирает 5 случайных STUN из пула
- Балансировка нагрузки
- Если один не работает - используется другой

**Основные:**
- Google (5 серверов)
- Mozilla
- Mit.de
- Ekiga.net
- И еще 200+

### Как работает:

```
1. Клиент получает 5 STUN серверов
2. Пробует подключиться к каждому
3. Выбирает лучший (минимальный пинг)
4. Устанавливает соединение
```

## 📦 Файлы в Discord/Telegram

### Загрузка:
```
1. Файл шифруется (потоковое AES-256)
2. Разбивается на чанки (20MB)
3. Каждый чанк загружается в Discord/Telegram
4. URL/ID сохраняются в БД
```

### Скачивание:
```
1. Получаем данные из БД
2. Скачиваем все чанки
3. Собираем файл
4. Дешифруем
5. Отдаем пользователю
```

## 🐛 Troubleshooting

### "Build failed"
```bash
# Проверь логи на Render
# Обычно проблема с зависимостями
npm install --legacy-peer-deps
```

### "Database connection failed"
- Проверь `DATABASE_URL`
- Убедись что SSL включен (`?sslmode=require`)
- Проверь Neon Dashboard

### "Redis connection failed"
- Проверь `REDIS_URL`
- Убедись что Redis Cloud активен
- Проверь firewall

### "Discord webhook failed"
- Проверь URL вебхука
- Убедись что вебхук активен
- Проверь права канала

### "Telegram bot blocked"
- Добавь бота как админа в канал
- Проверь Channel ID (с `-100`)
- Проверь токен бота

### "Encryption failed"
- Проверь `ENCRYPTION_KEY` (64 hex символа)
- Проверь `MASTER_KEY` (64 символа)
- Убедись что ключи правильные

## 📊 Мониторинг

### Логи:
Render → Твой сервис → **Logs**

### Метрики:
Render → Твой сервис → **Metrics**

### База данных:
Neon Dashboard → **Metrics**

### Redis:
Redis Cloud Dashboard → **Metrics**

## 💰 Тарифы

### Render Starter (бесплатно):
- 0.1 CPU
- 512MB RAM
- 750 часов/месяц
- Автосон через 15 мин

### Render Standard ($7/мес):
- 0.5 CPU
- 2GB RAM
- Без автосона
- Рекомендуется для production

## 🎁 Бонусы

### Авто-деплой:
При каждом пуше в `main`:
1. GitHub триггерит деплой
2. Render пересобирает
3. Новый деплой заменяет старый

### Health checks:
Render автоматически проверяет `/api/health` каждые 5 минут

### Логи:
Все логи сохраняются 30 дней (бесплатно)

## 📖 Документация

- `DISCORD_TELEGRAM_SETUP.md` - настройка Discord и Telegram
- `WEBRTC_SETUP.md` - настройка звонков
- `AUTONOMOUS_SERVER.md` - информация о сервере

## ✅ Готово!

Твой мессенджер работает на Render! 🎉

**URL:** `https://nexo-messenger.onrender.com`

**Защита:**
- 🔒 30 этапов шифрования
- 🔒 AES-256-GCM + ChaCha20 + Blowfish + 3DES
- 🔒 Файлы в Discord/Telegram
- 🔒 200+ STUN серверов
- 🔒 Redis кэш

**Всё работает автономно!**
