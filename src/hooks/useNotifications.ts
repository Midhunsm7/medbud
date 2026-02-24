'use client';

import { useEffect, useRef, useState } from 'react';
import type { Reminder } from '@/types/reminder';
import { playNotificationSound, playCustomAlarmSound } from '@/lib/sounds';
import { toast } from 'react-hot-toast';
import {
  initNotifications,
  requestNotificationPermission,
  areNotificationsEnabled,
  showNotification,
  getNotificationPermission
} from '@/lib/notifications';

export function useNotifications(reminders: Reminder[]) {
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');
  const [serviceWorkerReady, setServiceWorkerReady] = useState(false);
  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const notifiedRemindersRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    // Initialize service worker and check permission
    const init = async () => {
      if (typeof window !== 'undefined' && 'Notification' in window) {
        setNotificationPermission(getNotificationPermission());
        
        // Initialize service worker
        const registration = await initNotifications();
        if (registration) {
          setServiceWorkerReady(true);
          console.log('✅ Service Worker ready for notifications');
        }
      }
    };
    
    init();
  }, []);

  useEffect(() => {
    // Start checking for reminders
    if (notificationPermission === 'granted' && reminders.length > 0) {
      checkIntervalRef.current = setInterval(() => {
        checkReminders();
      }, 30000); // Check every 30 seconds

      // Initial check
      checkReminders();

      return () => {
        if (checkIntervalRef.current) {
          clearInterval(checkIntervalRef.current);
        }
      };
    }
  }, [reminders, notificationPermission]);

  const checkReminders = () => {
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    reminders.forEach((reminder) => {
      // Handle appointments differently
      if (reminder.type === 'appointment' && reminder.appointmentDate && reminder.reminderAdvance) {
        const appointmentDate = new Date(reminder.appointmentDate);
        const [hours, minutes] = reminder.times[0].split(':').map(Number);
        appointmentDate.setHours(hours, minutes, 0, 0);
        
        // Calculate reminder time (X hours before appointment)
        const reminderTime = new Date(appointmentDate.getTime() - (reminder.reminderAdvance * 60 * 60 * 1000));
        const reminderKey = `${reminder.id}-appointment-${appointmentDate.toISOString()}`;
        
        // Check if current time matches reminder time (within 1 minute)
        const timeDiff = Math.abs(now.getTime() - reminderTime.getTime());
        const oneMinute = 60 * 1000;
        
        if (timeDiff <= oneMinute && !notifiedRemindersRef.current.has(reminderKey)) {
          triggerNotification(reminder, true);
          notifiedRemindersRef.current.add(reminderKey);
          
          // Clean up after appointment passes
          setTimeout(() => {
            notifiedRemindersRef.current.delete(reminderKey);
          }, 24 * 60 * 60 * 1000);
        }
      } else {
        // Handle regular medication reminders
        reminder.times.forEach((time) => {
          const reminderKey = `${reminder.id}-${time}-${now.toDateString()}`;
          
          // Check if this reminder time matches current time (within 1 minute)
          if (isTimeMatch(time, currentTime) && !notifiedRemindersRef.current.has(reminderKey)) {
            triggerNotification(reminder, false);
            notifiedRemindersRef.current.add(reminderKey);
            
            // Clean up old notifications after 24 hours
            setTimeout(() => {
              notifiedRemindersRef.current.delete(reminderKey);
            }, 24 * 60 * 60 * 1000);
          }
        });
      }
    });
  };

  const isTimeMatch = (reminderTime: string, currentTime: string): boolean => {
    const [reminderHour, reminderMinute] = reminderTime.split(':').map(Number);
    const [currentHour, currentMinute] = currentTime.split(':').map(Number);
    
    // Match if within 1 minute
    return reminderHour === currentHour && Math.abs(reminderMinute - currentMinute) <= 1;
  };

  const triggerNotification = async (reminder: Reminder, isAdvanceReminder: boolean = false) => {
    try {
      // Play sound with error handling - use custom sound if available
      try {
        if (reminder.useCustomSound && reminder.alarmSoundUrl) {
          playCustomAlarmSound(reminder.alarmSoundUrl);
        } else {
          playNotificationSound();
        }
      } catch (soundError) {
        console.error('Error playing sound:', soundError);
        // Fallback to default sound
        try {
          playNotificationSound();
        } catch (fallbackError) {
          console.error('Fallback sound also failed:', fallbackError);
        }
      }

      // Show browser notification via service worker (works in background)
      if (areNotificationsEnabled() && serviceWorkerReady) {
        try {
          const title = reminder.type === 'appointment'
            ? isAdvanceReminder
              ? `Upcoming Appointment: ${reminder.name}`
              : `Appointment: ${reminder.name}`
            : `Medication: ${reminder.name}`;
          
          let body = '';
          if (reminder.type === 'appointment') {
            const timeInfo = isAdvanceReminder && reminder.reminderAdvance
              ? `in ${reminder.reminderAdvance} hour${reminder.reminderAdvance !== 1 ? 's' : ''}`
              : 'now';
            body = `${reminder.doctorName ? `Dr. ${reminder.doctorName}` : 'Appointment'} ${timeInfo}${reminder.location ? ` at ${reminder.location}` : ''}`;
          } else {
            body = `Time to take ${reminder.dosage || 'your medication'}`;
          }

          // Use service worker notification (works in background)
          await showNotification(title, {
            body,
            tag: reminder.id,
            data: {
              reminderId: reminder.id,
              type: reminder.type,
              name: reminder.name,
            },
          });
          
          console.log('✅ Notification shown via service worker');
        } catch (notifError) {
          console.error('Error showing notification:', notifError);
        }
      }

      // Show toast notification with error handling
      try {
        let toastMessage = '';
        if (reminder.type === 'appointment') {
          const timeInfo = isAdvanceReminder && reminder.reminderAdvance
            ? ` in ${reminder.reminderAdvance}h`
            : '';
          toastMessage = `${reminder.name}${timeInfo} - ${reminder.doctorName ? `Dr. ${reminder.doctorName}` : 'Appointment'}`;
        } else {
          toastMessage = `${reminder.name} - ${reminder.dosage || 'Take your medication'}`;
        }

        toast.success(toastMessage, {
          duration: 10000,
          icon: reminder.type === 'appointment' ? '🏥' : '💊',
          style: {
            background: '#fff',
            color: '#363636',
            padding: '16px',
            borderRadius: '12px',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
          },
        });
      } catch (toastError) {
        console.error('Error showing toast:', toastError);
      }
    } catch (error) {
      console.error('Error in triggerNotification:', error);
      // Fallback: at least try to show a basic alert
      try {
        if (typeof window !== 'undefined') {
          const message = reminder.type === 'appointment'
            ? `Appointment: ${reminder.name}`
            : `Medication: ${reminder.name}`;
          alert(message);
        }
      } catch (alertError) {
        console.error('Even alert failed:', alertError);
      }
    }
  };

  const requestPermission = async (): Promise<boolean> => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      toast.error('Notifications not supported in this browser');
      return false;
    }

    try {
      const granted = await requestNotificationPermission();
      const newPermission = getNotificationPermission();
      setNotificationPermission(newPermission);
      
      if (granted) {
        toast.success('Notifications enabled! You\'ll receive reminders even when the app is closed.');
        
        // Initialize service worker if not already done
        if (!serviceWorkerReady) {
          const registration = await initNotifications();
          if (registration) {
            setServiceWorkerReady(true);
          }
        }
        
        return true;
      } else {
        toast.error('Notification permission denied. Enable in browser settings to receive reminders.');
        return false;
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      toast.error('Failed to request notification permission');
      return false;
    }
  };

  return {
    notificationPermission,
    requestPermission,
    isEnabled: notificationPermission === 'granted',
  };
}

// Made with Bob
