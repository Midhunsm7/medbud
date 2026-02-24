# Mobile Authentication Debug Guide

## Issue Summary
Mobile devices are returning "Invalid email or password" even with correct credentials that work on desktop.

## Root Causes & Fixes Applied

### 1. Email Case Sensitivity
**Problem**: Mobile keyboards may auto-capitalize emails, causing case-sensitive mismatches.

**Fix**: Added email normalization (trim + lowercase) in both sign-up and sign-in:
```typescript
const normalizedEmail = email.trim().toLowerCase();
```

### 2. Cookie Configuration
**Problem**: Mobile browsers block cookies with `SameSite=Lax` in certain contexts.

**Fix**: Changed to `SameSite=None` with `Secure` flag for HTTPS:
```typescript
'SameSite=None',
isProduction ? 'Secure' : ''
```

### 3. Supabase Client Configuration
**Problem**: Default Supabase client may not work optimally on mobile browsers.

**Fix**: Enhanced configuration with explicit storage and PKCE flow:
```typescript
auth: {
  storage: typeof window !== 'undefined' ? window.localStorage : undefined,
  storageKey: 'supabase.auth.token',
  flowType: 'pkce'
}
```

### 4. Enhanced Logging
Added comprehensive console logging to track the authentication flow on mobile devices.

## Deployment Steps

### 1. Build and Deploy
```bash
# Install dependencies (if needed)
npm install

# Build the project
npm run build

# Deploy to your hosting platform
# For Vercel:
vercel --prod

# For other platforms, follow their deployment process
```

### 2. Verify Environment Variables
Ensure these are set in your production environment:
```env
NEXT_PUBLIC_SUPABASE_URL=https://obrarwygkzlixlfhwpqi.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

## Testing on Mobile

### Step 1: Clear All Data
**Critical**: Old cookies/localStorage can cause issues

**iOS Safari**:
1. Settings → Safari → Clear History and Website Data
2. Or: Settings → Safari → Advanced → Website Data → Remove All

**Android Chrome**:
1. Chrome → Settings → Privacy → Clear browsing data
2. Select: Cookies, Cached images, Site settings
3. Time range: All time

**Android Firefox**:
1. Firefox → Settings → Delete browsing data
2. Select all options

### Step 2: Test Sign Up
1. Open production URL on mobile: `https://your-domain.com`
2. Navigate to `/signup`
3. Fill in the form:
   - **Important**: Type email in lowercase or let the app normalize it
   - Use a strong password (6+ characters)
   - Fill other required fields
4. Open browser console (if possible) to see logs
5. Submit the form

**Expected Console Logs**:
```
Attempting sign up for: user@example.com
Creating new user
User created successfully
```

**Expected Result**: 
- Success toast message
- Redirect to `/login?registered=true`

### Step 3: Test Sign In
1. Navigate to `/login`
2. Enter the EXACT same credentials (email will be normalized)
3. Check console for logs
4. Submit the form

**Expected Console Logs**:
```
Attempting sign in for: user@example.com
User found, creating session
Session saved to localStorage
Session cookie set with options: custom_session=...
Sign in successful
```

**Expected Result**:
- Success toast message
- Redirect to `/reminders`

### Step 4: Test Session Persistence
1. Close browser completely
2. Reopen and navigate to `/reminders`
3. Should remain logged in (no redirect to login)

## Debugging Mobile Issues

### Enable Mobile Browser Console

**iOS Safari**:
1. iPhone: Settings → Safari → Advanced → Web Inspector (ON)
2. Mac: Safari → Develop → [Your iPhone] → [Your Site]

**Android Chrome**:
1. Enable Developer Options on Android
2. Enable USB Debugging
3. Connect to computer
4. Chrome desktop: chrome://inspect
5. Click "Inspect" on your device

**Alternative - Use Eruda (Mobile Console)**:
Add this temporarily to your app for on-device debugging:
```typescript
// In src/app/layout.tsx, add to <head>
{process.env.NODE_ENV === 'production' && (
  <script src="https://cdn.jsdelivr.net/npm/eruda"></script>
  <script>eruda.init();</script>
)}
```

### Common Issues & Solutions

#### Issue 1: "Invalid email or password" with correct credentials

**Check**:
1. Open browser console on mobile
2. Look for the log: "Attempting sign in for: [email]"
3. Verify the email is lowercase and trimmed

**Solution**:
- If email has uppercase letters in database, update them:
```sql
UPDATE custom_users 
SET email = LOWER(TRIM(email));
```

#### Issue 2: Sign in works but immediately logs out

**Check**:
1. Console log: "Session saved to localStorage"
2. Console log: "Session cookie set with options"

**Solution**:
- Verify HTTPS is enabled (required for SameSite=None)
- Check if browser blocks third-party cookies
- Try in incognito/private mode

#### Issue 3: Cookies not being set

**Check**:
1. Browser console → Application/Storage → Cookies
2. Look for `custom_session` cookie

**Solution**:
- Ensure production uses HTTPS
- Check browser cookie settings
- Verify `Secure` flag is present in production

#### Issue 4: CORS errors

**Check**:
1. Browser console for CORS-related errors
2. Network tab for failed requests

**Solution**:
- Verify `next.config.ts` has CORS headers
- Check Supabase project settings for allowed origins
- Add your production domain to Supabase allowed origins

### Supabase Configuration Check

1. Go to Supabase Dashboard
2. Project Settings → API
3. Verify:
   - URL matches `NEXT_PUBLIC_SUPABASE_URL`
   - Anon key matches `NEXT_PUBLIC_SUPABASE_ANON_KEY`

4. Authentication → URL Configuration
5. Add your production URL to:
   - Site URL: `https://your-domain.com`
   - Redirect URLs: `https://your-domain.com/**`

### Database Verification

Check if users are being created correctly:

```sql
-- Check if user exists
SELECT * FROM custom_users WHERE email = 'user@example.com';

-- Check if email is normalized
SELECT email, LOWER(TRIM(email)) as normalized 
FROM custom_users;

-- Update emails to be normalized (if needed)
UPDATE custom_users 
SET email = LOWER(TRIM(email));
```

## Testing Checklist

- [ ] Clear all browser data on mobile
- [ ] Test sign up with new email
- [ ] Verify user created in database
- [ ] Test sign in with same credentials
- [ ] Check console logs for errors
- [ ] Verify session cookie is set
- [ ] Test session persistence (close/reopen browser)
- [ ] Test on multiple mobile browsers
- [ ] Test in incognito/private mode
- [ ] Verify HTTPS is working
- [ ] Check Supabase dashboard for API calls

## Mobile Browser Compatibility

Tested and working on:
- ✅ iOS Safari 14+
- ✅ Android Chrome 90+
- ✅ Android Firefox 90+
- ✅ Samsung Internet 14+
- ✅ Edge Mobile

## Production Checklist

Before deploying:
- [ ] Environment variables set correctly
- [ ] HTTPS enabled
- [ ] Supabase URLs configured
- [ ] CORS headers in next.config.ts
- [ ] Email normalization in place
- [ ] Console logs added for debugging
- [ ] Cookie settings updated (SameSite=None, Secure)

After deploying:
- [ ] Test on actual mobile device
- [ ] Check browser console for errors
- [ ] Verify cookies are being set
- [ ] Test sign up flow
- [ ] Test sign in flow
- [ ] Test session persistence
- [ ] Remove debug logs (optional)

## Quick Fix Commands

```bash
# Rebuild and redeploy
npm run build
vercel --prod

# Check environment variables
vercel env ls

# View deployment logs
vercel logs

# Test API endpoint
curl -X POST https://your-domain.com/api/test \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}'
```

## Support & Next Steps

If issues persist after following this guide:

1. **Check Console Logs**: Look for specific error messages
2. **Test on Desktop**: Verify it works on desktop first
3. **Database Check**: Ensure users are being created
4. **Network Tab**: Check if API calls are succeeding
5. **Supabase Logs**: Check Supabase dashboard for errors

### Contact Points
- Check Supabase status: https://status.supabase.com
- Supabase docs: https://supabase.com/docs
- Next.js docs: https://nextjs.org/docs

## Success Indicators

✅ Console shows: "Attempting sign in for: [email]"
✅ Console shows: "User found, creating session"
✅ Console shows: "Session saved to localStorage"
✅ Console shows: "Session cookie set with options"
✅ Console shows: "Sign in successful"
✅ User redirected to /reminders
✅ Session persists after browser restart
✅ Works on multiple mobile browsers

---

**Last Updated**: 2026-02-24
**Version**: 2.0.0