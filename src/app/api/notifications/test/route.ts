import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

/**
 * Test endpoint to verify OneSignal configuration
 */
export async function GET() {
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

    const ONESIGNAL_APP_ID = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID || '';
    const ONESIGNAL_REST_API_KEY = process.env.ONESIGNAL_REST_API_KEY || '';
    const APP_URL = process.env.NEXT_PUBLIC_APP_URL || '';

    return NextResponse.json({
      success: true,
      config: {
        hasAppId: !!ONESIGNAL_APP_ID && ONESIGNAL_APP_ID !== 'YOUR_ONESIGNAL_APP_ID',
        hasRestApiKey: !!ONESIGNAL_REST_API_KEY && ONESIGNAL_REST_API_KEY !== 'YOUR_REST_API_KEY',
        hasAppUrl: !!APP_URL,
        appIdPrefix: ONESIGNAL_APP_ID ? ONESIGNAL_APP_ID.substring(0, 8) + '...' : 'NOT SET',
        appUrl: APP_URL || 'NOT SET',
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error checking config:', error);
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