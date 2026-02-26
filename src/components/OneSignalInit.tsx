'use client'

import { useEffect, useState } from 'react'
import { initOneSignal, requestNotificationPermission, setExternalUserId, getNotificationPermission, getOneSignalPlayerId } from '@/lib/onesignal'
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

        // Get current user from session cookie
        const sessionCookie = document.cookie
          .split('; ')
          .find(row => row.startsWith('custom_session='))
        
        if (sessionCookie) {
          try {
            const sessionValue = sessionCookie.split('=')[1]
            const session = JSON.parse(decodeURIComponent(sessionValue))
            if (session.user_id) {
              // Link OneSignal to user ID
              await setExternalUserId(session.user_id.toString())
              console.log('✅ OneSignal linked to user:', session.user_id)
            }
          } catch (error) {
            console.error('Failed to parse session:', error)
          }
        }

        // Check current permission status
        const permission = getNotificationPermission()
        setPermissionStatus(permission)

        // Check if this is a new user (from signup redirect)
        const urlParams = new URLSearchParams(window.location.search)
        const isNewUser = urlParams.has('newUser')

        // If permission is default (not asked yet), show a prompt
        if (permission === 'default') {
          // Show immediately for new users, otherwise wait 3 seconds
          const delay = isNewUser ? 500 : 3000
          setTimeout(() => {
            showPermissionPrompt()
          }, delay)
        } else if (permission === 'granted' && isNewUser) {
          // If already granted (shouldn't happen for new users), verify subscription
          const playerId = await getOneSignalPlayerId()
          if (playerId) {
            console.log('✅ New user already subscribed:', playerId)
            toast.success('Notifications enabled! You\'ll receive medication reminders.')
          }
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
                const granted = await requestNotificationPermission()
                if (granted) {
                  setPermissionStatus('granted')
                  
                  // Wait for subscription to complete
                  await new Promise(resolve => setTimeout(resolve, 2000))
                  
                  // Verify subscription
                  const playerId = await getOneSignalPlayerId()
                  if (playerId) {
                    console.log('✅ OneSignal subscription successful:', playerId)
                    toast.success('Notifications enabled! You\'ll receive reminders even when the app is closed.')
                  } else {
                    console.warn('⚠️ Permission granted but subscription incomplete')
                    toast('Notifications enabled, but subscription is still processing. Please refresh if you don\'t receive notifications.', {
                      icon: '⚠️',
                      duration: 6000,
                    })
                  }
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
