/**
 * OneSignal Push Notification Service
 * Handles background notifications even when app is closed
 */

import OneSignalReact from 'react-onesignal';

// OneSignal configuration
// IMPORTANT: Replace these with your actual OneSignal credentials
// Get them from: https://onesignal.com/
const ONESIGNAL_APP_ID = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID || 'YOUR_ONESIGNAL_APP_ID';
const ONESIGNAL_REST_API_KEY = process.env.NEXT_PUBLIC_ONESIGNAL_REST_API_KEY || 'YOUR_REST_API_KEY';

let isInitialized = false;
let initPromise: Promise<void> | null = null;

/**
 * Initialize OneSignal
 * Call this once when the app loads
 * Prevents double initialization with promise caching
 */
export async function initOneSignal(): Promise<void> {
  // If already initialized, return immediately
  if (isInitialized) {
    console.log('OneSignal already initialized');
    return;
  }

  // If initialization is in progress, wait for it
  if (initPromise) {
    console.log('OneSignal initialization in progress, waiting...');
    return initPromise;
  }

  // Start new initialization
  initPromise = (async () => {
    try {
      // Check if we're in browser environment
      if (typeof window === 'undefined') {
        console.log('OneSignal: Not in browser environment');
        return;
      }

      // Check if OneSignal credentials are configured
      if (ONESIGNAL_APP_ID === 'YOUR_ONESIGNAL_APP_ID') {
        console.warn('OneSignal: App ID not configured. Please set NEXT_PUBLIC_ONESIGNAL_APP_ID in .env.local');
        return;
      }

      console.log('Initializing OneSignal...');
      
      await OneSignalReact.init({
        appId: ONESIGNAL_APP_ID,
        allowLocalhostAsSecureOrigin: true, // For local development
        serviceWorkerParam: { scope: '/' },
        serviceWorkerPath: 'OneSignalSDKWorker.js',
      });

      isInitialized = true;
      console.log('✅ OneSignal initialized successfully');

      // Set up event listeners
      OneSignalReact.Notifications.addEventListener('click', (event) => {
        console.log('Notification clicked:', event);
      });

      OneSignalReact.Notifications.addEventListener('foregroundWillDisplay', (event) => {
        console.log('Notification received in foreground:', event);
      });

    } catch (error) {
      console.error('Failed to initialize OneSignal:', error);
      isInitialized = false;
      initPromise = null;
      throw error;
    }
  })();

  return initPromise;
}

/**
 * Request notification permission from user and ensure subscription
 */
export async function requestNotificationPermission(): Promise<boolean> {
  try {
    if (!isInitialized) {
      await initOneSignal();
    }

    const permission = await OneSignalReact.Notifications.requestPermission();
    console.log('Notification permission:', permission);
    
    if (permission) {
      // Wait a bit for subscription to complete
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Verify subscription was created
      const playerId = await OneSignalReact.User.PushSubscription.id;
      if (playerId) {
        console.log('✅ Push subscription created:', playerId);
      } else {
        console.warn('⚠️ Permission granted but no subscription ID yet');
      }
    }
    
    return permission;
  } catch (error) {
    console.error('Failed to request notification permission:', error);
    return false;
  }
}

/**
 * Get the user's OneSignal Player ID (subscription ID)
 */
export async function getOneSignalPlayerId(): Promise<string | null> {
  try {
    if (!isInitialized) {
      await initOneSignal();
    }

    const playerId = await OneSignalReact.User.PushSubscription.id;
    console.log('OneSignal Player ID:', playerId);
    return playerId || null;
  } catch (error) {
    console.error('Failed to get OneSignal Player ID:', error);
    return null;
  }
}

/**
 * Check if user is subscribed to push notifications
 */
export async function isSubscribed(): Promise<boolean> {
  try {
    if (!isInitialized) {
      await initOneSignal();
    }

    const permission = await OneSignalReact.Notifications.permission;
    return permission;
  } catch (error) {
    console.error('Failed to check subscription status:', error);
    return false;
  }
}

/**
 * Set external user ID (link OneSignal to your user ID)
 * IMPORTANT: Only call this AFTER user is subscribed
 */
export async function setExternalUserId(userId: string): Promise<void> {
  try {
    if (!isInitialized) {
      await initOneSignal();
    }

    // Verify user is subscribed before linking
    const playerId = await OneSignalReact.User.PushSubscription.id;
    if (!playerId) {
      console.warn('⚠️ Cannot set external user ID - user not subscribed yet');
      throw new Error('User must be subscribed before linking external ID');
    }

    await OneSignalReact.login(userId);
    console.log('✅ External user ID set:', userId, 'Player ID:', playerId);
  } catch (error) {
    console.error('Failed to set external user ID:', error);
    throw error;
  }
}

/**
 * Ensure user is subscribed to push notifications
 * This will request permission if needed and wait for subscription
 */
export async function ensureSubscribed(): Promise<{ subscribed: boolean; playerId: string | null }> {
  try {
    if (!isInitialized) {
      await initOneSignal();
    }

    // Check if already subscribed
    let playerId = await OneSignalReact.User.PushSubscription.id;
    if (playerId) {
      console.log('✅ Already subscribed:', playerId);
      return { subscribed: true, playerId };
    }

    // Check permission status
    const permission = await OneSignalReact.Notifications.permission;
    
    if (!permission) {
      // Request permission
      console.log('Requesting notification permission...');
      const granted = await OneSignalReact.Notifications.requestPermission();
      
      if (!granted) {
        console.log('❌ Permission denied');
        return { subscribed: false, playerId: null };
      }
      
      // Wait for subscription to complete
      console.log('Waiting for subscription...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      playerId = await OneSignalReact.User.PushSubscription.id;
    }

    if (playerId) {
      console.log('✅ Subscription successful:', playerId);
      return { subscribed: true, playerId };
    } else {
      console.warn('⚠️ Permission granted but subscription incomplete');
      return { subscribed: false, playerId: null };
    }
  } catch (error) {
    console.error('Failed to ensure subscription:', error);
    return { subscribed: false, playerId: null };
  }
}

/**
 * Schedule a notification via OneSignal API
 * This is called from your API route, not directly from client
 */
export async function scheduleNotification(params: {
  userId: string;
  title: string;
  message: string;
  sendAfter: Date;
  data?: Record<string, any>;
}): Promise<{ success: boolean; notificationId?: string; error?: string }> {
  try {
    const response = await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${ONESIGNAL_REST_API_KEY}`,
      },
      body: JSON.stringify({
        app_id: ONESIGNAL_APP_ID,
        include_external_user_ids: [params.userId],
        headings: { en: params.title },
        contents: { en: params.message },
        send_after: params.sendAfter.toISOString(),
        data: params.data || {},
        // iOS specific settings
        ios_badgeType: 'Increase',
        ios_badgeCount: 1,
        // Android specific settings
        priority: 10,
      }),
    });

    const result = await response.json();

    if (response.ok) {
      return {
        success: true,
        notificationId: result.id,
      };
    } else {
      return {
        success: false,
        error: result.errors?.[0] || 'Failed to schedule notification',
      };
    }
  } catch (error) {
    console.error('Failed to schedule notification:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Cancel a scheduled notification
 */
export async function cancelNotification(notificationId: string): Promise<boolean> {
  try {
    const response = await fetch(
      `https://onesignal.com/api/v1/notifications/${notificationId}?app_id=${ONESIGNAL_APP_ID}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Basic ${ONESIGNAL_REST_API_KEY}`,
        },
      }
    );

    return response.ok;
  } catch (error) {
    console.error('Failed to cancel notification:', error);
    return false;
  }
}

/**
 * Send an immediate notification (for testing)
 */
export async function sendImmediateNotification(params: {
  userId: string;
  title: string;
  message: string;
  data?: Record<string, any>;
}): Promise<{ success: boolean; notificationId?: string; error?: string }> {
  try {
    const response = await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${ONESIGNAL_REST_API_KEY}`,
      },
      body: JSON.stringify({
        app_id: ONESIGNAL_APP_ID,
        include_external_user_ids: [params.userId],
        headings: { en: params.title },
        contents: { en: params.message },
        data: params.data || {},
        // iOS specific settings
        ios_badgeType: 'Increase',
        ios_badgeCount: 1,
        // Android specific settings
        priority: 10,
      }),
    });

    const result = await response.json();

    if (response.ok) {
      return {
        success: true,
        notificationId: result.id,
      };
    } else {
      return {
        success: false,
        error: result.errors?.[0] || 'Failed to send notification',
      };
    }
  } catch (error) {
    console.error('Failed to send notification:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get notification permission status
 */
export function getNotificationPermission(): NotificationPermission {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'default';
  }
  return Notification.permission;
}

/**
 * Check if browser supports notifications
 */
export function isNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

// Made with Bob
