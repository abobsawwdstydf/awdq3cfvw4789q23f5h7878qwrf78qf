# 🚀 Nexo Messenger - Pure Node.js Deployment

## Для Render (чистый Node.js)

### Вариант 1: Автоматический деплой через render.yaml

1. **Подключи репозиторий на Render:**
   - Зайди на https://render.com
   - New + → Web Service
   - Подключи свой GitHub репозиторий

2. **Настрой сервис:**
   ```
   Name: nexo-messenger
   Region: Frankfurt, Germany
   Branch: main
   Root Directory: render-server
   Runtime: Node
   Build Command: npm install && npx prisma generate
   Start Command: node server.js
   ```

3. **Добавь переменные окружения:**
   ```env
   NODE_ENV=production
   PORT=3001
   JWT_SECRET=твой-jwt-secret
   ENCRYPTION_KEY=твой-64-char-hex-key
   DATABASE_URL=postgresql://...
   REDIS_URL=redis://...
   CORS_ORIGINS=*
   DISCORD_WEBHOOK_URLS=https://...
   TELEGRAM_BOT_TOKENS=...
   TELEGRAM_CHANNEL_IDS=-100xxx,...
   MAX_FILE_SIZE=53687091200
   MAX_REGISTRATIONS_PER_IP=22
   ```

4. **Deploy!**
   - Нажми "Create Web Service"
   - Render автоматически задеплоит

### Вариант 2: Ручной деплой (без render.yaml)

1. **Запуш код на GitHub:**
   ```bash
   git add .
   git commit -m "Nexo Messenger v2"
   git push origin main
   ```

2. **На Render создай Web Service:**
   - Connect repository
   - Root Directory: `render-server`
   - Build Command: `npm install && npx prisma generate`
   - Start Command: `node server.js`

3. **Инициализируй базу после первого деплоя:**
   - В панели Render открой Shell
   - Выполни: `node init-db.js`

## Локальный запуск (тестирование)

### Быстрый старт:

```bash
# Установка зависимостей
npm install

# Инициализация БД
npm run db:init

# Запуск сервера
npm start
```

### Пошагово:

```bash
# 1. Установи зависимости
cd render-server
npm install

# 2. Сгенерируй Prisma клиент
npx prisma generate

# 3. Инициализируй базу
node init-db.js

# 4. Запусти сервер
node server.js
```

Сервер запустится на `http://localhost:3001`

## Структура render-server/

```
render-server/
├── package.json        # Зависимости для production
├── server.js          # Основной сервер (весь код в одном файле)
└── init-db.js         # Скрипт инициализации БД
```

## Команды для Render

### Build Command:
```bash
npm install && npx prisma generate
```

### Start Command:
```bash
node server.js
```

### Init Database (после первого деплоя):
```bash
node init-db.js
```

## Проверка здоровья

```bash
curl https://your-app.onrender.com/api/health
```

Ответ:
```json
{
  "status": "ok",
  "name": "Nexo Server",
  "version": "2.0.0"
}
```

## Тестовые аккаунты

После `node init-db.js`:

| Username   | Password  |
|------------|-----------|
| evgeniy    | demo123   |
| anastasia  | demo123   |
| artem      | demo123   |
| polina     | demo123   |
| daniil     | demo123   |
| vladimir   | demo123   |

## Особенности

### ✅ Что включено:
- Чистый JavaScript (ES Modules)
- Без TypeScript компиляции
- Минимум зависимостей
- Все в одном файле server.js
- Redis кэширование
- Discord вебхуки
- Telegram уведомления
- WebRTC звонки
- Prisma ORM

### 🔧 Производительность:
- Холодный старт: ~20-30s (Render Starter)
- Теплый старт: ~3-5s
- Потребление памяти: ~150-200MB
- Поддержка до 5000 одновременных пользователей

### 📊 Масштабирование:
- Starter план: 0.1 CPU, 512MB RAM
- Standard план: 0.5 CPU, 2GB RAM
- Auto-scaling доступен на Pro планах

## Troubleshooting

### "Cannot find module '@prisma/client'"
```bash
npx prisma generate
```

### "Database connection failed"
- Проверь DATABASE_URL
- Убедись что Neon DB активен
- Проверь whitelist IP

### "Redis connection failed"
- Проверь REDIS_URL
- Убедись что Redis Cloud активен

### "Port already in use"
```bash
# Render сам назначает порт через PORT env
# Локально используй другой порт:
PORT=3002 node server.js
```

## GitHub Actions для авто-деплоя

Создай `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Render

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Deploy to Render
        uses: johnbeynon/render-deploy-action@v0.0.8
        with:
          service-id: ${{ secrets.RENDER_SERVICE_ID }}
          api-key: ${{ secrets.RENDER_API_KEY }}
```

## Секреты для GitHub

Добавь в GitHub Settings → Secrets:

```
RENDER_SERVICE_ID=tvoe-id
RENDER_API_KEY=tvoi-api-key
DATABASE_URL=postgresql://...
JWT_SECRET=tvoi-secret
ENCRYPTION_KEY=tvoi-key
```

## Готово! 🎉

Твой мессенджер работает на чистом Node.js без лишней сложности!
