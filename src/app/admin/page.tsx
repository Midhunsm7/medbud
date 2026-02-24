'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, Users, Activity, TrendingUp, Calendar, Pill, Stethoscope, LogOut, Eye, EyeOff, RefreshCw } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { pageVariants, containerVariants, itemVariants, buttonVariants } from '@/lib/animations';
import { toast } from 'react-hot-toast';
import { supabase } from '@/lib/supabase/supabase';

const ADMIN_EMAIL = 'jaseel@medreminder.com';
const ADMIN_PASSWORD = 'Jaseel@25';

interface AdminStats {
  totalUsers: number;
  activeReminders: number;
  completionRate: number;
  appointmentsToday: number;
  medicationsToday: number;
  newUsersThisWeek: number;
}

interface RecentActivity {
  user: string;
  action: string;
  time: string;
  type: 'medication' | 'appointment';
}

export default function AdminPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    activeReminders: 0,
    completionRate: 0,
    appointmentsToday: 0,
    medicationsToday: 0,
    newUsersThisWeek: 0,
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);

  // Fetch admin data from database
  useEffect(() => {
    if (isAuthenticated) {
      fetchAdminData();
    }
  }, [isAuthenticated]);

  const fetchAdminData = async () => {
    setIsLoadingData(true);
    try {
      // Fetch total users from custom_users table
      const { count: totalUsers } = await supabase
        .from('custom_users')
        .select('*', { count: 'exact', head: true });

      // Fetch all reminders
      const { data: allReminders, count: totalReminders } = await supabase
        .from('reminders')
        .select('*', { count: 'exact' });

      // Calculate today's date range
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // Count appointments today
      const appointmentsToday = allReminders?.filter(r =>
        r.type === 'appointment' &&
        r.appointment_date &&
        new Date(r.appointment_date) >= today &&
        new Date(r.appointment_date) < tomorrow
      ).length || 0;

      // Count medications today (all active medications)
      const medicationsToday = allReminders?.filter(r => r.type === 'medication').length || 0;

      // Calculate completion rate (taken reminders)
      const takenReminders = allReminders?.filter(r => r.taken).length || 0;
      const completionRate = totalReminders ? Math.round((takenReminders / totalReminders) * 100) : 0;

      // Count new users this week
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      const { count: newUsersThisWeek } = await supabase
        .from('custom_users')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', oneWeekAgo.toISOString());

      // Fetch recent reminders for activity (without join since user_id is text)
      const { data: recentReminders } = await supabase
        .from('reminders')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      // Get unique user IDs
      const userIds = [...new Set(recentReminders?.map(r => r.user_id) || [])];
      
      // Fetch user emails
      const { data: users } = await supabase
        .from('custom_users')
        .select('id, email')
        .in('id', userIds);

      // Create user map
      const userMap = new Map(users?.map(u => [u.id, u.email]) || []);

      // Transform to activity format
      const activity: RecentActivity[] = (recentReminders || []).slice(0, 5).map(reminder => {
        const userEmail = userMap.get(reminder.user_id) || 'Unknown User';
        const userName = userEmail.split('@')[0];
        const createdAt = new Date(reminder.created_at);
        const now = new Date();
        const diffMs = now.getTime() - createdAt.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        
        let timeAgo = '';
        if (diffMins < 1) timeAgo = 'Just now';
        else if (diffMins < 60) timeAgo = `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
        else if (diffMins < 1440) timeAgo = `${Math.floor(diffMins / 60)} hour${Math.floor(diffMins / 60) !== 1 ? 's' : ''} ago`;
        else timeAgo = `${Math.floor(diffMins / 1440)} day${Math.floor(diffMins / 1440) !== 1 ? 's' : ''} ago`;

        return {
          user: userName.charAt(0).toUpperCase() + userName.slice(1),
          action: `Added ${reminder.type} reminder: ${reminder.name}`,
          time: timeAgo,
          type: reminder.type as 'medication' | 'appointment'
        };
      });

      const newStats = {
        totalUsers: totalUsers || 0,
        activeReminders: totalReminders || 0,
        completionRate,
        appointmentsToday,
        medicationsToday,
        newUsersThisWeek: newUsersThisWeek || 0,
      };

      setStats(newStats);
      setRecentActivity(activity);
      
      console.log('✅ Admin data loaded:', {
        totalUsers,
        totalReminders,
        appointmentsToday,
        medicationsToday,
        activityCount: activity.length
      });
      
      console.log('✅ Stats state updated:', newStats);
      console.log('✅ Activity state updated:', activity);
      
    } catch (error) {
      console.error('Error fetching admin data:', error);
      toast.error('Failed to load admin data');
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    setTimeout(() => {
      if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
        setIsAuthenticated(true);
        toast.success('Welcome, Admin!');
      } else {
        toast.error('Invalid credentials');
      }
      setIsLoading(false);
    }, 1000);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setEmail('');
    setPassword('');
    toast.success('Logged out successfully');
  };

  const handleRefresh = () => {
    toast.success('Refreshing data...');
    fetchAdminData();
  };

  if (!isAuthenticated) {
    return (
      <motion.div
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-full max-w-md"
        >
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
            {/* Header */}
            <div className="text-center mb-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring' }}
                className="inline-flex p-4 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl mb-4"
              >
                <Shield className="w-12 h-12 text-white" />
              </motion.div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-700 bg-clip-text text-transparent mb-2">
                Admin Access
              </h1>
              <p className="text-gray-600">Enter your credentials to continue</p>
            </div>

            {/* Login Form */}
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@medreminder.com"
                  required
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-indigo-500 focus:outline-none transition-all"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-indigo-500 focus:outline-none transition-all pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <motion.button
                variants={buttonVariants}
                whileHover="hover"
                whileTap="tap"
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                    />
                    Authenticating...
                  </span>
                ) : (
                  'Sign In'
                )}
              </motion.button>
            </form>

            {/* Info */}
            <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-xl">
              <p className="text-xs text-amber-800 text-center">
                🔒 This is a secure admin area. Only authorized personnel can access.
              </p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-4 md:p-6 lg:p-8"
    >
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <motion.header 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-700 bg-clip-text text-transparent mb-2">
                Admin Dashboard
              </h1>
              <p className="text-gray-600">Monitor and manage MediReminder platform</p>
              {/* Debug info */}
              <p className="text-xs text-gray-400 mt-1">
                Debug: Users={stats.totalUsers}, Reminders={stats.activeReminders}, Loading={isLoadingData ? 'Yes' : 'No'}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <motion.button
                variants={buttonVariants}
                whileHover="hover"
                whileTap="tap"
                onClick={handleRefresh}
                disabled={isLoadingData}
                className="flex items-center gap-2 px-4 py-2.5 bg-blue-100 text-blue-700 rounded-xl font-medium hover:bg-blue-200 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${isLoadingData ? 'animate-spin' : ''}`} />
                Refresh
              </motion.button>

              <motion.button
                variants={buttonVariants}
                whileHover="hover"
                whileTap="tap"
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2.5 bg-red-100 text-red-700 rounded-xl font-medium hover:bg-red-200 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </motion.button>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
            {isLoadingData ? (
              // Loading skeletons
              Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm animate-pulse">
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-8 h-8 bg-gray-200 rounded-lg"></div>
                  </div>
                  <div className="h-8 bg-gray-200 rounded mb-1"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                </div>
              ))
            ) : (
              <>
                {/* Total Users */}
                <motion.div
                  variants={itemVariants}
                  whileHover={{ y: -4, boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }}
                  className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Users className="w-4 h-4 text-blue-600" />
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-gray-900 mb-1">{stats.totalUsers.toLocaleString()}</div>
                  <div className="text-xs text-gray-600">Total Users</div>
                </motion.div>

                {/* Active Reminders */}
                <motion.div
                  variants={itemVariants}
                  whileHover={{ y: -4, boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }}
                  className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Activity className="w-4 h-4 text-green-600" />
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-gray-900 mb-1">{stats.activeReminders.toLocaleString()}</div>
                  <div className="text-xs text-gray-600">Active Reminders</div>
                </motion.div>

                {/* Completion Rate */}
                <motion.div
                  variants={itemVariants}
                  whileHover={{ y: -4, boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }}
                  className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <TrendingUp className="w-4 h-4 text-purple-600" />
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-gray-900 mb-1">{stats.completionRate}%</div>
                  <div className="text-xs text-gray-600">Completion Rate</div>
                </motion.div>

                {/* Appointments Today */}
                <motion.div
                  variants={itemVariants}
                  whileHover={{ y: -4, boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }}
                  className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="p-2 bg-teal-100 rounded-lg">
                      <Stethoscope className="w-4 h-4 text-teal-600" />
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-gray-900 mb-1">{stats.appointmentsToday}</div>
                  <div className="text-xs text-gray-600">Appointments Today</div>
                </motion.div>

                {/* Medications Today */}
                <motion.div
                  variants={itemVariants}
                  whileHover={{ y: -4, boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }}
                  className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="p-2 bg-indigo-100 rounded-lg">
                      <Pill className="w-4 h-4 text-indigo-600" />
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-gray-900 mb-1">{stats.medicationsToday}</div>
                  <div className="text-xs text-gray-600">Medications Today</div>
                </motion.div>

                {/* New Users */}
                <motion.div
                  variants={itemVariants}
                  whileHover={{ y: -4, boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }}
                  className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="p-2 bg-pink-100 rounded-lg">
                      <Calendar className="w-4 h-4 text-pink-600" />
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-gray-900 mb-1">{stats.newUsersThisWeek}</div>
                  <div className="text-xs text-gray-600">New Users This Week</div>
                </motion.div>
              </>
            )}
          </div>
        </motion.header>

        {/* Recent Activity */}
        <section>
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Recent Activity</h2>
          
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {isLoadingData ? (
              // Loading skeleton
              <div className="divide-y divide-gray-100">
                {Array.from({ length: 5 }).map((_, index) => (
                  <div key={index} className="p-4 animate-pulse">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      </div>
                      <div className="h-3 bg-gray-200 rounded w-16"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : recentActivity.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Activity className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>No recent activity yet</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {recentActivity.map((activity, index) => (
                  <motion.div
                    key={index}
                    variants={itemVariants}
                    className="p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-lg ${
                        activity.type === 'appointment' ? 'bg-teal-100' : 'bg-blue-100'
                      }`}>
                        {activity.type === 'appointment' ? (
                          <Stethoscope className="w-5 h-5 text-teal-600" />
                        ) : (
                          <Pill className="w-5 h-5 text-blue-600" />
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900">{activity.user}</p>
                        <p className="text-sm text-gray-600 truncate">{activity.action}</p>
                      </div>
                      
                      <div className="text-xs text-gray-500 whitespace-nowrap">{activity.time}</div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* System Info */}
        <motion.footer 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-8 pt-6 border-t border-gray-200 text-center"
        >
          <p className="text-sm text-gray-500 flex items-center justify-center gap-2">
            <Shield className="w-4 h-4" />
            Logged in as: {ADMIN_EMAIL}
          </p>
        </motion.footer>
      </div>
    </motion.div>
  );
}

// Made with Bob