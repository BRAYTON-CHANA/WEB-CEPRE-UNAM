import { useState, useEffect } from 'react';

/**
 * Calcula el próximo ciclo del cron (cada 15 min: :00, :15, :30, :45).
 * Retorna el tiempo restante y la próxima hora de ejecución.
 */
function getNextCronTime() {
  const now = new Date();
  const minutes = now.getMinutes();
  const nextMark = Math.ceil((minutes + 1) / 15) * 15;

  const next = new Date(now);
  if (nextMark >= 60) {
    next.setHours(now.getHours() + 1);
    next.setMinutes(0);
  } else {
    next.setMinutes(nextMark);
  }
  next.setSeconds(0);
  next.setMilliseconds(0);

  return next;
}

export function useCronCountdown() {
  const [nextTime, setNextTime] = useState(getNextCronTime());
  const [secondsLeft, setSecondsLeft] = useState(0);

  useEffect(() => {
    const update = () => {
      const next = getNextCronTime();
      setNextTime(next);
      setSecondsLeft(Math.max(0, Math.floor((next.getTime() - Date.now()) / 1000)));
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;
  const timeLabel = nextTime.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', hour12: false });

  return {
    nextTime,
    secondsLeft,
    timeLabel,
    countdown: `${mins}:${String(secs).padStart(2, '0')}`,
  };
}
