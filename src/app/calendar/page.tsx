'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Pill,
  Clock,
  AlertCircle,
  CheckCircle,
  Lightbulb,
  Heart,
  Activity,
  Droplet,
  Sun,
  Moon,
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, isSameMonth, isSameDay, isToday, addMonths, subMonths, getDaysInMonth } from 'date-fns';
import { supabase } from '@/lib/supabase/supabase';
import { getCurrentCustomUser } from '@/lib/customAuth';

interface Reminder {
  id: string;
  name: string;
  dosage: string | null;
  frequency: string;
  times: string[];
  start_date: string;
  end_date: string | null;
  notes: string | null;
  type: string;
}

const healthTips = [
  {
    icon: <Pill className="w-5 h-5" />,
    title: "Take Medications on Time",
    tip: "Set alarms 15 minutes before your medication time to prepare.",
    color: "blue"
  },
  {
    icon: <Droplet className="w-5 h-5" />,
    title: "Stay Hydrated",
    tip: "Drink at least 8 glasses of water daily, especially with medications.",
    color: "cyan"
  },
  {
    icon: <Heart className="w-5 h-5" />,
    title: "Monitor Side Effects",
    tip: "Keep a journal of how you feel after taking medications.",
    color: "red"
  },
  {
    icon: <Activity className="w-5 h-5" />,
    title: "Regular Exercise",
    tip: "Light exercise can improve medication effectiveness. Consult your doctor.",
    color: "green"
  },
  {
    icon: <Sun className="w-5 h-5" />,
    title: "Morning Routine",
    tip: "Take morning medications with breakfast for better absorption.",
    color: "yellow"
  },
  {
    icon: <Moon className="w-5 h-5" />,
    title: "Bedtime Medications",
    tip: "Keep bedtime medications on your nightstand with water.",
    color: "indigo"
  },
];

export default function CalendarPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const currentUser = getCurrentCustomUser();
    setUser(currentUser);
    if (currentUser) {
      fetchReminders();
    }
  }, []);

  const fetchReminders = async () => {
    try {
      const user = getCurrentCustomUser();
      if (!user) {
        setLoading(false);
        return;
      }

      // Use API route instead of direct Supabase call
      const response = await fetch('/api/reminders');
      
      if (!response.ok) {
        console.log('Failed to fetch reminders');
        setReminders([]);
        setLoading(false);
        return;
      }

      const data = await response.json();
      setReminders(data.reminders || []);
    } catch (error) {
      console.log('Error fetching reminders:', error);
      setReminders([]);
    } finally {
      setLoading(false);
    }
  };

  const monthStart = startOfMonth(currentMonth);
  const numDays = getDaysInMonth(currentMonth);
  const daysInMonth = Array.from({ length: numDays }, (_, i) => {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), i + 1);
    return date;
  });

  const previousMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

  const getRemindersForDate = (date: Date) => {
    return reminders.filter(reminder => {
      const startDate = new Date(reminder.start_date);
      startDate.setHours(0, 0, 0, 0);
      
      const checkDate = new Date(date);
      checkDate.setHours(0, 0, 0, 0);
      
      const endDate = reminder.end_date ? new Date(reminder.end_date) : null;
      if (endDate) {
        endDate.setHours(23, 59, 59, 999);
      }
      
      // Check if date is within range
      if (checkDate < startDate || (endDate && checkDate > endDate)) {
        return false;
      }
      
      // Calculate days difference from start date
      const daysDiff = Math.floor((checkDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      
      // Check frequency
      switch (reminder.frequency) {
        case 'daily':
          return true;
        case 'weekly':
          return daysDiff % 7 === 0;
        case 'monthly':
          return checkDate.getDate() === startDate.getDate();
        default:
          return true;
      }
    });
  };

  const selectedDateReminders = getRemindersForDate(selectedDate);

  const getColorForIndex = (index: number) => {
    const colors = ['blue', 'purple', 'pink', 'green', 'orange', 'red'];
    return colors[index % colors.length];
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Please log in to view your calendar</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl">
              <CalendarIcon className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Medication Calendar</h1>
              <p className="text-gray-600">Track your medication schedule</p>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar Section */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-2xl shadow-xl p-6"
            >
              {/* Calendar Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  {format(currentMonth, 'MMMM yyyy')}
                </h2>
                <div className="flex gap-2">
                  <button
                    onClick={previousMonth}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={nextMonth}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Weekday Headers */}
              <div className="grid grid-cols-7 gap-2 mb-2">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="text-center text-sm font-semibold text-gray-600 py-2">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Days */}
              <div className="grid grid-cols-7 gap-2">
                {daysInMonth.map((day: Date, index: number) => {
                  const dayReminders = getRemindersForDate(day);
                  const isSelected = isSameDay(day, selectedDate);
                  const isCurrentDay = isToday(day);

                  return (
                    <motion.button
                      key={index}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setSelectedDate(day)}
                      className={`
                        relative p-3 rounded-lg transition-all min-h-[80px] flex flex-col items-center justify-start
                        ${isSelected ? 'bg-blue-500 text-white shadow-lg' : 'bg-gray-50 hover:bg-gray-100'}
                        ${isCurrentDay && !isSelected ? 'ring-2 ring-blue-500' : ''}
                        ${!isSameMonth(day, currentMonth) ? 'opacity-40' : ''}
                      `}
                    >
                      <span className={`text-sm font-semibold mb-1 ${isSelected ? 'text-white' : 'text-gray-900'}`}>
                        {format(day, 'd')}
                      </span>
                      {dayReminders.length > 0 && (
                        <div className="flex flex-wrap gap-1 justify-center">
                          {dayReminders.slice(0, 3).map((_, i) => (
                            <div
                              key={i}
                              className={`w-1.5 h-1.5 rounded-full ${
                                isSelected ? 'bg-white' : 'bg-blue-500'
                              }`}
                            />
                          ))}
                        </div>
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>

            {/* Selected Date Details */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 bg-white rounded-2xl shadow-xl p-6"
            >
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                {format(selectedDate, 'EEEE, MMMM d, yyyy')}
              </h3>

              {selectedDateReminders.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                  <p className="text-gray-600">No medications scheduled for this day</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedDateReminders.map((reminder, index) => (
                    <motion.div
                      key={reminder.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className={`p-4 rounded-xl border-l-4 border-${getColorForIndex(index)}-500 bg-${getColorForIndex(index)}-50`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                            <h4 className="font-semibold text-gray-900 mb-1">
                              {reminder.name}
                            </h4>
                            <div className="flex items-center gap-4 text-sm text-gray-600">
                              {reminder.dosage && (
                                <span className="flex items-center gap-1">
                                  <Pill className="w-4 h-4" />
                                  {reminder.dosage}
                                </span>
                              )}
                              <span className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                {reminder.times && reminder.times.length > 0 ? reminder.times.join(', ') : 'No time set'}
                              </span>
                            </div>
                            {reminder.notes && (
                              <p className="mt-2 text-sm text-gray-600">{reminder.notes}</p>
                            )}
                          </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          </div>

          {/* Health Tips Sidebar */}
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white rounded-2xl shadow-xl p-6"
            >
              <div className="flex items-center gap-2 mb-4">
                <Lightbulb className="w-6 h-6 text-yellow-500" />
                <h3 className="text-xl font-bold text-gray-900">Health Tips</h3>
              </div>

              <div className="space-y-4">
                {healthTips.map((tip, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`p-4 rounded-xl bg-${tip.color}-50 border border-${tip.color}-100`}
                  >
                    <div className={`flex items-center gap-2 mb-2 text-${tip.color}-600`}>
                      {tip.icon}
                      <h4 className="font-semibold">{tip.title}</h4>
                    </div>
                    <p className="text-sm text-gray-600">{tip.tip}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Quick Stats */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-xl p-6 text-white"
            >
              <h3 className="text-lg font-bold mb-4">This Month</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-blue-100">Total Medications</span>
                  <span className="text-2xl font-bold">{reminders.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-blue-100">Days with Meds</span>
                  <span className="text-2xl font-bold">
                    {daysInMonth.filter((day: Date) => getRemindersForDate(day).length > 0).length}
                  </span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Made with Bob
