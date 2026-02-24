-- Complete Database Setup for MediReminder
-- Run this script in Supabase SQL Editor

-- 1. Create reminders table
CREATE TABLE IF NOT EXISTS public.reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type VARCHAR(20) DEFAULT 'medication' CHECK (type IN ('medication', 'appointment')),
  name VARCHAR(255) NOT NULL,
  dosage VARCHAR(100),
  doctor_name VARCHAR(255),
  location VARCHAR(500),
  times TEXT[] NOT NULL,
  start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  next_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE,
  frequency VARCHAR(20) NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly')),
  notes TEXT,
  taken BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_reminders_user_id ON public.reminders(user_id);
CREATE INDEX IF NOT EXISTS idx_reminders_type ON public.reminders(type);
CREATE INDEX IF NOT EXISTS idx_reminders_user_type ON public.reminders(user_id, type);
CREATE INDEX IF NOT EXISTS idx_reminders_next_date ON public.reminders(next_date);
CREATE INDEX IF NOT EXISTS idx_reminders_frequency ON public.reminders(frequency);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS policies
-- Policy: Users can view their own reminders
CREATE POLICY "Users can view own reminders" 
ON public.reminders 
FOR SELECT 
USING (auth.uid() = user_id);

-- Policy: Users can insert their own reminders
CREATE POLICY "Users can insert own reminders" 
ON public.reminders 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own reminders
CREATE POLICY "Users can update own reminders" 
ON public.reminders 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Policy: Users can delete their own reminders
CREATE POLICY "Users can delete own reminders" 
ON public.reminders 
FOR DELETE 
USING (auth.uid() = user_id);

-- 5. Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. Create trigger for updated_at
DROP TRIGGER IF EXISTS update_reminders_updated_at ON public.reminders;
CREATE TRIGGER update_reminders_updated_at
  BEFORE UPDATE ON public.reminders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 7. Create view for active reminders
CREATE OR REPLACE VIEW active_reminders AS
SELECT 
  r.*,
  CASE 
    WHEN r.type = 'medication' THEN r.dosage
    WHEN r.type = 'appointment' THEN COALESCE(r.doctor_name, '') || ' at ' || COALESCE(r.location, '')
    ELSE NULL
  END as display_info
FROM public.reminders r
WHERE r.end_date IS NULL OR r.end_date > NOW()
ORDER BY r.next_date ASC;

-- 8. Create view for reminder history
CREATE OR REPLACE VIEW reminder_history AS
SELECT 
  r.*,
  CASE 
    WHEN r.type = 'medication' THEN r.dosage
    WHEN r.type = 'appointment' THEN COALESCE(r.doctor_name, '') || ' at ' || COALESCE(r.location, '')
    ELSE NULL
  END as display_info
FROM public.reminders r
WHERE r.end_date IS NOT NULL AND r.end_date <= NOW()
ORDER BY r.end_date DESC;

-- 9. Add comments for documentation
COMMENT ON TABLE public.reminders IS 'Stores medication and appointment reminders for users';
COMMENT ON COLUMN public.reminders.type IS 'Type of reminder: medication or appointment';
COMMENT ON COLUMN public.reminders.name IS 'Name of medication or appointment';
COMMENT ON COLUMN public.reminders.dosage IS 'Dosage information for medication reminders';
COMMENT ON COLUMN public.reminders.doctor_name IS 'Doctor name for appointment reminders';
COMMENT ON COLUMN public.reminders.location IS 'Location for appointment reminders';
COMMENT ON COLUMN public.reminders.times IS 'Array of time strings in HH:MM format';
COMMENT ON COLUMN public.reminders.frequency IS 'How often the reminder repeats: daily, weekly, or monthly';

-- 10. Grant permissions (if needed)
-- GRANT ALL ON public.reminders TO authenticated;
-- GRANT ALL ON public.reminders TO service_role;

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Database setup completed successfully!';
  RAISE NOTICE 'Table: reminders created with RLS enabled';
  RAISE NOTICE 'Indexes: Created for performance optimization';
  RAISE NOTICE 'Views: active_reminders and reminder_history created';
  RAISE NOTICE 'Triggers: Auto-update timestamp trigger added';
END $$;

-- Made with Bob
