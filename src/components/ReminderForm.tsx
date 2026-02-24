'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { 
  Pill, 
  Clock, 
  Calendar, 
  Plus, 
  AlertCircle,
  CheckCircle,
  X,
  Sparkles,
  Stethoscope,
  MapPin,
  User
} from 'lucide-react';
import { useState } from 'react';
import type { Reminder, ReminderType } from '@/types/reminder';
import { itemVariants, buttonVariants } from '@/lib/animations';

const schema = z.object({
  type: z.enum(['medication', 'appointment']),
  name: z.string().min(1, 'Name is required'),
  dosage: z.string().optional(),
  doctorName: z.string().optional(),
  location: z.string().optional(),
  appointmentDate: z.string().optional(),
  reminderAdvance: z.string().optional(),
  hour: z.string(),
  minute: z.string(),
  period: z.enum(['AM', 'PM']),
  notes: z.string().optional(),
  frequency: z.enum(['daily', 'weekly', 'monthly'])
});

type FormValues = z.infer<typeof schema>;

interface ReminderFormProps {
  onSubmit: (reminder: Reminder) => void;
  onCancel?: () => void;
  initialData?: Partial<Reminder>;
  isEditing?: boolean;
}

export default function ReminderForm({ 
  onSubmit, 
  onCancel, 
  initialData, 
  isEditing = false 
}: ReminderFormProps) {
  const [showSuccess, setShowSuccess] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  // Parse initial time if editing
  const getInitialTime = (): { hour: string; minute: string; period: 'AM' | 'PM' } => {
    if (initialData?.times?.[0]) {
      const [hours24, minutes] = initialData.times[0].split(':').map(Number);
      const period: 'AM' | 'PM' = hours24 >= 12 ? 'PM' : 'AM';
      const hours12 = hours24 % 12 || 12;
      return {
        hour: hours12.toString(),
        minute: minutes.toString().padStart(2, '0'),
        period
      };
    }
    return { hour: '8', minute: '00', period: 'AM' };
  };

  const initialTime = getInitialTime();

  // Get initial appointment date if editing
  const getInitialAppointmentDate = (): string => {
    if (initialData?.appointmentDate) {
      return initialData.appointmentDate.split('T')[0]; // Extract date part
    }
    return '';
  };

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting, isDirty }
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      type: (initialData?.type || 'medication') as 'medication' | 'appointment',
      name: initialData?.name || '',
      dosage: initialData?.dosage || '',
      doctorName: initialData?.doctorName || '',
      location: initialData?.location || '',
      appointmentDate: getInitialAppointmentDate(),
      reminderAdvance: initialData?.reminderAdvance?.toString() || '1',
      hour: initialTime.hour,
      minute: initialTime.minute,
      period: initialTime.period,
      notes: initialData?.notes || '',
      frequency: (initialData?.frequency || 'daily') as 'daily' | 'weekly' | 'monthly'
    },
  });

  const watchedValues = watch();

  const handleFormSubmit = async (values: FormValues) => {
    // Generate UUID fallback
    const generateId = () => {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
    };

    // Convert 12-hour to 24-hour format
    let hours24 = parseInt(values.hour);
    if (values.period === 'PM' && hours24 !== 12) hours24 += 12;
    if (values.period === 'AM' && hours24 === 12) hours24 = 0;
    const time24 = `${hours24.toString().padStart(2, '0')}:${values.minute}`;

    const newReminder: Reminder = {
      id: initialData?.id || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : generateId()),
      type: values.type,
      name: values.name,
      dosage: values.type === 'medication' ? values.dosage : undefined,
      doctorName: values.type === 'appointment' ? values.doctorName : undefined,
      location: values.type === 'appointment' ? values.location : undefined,
      appointmentDate: values.type === 'appointment' ? values.appointmentDate : undefined,
      reminderAdvance: values.type === 'appointment' ? parseInt(values.reminderAdvance || '1') : undefined,
      times: [time24],
      notes: values.notes || '',
      frequency: values.frequency,
      nextDate: new Date()
    };
    
    // For appointments, set nextDate based on appointmentDate
    if (values.type === 'appointment' && values.appointmentDate) {
      const appointmentDateTime = new Date(values.appointmentDate);
      appointmentDateTime.setHours(hours24, parseInt(values.minute), 0, 0);
      newReminder.nextDate = appointmentDateTime;
    } else {
      newReminder.nextDate.setHours(hours24, parseInt(values.minute), 0, 0);
    }
    
    // Show success animation
    setShowSuccess(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    onSubmit(newReminder);
    
    if (!isEditing) {
      reset();
    }
    setShowSuccess(false);
  };

  const frequencyOptions = [
    { value: 'daily', label: 'Daily', icon: '📅', color: 'blue' },
    { value: 'weekly', label: 'Weekly', icon: '📆', color: 'purple' },
    { value: 'monthly', label: 'Monthly', icon: '🗓️', color: 'pink' }
  ];

  const reminderTypes = [
    { value: 'medication', label: 'Medication', icon: Pill, color: 'blue' },
    { value: 'appointment', label: 'Appointment', icon: Stethoscope, color: 'green' }
  ];

  return (
    <motion.div
      variants={itemVariants}
      initial="hidden"
      animate="visible"
      className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 md:p-8 relative overflow-hidden"
    >
      {/* Decorative gradient */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />
      
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <motion.div 
            whileHover={{ rotate: [0, -10, 10, -10, 0] }}
            transition={{ duration: 0.5 }}
            className="p-2.5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg"
          >
            {isEditing ? (
              <Sparkles className="w-6 h-6 text-white" />
            ) : (
              <Plus className="w-6 h-6 text-white" />
            )}
          </motion.div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              {isEditing ? 'Edit Reminder' : 'Add New Reminder'}
            </h2>
            <p className="text-sm text-gray-500">
              {isEditing ? 'Update your reminder details' : 'Never miss a dose or appointment'}
            </p>
          </div>
        </div>
        
        {onCancel && (
          <motion.button
            variants={buttonVariants}
            whileHover="hover"
            whileTap="tap"
            onClick={onCancel}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Close form"
          >
            <X className="w-5 h-5" />
          </motion.button>
        )}
      </div>

      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        {/* Reminder Type Selector */}
        <motion.div 
          className="space-y-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <label className="block text-sm font-semibold text-gray-700">
            Reminder Type
          </label>
          <div className="grid grid-cols-2 gap-3">
            {reminderTypes.map((type) => (
              <label
                key={type.value}
                className="relative cursor-pointer"
              >
                <input
                  type="radio"
                  value={type.value}
                  {...register('type')}
                  className="sr-only peer"
                />
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`p-4 rounded-xl border-2 text-center transition-all ${
                    watchedValues.type === type.value
                      ? `border-${type.color}-500 bg-${type.color}-50 shadow-lg`
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <type.icon className={`w-6 h-6 mx-auto mb-2 ${
                    watchedValues.type === type.value ? `text-${type.color}-600` : 'text-gray-400'
                  }`} />
                  <div className="text-sm font-semibold text-gray-700">
                    {type.label}
                  </div>
                </motion.div>
              </label>
            ))}
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Name Field */}
          <motion.div 
            className="space-y-2"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
              {watchedValues.type === 'medication' ? (
                <><Pill className="w-4 h-4 text-blue-600" /> Medicine Name *</>
              ) : (
                <><Stethoscope className="w-4 h-4 text-green-600" /> Appointment Title *</>
              )}
            </label>
            <input 
              className={`w-full px-4 py-3 rounded-xl border-2 transition-all focus:outline-none ${
                focusedField === 'name' 
                  ? 'border-blue-500 shadow-lg shadow-blue-100' 
                  : errors.name 
                  ? 'border-red-300 bg-red-50' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              {...register('name')}
              placeholder={watchedValues.type === 'medication' ? 'e.g., Metformin' : 'e.g., Dental Checkup'}
              onFocus={() => setFocusedField('name')}
              onBlur={() => setFocusedField(null)}
            />
            {errors.name && (
              <p className="flex items-center gap-1 text-sm text-red-600">
                <AlertCircle className="w-4 h-4" />
                {errors.name.message}
              </p>
            )}
          </motion.div>

          {/* Conditional Fields based on type */}
          {watchedValues.type === 'medication' ? (
            <motion.div 
              className="space-y-2"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 }}
            >
              <label className="block text-sm font-semibold text-gray-700">
                Dosage (Optional)
              </label>
              <input 
                className={`w-full px-4 py-3 rounded-xl border-2 transition-all focus:outline-none ${
                  focusedField === 'dosage' 
                    ? 'border-blue-500 shadow-lg shadow-blue-100' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                {...register('dosage')}
                placeholder="e.g., 500 mg, 2 tablets"
                onFocus={() => setFocusedField('dosage')}
                onBlur={() => setFocusedField(null)}
              />
            </motion.div>
          ) : (
            <>
              <motion.div 
                className="space-y-2"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 }}
              >
                <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <User className="w-4 h-4 text-green-600" />
                  Doctor Name (Optional)
                </label>
                <input 
                  className={`w-full px-4 py-3 rounded-xl border-2 transition-all focus:outline-none ${
                    focusedField === 'doctorName' 
                      ? 'border-green-500 shadow-lg shadow-green-100' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  {...register('doctorName')}
                  placeholder="e.g., Dr. Smith"
                  onFocus={() => setFocusedField('doctorName')}
                  onBlur={() => setFocusedField(null)}
                />
              </motion.div>

              <motion.div 
                className="md:col-span-2 space-y-2"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-green-600" />
                  Location (Optional)
                </label>
                <input 
                  className={`w-full px-4 py-3 rounded-xl border-2 transition-all focus:outline-none ${
                    focusedField === 'location' 
                      ? 'border-green-500 shadow-lg shadow-green-100' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  {...register('location')}
                  placeholder="e.g., City Hospital, Room 301"
                  onFocus={() => setFocusedField('location')}
                  onBlur={() => setFocusedField(null)}
                />
              </motion.div>
            </>
          )}

          {/* Appointment Date - Only for appointments */}
          {watchedValues.type === 'appointment' && (
            <motion.div
              className="md:col-span-2 space-y-2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-green-600" />
                Appointment Date *
              </label>
              <input
                type="date"
                {...register('appointmentDate')}
                min={new Date().toISOString().split('T')[0]}
                className={`w-full px-4 py-3 rounded-xl border-2 transition-all focus:outline-none ${
                  focusedField === 'appointmentDate'
                    ? 'border-green-500 shadow-lg shadow-green-100'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onFocus={() => setFocusedField('appointmentDate')}
                onBlur={() => setFocusedField(null)}
              />
            </motion.div>
          )}

          {/* Reminder Advance - Only for appointments */}
          {watchedValues.type === 'appointment' && (
            <motion.div
              className="md:col-span-2 space-y-2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.225 }}
            >
              <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
                <Clock className="w-4 h-4 text-green-600" />
                Remind Me Before
              </label>
              <select
                {...register('reminderAdvance')}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 hover:border-gray-300 transition-all focus:outline-none focus:border-green-500 appearance-none bg-white"
              >
                <option value="1">1 hour before</option>
                <option value="2">2 hours before</option>
                <option value="4">4 hours before</option>
                <option value="12">12 hours before</option>
                <option value="24">1 day before</option>
                <option value="48">2 days before</option>
              </select>
              <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 px-3 py-2 rounded-lg">
                <AlertCircle className="w-4 h-4" />
                You'll be reminded {watchedValues.reminderAdvance} hour{watchedValues.reminderAdvance !== '1' ? 's' : ''} before your appointment
              </div>
            </motion.div>
          )}

          {/* Time Picker - 12 Hour Format */}
          <motion.div
            className="md:col-span-2 space-y-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
          >
            <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
              <Clock className="w-4 h-4 text-purple-600" />
              Time *
            </label>
            <div className="grid grid-cols-3 gap-3">
              {/* Hour */}
              <select
                {...register('hour')}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 hover:border-gray-300 transition-all focus:outline-none focus:border-purple-500 appearance-none bg-white"
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map((h) => (
                  <option key={h} value={h}>{h}</option>
                ))}
              </select>
              
              {/* Minute */}
              <select
                {...register('minute')}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 hover:border-gray-300 transition-all focus:outline-none focus:border-purple-500 appearance-none bg-white"
              >
                {Array.from({ length: 60 }, (_, i) => (
                  <option key={i} value={i.toString().padStart(2, '0')}>
                    {i.toString().padStart(2, '0')}
                  </option>
                ))}
              </select>
              
              {/* AM/PM */}
              <select
                {...register('period')}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 hover:border-gray-300 transition-all focus:outline-none focus:border-purple-500 appearance-none bg-white"
              >
                <option value="AM">AM</option>
                <option value="PM">PM</option>
              </select>
            </div>
            
            {/* Display selected time */}
            <div className="flex items-center gap-2 text-sm text-purple-600 bg-purple-50 px-3 py-2 rounded-lg">
              <Clock className="w-4 h-4" />
              Selected time: {watchedValues.hour}:{watchedValues.minute} {watchedValues.period}
            </div>
          </motion.div>

          {/* Frequency - Only for medications */}
          {watchedValues.type === 'medication' && (
            <motion.div
              className="md:col-span-2 space-y-2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-pink-600" />
                Frequency
              </label>
              <div className="grid grid-cols-3 gap-2">
                {frequencyOptions.map((option) => (
                  <label
                    key={option.value}
                    className="relative cursor-pointer"
                  >
                    <input
                      type="radio"
                      value={option.value}
                      {...register('frequency')}
                      className="sr-only peer"
                    />
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className={`p-3 rounded-xl border-2 text-center transition-all ${
                        watchedValues.frequency === option.value
                          ? `border-${option.color}-500 bg-${option.color}-50 shadow-lg`
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="text-2xl mb-1">{option.icon}</div>
                      <div className="text-xs font-semibold text-gray-700">
                        {option.label}
                      </div>
                    </motion.div>
                  </label>
                ))}
              </div>
            </motion.div>
          )}

          {/* Notes */}
          <motion.div 
            className="md:col-span-2 space-y-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
          >
            <label className="block text-sm font-semibold text-gray-700">
              Notes (Optional)
            </label>
            <textarea 
              className={`w-full px-4 py-3 rounded-xl border-2 transition-all focus:outline-none resize-none ${
                focusedField === 'notes' 
                  ? 'border-blue-500 shadow-lg shadow-blue-100' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              rows={3}
              {...register('notes')}
              placeholder={watchedValues.type === 'medication' 
                ? 'e.g., Take with food, Before breakfast...' 
                : 'e.g., Bring insurance card, Fasting required...'}
              onFocus={() => setFocusedField('notes')}
              onBlur={() => setFocusedField(null)}
            />
          </motion.div>
        </div>

        {/* Submit Button */}
        <motion.div 
          className="pt-4 flex gap-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          {onCancel && (
            <motion.button
              type="button"
              variants={buttonVariants}
              whileHover="hover"
              whileTap="tap"
              onClick={onCancel}
              className="flex-1 bg-gray-100 text-gray-700 font-semibold py-4 rounded-xl hover:bg-gray-200 transition-all duration-300"
            >
              Cancel
            </motion.button>
          )}
          
          <motion.button 
            type="submit"
            disabled={isSubmitting || !isDirty}
            variants={buttonVariants}
            whileHover="hover"
            whileTap="tap"
            className={`flex-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white font-semibold py-4 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 relative overflow-hidden ${
              !isSubmitting && isDirty ? 'hover:shadow-2xl' : ''
            }`}
          >
            {isSubmitting ? (
              <>
                <motion.div 
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                />
                {isEditing ? 'Updating...' : 'Adding...'}
              </>
            ) : showSuccess ? (
              <>
                <CheckCircle className="w-5 h-5" />
                Success!
              </>
            ) : (
              <>
                {isEditing ? (
                  <>
                    <Sparkles className="w-5 h-5" />
                    Update Reminder
                  </>
                ) : (
                  <>
                    <Plus className="w-5 h-5" />
                    Add Reminder
                  </>
                )}
              </>
            )}
          </motion.button>
        </motion.div>

        {/* Helper text */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.45 }}
          className="text-center text-sm text-gray-500"
        >
          💡 Tip: {watchedValues.type === 'medication'
            ? 'Set reminders for the same time each day for best results'
            : 'Choose how far in advance you want to be reminded of your appointment'}
        </motion.div>
      </form>
    </motion.div>
  );
}

// Made with Bob
