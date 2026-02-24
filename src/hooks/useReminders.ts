'use client';

import { useEffect, useState } from 'react';
import type { Reminder } from '@/types/reminder';
import { supabase } from '@/lib/supabase/supabase';
import { getCurrentCustomUser } from '@/lib/customAuth';
import { toast } from 'react-hot-toast';

export function useReminders() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load reminders from Supabase on mount
  useEffect(() => {
    loadReminders();
  }, []);

  const loadReminders = async () => {
    try {
      setIsLoading(true);
      const user = getCurrentCustomUser();
      
      if (!user) {
        console.log('No user found');
        setReminders([]);
        return;
      }

      // Use API route instead of direct Supabase call
      const response = await fetch('/api/reminders');
      
      if (!response.ok) {
        throw new Error('Failed to fetch reminders');
      }

      const data = await response.json();

      // Transform database data to match Reminder type
      const transformedReminders: Reminder[] = (data.reminders || []).map((item: any) => ({
        id: item.id,
        type: item.type as 'medication' | 'appointment',
        name: item.name,
        dosage: item.dosage,
        doctorName: item.doctor_name,
        location: item.location,
        appointmentDate: item.appointment_date,
        reminderAdvance: item.reminder_advance,
        times: item.times,
        startDate: item.start_date,
        nextDate: new Date(item.next_date),
        endDate: item.end_date,
        frequency: item.frequency as 'daily' | 'weekly' | 'monthly',
        notes: item.notes,
        taken: item.taken,
      }));

      setReminders(transformedReminders);
      console.log(`✅ Loaded ${transformedReminders.length} reminders from API`);
    } catch (error) {
      console.error('Error in loadReminders:', error);
      toast.error('Failed to load reminders');
    } finally {
      setIsLoading(false);
    }
  };

  const addReminder = async (reminder: Reminder) => {
    try {
      const user = getCurrentCustomUser();
      
      if (!user) {
        toast.error('Please log in to add reminders');
        return;
      }

      // Use API route instead of direct Supabase call
      const response = await fetch('/api/reminders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reminder }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to add reminder');
      }

      // Update local state
      setReminders(prev => [reminder, ...prev]);
      toast.success('Reminder added successfully!');
      console.log('✅ Reminder added via API');
    } catch (error: any) {
      console.error('Error in addReminder:', error);
      toast.error(error.message || 'Failed to add reminder');
    }
  };

  const removeReminder = async (id: string) => {
    try {
      // Use API route instead of direct Supabase call
      const response = await fetch(`/api/reminders?id=${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete reminder');
      }

      // Update local state
      setReminders(prev => prev.filter(r => r.id !== id));
      toast.success('Reminder deleted successfully!');
      console.log('✅ Reminder deleted via API');
    } catch (error: any) {
      console.error('Error in removeReminder:', error);
      toast.error(error.message || 'Failed to delete reminder');
    }
  };

  const updateReminder = async (reminder: Reminder) => {
    try {
      // Use API route instead of direct Supabase call
      const response = await fetch('/api/reminders', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reminder }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update reminder');
      }

      // Update local state
      setReminders(prev => prev.map(r => r.id === reminder.id ? reminder : r));
      toast.success('Reminder updated successfully!');
      console.log('✅ Reminder updated via API');
    } catch (error: any) {
      console.error('Error in updateReminder:', error);
      toast.error(error.message || 'Failed to update reminder');
    }
  };

  return { 
    reminders, 
    addReminder, 
    removeReminder, 
    updateReminder,
    isLoading,
    refreshReminders: loadReminders
  };
}

// Made with Bob
