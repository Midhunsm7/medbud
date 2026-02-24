-- Add custom alarm sound support to reminders table
-- Run this in Supabase SQL Editor

-- Add alarm_sound_url column to store custom alarm sound
ALTER TABLE public.reminders 
ADD COLUMN IF NOT EXISTS alarm_sound_url TEXT;

-- Add alarm_sound_name column to store the name of the custom sound
ALTER TABLE public.reminders 
ADD COLUMN IF NOT EXISTS alarm_sound_name TEXT;

-- Add use_custom_sound boolean to indicate if custom sound should be used
ALTER TABLE public.reminders 
ADD COLUMN IF NOT EXISTS use_custom_sound BOOLEAN DEFAULT FALSE;

-- Add comments
COMMENT ON COLUMN public.reminders.alarm_sound_url IS 'URL or data URI of custom alarm sound';
COMMENT ON COLUMN public.reminders.alarm_sound_name IS 'Name of the custom alarm sound file';
COMMENT ON COLUMN public.reminders.use_custom_sound IS 'Whether to use custom sound instead of default';

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Custom alarm sound columns added successfully!';
  RAISE NOTICE 'Users can now upload custom alarm sounds for their reminders';
END $$;

-- Made with Bob
