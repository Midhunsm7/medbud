'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Plus, Search, Filter, Calendar, TrendingUp, Sparkles } from 'lucide-react';
import { useReminders } from '@/hooks/useReminders';
import { useNotifications } from '@/hooks/useNotifications';
import ReminderCard from '@/components/ReminderCard';
import ReminderForm from '@/components/ReminderForm';
import LoadingSkeleton from '@/components/LoadingSkeleton';
import type { Reminder } from '@/types/reminder';
import { pageVariants, containerVariants, itemVariants, buttonVariants } from '@/lib/animations';
import { toast } from 'react-hot-toast';

export default function RemindersPage() {
  const { reminders, addReminder, removeReminder, updateReminder } = useReminders();
  const { notificationPermission, requestPermission, isEnabled } = useNotifications(reminders);
  const [showForm, setShowForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterFrequency, setFilterFrequency] = useState<string>('all');
  const [recentlyAddedId, setRecentlyAddedId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate initial loading
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  const handleAddReminder = (reminder: Reminder) => {
    addReminder(reminder);
    setRecentlyAddedId(reminder.id);
    setTimeout(() => setRecentlyAddedId(null), 3000);
    setShowForm(false);
    toast.success('Reminder added successfully!');
  };

  const handleDeleteReminder = (id: string) => {
    removeReminder(id);
    toast.success('Reminder deleted');
  };

  const filteredReminders = reminders.filter(reminder => {
    const matchesSearch = reminder.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         reminder.dosage?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterFrequency === 'all' || reminder.frequency === filterFrequency;
    return matchesSearch && matchesFilter;
  });

  const stats = {
    total: reminders.length,
    daily: reminders.filter(r => r.frequency === 'daily').length,
    weekly: reminders.filter(r => r.frequency === 'weekly').length,
    monthly: reminders.filter(r => r.frequency === 'monthly').length,
  };

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-4 md:p-6 lg:p-8"
    >
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <motion.header 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="mb-8"
        >
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-700 bg-clip-text text-transparent mb-2">
                Your Reminders
              </h1>
              <p className="text-gray-600">Manage your medication schedule</p>
            </div>

            <div className="flex items-center gap-3">
              {/* Notification Toggle */}
              <motion.button
                variants={buttonVariants}
                whileHover="hover"
                whileTap="tap"
                onClick={requestPermission}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isEnabled
                    ? 'bg-green-100 text-green-700 border-2 border-green-200'
                    : 'bg-blue-100 text-blue-700 border-2 border-blue-200 hover:bg-blue-200'
                }`}
              >
                <Bell className={`w-4 h-4 ${isEnabled ? 'animate-pulse' : ''}`} />
                {isEnabled ? '🔔 Notifications On' : 'Enable Notifications'}
              </motion.button>

              {/* Add Reminder Button */}
              <motion.button
                variants={buttonVariants}
                whileHover="hover"
                whileTap="tap"
                onClick={() => setShowForm(!showForm)}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
              >
                <Plus className="w-5 h-5" />
                <span className="hidden sm:inline">Add Reminder</span>
              </motion.button>
            </div>
          </div>

          {/* Stats Cards */}
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6"
          >
            {[
              { label: 'Total', value: stats.total, icon: Sparkles, color: 'blue' },
              { label: 'Daily', value: stats.daily, icon: Calendar, color: 'green' },
              { label: 'Weekly', value: stats.weekly, icon: TrendingUp, color: 'purple' },
              { label: 'Monthly', value: stats.monthly, icon: Bell, color: 'pink' },
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                variants={itemVariants}
                whileHover={{ y: -4, boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }}
                className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-600">{stat.label}</span>
                  <div className={`p-2 bg-${stat.color}-100 rounded-lg`}>
                    <stat.icon className={`w-4 h-4 text-${stat.color}-600`} />
                  </div>
                </div>
                <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
              </motion.div>
            ))}
          </motion.div>

          {/* Search and Filter */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-3"
          >
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search reminders..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none transition-all"
              />
            </div>

            {/* Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <select
                value={filterFrequency}
                onChange={(e) => setFilterFrequency(e.target.value)}
                className="pl-11 pr-8 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none transition-all appearance-none bg-white cursor-pointer min-w-[150px]"
              >
                <option value="all">All Frequencies</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
          </motion.div>
        </motion.header>

        {/* Add Reminder Form */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0, height: 0, marginBottom: 0 }}
              animate={{ opacity: 1, height: 'auto', marginBottom: 32 }}
              exit={{ opacity: 0, height: 0, marginBottom: 0 }}
              transition={{ duration: 0.3 }}
            >
              <ReminderForm 
                onSubmit={handleAddReminder}
                onCancel={() => setShowForm(false)}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Reminders List */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800">
              {searchQuery || filterFrequency !== 'all' 
                ? `Filtered Reminders (${filteredReminders.length})`
                : 'All Reminders'
              }
            </h2>
          </div>

          {isLoading ? (
            <LoadingSkeleton type="card" count={4} />
          ) : filteredReminders.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-16 px-4"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring' }}
                className="inline-flex p-6 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full mb-6"
              >
                <Bell className="w-16 h-16 text-blue-600" />
              </motion.div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">
                {searchQuery || filterFrequency !== 'all' 
                  ? 'No reminders found'
                  : 'No reminders yet'
                }
              </h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                {searchQuery || filterFrequency !== 'all'
                  ? 'Try adjusting your search or filter criteria'
                  : 'Add your first medication reminder to get started'
                }
              </p>
              {!showForm && !searchQuery && filterFrequency === 'all' && (
                <motion.button
                  variants={buttonVariants}
                  whileHover="hover"
                  whileTap="tap"
                  onClick={() => setShowForm(true)}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
                >
                  <Plus className="w-5 h-5" />
                  Add Your First Reminder
                </motion.button>
              )}
            </motion.div>
          ) : (
            <motion.div 
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              <AnimatePresence mode="popLayout">
                {filteredReminders.map((reminder) => (
                  <ReminderCard
                    key={reminder.id}
                    reminder={reminder}
                    onDelete={handleDeleteReminder}
                    isNew={reminder.id === recentlyAddedId}
                  />
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </section>

        {/* Footer Tip */}
        {reminders.length > 0 && (
          <motion.footer 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-12 pt-6 border-t border-gray-200 text-center"
          >
            <p className="text-sm text-gray-500 flex items-center justify-center gap-2">
              <Sparkles className="w-4 h-4" />
              {isEnabled
                ? '✅ Notifications enabled - You\'ll receive reminders with sound alerts'
                : '⚠️ Enable notifications to receive timely reminders with sound alerts'
              }
            </p>
          </motion.footer>
        )}
      </div>
    </motion.div>
  );
}

// Made with Bob
