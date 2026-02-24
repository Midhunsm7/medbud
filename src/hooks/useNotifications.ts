'use client';

import { useEffect, useRef, useState } from 'react';
import type { Reminder } from '@/types/reminder';
import { playNotificationSound } from '@/lib/sounds';
import { toast } from 'react-hot-toast';

export function useNotifications(reminders: Reminder[]) {
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');
  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const notifiedRemindersRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    // Check initial permission
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setNotificationPermission(Notification.permission);
    }
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

  const triggerNotification = (reminder: Reminder, isAdvanceReminder: boolean = false) => {
    // Play sound
    playNotificationSound();

    // Show browser notification
    if (notificationPermission === 'granted') {
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

      const notification = new Notification(title, {
        body,
        icon: '/icon-192x192.png',
        badge: '/icon-192x192.png',
        tag: reminder.id,
        requireInteraction: true,
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };
    }

    // Show toast notification
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
  };

  const requestPermission = async (): Promise<boolean> => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      toast.error('Notifications not supported in this browser');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      
      if (permission === 'granted') {
        toast.success('Notifications enabled! You\'ll receive reminders with sound.');
        return true;
      } else {
        toast.error('Notification permission denied');
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
