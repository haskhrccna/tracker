import { useState, useEffect, useCallback } from 'react';

export function useNotifications() {
  const [permission, setPermission] = useState('default');
  const [enabled, setEnabled] = useState(() => {
    return localStorage.getItem('quran-tracker-notif') === 'true';
  });
  const [reminderTime, setReminderTime] = useState(() => {
    return localStorage.getItem('quran-tracker-notif-time') || '06:00';
  });

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = useCallback(async () => {
    if (!('Notification' in window)) return false;
    const result = await Notification.requestPermission();
    setPermission(result);
    return result === 'granted';
  }, []);

  const enableNotifications = useCallback(async (time) => {
    const granted = await requestPermission();
    if (granted) {
      setEnabled(true);
      if (time) setReminderTime(time);
      localStorage.setItem('quran-tracker-notif', 'true');
      localStorage.setItem('quran-tracker-notif-time', time || reminderTime);
      scheduleReminder(time || reminderTime);
      return true;
    }
    return false;
  }, [requestPermission, reminderTime]);

  const disableNotifications = useCallback(() => {
    setEnabled(false);
    localStorage.setItem('quran-tracker-notif', 'false');
    if (window._quranReminderInterval) {
      clearInterval(window._quranReminderInterval);
    }
  }, []);

  return { permission, enabled, reminderTime, enableNotifications, disableNotifications, setReminderTime };
}

function scheduleReminder(timeStr) {
  if (window._quranReminderInterval) {
    clearInterval(window._quranReminderInterval);
  }

  window._quranReminderInterval = setInterval(() => {
    const now = new Date();
    const [h, m] = timeStr.split(':').map(Number);
    if (now.getHours() === h && now.getMinutes() === m) {
      if (Notification.permission === 'granted') {
        new Notification('متابعة حفظ القرآن الكريم 📖', {
          body: 'حان وقت مراجعة الحفظ! لا تنسَ ورد اليوم.',
          icon: '/Quran-tracker/icon-192.png',
          tag: 'quran-reminder',
        });
      }
    }
  }, 60000); // check every minute
}
