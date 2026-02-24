'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe, User, Clock, MapPin } from 'lucide-react';

interface RealtimeUser {
  id: string;
  user_id: string;
  online: boolean;
  current_page: string;
  last_ping: string;
  user: {
    email: string;
    full_name: string;
  };
}

export default function RealtimeUsers() {
  const [users, setUsers] = useState<RealtimeUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRealtimeUsers();
    
    // Subscribe to real-time updates
    const subscription = supabase
      .channel('realtime-users')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'realtime_usage' 
        }, 
        () => fetchRealtimeUsers()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  const fetchRealtimeUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('realtime_usage')
        .select(`
          *,
          user:users(email, full_name)
        `)
        .eq('online', true)
        .order('last_ping', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching realtime users:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTimeAgo = (timestamp: string) => {
    const seconds = Math.floor((new Date().getTime() - new Date(timestamp).getTime()) / 1000);
    
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-12 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-100 rounded-lg">
            <Globe className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Users Online Now</h2>
            <p className="text-sm text-gray-600">Real-time active users</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-gray-900">{users.length}</span>
          </div>
          <span className="text-sm text-gray-600">online</span>
        </div>
      </div>

      <AnimatePresence>
        {users.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-8"
          >
            <div className="inline-flex p-4 bg-gray-100 rounded-full mb-4">
              <User className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-600">No users are currently online</p>
          </motion.div>
        ) : (
          <div className="space-y-3">
            {users.map((user) => (
              <motion.div
                key={user.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-white font-semibold">
                      {user.user?.full_name?.charAt(0) || user.user?.email?.charAt(0) || 'U'}
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {user.user?.full_name || 'Anonymous User'}
                    </p>
                    <p className="text-sm text-gray-500">
                      {user.user?.email || 'No email'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">
                      {user.current_page || 'Home'}
                    </p>
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Clock className="w-3 h-3" />
                      {getTimeAgo(user.last_ping)}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}