import { useEffect } from 'react';
import { supabase } from '@/lib/supabase/supabase';

interface ActivityData {
  activity_type: string;
  activity_data?: Record<string, any>;
  current_page?: string;
}

export const useUserActivity = () => {
  const trackActivity = async (activityData: ActivityData) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;

      // Get user IP and browser info
      const ipRes = await fetch('https://api.ipify.org?format=json');
      const ipData = await ipRes.json();
      
      const activity = {
        user_id: user.id,
        activity_type: activityData.activity_type,
        activity_data: activityData.activity_data,
        ip_address: ipData.ip,
        user_agent: navigator.userAgent,
        current_page: activityData.current_page || window.location.pathname
      };

      await supabase.from('user_activity_logs').insert(activity);
      
      // Update real-time usage
      await supabase.from('realtime_usage').upsert({
        user_id: user.id,
        online: true,
        current_page: activityData.current_page,
        last_ping: new Date().toISOString()
      });

    } catch (error) {
      console.error('Error tracking activity:', error);
    }
  };

  const trackPageView = (page: string) => {
    trackActivity({
      activity_type: 'page_view',
      current_page: page
    });
  };

  const trackLogin = () => {
    trackActivity({
      activity_type: 'login'
    });
  };

  const trackLogout = () => {
    trackActivity({
      activity_type: 'logout'
    });
  };

  const trackReminderCreated = (reminderData: any) => {
    trackActivity({
      activity_type: 'reminder_created',
      activity_data: reminderData
    });
  };

  const trackNotificationSent = (notificationData: any) => {
    trackActivity({
      activity_type: 'notification_sent',
      activity_data: notificationData
    });
  };

  return {
    trackActivity,
    trackPageView,
    trackLogin,
    trackLogout,
    trackReminderCreated,
    trackNotificationSent
  };
};