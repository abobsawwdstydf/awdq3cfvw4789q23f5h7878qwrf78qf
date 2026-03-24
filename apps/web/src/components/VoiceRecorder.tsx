import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Video, X, Lock, Send, Trash2 } from 'lucide-react';

interface VoiceRecorderProps {
  chatId: string;
  onRecordingStart: () => void;
  onRecordingStop: () => void;
  onSendVoice: (blob: Blob, duration: number) => void;
  onSendVideo: (blob: Blob, duration: number) => void;
}

const MAX_VIDEO_DURATION = 90; // 1:30 для видеокружков
const MIN_RECORDING_TIME = 0.5; // Минимальное время записи

export default function VoiceRecorder({
  chatId,
  onRecordingStart,
  onRecordingStop,
  onSendVoice,
  onSendVideo
}: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isVideoMode, setIsVideoMode] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [cancelProgress, setCancelProgress] = useState(0);
  const [showMaxWarning, setShowMaxWarning] = useState(false);
  const [lockHint, setLockHint] = useState(false);
  const [errorToast, setErrorToast] = useState<string | null>(null);
  const [showModeHint, setShowModeHint] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval>>(undefined);
  const videoPreviewRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const startPosRef = useRef<{ x: number; y: number } | null>(null);
  const currentPosRef = useRef<{ x: number; y: number } | null>(null);
  const isDraggingRef = useRef(false);
  const hasShownLockHintRef = useRef(false);
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const isLongPressRef = useRef(false);

  // Запрос разрешений
  const requestPermissions = useCallback(async () => {
    try {
      // Запрашиваем доступ к микрофону
      const audioPermission = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioPermission.getTracks().forEach(track => track.stop());

      // Если видеорежим - запрашиваем камеру
      if (isVideoMode) {
        const videoPermission = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 640 }, height: { ideal: 640 }, facingMode: 'user' }
        });
        videoPermission.getTracks().forEach(track => track.stop());
      }

      return true;
    } catch (err) {
      console.error('Permission error:', err);
      return false;
    }
  }, [isVideoMode]);

  // Старт записи
  const startRecording = useCallback(async () => {
    try {
      // Сначала запрашиваем разрешения
      const hasPermission = await requestPermissions();
      if (!hasPermission) {
        throw new DOMException('Permission denied', 'NotAllowedError');
      }

      chunksRef.current = [];
      setRecordingTime(0);
      setCancelProgress(0);
      isDraggingRef.current = false;

      let stream: MediaStream;
      let mimeType = '';

      if (isVideoMode) {
        // Видеорежим - камера + аудио
        stream = await navigator.mediaDevices.getUserMedia({
          video: { 
            width: { ideal: 640 }, 
            height: { ideal: 640 }, 
            facingMode: 'user' 
          },
          audio: true
        });
        mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
          ? 'video/webm;codecs=vp9'
          : 'video/webm';

        // Показываем превью
        if (videoPreviewRef.current) {
          videoPreviewRef.current.srcObject = stream;
        }
        setShowPreview(true);
      } else {
        // Голосовой режим - только аудио
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
          ? 'audio/webm;codecs=opus'
          : 'audio/webm';
      }

      streamRef.current = stream;

      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      recorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        const duration = recordingTime;

        // Останавливаем все треки
        stream.getTracks().forEach(track => track.stop());
        streamRef.current = null;

        if (duration >= MIN_RECORDING_TIME) {
          if (isVideoMode) {
            onSendVideo(blob, duration);
          } else {
            onSendVoice(blob, duration);
          }
        }

        setShowPreview(false);
        setIsRecording(false);
        setIsLocked(false);
        setRecordingTime(0);
        setCancelProgress(0);
        onRecordingStop();
      };

      recorder.start(100);
      setIsRecording(true);
      onRecordingStart();

      // Таймер
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => {
          // Ограничение только для видео
          if (isVideoMode && prev >= MAX_VIDEO_DURATION) {
            stopRecording();
            setShowMaxWarning(true);
            setTimeout(() => setShowMaxWarning(false), 2000);
            return prev;
          }
          // Предупреждение на 80 секундах для видео
          if (isVideoMode && prev === 80) {
            setShowMaxWarning(true);
            setTimeout(() => setShowMaxWarning(false), 2000);
          }
          return prev + 1;
        });
      }, 1000);

    } catch (err) {
      console.error('Ошибка записи:', err);
      setIsRecording(false);
      setShowPreview(false);
      setCancelProgress(0);
      
      // Показываем понятное сообщение об ошибке
      let errorMessage = 'Не удалось начать запись. ';
      if (err instanceof DOMException) {
        if (err.name === 'NotAllowedError') {
          errorMessage = isVideoMode 
            ? '📹 Нет доступа к камере'
            : '🎤 Нет доступа к микрофону';
        } else if (err.name === 'NotFoundError') {
          errorMessage = isVideoMode 
            ? '📹 Камера не найдена' 
            : '🎤 Микрофон не найден';
        } else if (err.name === 'NotReadableError') {
          errorMessage = '🔇 Устройство занято';
        } else if (err.name === 'OverconstrainedError') {
          errorMessage = '⚠️ Устройство не подходит';
        }
      }
      
      // Показываем toast уведомление
      setErrorToast(errorMessage);
      setTimeout(() => setErrorToast(null), 3000);
    }
  }, [isVideoMode, onRecordingStart, onRecordingStop, onSendVoice, onSendVideo, recordingTime, requestPermissions]);

  // Остановка записи
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
  }, []);

  // Отмена записи
  const cancelRecording = useCallback(() => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.ondataavailable = null;
      mediaRecorderRef.current.onstop = null;
      mediaRecorderRef.current.stop();
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    setShowPreview(false);
    setIsRecording(false);
    setIsLocked(false);
    setRecordingTime(0);
    setCancelProgress(0);
    onRecordingStop();
  }, [onRecordingStop]);

  // Переключение режима (видео/голос) - только клик
  const toggleVideoMode = useCallback(() => {
    if (!isRecording) {
      setIsVideoMode(prev => !prev);
      hasShownLockHintRef.current = false;
      // Показываем подсказку о режиме
      setShowModeHint(true);
      setTimeout(() => setShowModeHint(false), 1500);
    }
  }, [isRecording]);

  // Обработка начала нажатия
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (isLocked) return;

    e.preventDefault();
    e.stopPropagation();
    startPosRef.current = { x: e.clientX, y: e.clientY };
    currentPosRef.current = { x: e.clientX, y: e.clientY };
    isDraggingRef.current = false;
    isLongPressRef.current = false;

    (e.target as Element).setPointerCapture(e.pointerId);

    // Запускаем таймер для определения долгого нажатия
    longPressTimerRef.current = setTimeout(() => {
      isLongPressRef.current = true;
      startRecording();
    }, 150); // 150ms для начала записи
  }, [isLocked, startRecording]);

  // Обработка перемещения
  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!startPosRef.current || !isRecording) return;

    e.preventDefault();
    isDraggingRef.current = true;
    currentPosRef.current = { x: e.clientX, y: e.clientY };

    const dx = e.clientX - startPosRef.current.x;
    const dy = e.clientY - startPosRef.current.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Отмена свайпом влево
    if (dx < -50) {
      const progress = Math.min(Math.abs(dx) / 150, 1);
      setCancelProgress(progress);
    } else {
      setCancelProgress(0);
    }

    // Блокировка свайпом вверх
    if (dy < -100 && !isLocked) {
      setIsLocked(true);
      setLockHint(false);
    }

    // Подсказка о блокировке
    if (dy < -50 && dy >= -100 && !isLocked && !hasShownLockHintRef.current) {
      setLockHint(true);
    }
  }, [isRecording, isLocked]);

  // Обработка окончания нажатия
  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Очищаем таймер долгого нажатия
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
    }

    const dx = startPosRef.current ? e.clientX - startPosRef.current.x : 0;
    const dy = startPosRef.current ? e.clientY - startPosRef.current.y : 0;
    const distance = Math.sqrt(dx * dx + dy * dy);

    startPosRef.current = null;
    currentPosRef.current = null;
    isDraggingRef.current = false;

    // Если это был короткий клик (не запись) - переключаем режим
    if (!isLongPressRef.current && !isRecording) {
      toggleVideoMode();
      return;
    }

    // Отмена при свайпе влево
    if (cancelProgress >= 0.8 || dx < -150) {
      cancelRecording();
      return;
    }

    // Остановка если не заблокировано
    if (!isLocked && isRecording) {
      stopRecording();
    }

    setCancelProgress(0);
    setLockHint(false);
    isLongPressRef.current = false;
  }, [isRecording, isLocked, cancelProgress, cancelRecording, stopRecording, toggleVideoMode]);

  const handlePointerCancel = useCallback((e: React.PointerEvent) => {
    handlePointerUp(e);
  }, [handlePointerUp]);

  // Форматирование времени
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Очистка при размонтировании
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  return (
    <>
      {/* Оверлей записи */}
      <AnimatePresence>
        {isRecording && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] bg-black/90 backdrop-blur-sm"
          >
            {/* Центральное превью */}
            <div className="absolute inset-0 flex items-center justify-center">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                className="relative"
              >
                {/* Видео превью */}
                {isVideoMode && (
                  <div className="relative w-64 h-64 rounded-full overflow-hidden border-4 border-white/20 shadow-2xl bg-black">
                    <video
                      ref={videoPreviewRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover"
                    />
                    {/* Индикатор записи на превью */}
                    <div className="absolute top-4 right-4 flex items-center gap-2 bg-black/50 px-3 py-1.5 rounded-full">
                      <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                      <span className="text-white text-xs font-mono">{formatTime(recordingTime)}</span>
                    </div>
                  </div>
                )}

                {/* Голосовой режим - визуализатор */}
                {!isVideoMode && (
                  <div className="w-64 h-64 rounded-full bg-gradient-to-br from-Nimbus-500 to-purple-600 flex items-center justify-center shadow-2xl">
                    <motion.div
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 1, repeat: Infinity }}
                    >
                      <Mic size={64} className="text-white" />
                    </motion.div>
                  </div>
                )}

                {/* Таймер и статус */}
                <div className="absolute -bottom-20 left-1/2 -translate-x-1/2 text-center">
                  <motion.div
                    key={recordingTime}
                    initial={{ scale: 1.2 }}
                    animate={{ scale: 1 }}
                    className="text-4xl font-mono font-bold text-white mb-2"
                  >
                    {formatTime(recordingTime)}
                  </motion.div>
                  <p className="text-white/60 text-sm">
                    {isLocked
                      ? (isVideoMode ? 'Запись закреплена' : 'Запись закреплена')
                      : (isVideoMode ? 'Удерживайте для записи' : 'Удерживайте для записи')}
                  </p>

                  {/* Прогресс бар для видео */}
                  {isVideoMode && (
                    <div className="w-48 h-1.5 bg-white/20 rounded-full mt-3 overflow-hidden mx-auto">
                      <motion.div
                        className={`h-full ${recordingTime > 80 ? 'bg-red-500' : 'bg-white'}`}
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min((recordingTime / MAX_VIDEO_DURATION) * 100, 100)}%` }}
                      />
                    </div>
                  )}
                </div>
              </motion.div>
            </div>

            {/* Индикаторы отмены/блокировки */}
            <div className="absolute inset-x-0 bottom-40 flex items-center justify-center gap-16">
              {/* Отмена (слева) */}
              <motion.div
                animate={{
                  opacity: cancelProgress > 0 ? 1 : 0.5,
                  scale: cancelProgress > 0.5 ? 1.2 : 1,
                  x: cancelProgress > 0 ? -20 : 0
                }}
                className="flex flex-col items-center"
              >
                <div className={`w-20 h-20 rounded-full flex items-center justify-center border-2 transition-all ${
                  cancelProgress > 0.5 
                    ? 'bg-red-500/30 border-red-500' 
                    : 'bg-red-500/10 border-red-500/30'
                }`}>
                  <Trash2 size={28} className={`transition-all ${
                    cancelProgress > 0.5 ? 'text-red-400' : 'text-red-400/50'
                  }`} />
                </div>
                <span className={`text-sm mt-2 transition-opacity ${
                  cancelProgress > 0 ? 'text-red-400' : 'text-red-400/50'
                }`}>
                  Свайп влево
                </span>
              </motion.div>

              {/* Блокировка (справа) */}
              <motion.div
                animate={{
                  opacity: isLocked ? 1 : 0.5,
                  scale: isLocked ? 1.2 : 1,
                  y: lockHint ? -10 : 0
                }}
                className="flex flex-col items-center"
              >
                <div className={`w-20 h-20 rounded-full flex items-center justify-center border-2 transition-all ${
                  isLocked 
                    ? 'bg-Nimbus-500/30 border-Nimbus-500' 
                    : 'bg-Nimbus-500/10 border-Nimbus-500/30'
                }`}>
                  <Lock size={28} className={`transition-all ${
                    isLocked ? 'text-Nimbus-400' : 'text-Nimbus-400/50'
                  }`} />
                </div>
                <span className={`text-sm mt-2 transition-opacity ${
                  isLocked ? 'text-Nimbus-400' : 'text-Nimbus-400/50'
                }`}>
                  Свайп вверх
                </span>
              </motion.div>
            </div>

            {/* Прогресс бар отмены */}
            <AnimatePresence>
              {cancelProgress > 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute bottom-28 left-1/2 -translate-x-1/2 w-64 h-1.5 bg-white/10 rounded-full overflow-hidden"
                >
                  <motion.div
                    className="h-full bg-gradient-to-r from-transparent via-red-500 to-transparent"
                    style={{ width: `${cancelProgress * 100}%` }}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Кнопка отправки (при блокировке) */}
            {isLocked && (
              <motion.button
                initial={{ scale: 0.8, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                onClick={stopRecording}
                className="absolute bottom-48 left-1/2 -translate-x-1/2 px-8 py-4 rounded-full bg-gradient-to-r from-Nimbus-500 to-purple-600 hover:from-Nimbus-600 hover:to-purple-700 text-white font-semibold flex items-center gap-3 shadow-2xl transition-all transform hover:scale-105"
              >
                <Send size={20} />
                <span>Отправить</span>
              </motion.button>
            )}

            {/* Кнопка отмены (крестик) */}
            <button
              onClick={cancelRecording}
              className="absolute top-8 right-8 p-4 rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white backdrop-blur-sm"
            >
              <X size={24} />
            </button>

            {/* Предупреждение о макс. длительности */}
            <AnimatePresence>
              {showMaxWarning && (
                <motion.div
                  initial={{ scale: 0.8, opacity: 0, y: 20 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.8, opacity: 0, y: 20 }}
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 px-6 py-3 rounded-full bg-red-500 text-white font-semibold shadow-2xl flex items-center gap-2"
                >
                  <span>⏱️</span>
                  <span>Максимум 1:30</span>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Контейнер с кнопкой */}
      <div ref={containerRef} className="relative">
        {/* Основная кнопка записи */}
        <motion.button
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerCancel}
          onContextMenu={(e) => e.preventDefault()}
          whileTap={!isLocked ? { scale: 0.9 } : {}}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-all shadow-lg ${
            isRecording && !isLocked
              ? 'bg-red-500 scale-105 shadow-red-500/50'
              : isVideoMode
                ? 'bg-gradient-to-br from-Nimbus-500 to-purple-600 shadow-Nimbus-500/30'
                : 'bg-white/10 hover:bg-white/20'
          } text-white`}
          title={isVideoMode ? 'Видеокружок' : 'Голосовое сообщение'}
        >
          {isRecording ? (
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              className="w-4 h-4 rounded-sm bg-white"
            />
          ) : isVideoMode ? (
            <Video size={20} />
          ) : (
            <Mic size={20} />
          )}
        </motion.button>

        {/* Индикатор записи (пульсирующее кольцо) */}
        <AnimatePresence>
          {isRecording && (
            <motion.div
              initial={{ scale: 1, opacity: 0.5 }}
              animate={{ scale: 1.5, opacity: 0 }}
              exit={{ scale: 1.5, opacity: 0 }}
              transition={{ duration: 1, repeat: Infinity }}
              className="absolute inset-0 rounded-full bg-red-500"
            />
          )}
        </AnimatePresence>

        {/* Подсказка о режиме */}
        <AnimatePresence>
          {showModeHint && !isRecording && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.9 }}
              className={`absolute -top-10 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap shadow-lg ${
                isVideoMode 
                  ? 'bg-gradient-to-r from-Nimbus-500 to-purple-600 text-white' 
                  : 'bg-white/20 text-white'
              }`}
            >
              {isVideoMode ? '📹 Видеокружок' : '🎤 Голосовое'}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Toast уведомление об ошибке */}
        <AnimatePresence>
          {errorToast && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.9 }}
              className="absolute -top-12 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-red-500/90 backdrop-blur-sm text-white text-sm font-medium whitespace-nowrap shadow-lg z-50"
            >
              {errorToast}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
