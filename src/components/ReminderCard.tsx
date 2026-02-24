'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Pill, Clock, Calendar, Trash2, Edit2, CheckCircle, AlertCircle, Stethoscope, MapPin } from 'lucide-react';
import { useState } from 'react';
import type { Reminder } from '@/types/reminder';
import { cardHoverVariants, buttonVariants, fadeInVariants } from '@/lib/animations';
import { formatTime12Hour } from '@/types/reminder';

interface ReminderCardProps {
  reminder: Reminder;
  onDelete: (id: string) => void;
  onEdit?: (reminder: Reminder) => void;
  isNew?: boolean;
}

export default function ReminderCard({ reminder, onDelete, onEdit, isNew = false }: ReminderCardProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    await new Promise(resolve => setTimeout(resolve, 300)); // Smooth animation
    onDelete(reminder.id);
  };

  const formatNextDate = (date: Date) => {
    const now = new Date();
    const reminderDate = new Date(date);
    const diffMs = reminderDate.getTime() - now.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 0) return 'Overdue';
    if (diffMins < 60) return `In ${diffMins} min${diffMins !== 1 ? 's' : ''}`;
    if (diffHours < 24) return `In ${diffHours} hour${diffHours !== 1 ? 's' : ''}`;
    if (diffDays < 7) return `In ${diffDays} day${diffDays !== 1 ? 's' : ''}`;
    
    return reminderDate.toLocaleDateString([], { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTypeColor = (type?: string) => {
    switch(type) {
      case 'appointment': return 'from-teal-500 to-teal-600';
      case 'medication':
      default: return 'from-blue-500 to-blue-600';
    }
  };

  const getFrequencyColor = (frequency: string) => {
    switch(frequency) {
      case 'daily': return 'from-blue-500 to-blue-600';
      case 'weekly': return 'from-purple-500 to-purple-600';
      case 'monthly': return 'from-pink-500 to-pink-600';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  const getFrequencyBadgeColor = (frequency: string) => {
    switch(frequency) {
      case 'daily': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'weekly': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'monthly': return 'bg-pink-100 text-pink-700 border-pink-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{
        opacity: 1,
        scale: 1,
        y: 0,
        boxShadow: isNew
          ? '0 0 0 3px rgba(59, 130, 246, 0.3)'
          : '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
      }}
      exit={{
        opacity: 0,
        scale: 0.9,
        x: -100,
        transition: { duration: 0.3 }
      }}
      whileHover="hover"
      whileTap="tap"
      className={`relative bg-white rounded-2xl border overflow-hidden transition-all ${
        isNew ? 'ring-2 ring-blue-400 border-blue-200' : 'border-gray-100'
      }`}
    >
      {/* Gradient accent bar */}
      <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${getTypeColor(reminder.type)}`} />
      
      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start gap-3 flex-1">
            <motion.div
              whileHover={{ rotate: [0, -10, 10, -10, 0] }}
              transition={{ duration: 0.5 }}
              className={`p-2.5 bg-gradient-to-br ${getTypeColor(reminder.type)} rounded-xl shadow-sm`}
            >
              {reminder.type === 'appointment' ? (
                <Stethoscope className="w-5 h-5 text-white" />
              ) : (
                <Pill className="w-5 h-5 text-white" />
              )}
            </motion.div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-bold text-gray-900 text-lg truncate">
                  {reminder.name}
                </h3>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                  reminder.type === 'appointment'
                    ? 'bg-teal-100 text-teal-700'
                    : 'bg-blue-100 text-blue-700'
                }`}>
                  {reminder.type === 'appointment' ? 'Appointment' : 'Medication'}
                </span>
              </div>
              
              {reminder.type === 'appointment' ? (
                <div className="space-y-1">
                  {reminder.doctorName && (
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center gap-1.5 text-sm text-gray-600"
                    >
                      <Stethoscope className="w-3.5 h-3.5" />
                      <span className="font-medium">Dr. {reminder.doctorName}</span>
                    </motion.div>
                  )}
                  {reminder.location && (
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.05 }}
                      className="flex items-center gap-1.5 text-sm text-gray-600"
                    >
                      <MapPin className="w-3.5 h-3.5" />
                      <span>{reminder.location}</span>
                    </motion.div>
                  )}
                </div>
              ) : (
                reminder.dosage && (
                  <motion.span
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="inline-block text-sm text-gray-600 bg-gray-100 px-2.5 py-1 rounded-full font-medium"
                  >
                    {reminder.dosage}
                  </motion.span>
                )
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1 ml-2">
            {onEdit && (
              <motion.button
                variants={buttonVariants}
                whileHover="hover"
                whileTap="tap"
                onClick={() => onEdit(reminder)}
                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                aria-label="Edit reminder"
              >
                <Edit2 className="w-4 h-4" />
              </motion.button>
            )}
            
            <motion.button
              variants={buttonVariants}
              whileHover="hover"
              whileTap="tap"
              onClick={() => setShowDeleteConfirm(true)}
              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              aria-label="Delete reminder"
            >
              <Trash2 className="w-4 h-4" />
            </motion.button>
          </div>
        </div>

        {/* Details */}
        <div className="space-y-2.5 mb-4">
          {/* Appointment Date - Only for appointments */}
          {reminder.type === 'appointment' && reminder.appointmentDate && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="flex items-center gap-2.5 text-gray-700"
            >
              <div className="p-1.5 bg-teal-50 rounded-lg">
                <Calendar className="w-4 h-4 text-teal-600" />
              </div>
              <span className="font-medium text-sm">
                {new Date(reminder.appointmentDate).toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </span>
            </motion.div>
          )}

          {/* Time */}
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: reminder.type === 'appointment' && reminder.appointmentDate ? 0.15 : 0.1 }}
            className="flex items-center gap-2.5 text-gray-700"
          >
            <div className="p-1.5 bg-blue-50 rounded-lg">
              <Clock className="w-4 h-4 text-blue-600" />
            </div>
            <span className="font-medium text-sm">
              {reminder.times.map(time => formatTime12Hour(time)).join(', ')}
            </span>
          </motion.div>

          {/* Reminder Advance - Only for appointments */}
          {reminder.type === 'appointment' && reminder.reminderAdvance && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="flex items-center gap-2.5"
            >
              <div className="p-1.5 bg-amber-50 rounded-lg">
                <AlertCircle className="w-4 h-4 text-amber-600" />
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full border bg-amber-50 text-amber-700 border-amber-200">
                Remind {reminder.reminderAdvance}h before
              </span>
            </motion.div>
          )}
          
          {/* Frequency - Only for medications */}
          {reminder.type === 'medication' && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="flex items-center gap-2.5"
            >
              <div className="p-1.5 bg-purple-50 rounded-lg">
                <Calendar className="w-4 h-4 text-purple-600" />
              </div>
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${getFrequencyBadgeColor(reminder.frequency)}`}>
                {reminder.frequency.charAt(0).toUpperCase() + reminder.frequency.slice(1)}
              </span>
            </motion.div>
          )}
        </div>

        {/* Notes */}
        {reminder.notes && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-4 p-3 bg-amber-50 border border-amber-100 rounded-xl"
          >
            <p className="text-sm text-amber-800 flex items-start gap-2">
              <span className="text-base">📝</span>
              <span className="flex-1">{reminder.notes}</span>
            </p>
          </motion.div>
        )}

        {/* Next reminder time */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="flex items-center justify-between pt-3 border-t border-gray-100"
        >
          <span className="text-xs text-gray-500 font-medium">Next reminder:</span>
          <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">
            {formatNextDate(new Date(reminder.nextDate))}
          </span>
        </motion.div>

        {/* New badge */}
        {isNew && (
          <motion.div 
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, type: 'spring' }}
            className="absolute top-4 right-4 bg-green-500 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-lg flex items-center gap-1"
          >
            <CheckCircle className="w-3 h-3" />
            New
          </motion.div>
        )}
      </div>

      {/* Delete confirmation overlay */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-white/95 backdrop-blur-sm flex items-center justify-center p-4 z-10"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="text-center"
            >
              <div className="inline-flex p-3 bg-red-100 rounded-full mb-3">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <h4 className="font-bold text-gray-900 mb-2">Delete Reminder?</h4>
              <p className="text-sm text-gray-600 mb-4">
                This action cannot be undone.
              </p>
              <div className="flex gap-2 justify-center">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={isDeleting}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors disabled:opacity-50"
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {isDeleting ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                      />
                      Deleting...
                    </>
                  ) : (
                    'Delete'
                  )}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// Made with Bob
