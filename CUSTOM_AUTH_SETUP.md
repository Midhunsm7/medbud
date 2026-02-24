# Custom Authentication Setup (Testing Only)

⚠️ **WARNING**: This is for testing/development only. NOT for production use!

## Database Changes Required

Run this SQL in your Supabase SQL Editor:

```sql
-- Create custom auth table
CREATE TABLE IF NOT EXISTS public.custom_users (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  password text NOT NULL, -- Plain text for testing only!
  full_name text,
  phone text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT custom_users_pkey PRIMARY KEY (id)
);

-- Enable RLS (optional for testing)
ALTER TABLE public.custom_users ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read/write (testing only!)
CREATE POLICY "Allow all access for testing" ON public.custom_users
  FOR ALL USING (true) WITH CHECK (true);

-- Create sessions table
CREATE TABLE IF NOT EXISTS public.custom_sessions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.custom_users(id) ON DELETE CASCADE,
  token text NOT NULL UNIQUE,
  expires_at timestamp with time zone NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT custom_sessions_pkey PRIMARY KEY (id)
);

ALTER TABLE public.custom_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all session access" ON public.custom_sessions
  FOR ALL USING (true) WITH CHECK (true);
```

## How It Works

1. **Signup**: Stores email and password directly in `custom_users` table
2. **Login**: Checks email/password match in database
3. **Session**: Creates a token stored in `custom_sessions` table
4. **No rate limits**: Direct database access, no Supabase Auth limits

## Next Steps

After running the SQL above, I'll update your auth files to use this custom system.

Ready to proceed?