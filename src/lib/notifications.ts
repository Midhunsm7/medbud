/**
 * Native Web Notifications API
 * Simple, no third-party dependencies, works on mobile
 * Based on neverminder-pwa approach
 */

let serviceWorkerRegistration: ServiceWorkerRegistration | null = null;

/**
 * Initialize service worker for notifications
 */
export async function initNotifications(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    console.log('Service Worker not supported');
    return null;
  }

  try {
    // Register service worker if not already registered
    const registration = await navigator.serviceWorker.register('/sw.js');
    serviceWorkerRegistration = registration;
    console.log('Service Worker registered for notifications');
    return registration;
  } catch (error) {
    console.error('Service Worker registration failed:', error);
    return null;
  }
}

/**
 * Request notification permission from user
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    console.log('Notifications not supported');
    return false;
  }

  try {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  } catch (error) {
    console.error('Failed to request notification permission:', error);
    return false;
  }
}

/**
 * Check if notifications are enabled
 */
export function areNotificationsEnabled(): boolean {
  if (!('Notification' in window)) {
    return false;
  }
  return Notification.permission === 'granted';
}

/**
 * Get notification permission status
 */
export function getNotificationPermission(): NotificationPermission {
  if (!('Notification' in window)) {
    return 'default';
  }
  return Notification.permission;
}

/**
 * Show a notification immediately
 */
export async function showNotification(
  title: string,
  options?: NotificationOptions
): Promise<void> {
  if (!areNotificationsEnabled()) {
    console.log('Notifications not enabled');
    return;
  }

  try {
    // Get service worker registration
    const registration = serviceWorkerRegistration || await navigator.serviceWorker.ready;
    
    // Show notification via service worker (works in background)
    await registration.showNotification(title, {
      icon: '/logo.png',
      badge: '/logo.png',
      requireInteraction: true,
      ...options,
    });
  } catch (error) {
    console.error('Failed to show notification:', error);
    
    // Fallback to regular notification if service worker fails
    try {
      new Notification(title, {
        icon: '/logo.png',
        ...options,
      });
    } catch (fallbackError) {
      console.error('Fallback notification also failed:', fallbackError);
    }
  }
}

/**
 * Schedule a notification for a specific time
 * Uses browser's built-in scheduling
 */
export function scheduleNotification(
  title: string,
  body: string,
  scheduledTime: Date,
  data?: any
): number {
  const now = new Date().getTime();
  const scheduledTimeMs = scheduledTime.getTime();
  const delay = scheduledTimeMs - now;

  if (delay <= 0) {
    console.log('Scheduled time is in the past, showing immediately');
    showNotification(title, { body, data });
    return -1;
  }

  // Schedule notification using setTimeout
  const timeoutId = window.setTimeout(() => {
    showNotification(title, { body, data });
  }, delay);

  console.log(`Notification scheduled for ${scheduledTime.toLocaleString()}`);
  return timeoutId;
}

/**
 * Cancel a scheduled notification
 */
export function cancelScheduledNotification(timeoutId: number): void {
  if (timeoutId > 0) {
    window.clearTimeout(timeoutId);
    console.log('Scheduled notification cancelled');
  }
}

/**
 * Schedule multiple notifications for a reminder
 * Returns array of timeout IDs
 */
export function scheduleReminderNotifications(
  reminderName: string,
  times: string[],
  startDate: Date,
  frequency: 'daily' | 'weekly' | 'monthly',
  reminderType: 'medication' | 'appointment',
  dosage?: string
): number[] {
  const timeoutIds: number[] = [];

  times.forEach((time) => {
    const [hours, minutes] = time.split(':').map(Number);
    
    // Create notification date
    const notificationDate = new Date(startDate);
    notificationDate.setHours(hours, minutes, 0, 0);

    // If time has passed today, schedule for next occurrence
    if (notificationDate <= new Date()) {
      switch (frequency) {
        case 'daily':
          notificationDate.setDate(notificationDate.getDate() + 1);
          break;
        case 'weekly':
          notificationDate.setDate(notificationDate.getDate() + 7);
          break;
        case 'monthly':
          notificationDate.setMonth(notificationDate.getMonth() + 1);
          break;
      }
    }

    const title = reminderType === 'medication' 
      ? `Time to take ${reminderName}`
      : `Appointment: ${reminderName}`;
    
    const body = reminderType === 'medication'
      ? `Don't forget to take your ${dosage || 'medication'}`
      : `You have an appointment scheduled`;

    const timeoutId = scheduleNotification(title, body, notificationDate, {
      reminderName,
      time,
      type: reminderType,
    });

    if (timeoutId > 0) {
      timeoutIds.push(timeoutId);
    }
  });

  return timeoutIds;
}

/**
 * Cancel all scheduled notifications for a reminder
 */
export function cancelReminderNotifications(timeoutIds: number[]): void {
  timeoutIds.forEach((id) => cancelScheduledNotification(id));
}

/**
 * Test notification - send immediately
 */
export async function sendTestNotification(): Promise<void> {
  await showNotification('Test Notification', {
    body: 'This is a test notification from MediReminder!',
    icon: '/logo.png',
    badge: '/logo.png',
  });
}

// Made with Bob
