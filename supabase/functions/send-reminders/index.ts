// Supabase Edge Function to send push notifications
// This runs on Supabase servers and sends notifications at scheduled times

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    // Get current time in HH:MM format
    const now = new Date()
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
    
    console.log('Checking reminders for time:', currentTime)

    // Get all active reminders for this time
    const { data: reminders, error } = await supabaseClient
      .from('reminders')
      .select(`
        *,
        custom_users!inner(id, email, full_name)
      `)
      .contains('times', [currentTime])
      .eq('taken', false)

    if (error) {
      console.error('Error fetching reminders:', error)
      throw error
    }

    console.log(`Found ${reminders?.length || 0} reminders`)

    if (!reminders || reminders.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No reminders due at this time', count: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Send notifications for each reminder
    const results = []
    for (const reminder of reminders) {
      try {
        // Here you would integrate with a push notification service
        // For now, we'll log and prepare the notification data
        
        const notificationData = {
          userId: reminder.user_id,
          userName: reminder.custom_users.full_name || reminder.custom_users.email,
          reminderId: reminder.id,
          reminderName: reminder.name,
          reminderType: reminder.type,
          dosage: reminder.dosage,
          time: currentTime,
          message: reminder.type === 'medication' 
            ? `Time to take ${reminder.name}${reminder.dosage ? ` - ${reminder.dosage}` : ''}`
            : `Appointment: ${reminder.name}`,
        }

        console.log('Notification prepared:', notificationData)
        
        // TODO: Send actual push notification here
        // This would integrate with Web Push API or a service like OneSignal
        
        results.push({
          success: true,
          reminder: reminder.name,
          user: reminder.custom_users.email,
        })
      } catch (notifError) {
        console.error('Error sending notification:', notifError)
        results.push({
          success: false,
          reminder: reminder.name,
          error: notifError.message,
        })
      }
    }

    return new Response(
      JSON.stringify({
        message: 'Reminders processed',
        count: reminders.length,
        results,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Function error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

// Made with Bob
