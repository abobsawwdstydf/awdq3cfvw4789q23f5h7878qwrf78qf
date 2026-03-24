# 📞 WebRTC Звонки - Настройка

## Как это работает

Звонки работают **полностью через сервер** без внешних API:

```
Клиент A ←→ Socket.IO ←→ Клиент B
           (сервер)
```

### Протокол звонка:

1. **Инициация звонка**
   ```
   Клиент A → Сервер: call_offer (SDP offer)
   Сервер → Клиент B: call_incoming
   ```

2. **Принятие звонка**
   ```
   Клиент B → Сервер: call_answer (SDP answer)
   Сервер → Клиент A: call_answer
   ```

3. **Обмен ICE кандидатами**
   ```
   Клиент A/B ↔ Сервер ↔ Клиент B/A
   (call_ice кандидаты)
   ```

4. **Завершение звонка**
   ```
   Клиент A → Сервер: call_end
   Сервер → Клиент B: call_end
   ```

## ICE Серверы

### STUN (бесплатно, уже настроено)

Сервер использует бесплатные STUN серверы Google:
```javascript
stun:stun.l.google.com:19302
stun:stun1.l.google.com:19302
```

**STUN достаточно для:**
- Звонков между клиентами в одной сети
- Звонков через NAT с пробросом портов
- Большинства сценариев использования

### TURN (опционально, для сложных случаев)

**TURN нужен если:**
- Клиенты за симметричным NAT
- Прямое соединение не устанавливается
- Корпоративные файрволы

#### Настройка своего TURN сервера:

1. **Установите coturn (Ubuntu/Debian):**
   ```bash
   sudo apt install coturn
   ```

2. **Настройте `/etc/turnserver.conf`:**
   ```
   listening-port=3478
   tls-listening-port=5349
   listener-ip=YOUR_SERVER_IP
   realm=nexo-messenger
   server-name=nexo-messenger
   lt-cred-mech
   user=nexo:your-secret-password
   total-quota=100
   stale-nonce=600
   cert=/etc/turnserver/cert.pem
   pkey=/etc/turnserver/pkey.pem
   ```

3. **Запустите coturn:**
   ```bash
   sudo systemctl start coturn
   sudo systemctl enable coturn
   ```

4. **Добавьте в `.env`:**
   ```env
   TURN_URL=turn:YOUR_SERVER_IP:3478
   TURN_SECRET=your-secret-password
   ```

## Настройка на клиенте

### Получение ICE серверов:

```javascript
const response = await fetch('/api/ice-servers', {
  headers: { 'Authorization': `Bearer ${token}` }
});
const { iceServers } = await response.json();

// iceServers = {
//   iceServers: [
//     { urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] }
//   ]
// }
```

### Создание PeerConnection:

```javascript
const pc = new RTCPeerConnection({
  iceServers: iceServers.iceServers
});
```

## Socket.IO События

### Клиент → Сервер:

| Событие | Описание |
|---------|----------|
| `call_start` | Начало звонка |
| `call_offer` | SDP offer |
| `call_answer` | SDP answer |
| `call_ice` | ICE кандидат |
| `call_end` | Завершение звонка |
| `call_decline` | Отклонение звонка |

### Сервер → Клиент:

| Событие | Описание |
|---------|----------|
| `call_incoming` | Входящий звонок |
| `call_answer` | Ответ на звонок |
| `call_ice` | ICE кандидат |
| `call_end` | Звонок завершен |
| `call_decline` | Звонок отклонен |
| `call_error` | Ошибка звонка |

## Пример кода клиента

### Исходящий звонок:

```javascript
// 1. Получаем ICE серверы
const { iceServers } = await fetch('/api/ice-servers').then(r => r.json());

// 2. Создаем PeerConnection
const pc = new RTCPeerConnection({ iceServers: iceServers.iceServers });

// 3. Добавляем локальный поток
const stream = await navigator.mediaDevices.getUserMedia({ 
  audio: true, 
  video: true 
});
stream.getTracks().forEach(track => pc.addTrack(track, stream));

// 4. Создаем offer
const offer = await pc.createOffer();
await pc.setLocalDescription(offer);

// 5. Отправляем через Socket.IO
socket.emit('call_offer', {
  targetUserId: 'user-id',
  offer: pc.localDescription,
  callType: 'video'
});

// 6. Обрабатываем ICE кандидаты
pc.onicecandidate = (e) => {
  if (e.candidate) {
    socket.emit('call_ice', {
      targetUserId: 'user-id',
      candidate: e.candidate
    });
  }
};

// 7. Обрабатываем ответ
socket.on('call_answer', async (data) => {
  await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
});

// 8. Обрабатываем удаленный поток
pc.ontrack = (e) => {
  remoteVideoRef.current.srcObject = e.streams[0];
};
```

### Входящий звонок:

```javascript
// 1. Получаем ICE серверы
const { iceServers } = await fetch('/api/ice-servers').then(r => r.json());

// 2. Создаем PeerConnection
const pc = new RTCPeerConnection({ iceServers: iceServers.iceServers });

// 3. Получаем локальный поток
const stream = await navigator.mediaDevices.getUserMedia({ 
  audio: true, 
  video: true 
});
stream.getTracks().forEach(track => pc.addTrack(track, stream));

// 4. Обрабатываем offer
socket.on('call_incoming', async (data) => {
  await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
  
  // 5. Создаем answer
  const answer = await pc.createAnswer();
  await pc.setLocalDescription(answer);
  
  // 6. Отправляем answer
  socket.emit('call_answer', {
    targetUserId: data.from,
    answer: pc.localDescription
  });
});

// 7. Обрабатываем ICE кандидаты
pc.onicecandidate = (e) => {
  if (e.candidate) {
    socket.emit('call_ice', {
      targetUserId: data.from,
      candidate: e.candidate
    });
  }
};

// 8. Обрабатываем удаленный поток
pc.ontrack = (e) => {
  remoteVideoRef.current.srcObject = e.streams[0];
};
```

## Защита от проблем

### Мульти-девайс синхронизация

Сервер использует Redis для блокировки пользователей в звонке:

```javascript
// Проверка перед звонком
const targetInCall = await redis.get(`call:${targetUserId}`);
if (targetInCall) {
  socket.emit('call_error', { message: 'User is busy' });
  return;
}

// Блокировка при звонке
await redis.setex(`call:${socket.user.id}`, 300, JSON.stringify({
  inCall: true,
  with: targetUserId
}));
```

### Таймауты

- **Звонок не принят:** 15 секунд
- **Сессия звонка:** 5 минут в Redis
- **Reconnect:** автоматический

## Тестирование

### Проверка соединения:

1. Откройте 2 браузера
2. Залогиньтесь под разными аккаунтами
3. Нажмите кнопку звонка
4. Выберите аудио/видео
5. Принимите звонок

### Логи сервера:

```
✓ User connected: username
✓ call_offer sent to user-id
✓ call_answer received from user-id
✓ ICE candidates exchanged
✓ Call established
```

## Проблемы и решения

### "No ICE candidates"
- Проверьте firewall (порты 3478, 5349 для TURN)
- Убедитесь что NAT проброшен
- Используйте TURN вместо STUN

### "Connection failed"
- Проверьте CORS настройки
- Убедитесь что WebSocket работает
- Проверьте firewall

### "One-way audio"
- Проверьте что оба клиента отправили ICE кандидаты
- Убедитесь что tracks добавлены правильно
- Проверьте разрешения браузера

## Готово!

Звонки работают полностью через ваш сервер без внешних API! 🎉
