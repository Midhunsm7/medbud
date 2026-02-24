-- Database Migration for MediReminder
-- Add support for appointment reminders and new fields

-- Add new columns to reminders table
ALTER TABLE reminders 
ADD COLUMN IF NOT EXISTS type VARCHAR(20) DEFAULT 'medication' CHECK (type IN ('medication', 'appointment'));

ALTER TABLE reminders 
ADD COLUMN IF NOT EXISTS doctor_name VARCHAR(255);

ALTER TABLE reminders 
ADD COLUMN IF NOT EXISTS location VARCHAR(500);

-- Update existing records to have 'medication' type
UPDATE reminders 
SET type = 'medication' 
WHERE type IS NULL;

-- Create index for faster queries by type
CREATE INDEX IF NOT EXISTS idx_reminders_type ON reminders(type);

-- Create index for user_id and type combination
CREATE INDEX IF NOT EXISTS idx_reminders_user_type ON reminders(user_id, type);

-- Optional: Create a view for active reminders
CREATE OR REPLACE VIEW active_reminders AS
SELECT 
  r.*,
  CASE 
    WHEN r.type = 'medication' THEN r.dosage
    WHEN r.type = 'appointment' THEN r.doctor_name || ' at ' || r.location
    ELSE NULL
  END as display_info
FROM reminders r
WHERE r.end_date IS NULL OR r.end_date > NOW();

-- Optional: Create a view for reminder history
CREATE OR REPLACE VIEW reminder_history AS
SELECT 
  r.*,
  CASE 
    WHEN r.type = 'medication' THEN r.dosage
    WHEN r.type = 'appointment' THEN r.doctor_name || ' at ' || r.location
    ELSE NULL
  END as display_info
FROM reminders r
WHERE r.end_date IS NOT NULL AND r.end_date <= NOW()
ORDER BY r.end_date DESC;

-- Add comments for documentation
COMMENT ON COLUMN reminders.type IS 'Type of reminder: medication or appointment';
COMMENT ON COLUMN reminders.doctor_name IS 'Doctor name for appointment reminders';
COMMENT ON COLUMN reminders.location IS 'Location for appointment reminders';

-- Made with Bob
