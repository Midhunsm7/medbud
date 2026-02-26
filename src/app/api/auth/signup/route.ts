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
    const { email, password, full_name, phone } = body

    // Basic validation
    if (!email || !password || !full_name) {
      return NextResponse.json(
        { error: 'Please fill in all required fields' },
        { status: 400 }
      )
    }

    // Normalize email
    const normalizedEmail = email.trim().toLowerCase()

    // Validate email format
    if (!/\S+@\S+\.\S+/.test(normalizedEmail)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Validate password length
    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('custom_users')
      .select('id')
      .eq('email', normalizedEmail)
      .single()

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Insert user
    const { data: user, error } = await supabase
      .from('custom_users')
      .insert([
        {
          email: normalizedEmail,
          password: hashedPassword,
          full_name,
          phone: phone || null,
        }
      ])
      .select('id, email, full_name, phone, created_at')
      .single()

    if (error) {
      console.error('Signup error:', error)
      return NextResponse.json(
        { error: 'Failed to create account' },
        { status: 500 }
      )
    }

    // AUTO-LOGIN: Create session immediately after signup
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
      // Still return success for user creation, but without auto-login
      return NextResponse.json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          full_name: user.full_name,
          phone: user.phone,
          created_at: user.created_at
        },
        autoLoginFailed: true
      })
    }

    // Create session object
    const session = {
      user_id: user.id,
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

    // Set cookie for auto-login
    const cookieStore = await cookies()
    const isProduction = process.env.NODE_ENV === 'production'
    
    cookieStore.set('custom_session', JSON.stringify(session), {
      httpOnly: false, // Allow client-side access for OneSignal
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/',
    })

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        phone: user.phone,
        created_at: user.created_at
      },
      session,
      autoLogin: true
    })

  } catch (err) {
    console.error('Signup exception:', err)
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    )
  }
}

// Made with Bob
