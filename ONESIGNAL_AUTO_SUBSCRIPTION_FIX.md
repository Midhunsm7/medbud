# OneSignal Auto-Subscription Fix

## Problem
Users were getting the error "All included players are not subscribed" when trying to send notifications via OneSignal API. This happened because:

1. Users were being linked to OneSignal with `setExternalUserId()` but weren't actually **subscribed** to push notifications
2. OneSignal knew about the user ID but had no active push subscription
3. The subscription flow wasn't being enforced during signup/login

## Solution Implemented

### 1. Enhanced OneSignal Library (`src/lib/onesignal.ts`)

#### Added `ensureSubscribed()` Function
```typescript
export async function ensureSubscribed(): Promise<{ subscribed: boolean; playerId: string | null }>
```
- Checks if user is already subscribed
- Requests notification permission if needed
- Waits for subscription to complete
- Returns subscription status and player ID

#### Updated `setExternalUserId()` Function
- Now verifies user is subscribed BEFORE linking external ID
- Throws error if user is not subscribed
- Prevents linking unsubscribed users

#### Enhanced `requestNotificationPermission()` Function
- Now waits for subscription to complete after permission is granted
- Verifies subscription was created successfully

### 2. Updated OneSignalInit Component (`src/components/OneSignalInit.tsx`)

#### Auto-Subscription Flow
- Detects `newUser` and `autoSubscribe` URL parameters
- Automatically subscribes users during signup/login
- Links external user ID only AFTER subscription is confirmed
- Shows appropriate success/error messages

#### Manual Subscription Flow
- Uses `ensureSubscribed()` for manual permission requests
- Links user ID after successful subscription
- Provides clear feedback to users

#### Existing User Handling
- Checks if existing users are subscribed
- Re-subscribes if permission granted but not subscribed
- Links user ID after ensuring subscription

### 3. Updated Signup Flow (`src/app/signup/page.tsx`)

- Redirects to `/reminders?newUser=true&autoSubscribe=true` after successful signup
- Triggers automatic subscription on the reminders page

### 4. Updated Login Flow (`src/app/login/page.tsx`)

- Redirects to `/reminders?autoSubscribe=true` after successful login
- Ensures users are subscribed even if they weren't before

## How It Works

### New User Signup
1. User creates account → auto-login
2. Redirected to `/reminders?newUser=true&autoSubscribe=true`
3. OneSignalInit detects flags and calls `ensureSubscribed()`
4. Permission requested → user grants → subscription created
5. External user ID linked to subscription
6. User is now fully subscribed and linked

### Existing User Login
1. User logs in
2. Redirected to `/reminders?autoSubscribe=true`
3. OneSignalInit checks subscription status
4. If not subscribed: calls `ensureSubscribed()`
5. Links/re-links external user ID
6. User is now subscribed and linked

### Manual Permission Request
1. User clicks "Enable" on notification prompt
2. `ensureSubscribed()` handles full flow
3. Links user ID after subscription
4. Shows success message

## Key Changes

### Before
- Users were linked with `setExternalUserId()` without checking subscription
- No guarantee user was actually subscribed
- API calls failed with "All included players are not subscribed"

### After
- Subscription is ALWAYS verified before linking external ID
- `ensureSubscribed()` function handles complete subscription flow
- Auto-subscription on signup/login ensures all users are subscribed
- Clear error handling and user feedback

## Testing

### Test New User Signup
1. Sign up with new account
2. Should see "Setting up notifications..." message
3. Permission prompt should appear automatically
4. After granting: "Notifications enabled!" message
5. Check browser console for subscription confirmation

### Test Existing User Login
1. Log in with existing account
2. Should see "Setting up notifications..." message
3. If not subscribed: permission prompt appears
4. After granting: user is subscribed and linked

### Test Manual Permission
1. Dismiss auto-prompt or deny initially
2. Click notification toggle or prompt later
3. Should successfully subscribe and link

## Verification

Check browser console for these logs:
- ✅ OneSignal initialized successfully
- ✅ Already subscribed: [player-id] (if already subscribed)
- ✅ Subscription successful: [player-id] (after new subscription)
- ✅ User subscribed and linked: [user-id] [player-id]
- ✅ External user ID set: [user-id] Player ID: [player-id]

## API Calls

Now when you send notifications via OneSignal API:
```typescript
{
  app_id: ONESIGNAL_APP_ID,
  include_external_user_ids: [userId],
  headings: { en: title },
  contents: { en: message }
}
```

The user will be:
1. ✅ Subscribed to push notifications
2. ✅ Linked to their external user ID
3. ✅ Ready to receive notifications

## Error Prevention

The fix prevents these errors:
- ❌ "All included players are not subscribed"
- ❌ "invalid_external_user_ids"
- ❌ Notifications not being delivered

## Notes

- Users MUST grant notification permission for this to work
- If user denies permission, they won't receive notifications
- The system will retry subscription on next login
- All database users will be auto-subscribed on their next login

## Made with Bob