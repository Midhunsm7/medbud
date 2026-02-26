# OneSignal Subscription Debug Guide

## Problem
Error: "All included players are not subscribed"

This means OneSignal doesn't have a valid push subscription for your user ID.

## Root Causes

1. **User not subscribed to OneSignal** - The user granted browser permission but OneSignal SDK hasn't created a subscription
2. **External User ID not linked** - The user is subscribed but not linked to your user ID
3. **Subscription expired or invalid** - The subscription token is no longer valid

## Step-by-Step Fix

### Step 1: Check Browser Console

Open your browser console (F12) and look for:
- ✅ "OneSignal initialized successfully"
- ✅ "OneSignal linked to user: [your-user-id]"
- ✅ "OneSignal Player ID: [some-id]"

If you see errors, note them down.

### Step 2: Verify OneSignal Dashboard

1. Go to https://onesignal.com/
2. Login and select your app
3. Go to "Audience" → "All Users"
4. Check if you see any subscribed users
5. Look for your External User ID in the list

### Step 3: Check Subscription Status

Run this in your browser console:
```javascript
// Check if OneSignal is loaded
console.log('OneSignal loaded:', typeof OneSignal !== 'undefined');

// Check subscription status
OneSignal.User.PushSubscription.id.then(id => {
  console.log('Subscription ID:', id);
});

// Check if subscribed
OneSignal.User.PushSubscription.optedIn.then(optedIn => {
  console.log('Opted in:', optedIn);
});

// Check external user ID
OneSignal.User.getExternalId().then(externalId => {
  console.log('External User ID:', externalId);
});
```

### Step 4: Manual Subscription Test

If the above shows no subscription, try manually subscribing:
```javascript
// Request permission and subscribe
await OneSignal.Notifications.requestPermission();

// Wait a moment for subscription to complete
await new Promise(resolve => setTimeout(resolve, 2000));

// Check subscription again
const id = await OneSignal.User.PushSubscription.id;
console.log('New Subscription ID:', id);
```

## Common Issues & Solutions

### Issue 1: Permission Granted but Not Subscribed

**Symptoms:**
- Browser shows notifications allowed
- OneSignal dashboard shows 0 users
- Console shows no Player ID

**Solution:**
The OneSignal SDK needs to explicitly opt-in the user after permission is granted.

### Issue 2: Using Wrong API Endpoint

**Symptoms:**
- Error: "All included players are not subscribed"
- User appears in dashboard but notifications fail

**Solution:**
Use `include_player_ids` instead of `include_external_user_ids` until external ID is properly linked.

### Issue 3: Service Worker Not Registered

**Symptoms:**
- Notifications work in foreground only
- Background notifications fail

**Solution:**
Ensure `/OneSignalSDKWorker.js` is accessible and service worker is registered.

## Testing Checklist

- [ ] Browser notification permission is "granted"
- [ ] OneSignal SDK initialized without errors
- [ ] User appears in OneSignal dashboard
- [ ] Subscription ID is not null
- [ ] External User ID is set correctly
- [ ] Test notification works via OneSignal dashboard
- [ ] Test notification works via API

## Quick Fix Commands

### Clear OneSignal Data and Re-subscribe
```javascript
// In browser console
localStorage.clear();
sessionStorage.clear();
location.reload();
// Then grant permission again when prompted
```

### Force Re-initialization
```javascript
// In browser console
await OneSignal.logout();
await OneSignal.login('YOUR_USER_ID');
```

## Next Steps

If none of the above works:
1. Check OneSignal SDK version compatibility
2. Verify your OneSignal App ID and REST API Key
3. Check browser console for CORS or network errors
4. Try in incognito mode to rule out extension conflicts
5. Test on a different browser

## Support Resources

- OneSignal Documentation: https://documentation.onesignal.com/
- OneSignal Web SDK: https://github.com/OneSignal/OneSignal-Website-SDK
- OneSignal Support: https://onesignal.com/support