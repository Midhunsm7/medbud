import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { supabase } from '@/lib/supabase/supabase'
import { cookies } from 'next/headers'

// Generate a simple session token
const generateToken = () => {
  return Math.random().toString(36).substring(2) + Date.now().toString(36)
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { email, password } = body

    // Basic validation
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Please provide email and password' },
        { status: 400 }
      )
    }

    // Normalize email
    const normalizedEmail = email.trim().toLowerCase()

    // Find user
    const { data: user, error: userError } = await supabase
      .from('custom_users')
      .select('*')
      .eq('email', normalizedEmail)
      .single()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password)

    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Create session
    const token = generateToken()
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7) // 7 days

    const { error: sessionError } = await supabase
      .from('custom_sessions')
      .insert({
        user_id: user.id,
        token,
        expires_at: expiresAt.toISOString()
      })

    if (sessionError) {
      console.error('Session creation error:', sessionError)
      return NextResponse.json(
        { error: 'Failed to create session' },
        { status: 500 }
      )
    }

    // Create session object
    const session = {
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        phone: user.phone,
        created_at: user.created_at
      },
      token,
      expires_at: expiresAt.toISOString()
    }

    // Set cookie
    const cookieStore = await cookies()
    const isProduction = process.env.NODE_ENV === 'production'
    
    cookieStore.set('custom_session', JSON.stringify(session), {
      httpOnly: false, // Allow client-side access for compatibility
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/',
    })

    return NextResponse.json({
      success: true,
      session
    })

  } catch (err) {
    console.error('Signin exception:', err)
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    )
  }
}

// Made with Bob
