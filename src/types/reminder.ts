export type ReminderType = "medication" | "appointment";

export type Reminder = {
  id: string;
  type: ReminderType;  // medication or appointment
  name: string;
  dosage?: string;  // for medication
  doctorName?: string;  // for appointment
  location?: string;  // for appointment
  appointmentDate?: string;  // for appointment - specific date
  reminderAdvance?: number;  // for appointment - hours before to remind (e.g., 2 = 2 hours before)
  times: string[];  // e.g. ["08:00","20:00"] - for medication
  startDate?: string;
  nextDate: Date;
  endDate?: string;
  frequency:  "daily" | "weekly" | "monthly";  // for medication only
  notes?: string;
  taken?: boolean;
  // Custom alarm sound fields
  alarmSoundUrl?: string;  // URL or data URI of custom alarm sound
  alarmSoundName?: string;  // Name of the custom alarm sound file
  useCustomSound?: boolean;  // Whether to use custom sound instead of default
};

// Helper function to convert 24h to 12h format
export const formatTime12Hour = (time24: string): string => {
  const [hours, minutes] = time24.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const hours12 = hours % 12 || 12;
  return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
};

// Helper function to convert 12h to 24h format
export const formatTime24Hour = (time12: string, period: 'AM' | 'PM'): string => {
  const [hours, minutes] = time12.split(':').map(Number);
  let hours24 = hours;
  if (period === 'PM' && hours !== 12) hours24 += 12;
  if (period === 'AM' && hours === 12) hours24 = 0;
  return `${hours24.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
};