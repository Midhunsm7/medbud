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

      // Query Supabase directly (no RLS)
      const { data, error } = await supabase
        .from('reminders')
        .select('*')
        .eq('user_id', user.id)
        .order('next_date', { ascending: true });

      if (error) {
        console.error('Error loading reminders:', error);
        toast.error('Failed to load reminders from database');
        return;
      }

      // Transform database data to match Reminder type
      const transformedReminders: Reminder[] = (data || []).map(item => ({
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
      console.log(`✅ Loaded ${transformedReminders.length} reminders from database`);
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

      // Transform to database format
      const dbReminder = {
        id: reminder.id,
        user_id: user.id, // Custom auth user ID
        type: reminder.type,
        name: reminder.name,
        dosage: reminder.dosage,
        doctor_name: reminder.doctorName,
        location: reminder.location,
        appointment_date: reminder.appointmentDate,
        reminder_advance: reminder.reminderAdvance,
        times: reminder.times,
        start_date: reminder.startDate || new Date().toISOString(),
        next_date: reminder.nextDate.toISOString(),
        end_date: reminder.endDate,
        frequency: reminder.frequency,
        notes: reminder.notes,
        taken: reminder.taken || false,
      };

      // Insert into Supabase (no RLS)
      const { error } = await supabase
        .from('reminders')
        .insert([dbReminder]);

      if (error) {
        console.error('Error adding reminder:', error);
        toast.error('Failed to add reminder to database');
        return;
      }

      // Update local state
      setReminders(prev => [reminder, ...prev]);
      console.log('✅ Reminder added to database');
    } catch (error) {
      console.error('Error in addReminder:', error);
      toast.error('Failed to add reminder');
    }
  };

  const removeReminder = async (id: string) => {
    try {
      // Delete from Supabase (no RLS)
      const { error } = await supabase
        .from('reminders')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting reminder:', error);
        toast.error('Failed to delete reminder from database');
        return;
      }

      // Update local state
      setReminders(prev => prev.filter(r => r.id !== id));
      console.log('✅ Reminder deleted from database');
    } catch (error) {
      console.error('Error in removeReminder:', error);
      toast.error('Failed to delete reminder');
    }
  };

  const updateReminder = async (reminder: Reminder) => {
    try {
      // Transform to database format
      const dbReminder = {
        type: reminder.type,
        name: reminder.name,
        dosage: reminder.dosage,
        doctor_name: reminder.doctorName,
        location: reminder.location,
        appointment_date: reminder.appointmentDate,
        reminder_advance: reminder.reminderAdvance,
        times: reminder.times,
        next_date: reminder.nextDate.toISOString(),
        end_date: reminder.endDate,
        frequency: reminder.frequency,
        notes: reminder.notes,
        taken: reminder.taken,
      };

      // Update in Supabase (no RLS)
      const { error } = await supabase
        .from('reminders')
        .update(dbReminder)
        .eq('id', reminder.id);

      if (error) {
        console.error('Error updating reminder:', error);
        toast.error('Failed to update reminder in database');
        return;
      }

      // Update local state
      setReminders(prev => prev.map(r => r.id === reminder.id ? reminder : r));
      console.log('✅ Reminder updated in database');
    } catch (error) {
      console.error('Error in updateReminder:', error);
      toast.error('Failed to update reminder');
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
