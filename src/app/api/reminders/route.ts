import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/supabase'
import { cookies } from 'next/headers'

// Helper to get user from session
async function getUserFromSession() {
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get('custom_session')
  
  if (!sessionCookie) {
    return null
  }
  
  try {
    const session = JSON.parse(decodeURIComponent(sessionCookie.value))
    return session.user
  } catch {
    return null
  }
}

// GET - Fetch all reminders for user
export async function GET() {
  try {
    const user = await getUserFromSession()
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { data, error } = await supabase
      .from('reminders')
      .select('*')
      .eq('user_id', user.id)
      .order('next_date', { ascending: true })

    if (error) {
      console.error('Error fetching reminders:', error)
      return NextResponse.json(
        { error: 'Failed to fetch reminders' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      reminders: data || []
    })

  } catch (err) {
    console.error('GET reminders exception:', err)
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    )
  }
}

// POST - Create new reminder
export async function POST(req: Request) {
  try {
    const user = await getUserFromSession()
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await req.json()
    const { reminder } = body

    if (!reminder) {
      return NextResponse.json(
        { error: 'Reminder data is required' },
        { status: 400 }
      )
    }

    // Transform to database format
    // Note: Don't include 'id' - let the database generate it to avoid duplicates
    const dbReminder = {
      user_id: user.id,
      type: reminder.type,
      name: reminder.name,
      dosage: reminder.dosage || null,
      doctor_name: reminder.doctorName || null,
      location: reminder.location || null,
      appointment_date: reminder.appointmentDate || null,
      reminder_advance: reminder.reminderAdvance || null,
      times: reminder.times,
      start_date: reminder.startDate || new Date().toISOString(),
      next_date: new Date(reminder.nextDate).toISOString(),
      end_date: reminder.endDate || null,
      frequency: reminder.frequency,
      notes: reminder.notes || null,
      taken: reminder.taken || false,
      alarm_sound_url: reminder.alarmSoundUrl || null,
      alarm_sound_name: reminder.alarmSoundName || null,
      use_custom_sound: reminder.useCustomSound || false,
    }

    const { data, error } = await supabase
      .from('reminders')
      .insert([dbReminder])
      .select()
      .single()

    if (error) {
      console.error('Error creating reminder:', error)
      return NextResponse.json(
        { error: 'Failed to create reminder' },
        { status: 500 }
      )
    }

    // Schedule push notifications for each time
    try {
      const notificationIds: string[] = []
      
      for (const time of reminder.times) {
        // Parse the time (format: "HH:MM")
        const [hours, minutes] = time.split(':').map(Number)
        
        // Create notification date
        const notificationDate = new Date(reminder.nextDate)
        notificationDate.setHours(hours, minutes, 0, 0)
        
        // Only schedule if in the future
        if (notificationDate > new Date()) {
          const scheduleResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/notifications/schedule`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Cookie': `custom_session=${encodeURIComponent(JSON.stringify({ user_id: user.id }))}`,
            },
            body: JSON.stringify({
              title: reminder.type === 'medication'
                ? `Time to take ${reminder.name}`
                : `Appointment: ${reminder.name}`,
              message: reminder.type === 'medication'
                ? `Don't forget to take your ${reminder.dosage || 'medication'}`
                : `Appointment with ${reminder.doctorName || 'doctor'} at ${reminder.location || 'clinic'}`,
              sendAfter: notificationDate.toISOString(),
              reminderId: data.id,
              reminderData: {
                type: reminder.type,
                name: reminder.name,
                time: time,
              },
            }),
          })
          
          const scheduleResult = await scheduleResponse.json()
          if (scheduleResult.success && scheduleResult.notificationId) {
            notificationIds.push(scheduleResult.notificationId)
          }
        }
      }
      
      // Store notification IDs in the reminder (optional - for tracking)
      if (notificationIds.length > 0) {
        await supabase
          .from('reminders')
          .update({ notification_ids: notificationIds })
          .eq('id', data.id)
      }
      
      console.log(`Scheduled ${notificationIds.length} push notifications for reminder ${data.id}`)
    } catch (notifError) {
      console.error('Error scheduling push notifications:', notifError)
      // Don't fail the reminder creation if notification scheduling fails
    }

    return NextResponse.json({
      success: true,
      reminder: data
    })

  } catch (err) {
    console.error('POST reminder exception:', err)
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    )
  }
}

// PUT - Update existing reminder
export async function PUT(req: Request) {
  try {
    const user = await getUserFromSession()
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await req.json()
    const { reminder } = body

    if (!reminder || !reminder.id) {
      return NextResponse.json(
        { error: 'Reminder ID is required' },
        { status: 400 }
      )
    }

    // Transform to database format
    const dbReminder = {
      type: reminder.type,
      name: reminder.name,
      dosage: reminder.dosage || null,
      doctor_name: reminder.doctorName || null,
      location: reminder.location || null,
      appointment_date: reminder.appointmentDate || null,
      reminder_advance: reminder.reminderAdvance || null,
      times: reminder.times,
      next_date: new Date(reminder.nextDate).toISOString(),
      end_date: reminder.endDate || null,
      frequency: reminder.frequency,
      notes: reminder.notes || null,
      taken: reminder.taken || false,
      alarm_sound_url: reminder.alarmSoundUrl || null,
      alarm_sound_name: reminder.alarmSoundName || null,
      use_custom_sound: reminder.useCustomSound || false,
    }

    const { data, error } = await supabase
      .from('reminders')
      .update(dbReminder)
      .eq('id', reminder.id)
      .eq('user_id', user.id) // Ensure user owns this reminder
      .select()
      .single()

    if (error) {
      console.error('Error updating reminder:', error)
      return NextResponse.json(
        { error: 'Failed to update reminder' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      reminder: data
    })

  } catch (err) {
    console.error('PUT reminder exception:', err)
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    )
  }
}

// DELETE - Remove reminder
export async function DELETE(req: Request) {
  try {
    const user = await getUserFromSession()
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Reminder ID is required' },
        { status: 400 }
      )
    }

    // First, get the reminder to check for notification IDs
    const { data: reminderData } = await supabase
      .from('reminders')
      .select('notification_ids')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    // Cancel scheduled push notifications if they exist
    if (reminderData?.notification_ids && Array.isArray(reminderData.notification_ids)) {
      try {
        for (const notificationId of reminderData.notification_ids) {
          await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/notifications/schedule?id=${notificationId}`, {
            method: 'DELETE',
            headers: {
              'Cookie': `custom_session=${encodeURIComponent(JSON.stringify({ user_id: user.id }))}`,
            },
          })
        }
        console.log(`Cancelled ${reminderData.notification_ids.length} push notifications`)
      } catch (notifError) {
        console.error('Error cancelling push notifications:', notifError)
        // Continue with deletion even if notification cancellation fails
      }
    }

    const { error } = await supabase
      .from('reminders')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id) // Ensure user owns this reminder

    if (error) {
      console.error('Error deleting reminder:', error)
      return NextResponse.json(
        { error: 'Failed to delete reminder' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Reminder deleted successfully'
    })

  } catch (err) {
    console.error('DELETE reminder exception:', err)
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    )
  }
}

// Made with Bob
