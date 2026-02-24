-- Add appointment-specific fields to reminders table
-- Run this migration to add support for appointment dates and advance reminders

ALTER TABLE reminders 
ADD COLUMN IF NOT EXISTS appointment_date TIMESTAMP,
ADD COLUMN IF NOT EXISTS reminder_advance INTEGER;

-- Add comments for documentation
COMMENT ON COLUMN reminders.appointment_date IS 'The date and time of the appointment (for appointment type reminders)';
COMMENT ON COLUMN reminders.reminder_advance IS 'Hours before appointment to send reminder (e.g., 1, 2, 4, 24)';

-- Example: Update existing appointment reminders if needed
-- UPDATE reminders 
-- SET reminder_advance = 1 
-- WHERE type = 'appointment' AND reminder_advance IS NULL;

-- Made with Bob
