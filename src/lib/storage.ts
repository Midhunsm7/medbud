import type { Reminder } from '@/types/reminder';

const KEY = 'reminders';

export function loadReminders(): Reminder[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) as Reminder[] : [];
  } catch {
    return [];
  }
}

export function saveReminders(data: Reminder[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    // ignore quota errors
  }
}