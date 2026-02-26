'use client'

import { useEffect, useState } from 'react'
import { initOneSignal, ensureSubscribed, setExternalUserId, getNotificationPermission, getOneSignalPlayerId } from '@/lib/onesignal'
import toast from 'react-hot-toast'

/**
 * OneSignal Initialization Component
 * Handles OneSignal setup and notification permission requests
 */
export default function OneSignalInit() {
  const [isInitialized, setIsInitialized] = useState(false)
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>('default')

  useEffect(() => {
    const initialize = async () => {
      try {
        // Check if we're in browser environment
        if (typeof window === 'undefined') return

        // Initialize OneSignal
        await initOneSignal()
        setIsInitialized(true)

        // Check current permission status
        const permission = getNotificationPermission()
        setPermissionStatus(permission)

        // Check if this is a new user (from signup redirect)
        const urlParams = new URLSearchParams(window.location.search)
        const isNewUser = urlParams.has('newUser')
        const autoSubscribe = urlParams.has('autoSubscribe')

        // Get current user from session cookie
        const sessionCookie = document.cookie
          .split('; ')
          .find(row => row.startsWith('custom_session='))
        
        let userId: string | null = null
        if (sessionCookie) {
          try {
            const sessionValue = sessionCookie.split('=')[1]
            const session = JSON.parse(decodeURIComponent(sessionValue))
            userId = session.user_id?.toString()
          } catch (error) {
            console.error('Failed to parse session:', error)
          }
        }

        // Auto-subscribe for new users or when explicitly requested
        if ((isNewUser || autoSubscribe) && userId) {
          console.log('🔔 Auto-subscribing user:', userId)
          
          // Ensure user is subscribed first
          const { subscribed, playerId } = await ensureSubscribed()
          
          if (subscribed && playerId) {
            // Now link the external user ID
            try {
              await setExternalUserId(userId)
              console.log('✅ User subscribed and linked:', userId, playerId)
              toast.success('Notifications enabled! You\'ll receive medication reminders.')
            } catch (error) {
              console.error('Failed to link user ID:', error)
              toast.error('Subscription successful but linking failed. Please refresh.')
            }
          } else {
            console.warn('⚠️ Auto-subscription failed')
            // Show manual prompt
            setTimeout(() => showPermissionPrompt(), 1000)
          }
        } else if (permission === 'granted' && userId) {
          // User already granted permission, ensure they're subscribed and linked
          const playerId = await getOneSignalPlayerId()
          if (playerId) {
            try {
              await setExternalUserId(userId)
              console.log('✅ Existing user linked:', userId, playerId)
            } catch (error) {
              console.error('Failed to link existing user:', error)
            }
          } else {
            // Permission granted but not subscribed - try to subscribe
            const { subscribed } = await ensureSubscribed()
            if (subscribed) {
              try {
                await setExternalUserId(userId)
                console.log('✅ User re-subscribed and linked:', userId)
              } catch (error) {
                console.error('Failed to link user after re-subscription:', error)
              }
            }
          }
        } else if (permission === 'default') {
          // Show prompt for users who haven't been asked yet
          const delay = isNewUser ? 500 : 3000
          setTimeout(() => {
            showPermissionPrompt()
          }, delay)
        }
      } catch (error) {
        console.error('Failed to initialize OneSignal:', error)
      }
    }

    initialize()
  }, [])

  const showPermissionPrompt = () => {
    toast(
      (t) => (
        <div className="flex flex-col gap-2">
          <p className="font-semibold">Enable Notifications</p>
          <p className="text-sm text-gray-600">
            Get reminders even when the app is closed
          </p>
          <div className="flex gap-2 mt-2">
            <button
              onClick={async () => {
                toast.dismiss(t.id)
                
                // Use ensureSubscribed to handle the full flow
                const { subscribed, playerId } = await ensureSubscribed()
                
                if (subscribed && playerId) {
                  setPermissionStatus('granted')
                  
                  // Link user ID if available
                  const sessionCookie = document.cookie
                    .split('; ')
                    .find(row => row.startsWith('custom_session='))
                  
                  if (sessionCookie) {
                    try {
                      const sessionValue = sessionCookie.split('=')[1]
                      const session = JSON.parse(decodeURIComponent(sessionValue))
                      if (session.user_id) {
                        await setExternalUserId(session.user_id.toString())
                        console.log('✅ User subscribed and linked:', session.user_id, playerId)
                      }
                    } catch (error) {
                      console.error('Failed to link user:', error)
                    }
                  }
                  
                  toast.success('Notifications enabled! You\'ll receive reminders even when the app is closed.')
                } else {
                  setPermissionStatus('denied')
                  toast.error('Notifications blocked. You can enable them in your browser settings.')
                }
              }}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors"
            >
              Enable
            </button>
            <button
              onClick={() => {
                toast.dismiss(t.id)
                setPermissionStatus('denied')
              }}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300 transition-colors"
            >
              Not Now
            </button>
          </div>
        </div>
      ),
      {
        duration: 10000,
        position: 'top-center',
        style: {
          maxWidth: '400px',
        },
      }
    )
  }

  // Show notification status indicator (optional)
  if (!isInitialized) {
    return null
  }

  return (
    <>
      {/* Hidden component - just for initialization */}
      {permissionStatus === 'denied' && (
        <div className="fixed bottom-4 right-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3 shadow-lg max-w-sm z-50">
          <div className="flex items-start gap-2">
            <svg className="w-5 h-5 text-yellow-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div className="flex-1">
              <p className="text-sm font-medium text-yellow-800">Notifications Disabled</p>
              <p className="text-xs text-yellow-700 mt-1">
                Enable notifications in your browser settings to receive reminders when the app is closed.
              </p>
            </div>
            <button
              onClick={() => setPermissionStatus('default')}
              className="text-yellow-600 hover:text-yellow-800"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </>
  )
}

// Made with Bob
