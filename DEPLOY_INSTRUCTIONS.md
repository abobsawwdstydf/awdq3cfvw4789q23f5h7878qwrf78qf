# 🚀 Инструкция по деплою Nexo Messenger

## Быстрый старт

### 1. Подготовка GitHub репозитория

```bash
# В директории проекта
git init
git add .
git commit -m "Nexo Messenger - initial commit"
git branch -M main
git remote add origin https://github.com/abobsawwdstydf/awdq3cfvw4789q23f5h7878qwrf78qf.git
git push -u origin main
```

### 2. Настройка переменных окружения

Создайте файл `.env` на основе `.env.example` с вашими данными:

```env
# Server
PORT=3001
NODE_ENV=production
JWT_SECRET=36427af4278b7198dc850c7235c4c85feda7275d89fe3d360c79a1af94579765
CORS_ORIGINS=*

# Database (Neon DB)
DATABASE_URL="postgresql://neondb_owner:npg_DOzU4jR8arce@ep-wandering-dawn-an3qfdn4-pooler.c-6.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

# Encryption
ENCRYPTION_KEY=36427af4278b7198dc850c7235c4c85feda7275d89fe3d360c79a1af94579765
DB_ENCRYPTION_ENABLED=true
MASTER_KEY=0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef

# Redis Cloud
REDIS_URL=redis://default:Hvu31YHncn7em8jyUpYdpqj0WBC6Y438@redis-17601.c328.europe-west3-1.gce.cloud.redislabs.com:17601

# Discord Webhooks
DISCORD_WEBHOOK_URLS=https://discord.com/api/webhooks/1485562630663049298/N2zoK3IJrfFEEuzQldGF835RHUkb3qBS7WFHDknhJ6ZsmoZfF8tLtl_GyHxfMgcjbYbs,https://discord.com/api/webhooks/1485563746725265418/2mDS_yV88cn3rzPifyLmLdSVJxm3mkC-CdkvCBUv-lFU_NCbGP9hQ5ajjiUFoGGxDZQ7

# Telegram
TELEGRAM_BOT_TOKENS=8758209438:AAEnaXcJ7ke88fjjHNPwQVTt_u9LYrSzPFk,8748554768:AAEnJcHklmilbjih9glo3GITnQXSx4YmM_8
TELEGRAM_CHANNEL_IDS=-1003850596987,-1003878106202

# Limits
MAX_FILE_SIZE=53687091200
CHUNK_SIZE=19922944
MAX_REGISTRATIONS_PER_IP=22

# WebRTC
STUN_URLS=stun:stun.l.google.com:19302,stun:stun1.l.google.com:19302
```

### 3. Деплой на Render

#### Шаг 3.1: Создание сервиса на Render

1. Перейдите на [render.com](https://render.com)
2. Войдите через GitHub
3. Нажмите **New +** → **Web Service**
4. Подключите ваш репозиторий

#### Шаг 3.2: Настройка сервиса

**Basic Settings:**
- Name: `nexo-messenger`
- Region: `Frankfurt, Germany`
- Branch: `main`
- Root Directory: (оставьте пустым)
- Runtime: `Node`
- Build Command: `npm install && npm run build`
- Start Command: `npm run start`

**Environment Variables:**
Добавьте все переменные из `.env` файла

**Instance Size:**
- Plan: `Starter` (бесплатно) или `Standard` для production

#### Шаг 3.3: База данных

Render автоматически подключится к Neon DB по `DATABASE_URL`.

#### Шаг 3.4: Деплой

Нажмите **Create Web Service** - начнется автоматический деплой.

### 4. Настройка GitHub Secrets (для CI/CD)

В репозитории GitHub перейдите в **Settings** → **Secrets and variables** → **Actions** → **New repository secret**:

```
RENDER_SERVICE_ID=your-service-id
RENDER_API_KEY=your-api-key
DATABASE_URL=postgresql://...
JWT_SECRET=your-jwt-secret
ENCRYPTION_KEY=your-encryption-key
```

### 5. Инициализация базы данных

После первого деплоя выполните миграцию:

```bash
# Через SSH или консоль Render
npm run db:push
```

Или добавьте в Start Command:
```bash
npm run db:push && npm run start
```

## 📋 Чеклист после деплоя

- [ ] Проверить доступность API: `https://your-app.onrender.com/api/health`
- [ ] Проверить подключение к базе данных
- [ ] Проверить работу WebSocket
- [ ] Протестировать регистрацию/вход
- [ ] Проверить загрузку файлов (Discord webhook)
- [ ] Проверить уведомления (Telegram)
- [ ] Протестировать звонки (WebRTC)
- [ ] Проверить мобильную версию

## 🔧 Решение проблем

### Ошибка: "Can't connect to database"
- Проверьте `DATABASE_URL` в переменных окружения
- Убедитесь, что Neon DB активен
- Проверьте whitelist IP (если есть)

### Ошибка: "Redis connection failed"
- Проверьте `REDIS_URL`
- Убедитесь, что Redis Cloud активен
- Проверьте firewall настройки

### Файлы не загружаются
- Проверьте Discord webhook URLs
- Убедитесь, что бот имеет права в канале
- Проверьте размер файлов (лимит 20GB)

### Звонки не работают
- Убедитесь, что используется HTTPS (WebRTC требует)
- Настройте TURN сервер для production
- Проверьте firewall и порты

## 📊 Мониторинг

### Логи в Render
```
Dashboard → Your Service → Logs
```

### Метрики
```
Dashboard → Your Service → Metrics
```

### База данных
```
Neon Dashboard → Your Project → Metrics
```

## 🎯 Дополнительные настройки

### Кастомизация домена
1. В Render Dashboard → Settings → Custom Domain
2. Добавьте свой домен
3. Настройте DNS записи

### SSL сертификат
Render автоматически предоставляет HTTPS через Let's Encrypt.

### Автоматический рестарт
Render автоматически перезапускает сервис при изменении кода в main ветке.

## 📱 Тестирование

### Тестовые аккаунты
После `npm run db:seed`:
- Логин: `evgeniy`, `anastasia`, `artem`, `polina`, `daniil`, `vladimir`
- Пароль: `demo123`

### Проверка звонков
1. Откройте приложение в двух браузерах
2. Залогиньтесь под разными аккаунтами
3. Нажмите кнопку звонка
4. Выберите аудио или видео
5. Проверьте качество связи

## 🎨 Кастомизация

### Изменение названия
Замените все упоминания "Nexo" на ваше название в:
- `apps/web/index.html`
- `apps/web/src/components/Sidebar.tsx`
- `apps/server/src/index.ts`

### Изменение логотипа
Замените файл `apps/web/public/logo.png`

### Изменение цветов
Отредактируйте `tailwind.config.js`:
```js
colors: {
  'primary': '#6366f1',
  'secondary': '#8b5cf6',
}
```

## 📞 Поддержка

При возникновении проблем:
1. Проверьте логи в Render Dashboard
2. Проверьте консоль браузера (F12)
3. Проверьте переменные окружения
4. Обратитесь в поддержку Render или Neon

---

**Готово!** Ваш мессенджер Nexo запущен и готов к использованию! 🎉
