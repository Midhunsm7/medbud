# Testing Your App on Mobile Locally (Without Publishing)

## Overview
You can test your Next.js app on your phone while it's running on your laptop, without deploying to production. Both devices need to be on the same WiFi network.

## Method 1: Using Your Local IP Address (Recommended)

### Step 1: Find Your Computer's Local IP Address

**On macOS:**
```bash
# Option 1: Using ifconfig
ifconfig | grep "inet " | grep -v 127.0.0.1

# Option 2: Using System Preferences
# System Preferences → Network → WiFi → Advanced → TCP/IP
# Look for "IPv4 Address"

# Option 3: Quick command
ipconfig getifaddr en0
```

**On Windows:**
```bash
ipconfig
# Look for "IPv4 Address" under your WiFi adapter
```

**On Linux:**
```bash
hostname -I
# or
ip addr show
```

Your local IP will look like: `192.168.1.X` or `10.0.0.X`

### Step 2: Update Next.js Configuration

Edit your `package.json` to allow external connections:

```json
{
  "scripts": {
    "dev": "next dev",
    "dev:mobile": "next dev -H 0.0.0.0",
    "build": "next build",
    "start": "next start"
  }
}
```

### Step 3: Start the Development Server

```bash
npm run dev:mobile
```

You should see output like:
```
- Local:        http://localhost:3000
- Network:      http://192.168.1.X:3000
```

### Step 4: Access from Your Phone

1. Make sure your phone is on the **same WiFi network** as your laptop
2. Open your phone's browser (Safari, Chrome, etc.)
3. Navigate to: `http://192.168.1.X:3000` (use YOUR IP address)
4. The app should load!

### Step 5: Update Supabase Configuration (Important!)

Since you're using a different URL, you need to allow it in Supabase:

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to: **Authentication** → **URL Configuration**
4. Add to **Redirect URLs**:
   - `http://192.168.1.X:3000/**` (replace with your IP)
   - `http://localhost:3000/**`

### Troubleshooting Method 1

**Issue: Can't connect from phone**
- Verify both devices are on same WiFi
- Check firewall settings on your laptop
- Try disabling VPN if active
- Restart the dev server

**Issue: Connection refused**
- Make sure you used `npm run dev:mobile` (with -H 0.0.0.0)
- Check if port 3000 is blocked by firewall

**Issue: Authentication fails**
- Update Supabase redirect URLs (Step 5)
- Clear browser cache on phone
- Check console logs for CORS errors

---

## Method 2: Using ngrok (Easiest for HTTPS)

ngrok creates a secure tunnel to your localhost, giving you a public HTTPS URL.

### Step 1: Install ngrok

**macOS (using Homebrew):**
```bash
brew install ngrok
```

**Windows/Linux:**
Download from: https://ngrok.com/download

### Step 2: Sign Up for ngrok (Free)

1. Go to: https://dashboard.ngrok.com/signup
2. Create a free account
3. Get your auth token from: https://dashboard.ngrok.com/get-started/your-authtoken

### Step 3: Configure ngrok

```bash
ngrok config add-authtoken YOUR_AUTH_TOKEN
```

### Step 4: Start Your Next.js App

```bash
npm run dev
```

### Step 5: Start ngrok Tunnel

In a **new terminal window**:
```bash
ngrok http 3000
```

You'll see output like:
```
Forwarding    https://abc123.ngrok.io -> http://localhost:3000
```

### Step 6: Access from Your Phone

1. Copy the HTTPS URL (e.g., `https://abc123.ngrok.io`)
2. Open it on your phone's browser
3. Your app should load with HTTPS!

### Step 7: Update Supabase for ngrok

1. Go to Supabase Dashboard → Authentication → URL Configuration
2. Add to **Redirect URLs**:
   - `https://abc123.ngrok.io/**` (use your ngrok URL)

### Benefits of ngrok
- ✅ Provides HTTPS (required for SameSite=None cookies)
- ✅ Works from anywhere (not just same WiFi)
- ✅ Can share with others for testing
- ✅ Stable URL during session

### ngrok Limitations (Free Tier)
- URL changes each time you restart ngrok
- Session timeout after 2 hours
- Limited bandwidth

---

## Method 3: Using Cloudflare Tunnel (Alternative to ngrok)

Similar to ngrok but with different features.

### Step 1: Install Cloudflare Tunnel

**macOS:**
```bash
brew install cloudflare/cloudflare/cloudflared
```

**Windows/Linux:**
Download from: https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/

### Step 2: Start Tunnel

```bash
# Start your Next.js app first
npm run dev

# In another terminal
cloudflared tunnel --url http://localhost:3000
```

You'll get a URL like: `https://xyz.trycloudflare.com`

### Step 3: Access from Phone

Use the provided URL on your phone's browser.

---

## Method 4: Using Tailscale (For Advanced Users)

Creates a private network between your devices.

### Quick Setup

1. Install Tailscale on laptop: https://tailscale.com/download
2. Install Tailscale on phone
3. Sign in to same account on both
4. Use Tailscale IP to access: `http://100.x.x.x:3000`

---

## Recommended Setup for Your Project

Since your app uses `SameSite=None` cookies (which require HTTPS), I recommend:

### For Quick Testing: Use ngrok

```bash
# Terminal 1: Start Next.js
npm run dev

# Terminal 2: Start ngrok
ngrok http 3000

# Use the HTTPS URL on your phone
```

### For Regular Development: Use Local IP

```bash
# Start with network access
npm run dev:mobile

# Access via: http://192.168.1.X:3000
```

**Note**: For local IP method, you'll need to temporarily change cookies to `SameSite=Lax` for HTTP testing, or use ngrok for HTTPS.

---

## Quick Start Commands

Add these to your `package.json`:

```json
{
  "scripts": {
    "dev": "next dev",
    "dev:mobile": "next dev -H 0.0.0.0",
    "dev:ngrok": "concurrently \"npm run dev\" \"ngrok http 3000\"",
    "build": "next build",
    "start": "next start"
  }
}
```

Then install concurrently (optional):
```bash
npm install -D concurrently
```

Now you can run:
```bash
npm run dev:mobile    # For local IP access
npm run dev:ngrok     # For ngrok (if installed)
```

---

## Testing Checklist

- [ ] Both devices on same WiFi (for local IP method)
- [ ] Firewall allows connections on port 3000
- [ ] Next.js running with `-H 0.0.0.0` flag
- [ ] Supabase redirect URLs updated
- [ ] Phone browser cache cleared
- [ ] HTTPS enabled (for SameSite=None cookies)

---

## Debugging Tips

### Check if server is accessible

**From your laptop:**
```bash
curl http://localhost:3000
```

**From your phone:**
- Open browser
- Navigate to `http://YOUR_IP:3000`
- Check browser console for errors

### Common Issues

**"This site can't be reached"**
- Verify IP address is correct
- Check both devices on same WiFi
- Disable VPN
- Check firewall settings

**"Authentication failed"**
- Update Supabase redirect URLs
- Clear phone browser cache
- Check if HTTPS is required (use ngrok)

**"Cookie not set"**
- For HTTP: Change `SameSite=None` to `SameSite=Lax` temporarily
- For HTTPS: Use ngrok or Cloudflare tunnel

---

## My Recommendation for You

Based on your setup with `SameSite=None` cookies:

1. **Use ngrok** for the most accurate testing (provides HTTPS)
2. **Steps**:
   ```bash
   # Install ngrok
   brew install ngrok
   
   # Sign up and get auth token from ngrok.com
   ngrok config add-authtoken YOUR_TOKEN
   
   # Start your app
   npm run dev
   
   # In new terminal, start ngrok
   ngrok http 3000
   
   # Use the HTTPS URL on your phone
   ```

3. **Update Supabase** with the ngrok URL
4. **Test** sign up and sign in on your phone
5. **Check console logs** for debugging

This way you get:
- ✅ HTTPS (required for your cookies)
- ✅ Easy to use
- ✅ Works from anywhere
- ✅ Accurate production-like testing

---

**Need Help?**
- ngrok docs: https://ngrok.com/docs
- Next.js docs: https://nextjs.org/docs
- Supabase docs: https://supabase.com/docs