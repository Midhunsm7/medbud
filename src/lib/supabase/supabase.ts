import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createBrowserClient(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: 'pkce',
    },
  }
)

/* ---------------- AUTH HELPERS ---------------- */

export const signInWithPassword = async (
  email: string,
  password: string
) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  if (error) throw error
  return data
}

export const signUp = async (
  email: string,
  password: string,
  fullName?: string
) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
      emailRedirectTo:
        typeof window !== 'undefined'
          ? `${window.location.origin}/auth/callback`
          : undefined,
    },
  })

  if (error) throw error
  return data
}

export const signOut = async () => {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export const getCurrentUser = async () => {
  const { data, error } = await supabase.auth.getUser()
  if (error) throw error
  return data.user
}

export const resetPassword = async (email: string) => {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo:
      typeof window !== 'undefined'
        ? `${window.location.origin}/reset-password`
        : undefined,
  })
  if (error) throw error
}

export const updatePassword = async (password: string) => {
  const { error } = await supabase.auth.updateUser({ password })
  if (error) throw error
}

export const updateProfile = async (updates: any) => {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No user logged in')

  const { error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', user.id)

  if (error) throw error
}