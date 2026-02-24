# Background Notifications Setup Guide

## Overview
To receive notifications when the app is closed, you need:
1. **Service Worker** - Runs in background
2. **Push Notifications** - Server sends notifications at scheduled times
3. **Web Push Protocol** - Standard for push notifications

## Important Limitations

### Current Browser Support:
- ✅ **Android Chrome/Firefox** - Full support
- ❌ **iOS Safari** - Limited support (iOS 16.4+ has partial support)
- ✅ **Desktop Chrome/Firefox/Edge** - Full support

### iOS Limitations:
- iOS Safari requires the app to be added to home screen (PWA)
- Background notifications are limited
- May not work reliably when app is completely closed

## Solution Architecture

```
Scheduled Time → Server/Cloud Function → Push Service → Service Worker → Notification
```

## Implementation Options

### Option 1: Using a Backend Service (Recommended)

You need a server that:
1. Stores reminder schedules
2. Checks every minute for due reminders
3. Sends push notifications via Web Push API

**Services you can use:**
- **Supabase Edge Functions** (Recommended - you're already using Supabase)
- **Vercel Cron Jobs** (If deployed on Vercel)
- **AWS Lambda + EventBridge**
- **Google Cloud Functions + Cloud Scheduler**

### Option 2: Using Third-Party Services

**OneSignal** (Free tier available):
- Handles all push notification infrastructure
- Easy integration
- Works on mobile browsers
- Free for up to 10,000 subscribers

**Firebase Cloud Messaging (FCM)**:
- Google's push notification service
- Free
- Reliable
- Requires Firebase setup

## Quick Setup with Supabase Edge Functions

### Step 1: Install Dependencies

```bash
npm install web-push
```

### Step 2: Generate VAPID Keys

```bash
npx web-push generate-vapid-keys
```

Save these keys securely - you'll need them!

### Step 3: Create Supabase Edge Function

Create a new edge function in Supabase:

```typescript
// supabase/functions/send-reminders/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get current time
    const now = new Date()
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`

    // Find reminders due now
    const { data: reminders, error } = await supabase
      .from('reminders')
      .select('*, push_subscriptions(*)')
      .contains('times', [currentTime])

    if (error) throw error

    // Send push notifications
    for (const reminder of reminders) {
      // Send push notification logic here
      // Using web-push library
    }

    return new Response(
      JSON.stringify({ success: true, sent: reminders.length }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
```

### Step 4: Schedule the Function

In Supabase Dashboard:
1. Go to Edge Functions
2. Create a new function
3. Set up a cron trigger to run every minute

## Simpler Alternative: OneSignal Integration

### Why OneSignal?
- ✅ No backend code needed
- ✅ Free tier (10,000 subscribers)
- ✅ Works on mobile browsers
- ✅ Easy setup
- ✅ Handles all push infrastructure

### OneSignal Setup Steps:

1. **Sign up at OneSignal.com**
2. **Create a new app**
3. **Get your App ID**
4. **Add OneSignal SDK to your app**

```bash
npm install react-onesignal
```

5. **Initialize in your app:**

```typescript
// src/lib/onesignal.ts
import OneSignal from 'react-onesignal';

export async function initOneSignal() {
  await OneSignal.init({
    appId: 'YOUR_ONESIGNAL_APP_ID',
    allowLocalhostAsSecureOrigin: true,
  });
}
```

6. **Schedule notifications via OneSignal API**

When user creates a reminder, send it to OneSignal:

```typescript
async function scheduleNotification(reminder: Reminder) {
  const response = await fetch('https://onesignal.com/api/v1/notifications', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Basic YOUR_REST_API_KEY'
    },
    body: JSON.stringify({
      app_id: 'YOUR_APP_ID',
      included_segments: ['Subscribed Users'],
      contents: { en: `Time to take ${reminder.name}` },
      headings: { en: 'Medication Reminder' },
      send_after: reminder.nextDate.toISOString()
    })
  });
}
```

## Current App Limitations

Your current implementation:
- ❌ Only works when app is open
- ❌ Uses `setInterval` which stops when app closes
- ❌ No server-side scheduling

To get background notifications, you MUST:
- ✅ Use a backend service (Supabase/OneSignal/FCM)
- ✅ Implement Service Worker push notifications
- ✅ Store push subscriptions in database

## Recommended Solution for Your App

### Use Supabase + Web Push

**Pros:**
- You're already using Supabase
- No additional services needed
- Full control
- Free (within Supabase limits)

**Cons:**
- Requires more setup
- Need to manage VAPID keys
- Need to create edge functions

### OR Use OneSignal

**Pros:**
- Easiest to implement
- No backend code needed
- Free tier sufficient
- Reliable

**Cons:**
- Third-party dependency
- Limited customization on free tier

## Next Steps

1. **Choose your approach:**
   - Supabase Edge Functions (more control)
   - OneSignal (easier, faster)

2. **I can help you implement either solution**

3. **For iOS users:**
   - Ensure app is installable as PWA
   - Add to home screen
   - Grant notification permissions

## Testing Background Notifications

1. **Grant notification permission**
2. **Close the app completely**
3. **Wait for scheduled time**
4. **Notification should appear**

## Important Notes

- Background notifications require HTTPS (production)
- iOS has limitations - may not work when app is fully closed
- Android works reliably
- Users must grant notification permission
- Service Worker must be registered

Would you like me to implement:
1. **Supabase Edge Functions** solution (more work, full control)
2. **OneSignal** integration (easier, faster)
3. **Both** (OneSignal for quick win, Supabase for future)

Let me know which approach you prefer!