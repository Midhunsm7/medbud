# Supabase Setup Guide for MediReminder

## Issue: Email Not Confirmed Error

The "Email not confirmed" error occurs because Supabase requires email verification by default. Here's how to fix it:

## Solution 1: Disable Email Confirmation (Development Only)

### Steps:
1. Go to your Supabase Dashboard
2. Navigate to **Authentication** → **Providers** → **Email**
3. Find **"Confirm email"** setting
4. **Disable** the "Confirm email" toggle
5. Click **Save**

⚠️ **Note**: This is recommended for development only. For production, keep email confirmation enabled.

## Solution 2: Configure Email Confirmation (Production)

If you want to keep email confirmation enabled (recommended for production):

### 1. Configure Email Templates
1. Go to **Authentication** → **Email Templates**
2. Customize the "Confirm signup" template
3. Make sure the confirmation link points to: `{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=signup`

### 2. Set Site URL
1. Go to **Authentication** → **URL Configuration**
2. Set **Site URL** to your app URL:
   - Development: `http://localhost:3000`
   - Production: `https://yourdomain.com`
3. Add **Redirect URLs**:
   - `http://localhost:3000/auth/callback`
   - `https://yourdomain.com/auth/callback`

### 3. Test the Flow
1. Sign up with a new email
2. Check your email inbox
3. Click the verification link
4. You'll be redirected to `/auth/callback` and then to `/reminders`

## Database Setup

Make sure your database has the required tables. Run this SQL in the Supabase SQL Editor:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL UNIQUE,
  full_name text,
  avatar_url text,
  phone text,
  role text DEFAULT 'user',
  status text DEFAULT 'active',
  subscription_type text DEFAULT 'free',
  timezone text DEFAULT 'UTC',
  notification_enabled boolean DEFAULT true,
  last_active timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT users_pkey PRIMARY KEY (id)
);

-- User preferences
CREATE TABLE IF NOT EXISTS public.user_preferences (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  notification_email boolean DEFAULT true,
  notification_push boolean DEFAULT true,
  notification_sms boolean DEFAULT false,
  reminder_advance_minutes integer DEFAULT 5,
  theme text DEFAULT 'light',
  weekly_report boolean DEFAULT false,
  medication_history_access boolean DEFAULT true,
  data_sharing_consent boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_preferences_pkey PRIMARY KEY (id)
);

-- User activities
CREATE TABLE IF NOT EXISTS public.user_activities (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  activity_type text NOT NULL,
  activity_data jsonb,
  ip_address text,
  user_agent text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_activities_pkey PRIMARY KEY (id)
);

-- Login attempts
CREATE TABLE IF NOT EXISTS public.login_attempts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  email text NOT NULL,
  ip_address text NOT NULL,
  user_agent text,
  success boolean DEFAULT false,
  failure_reason text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT login_attempts_pkey PRIMARY KEY (id)
);

-- User sessions
CREATE TABLE IF NOT EXISTS public.user_sessions (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  session_token text NOT NULL UNIQUE,
  device_type text,
  browser text,
  os text,
  ip_address inet,
  location text,
  last_activity timestamp with time zone DEFAULT now(),
  expires_at timestamp with time zone NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_sessions_pkey PRIMARY KEY (id)
);

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- RLS Policies for user_preferences
CREATE POLICY "Users can view own preferences" ON public.user_preferences
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences" ON public.user_preferences
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences" ON public.user_preferences
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for user_activities
CREATE POLICY "Users can view own activities" ON public.user_activities
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own activities" ON public.user_activities
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for user_sessions
CREATE POLICY "Users can view own sessions" ON public.user_sessions
  FOR SELECT USING (auth.uid() = user_id);

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NOW(),
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

## Environment Variables

Make sure you have these in your `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Testing the Fix

### Option 1: Disable Email Confirmation (Quick Fix)
1. Disable email confirmation in Supabase dashboard
2. Sign up with a new email
3. You should be logged in immediately

### Option 2: With Email Confirmation
1. Keep email confirmation enabled
2. Sign up with a new email
3. Check your email for verification link
4. Click the link
5. You'll be redirected to the app and logged in

## Troubleshooting

### Issue: Still getting "Email not confirmed"
- Clear browser cookies and local storage
- Try signing up with a different email
- Check Supabase logs in the dashboard

### Issue: Not receiving verification emails
- Check spam folder
- Verify email settings in Supabase dashboard
- Make sure SMTP is configured (or use Supabase's default)

### Issue: Redirect not working
- Verify Site URL and Redirect URLs in Supabase
- Check that `/auth/callback/route.ts` exists
- Clear browser cache

## Production Checklist

Before deploying to production:

- [ ] Enable email confirmation
- [ ] Configure custom email templates
- [ ] Set up custom SMTP (optional)
- [ ] Configure proper Site URL and Redirect URLs
- [ ] Enable RLS policies
- [ ] Test signup flow end-to-end
- [ ] Set up monitoring and error tracking

## Support

If you continue to have issues:
1. Check Supabase logs in the dashboard
2. Review browser console for errors
3. Verify all environment variables are set
4. Test with a fresh email address

---

**Note**: The app now includes:
- ✅ Email verification page (`/verify-email`)
- ✅ Auth callback handler (`/auth/callback`)
- ✅ Proper error handling in signup flow
- ✅ Resend verification email functionality