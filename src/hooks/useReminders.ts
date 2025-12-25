import { useState, useEffect, useCallback } from 'react';

export interface ReminderSettings {
  enabled: boolean;
  time: string; // HH:MM format
  notificationsPermission: NotificationPermission | 'default';
  lastReminderShown: string | null; // ISO date string
}

const DEFAULT_SETTINGS: ReminderSettings = {
  enabled: false,
  time: '09:00',
  notificationsPermission: 'default',
  lastReminderShown: null,
};

const STORAGE_KEY = 'exercise_reminder_settings';

export interface UseRemindersReturn {
  settings: ReminderSettings;
  updateSettings: (updates: Partial<ReminderSettings>) => void;
  requestNotificationPermission: () => Promise<NotificationPermission>;
  shouldShowReminder: boolean;
  dismissReminder: () => void;
  hasCompletedToday: boolean;
  sendTestNotification: () => void;
}

const getSessionId = (): string => {
  return localStorage.getItem('exercise_session_id') || '';
};

export const useReminders = (hasCompletedToday: boolean): UseRemindersReturn => {
  const [settings, setSettings] = useState<ReminderSettings>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
      } catch {
        return DEFAULT_SETTINGS;
      }
    }
    return DEFAULT_SETTINGS;
  });

  const [shouldShowReminder, setShouldShowReminder] = useState(false);

  // Persist settings to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  // Check notification permission on mount
  useEffect(() => {
    if ('Notification' in window) {
      setSettings(prev => ({
        ...prev,
        notificationsPermission: Notification.permission,
      }));
    }
  }, []);

  // Check if we should show a reminder
  useEffect(() => {
    if (!settings.enabled || hasCompletedToday) {
      setShouldShowReminder(false);
      return;
    }

    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const [hours, minutes] = settings.time.split(':').map(Number);
    
    const reminderTime = new Date();
    reminderTime.setHours(hours, minutes, 0, 0);

    // Show reminder if:
    // 1. Current time is past the reminder time
    // 2. Haven't completed today
    // 3. Haven't dismissed today's reminder
    const isPastReminderTime = now >= reminderTime;
    const hasNotDismissedToday = settings.lastReminderShown !== today;

    if (isPastReminderTime && hasNotDismissedToday && !hasCompletedToday) {
      setShouldShowReminder(true);
      
      // Send browser notification if permission granted
      if (settings.notificationsPermission === 'granted' && 'Notification' in window) {
        // Only send once per day
        const lastNotification = localStorage.getItem('last_notification_date');
        if (lastNotification !== today) {
          new Notification('Time for your daily exercise! 🧘', {
            body: 'Take a few minutes to ground yourself with a quick exercise.',
            icon: '/favicon.ico',
            tag: 'daily-reminder',
          });
          localStorage.setItem('last_notification_date', today);
        }
      }
    }
  }, [settings.enabled, settings.time, settings.lastReminderShown, settings.notificationsPermission, hasCompletedToday]);

  const updateSettings = useCallback((updates: Partial<ReminderSettings>) => {
    setSettings(prev => ({ ...prev, ...updates }));
  }, []);

  const requestNotificationPermission = useCallback(async (): Promise<NotificationPermission> => {
    if (!('Notification' in window)) {
      return 'denied';
    }

    const permission = await Notification.requestPermission();
    setSettings(prev => ({ ...prev, notificationsPermission: permission }));
    return permission;
  }, []);

  const dismissReminder = useCallback(() => {
    const today = new Date().toISOString().split('T')[0];
    setSettings(prev => ({ ...prev, lastReminderShown: today }));
    setShouldShowReminder(false);
  }, []);

  const sendTestNotification = useCallback(() => {
    if (settings.notificationsPermission === 'granted' && 'Notification' in window) {
      new Notification('Test notification! 🎉', {
        body: 'Your reminders are working correctly.',
        icon: '/favicon.ico',
      });
    }
  }, [settings.notificationsPermission]);

  return {
    settings,
    updateSettings,
    requestNotificationPermission,
    shouldShowReminder,
    dismissReminder,
    hasCompletedToday,
    sendTestNotification,
  };
};
