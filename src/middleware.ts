import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()

  // Check for custom session in cookies with better error handling
  const customSessionCookie = req.cookies.get('custom_session')?.value

  const protectedRoutes = ['/reminders', '/profile', '/settings']
  const authRoutes = ['/login', '/signup']

  const url = req.nextUrl.pathname

  const isProtectedRoute = protectedRoutes.some(route =>
    url.startsWith(route)
  )
  const isAuthRoute = authRoutes.some(route => url === route)

  // Check if session exists and is valid
  let hasValidSession = false
  if (customSessionCookie) {
    try {
      // Decode the cookie value (it might be URL encoded)
      const decodedSession = decodeURIComponent(customSessionCookie)
      const session = JSON.parse(decodedSession)
      
      // Check if session is not expired
      if (session.expires_at && new Date(session.expires_at) > new Date()) {
        hasValidSession = true
      }
    } catch (error) {
      // Invalid session format - clear the invalid cookie
      console.error('Invalid session cookie:', error)
      hasValidSession = false
    }
  }

  // Redirect to login if accessing protected route without session
  if (!hasValidSession && isProtectedRoute) {
    const response = NextResponse.redirect(new URL('/login', req.url))
    // Clear invalid session cookie if present
    if (customSessionCookie) {
      response.cookies.delete('custom_session')
    }
    return response
  }

  // Redirect to reminders if accessing auth routes with valid session
  if (hasValidSession && isAuthRoute) {
    return NextResponse.redirect(new URL('/reminders', req.url))
  }

  return res
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

// Made with Bob
