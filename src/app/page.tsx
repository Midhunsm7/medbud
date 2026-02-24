'use client';
import { useEffect, useState } from "react";
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  Pill, 
  Bell, 
  CheckCircle,
  ArrowRight,
  Sparkles,
  Shield,
  Clock,
  Zap,
  Calendar,
  Users,
  Heart
} from 'lucide-react';
import { pageVariants, containerVariants, itemVariants, buttonVariants, floatingVariants } from '@/lib/animations';

export default function Home() {
  const router = useRouter();
  const [notificationGranted, setNotificationGranted] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setNotificationGranted(Notification.permission === 'granted');
    }
  }, []);

  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      setNotificationGranted(permission === 'granted');
    }
  };

  const features = [
    {
      icon: Bell,
      title: 'Smart Reminders',
      description: 'Never miss a dose with timely notifications via email, push, and SMS',
      color: 'blue'
    },
    {
      icon: Calendar,
      title: 'Flexible Scheduling',
      description: 'Set daily, weekly, or monthly reminders that fit your routine',
      color: 'purple'
    },
    {
      icon: Shield,
      title: 'Secure & Private',
      description: 'Your health data is encrypted and protected with enterprise-grade security',
      color: 'green'
    },
    {
      icon: Zap,
      title: 'Quick & Easy',
      description: 'Add reminders in seconds with our intuitive interface',
      color: 'yellow'
    },
    {
      icon: Users,
      title: 'Family Sharing',
      description: 'Manage medication schedules for your entire family',
      color: 'pink'
    },
    {
      icon: Heart,
      title: 'Health Tracking',
      description: 'Track your medication history and adherence over time',
      color: 'red'
    }
  ];

  const stats = [
    { value: '10K+', label: 'Active Users Aim' },
    { value: '99.9%', label: 'Uptime' },
    { value: '50K+', label: 'Reminders Sending Capacity' },
    { value: '4.9★', label: 'User Appreciation' }
  ];

  return (
    <motion.main 
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50"
    >
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 px-4 md:px-6 lg:px-8">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            variants={floatingVariants}
            animate="animate"
            className="absolute top-20 left-10 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-30"
          />
          <motion.div
            variants={floatingVariants}
            animate="animate"
            transition={{ delay: 1 }}
            className="absolute top-40 right-10 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-30"
          />
          <motion.div
            variants={floatingVariants}
            animate="animate"
            transition={{ delay: 2 }}
            className="absolute -bottom-8 left-1/2 w-72 h-72 bg-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-30"
          />
        </div>

        <div className="relative max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
              className="inline-flex p-4 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl shadow-2xl mb-8"
            >
              <Pill className="w-16 h-16 text-white" />
            </motion.div>

            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-5xl md:text-7xl font-bold mb-6"
            >
              <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                Never Miss
              </span>
              <br />
              <span className="text-gray-900">A Dose Again</span>
            </motion.h1>

            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto"
            >
              Smart medication reminders that help you stay on track with your health goals.
              Simple, secure, and always there when you need it.
            </motion.p>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            >
              <motion.button
                variants={buttonVariants}
                whileHover="hover"
                whileTap="tap"
                onClick={() => router.push('/signup')}
                className="group px-8 py-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-bold text-lg shadow-xl hover:shadow-2xl transition-all flex items-center gap-2"
              >
                Get Started Free
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </motion.button>

              <motion.button
                variants={buttonVariants}
                whileHover="hover"
                whileTap="tap"
                onClick={() => router.push('/login')}
                className="px-8 py-4 bg-white text-gray-700 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all border-2 border-gray-200"
              >
                Sign In
              </motion.button>

              <motion.button
                variants={buttonVariants}
                whileHover="hover"
                whileTap="tap"
                onClick={() => router.push('/admin')}
                className="px-8 py-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
              >
                <Shield className="w-5 h-5" />
                Admin Login
              </motion.button>
            </motion.div>

            {!notificationGranted && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="mt-6"
              >
                <button
                  onClick={requestNotificationPermission}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-full text-sm font-medium hover:bg-blue-100 transition-colors"
                >
                  <Bell className="w-4 h-4" />
                  Enable notifications for the best experience
                </button>
              </motion.div>
            )}
          </div>

          {/* Stats */}
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto"
          >
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                variants={itemVariants}
                className="text-center p-6 bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-100 shadow-lg"
              >
                <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
                  {stat.value}
                </div>
                <div className="text-sm text-gray-600 font-medium">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 md:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold mb-4">
              <Sparkles className="w-4 h-4" />
              Features
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Everything You Need
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Powerful features designed to make medication management effortless
            </p>
          </motion.div>

          <motion.div 
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                variants={itemVariants}
                whileHover={{ y: -8, boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.1)' }}
                className="p-8 bg-gradient-to-br from-white to-gray-50 rounded-2xl border border-gray-100 shadow-lg"
              >
                <div className={`inline-flex p-3 bg-${feature.color}-100 rounded-xl mb-4`}>
                  <feature.icon className={`w-8 h-8 text-${feature.color}-600`} />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 md:px-6 lg:px-8 bg-gradient-to-br from-blue-600 to-indigo-700">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto text-center"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to Take Control of Your Health?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of users who never miss their medication
          </p>
          <motion.button
            variants={buttonVariants}
            whileHover="hover"
            whileTap="tap"
            onClick={() => router.push('/signup')}
            className="group px-10 py-5 bg-white text-blue-600 rounded-xl font-bold text-lg shadow-2xl hover:shadow-3xl transition-all inline-flex items-center gap-2"
          >
            Start Free Today
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </motion.button>
          <p className="mt-4 text-blue-200 text-sm">
            No credit card required • Free forever
          </p>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 bg-gray-900 text-gray-400">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            {/* Brand */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg">
                  <Pill className="w-6 h-6 text-white" />
                </div>
                <span className="font-bold text-xl text-white">MediReminder</span>
              </div>
              <p className="text-sm text-gray-400">
                Smart medication reminders for better health management.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="font-semibold text-white mb-4">Quick Links</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <button onClick={() => router.push('/signup')} className="hover:text-blue-400 transition-colors">
                    Get Started
                  </button>
                </li>
                <li>
                  <button onClick={() => router.push('/login')} className="hover:text-blue-400 transition-colors">
                    Sign In
                  </button>
                </li>
                <li>
                  <button onClick={() => router.push('/reminders')} className="hover:text-blue-400 transition-colors">
                    Reminders
                  </button>
                </li>
              </ul>
            </div>

            {/* Admin Access */}
            <div>
              <h3 className="font-semibold text-white mb-4">Admin Access</h3>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => router.push('/admin')}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg text-sm font-medium hover:shadow-lg transition-all"
              >
                <Shield className="w-4 h-4" />
                Admin Dashboard
              </motion.button>
              <p className="text-xs text-gray-500 mt-2">
                For authorized personnel only
              </p>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8 text-center">
            <p className="text-sm">
              © 2026 MediBud. All rights reserved. Made with ❤️ for better health.
            </p>
          </div>
        </div>
      </footer>
    </motion.main>
  );
}

