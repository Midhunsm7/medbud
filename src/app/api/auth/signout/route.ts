import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/supabase'
import { cookies } from 'next/headers'

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get('custom_session')

    if (sessionCookie) {
      try {
        const session = JSON.parse(sessionCookie.value)
        
        // Delete session from database
        await supabase
          .from('custom_sessions')
          .delete()
          .eq('token', session.token)
      } catch (parseError) {
        console.error('Error parsing session cookie:', parseError)
      }

      // Clear cookie
      cookieStore.delete('custom_session')
    }

    return NextResponse.json({
      success: true,
      message: 'Signed out successfully'
    })

  } catch (err) {
    console.error('Signout exception:', err)
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    )
  }
}

// Made with Bob
