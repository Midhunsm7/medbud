/**
 * API Route: Schedule Push Notifications
 * Handles scheduling OneSignal notifications for reminders
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const ONESIGNAL_APP_ID = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID || '';
const ONESIGNAL_REST_API_KEY = process.env.ONESIGNAL_REST_API_KEY || '';

/**
 * POST /api/notifications/schedule
 * Schedule a push notification via OneSignal
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('custom_session');
    
    if (!sessionCookie) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const session = JSON.parse(sessionCookie.value);
    const userId = session.user_id;

    // Parse request body
    const body = await request.json();
    const { title, message, sendAfter, reminderId, reminderData } = body;

    // Validate required fields
    if (!title || !message || !sendAfter) {
      return NextResponse.json(
        { error: 'Missing required fields: title, message, sendAfter' },
        { status: 400 }
      );
    }

    // Check if OneSignal is configured
    if (!ONESIGNAL_APP_ID || ONESIGNAL_APP_ID === 'YOUR_ONESIGNAL_APP_ID') {
      return NextResponse.json(
        { error: 'OneSignal not configured. Please set environment variables.' },
        { status: 500 }
      );
    }

    if (!ONESIGNAL_REST_API_KEY || ONESIGNAL_REST_API_KEY === 'YOUR_REST_API_KEY') {
      return NextResponse.json(
        { error: 'OneSignal REST API key not configured.' },
        { status: 500 }
      );
    }

    // User is now properly subscribed and linked!
    // Use external user ID for targeted notifications
    
    // Get the base URL for the sound file
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://medbud-two.vercel.app';
    const soundUrl = `${baseUrl}/sound.wav`;
    
    let notificationPayload: any = {
      app_id: ONESIGNAL_APP_ID,
      include_external_user_ids: [userId.toString()],
      headings: { en: title },
      contents: { en: message },
      send_after: new Date(sendAfter).toISOString(),
      data: {
        reminderId: reminderId || null,
        type: 'medication_reminder',
        soundUrl: soundUrl, // Pass sound URL to service worker
        ...reminderData,
      },
      // iOS specific settings
      ios_badgeType: 'Increase',
      ios_badgeCount: 1,
      ios_sound: soundUrl, // Custom sound for iOS
      // Android specific settings
      android_sound: soundUrl, // Custom sound for Android
      android_channel_id: 'medication_reminders', // Custom channel for Android
      priority: 10,
      // Additional settings
      ttl: 86400, // 24 hours
      content_available: true,
    };

    console.log('🔵 [schedule] Sending notification to user:', {
      userId: userId.toString(),
      title,
      sendAfter: new Date(sendAfter).toISOString(),
      method: 'external_user_id',
    });

    // Schedule notification via OneSignal API
    const response = await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${ONESIGNAL_REST_API_KEY}`,
      },
      body: JSON.stringify(notificationPayload),
    });

    const result = await response.json();
    
    console.log('OneSignal API Response:', JSON.stringify(result, null, 2));

    if (response.ok) {
      // Check if we got a notification ID
      const notificationId = result.id || result.notification_id || '';
      
      if (!notificationId) {
        console.warn('OneSignal returned success but no notification ID:', result);
      }
      
      return NextResponse.json({
        success: true,
        notificationId: notificationId,
        message: 'Notification scheduled successfully',
        debug: {
          hasId: !!notificationId,
          responseKeys: Object.keys(result),
        }
      });
    } else {
      console.error('OneSignal API error:', result);
      return NextResponse.json(
        {
          success: false,
          error: result.errors?.[0] || 'Failed to schedule notification',
        },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error scheduling notification:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/notifications/schedule
 * Cancel a scheduled notification
 */
export async function DELETE(request: NextRequest) {
  try {
    // Check authentication
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('custom_session');
    
    if (!sessionCookie) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get notification ID from query params
    const { searchParams } = new URL(request.url);
    const notificationId = searchParams.get('id');

    if (!notificationId) {
      return NextResponse.json(
        { error: 'Missing notification ID' },
        { status: 400 }
      );
    }

    // Check if OneSignal is configured
    if (!ONESIGNAL_APP_ID || !ONESIGNAL_REST_API_KEY) {
      return NextResponse.json(
        { error: 'OneSignal not configured' },
        { status: 500 }
      );
    }

    // Cancel notification via OneSignal API
    const response = await fetch(
      `https://onesignal.com/api/v1/notifications/${notificationId}?app_id=${ONESIGNAL_APP_ID}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Basic ${ONESIGNAL_REST_API_KEY}`,
        },
      }
    );

    if (response.ok) {
      return NextResponse.json({
        success: true,
        message: 'Notification cancelled successfully',
      });
    } else {
      const result = await response.json();
      return NextResponse.json(
        {
          success: false,
          error: result.errors?.[0] || 'Failed to cancel notification',
        },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error cancelling notification:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/notifications/schedule/test
 * Send an immediate test notification
 */
export async function PUT(request: NextRequest) {
  try {
    // Check authentication
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('custom_session');
    
    if (!sessionCookie) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const session = JSON.parse(sessionCookie.value);
    const userId = session.user_id;

    // Parse request body
    const body = await request.json();
    const { title, message } = body;

    // Check if OneSignal is configured
    if (!ONESIGNAL_APP_ID || !ONESIGNAL_REST_API_KEY) {
      return NextResponse.json(
        { error: 'OneSignal not configured' },
        { status: 500 }
      );
    }

    // Send immediate notification via OneSignal API
    const response = await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${ONESIGNAL_REST_API_KEY}`,
      },
      body: JSON.stringify({
        app_id: ONESIGNAL_APP_ID,
        include_external_user_ids: [userId.toString()],
        headings: { en: title || 'Test Notification' },
        contents: { en: message || 'This is a test notification from MediReminder' },
        data: {
          type: 'test',
        },
        // iOS specific settings
        ios_badgeType: 'Increase',
        ios_badgeCount: 1,
        ios_sound: 'default',
        // Android specific settings
        priority: 10,
      }),
    });

    const result = await response.json();

    if (response.ok) {
      return NextResponse.json({
        success: true,
        notificationId: result.id,
        message: 'Test notification sent successfully',
      });
    } else {
      console.error('OneSignal API error:', result);
      return NextResponse.json(
        {
          success: false,
          error: result.errors?.[0] || 'Failed to send test notification',
        },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error sending test notification:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}

// Made with Bob
