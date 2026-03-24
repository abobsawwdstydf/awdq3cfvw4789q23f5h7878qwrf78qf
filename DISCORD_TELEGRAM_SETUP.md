# 📤 Настройка Discord и Telegram для хранения файлов

## Discord - Настройка вебхуков

### Шаг 1: Создайте Discord сервер

1. Откройте Discord
2. Нажмите "+" → "Create My Own"
3. Создайте сервер для хранения файлов

### Шаг 2: Создайте каналы

Создайте текстовые каналы для разных типов файлов:
- `#files-general` - обычные файлы
- `#files-images` - изображения
- `#files-videos` - видео
- `#files-audio` - аудио

### Шаг 3: Создайте вебхуки

Для каждого канала:

1. **Настройки канала** → **Integrations** → **Webhooks** → **New Webhook**
2. Дайте имя вебхуку (например, "Nexo Files Bot")
3. Выберите канал
4. Скопируйте **Webhook URL**
5. Повторите для каждого канала

### Шаг 4: Добавьте в .env

```env
DISCORD_WEBHOOK_URLS=https://discord.com/api/webhooks/111111111111111111/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA,https://discord.com/api/webhooks/222222222222222222/BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB
```

**Формат:** URL через запятую без пробелов

### Шаг 5: Настройте права доступа

Для каждого вебхука:
- ✅ Send Messages
- ✅ Attach Files
- ✅ Embed Links
- ❌ Mention @everyone (не обязательно)

---

## Telegram - Настройка ботов и каналов

### Шаг 1: Создайте ботов

1. Откройте @BotFather в Telegram
2. Отправьте `/newbot`
3. Введите имя бота (например, "Nexo Files Bot 1")
4. Введите username бота (должен заканчиваться на `bot`, например `nexo_files_1_bot`)
5. Скопируйте **токен бота** (выглядит как `1234567890:AAHdqTcvCH1vGWJxfSeofSAs0K5PALDsaw`)

**Создайте несколько ботов** (рекомендуется 5-10 для надежности):
- `nexo_files_1_bot`
- `nexo_files_2_bot`
- `nexo_files_3_bot`
- и т.д.

### Шаг 2: Создайте приватные каналы

1. В Telegram нажмите "New Channel"
2. Назовите канал (например, "Nexo Files Storage 1")
3. Сделайте канал **Private**
4. Скопируйте **Channel ID** (понадобится позже)

**Как узнать Channel ID:**
- Добавьте бота @getmyid_bot в канал
- Он покажет ID (например, `-1001234567890`)
- Удалите @getmyid_bot после получения ID

**Создайте несколько каналов** для надежности:
- `Nexo Files Storage 1` → `-1001111111111`
- `Nexo Files Storage 2` → `-1002222222222`
- `Nexo Files Storage 3` → `-1003333333333`

### Шаг 3: Добавьте ботов как админов

Для каждого канала:

1. Откройте настройки канала
2. **Administrators** → **Add Admin**
3. Найдите своего бота по username
4. Дайте права:
   - ✅ Post Messages
   - ✅ Edit Messages
   - ✅ Delete Messages
   - ✅ Add Users (не обязательно)
   - ❌ Change Channel Info (не нужно)
   - ❌ Pin Messages (не нужно)

**Повторите для всех ботов и каналов!**

### Шаг 4: Добавьте в .env

```env
# Токены ботов (через запятую)
TELEGRAM_BOT_TOKENS=1234567890:AAHdqTcvCH1vGWJxfSeofSAs0K5PALDsaw,9876543210:BBIdqTcvCH1vGWJxfSeofSAs0K5PALDsaw,1111111111:CCIdqTcvCH1vGWJxfSeofSAs0K5PALDsaw

# ID каналов (через запятую)
TELEGRAM_CHANNEL_IDS=-1001111111111,-1002222222222,-1003333333333
```

**Важно:**
- Порядок ботов и каналов должен совпадать!
- Первый бот → первый канал
- Второй бот → второй канал
- и т.д.

---

## 📊 Как это работает

### Загрузка файлов:

1. **Файл шифруется** (AES-256-GCM)
2. **Разбивается на чанки** (20MB для Discord, 50MB для Telegram)
3. **Каждый чанк загружается** через вебхук/бота
4. **URL/ID чанков сохраняются** в базу данных

### Скачивание файлов:

1. **Получаем данные** из базы
2. **Скачиваем все чанки** из Discord/Telegram
3. **Собираем файл** из чанков
4. **Дешифруем** и отдаем пользователю

---

## 🔐 Шифрование

**ВСЁ шифруется перед загрузкой:**

- ✅ Сообщения (AES-256-GCM)
- ✅ Файлы (потоковое шифрование)
- ✅ Цитаты
- ✅ Контент

**Ключ шифрования:** `ENCRYPTION_KEY` в .env (64 hex символа)

**Сгенерировать ключ:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## 📦 Чанки

### Discord:
- **Размер чанка:** 25MB (лимит Discord)
- **Макс файл:** 50GB (разбивается на ~2000 чанков)
- **Формат имени:** `filename.ext.chunk.0`, `filename.ext.chunk.1`, ...

### Telegram:
- **Размер чанка:** 50MB (лимит Telegram для ботов)
- **Макс файл:** 50GB (разбивается на ~1000 чанков)
- **Формат имени:** `filename.ext.chunk.0`, `filename.ext.chunk.1`, ...

---

## 🎯 Проверка работы

### 1. Проверьте Discord:

Отправьте сообщение с файлом через API:
```bash
curl -X POST https://discord.com/api/webhooks/YOUR_WEBHOOK_ID/YOUR_TOKEN \
  -F "file=@test.txt" \
  -F "payload_json={\"content\":\"test\"}"
```

Если файл появился в канале - ✅ работает!

### 2. Проверьте Telegram:

Отправьте файл через бота:
```bash
curl -X POST "https://api.telegram.org/botYOUR_BOT_TOKEN/sendDocument" \
  -F "chat_id=-1001111111111" \
  -F "document=@test.txt"
```

Если файл появился в канале - ✅ работает!

### 3. Проверьте сервер:

```bash
curl https://your-server.onrender.com/api/health
```

Ответ:
```json
{
  "status": "ok",
  "discord": "2 webhooks",
  "telegram": "3 bots, 3 channels"
}
```

---

## 🐛 Troubleshooting

### "Webhook URL is invalid"
- Убедитесь что URL скопирован полностью
- Проверьте что вебхук активен (не удален)

### "Bot is not a member of the channel"
- Добавьте бота как админа в канал
- Проверьте что Channel ID правильный (с `-100`)

### "File is too large"
- Файл автоматически разбивается на чанки
- Проверьте `MAX_FILE_SIZE` в .env

### "Rate limited"
- Discord: 30 запросов в минуту на вебхук
- Telegram: 30 сообщений в секунду на бота
- Сервер автоматически ждет между загрузками

### "Decryption failed"
- Проверьте что `ENCRYPTION_KEY` правильный
- Убедитесь что ключ 64 hex символа

---

## 💡 Советы

### 1. Используйте несколько вебхуков/ботов

Для надежности создайте:
- **Discord:** 3-5 вебхуков в разных каналах
- **Telegram:** 5-10 ботов в разных каналах

### 2. Регулярно делайте бэкапы

Файлы хранятся в Discord/Telegram, но:
- Экспортируйте важные данные
- Сохраняйте `ENCRYPTION_KEY` в надежном месте

### 3. Мониторьте использование

- Discord: почти безлимитно
- Telegram: боты могут быть забанены при злоупотреблении

### 4. Оптимизируйте размер чанков

Для быстрых файлов уменьшите `CHUNK_SIZE`:
```env
CHUNK_SIZE=10485760  # 10MB
```

---

## ✅ Готово!

Теперь файлы хранятся в Discord и Telegram:
- ✅ Зашифрованы
- ✅ Разбиты на чанки
- ✅ Надежно
- ✅ Бесплатно
- ✅ Безлимитно

**Nexo Messenger** - Полная приватность! 🔒
