# Nexo Messenger - Deployment Guide

## 🚀 Быстрый старт для Render

### 1. Подготовка базы данных

#### Neon DB (PostgreSQL)
1. Перейдите на [neon.tech](https://neon.tech)
2. Создайте новый проект
3. Скопируйте connection string
4. Вставьте в `.env` как `DATABASE_URL`

#### Redis Cloud
1. Перейдите на [redis.com/cloud](https://redis.com/cloud)
2. Создайте бесплатный Redis инстанс
3. Скопируйте connection string
4. Вставьте в `.env` как `REDIS_URL`

### 2. Настройка GitHub репозитория

```bash
git init
git add .
git commit -m "Initial Nexo Messenger commit"
git branch -M main
git remote add origin https://github.com/abobsawwdstydf/awdq3cfvw4789q23f5h7878qwrf78qf.git
git push -u origin main
```

### 3. Деплой на Render

#### Вариант A: Автоматический деплой через GitHub Actions
1. В настройках GitHub репозитория добавьте Secrets:
   - `RENDER_SERVICE_ID` - ID сервиса Render
   - `RENDER_API_KEY` - API ключ Render
   - `DATABASE_URL` - Connection string Neon DB
   - `JWT_SECRET` - Секретный ключ JWT
   - `ENCRYPTION_KEY` - Ключ шифрования (64 символа)

2. GitHub Actions автоматически задеплоит при пуше в main

#### Вариант B: Ручной деплой через Render Dashboard
1. Создайте новый Web Service на Render
2. Подключите GitHub репозиторий
3. Настройте переменные окружения:
   ```
   NODE_ENV=production
   PORT=3001
   DATABASE_URL=postgresql://...
   REDIS_URL=redis://...
   JWT_SECRET=your-jwt-secret
   ENCRYPTION_KEY=your-encryption-key
   CORS_ORIGINS=*
   DISCORD_WEBHOOK_URLS=https://discord.com/api/webhooks/...
   TELEGRAM_BOT_TOKENS=bot1,bot2,...
   TELEGRAM_CHANNEL_IDS=-100xxx,-100yyy,...
   ```
4. Deploy

### 4. Конфигурация вебхуков

#### Discord Webhooks
1. Создайте Discord сервер и канал
2. Настройки канала → Интеграции → Webhooks
3. Создайте webhook и скопируйте URL
4. Добавьте в `.env` через запятую несколько webhook'ов

#### Telegram каналы
1. Создайте приватный Telegram канал
2. Добавьте бота из `TELEGRAM_BOT_TOKENS` как админа
3. Узнайте ID канала (через @getmyid_bot или аналогичный)
4. Добавьте ID в `TELEGRAM_CHANNEL_IDS` через запятую

### 5. Команды для Render

#### Start Command
```bash
npm install && npm run build && npm run start
```

#### Build Command
```bash
npm run build
```

#### Database Migration
```bash
npm run db:push
```

## 📁 Структура проекта

```
telega/
├── apps/
│   ├── server/          # Express + Socket.IO + Prisma
│   │   ├── src/
│   │   │   ├── routes/  # API endpoints
│   │   │   ├── socket/  # WebSocket handlers
│   │   │   ├── config.ts
│   │   │   ├── db.ts
│   │   │   ├── redis.ts # Redis cache
│   │   │   └── webhooks.ts # Discord/Telegram
│   │   └── prisma/
│   │       └── schema.prisma
│   └── web/             # React + Vite
│       ├── src/
│       │   ├── components/
│       │   ├── pages/
│       │   ├── stores/
│       │   └── lib/
│       └── public/
├── sounds/              # Звуки звонков
├── .env                 # Переменные окружения
├── render.yaml          # Render конфигурация
└── package.json
```

## 🔧 Основные изменения

### 1. Переименование Nimbus → Nexo
- Все упоминания в коде заменены
- Логотип и favicon обновлены

### 2. База данных
- SQLite → PostgreSQL (Neon DB)
- Добавлена поддержка Redis для кэширования

### 3. Вебхуки
- Discord для хранения файлов
- Telegram для уведомлений

### 4. Звонки
- Объединенная кнопка выбора типа звонка
- Поддержка аудио и видео звонков
- Исправлены баги с несколькими устройствами

### 5. UI/UX
- Адаптивный дизайн для мобильных
- Плавающие окна звонков
- Редактирование сообщений

## 🎯 API Endpoints

### Auth
- `POST /api/auth/register` - Регистрация
- `POST /api/auth/login` - Вход
- `GET /api/auth/me` - Проверка токена

### Users
- `GET /api/users/:id` - Профиль пользователя
- `PUT /api/users/:id` - Обновление профиля
- `POST /api/users/avatar` - Загрузка аватара

### Chats
- `GET /api/chats` - Список чатов
- `POST /api/chats` - Создание чата
- `GET /api/chats/:id` - Детали чата

### Messages
- `GET /api/messages/:chatId` - История сообщений
- `POST /api/messages` - Отправка сообщения
- `PUT /api/messages/:id` - Редактирование
- `DELETE /api/messages/:id` - Удаление

### Friends
- `POST /api/friends/request` - Запрос в друзья
- `POST /api/friends/accept` - Принять запрос
- `DELETE /api/friends/:id` - Удалить друга

## 🔐 Безопасность

### Шифрование
- AES-256-GCM для сообщений
- Ключ в `ENCRYPTION_KEY` (64 hex символа)

### Rate Limiting
- 20 запросов на 15 минут для auth
- 1000 запросов в минуту для API
- Максимум регистраций с одного IP: 22

### CORS
- Настройте `CORS_ORIGINS` для production
- По умолчанию: `*` (разрешено всё)

## 📊 Мониторинг

### Логи
Render автоматически собирает логи. Для просмотра:
```bash
render logs --service <service-id>
```

### Здоровье
- `GET /api/health` - Проверка статуса
- `GET /api/ice-servers` - STUN/TURN серверы

## 🐛 Troubleshooting

### Ошибка подключения к базе
```
Error: Can't reach database server
```
Решение: Проверьте `DATABASE_URL` и whitelist IP в Neon Dashboard

### Ошибка Redis
```
Redis connection failed
```
Решение: Проверьте `REDIS_URL` и настройки firewall в Redis Cloud

### Файлы не загружаются
Решение: Проверьте Discord webhook URLs и права доступа

### Звонки не работают
Решение: 
1. Проверьте HTTPS (WebRTC требует HTTPS)
2. Настройте TURN сервер для production
3. Проверьте firewall и порты

## 📱 Мобильная версия

Приложение полностью адаптировано для мобильных устройств:
- Responsive дизайн
- Touch-friendly интерфейс
- PWA поддержка
- Offline режим (кэширование)

## 🎨 Кастомизация

### Тема
Измените цвета в `tailwind.config.js`:
```js
theme: {
  extend: {
    colors: {
      'nexo-primary': '#6366f1',
      'nexo-secondary': '#8b5cf6',
    }
  }
}
```

### Логотип
Замените `/logo.png` на свой файл

### Звуки
Добавьте свои звуки в `/sounds/`:
- `call_sound.mp3` - Звонок
- `call_sound_2.mp3` - Сброс звонка
- `user_join.mp3` - Присоединение к звонку

## 📞 Поддержка

Для вопросов и предложений:
- GitHub Issues
- Telegram канал
- Discord сервер

---

**Nexo Messenger** - Современный мессенджер с фокусом на приватность и удобство.
