'use client'

import { useEffect, useState } from 'react'
import { Bell, BellOff } from 'lucide-react'
import { Button } from './ui/button'
import { 
  requestNotificationPermission, 
  areNotificationsEnabled,
  getNotificationPermission,
  sendTestNotification
} from '@/lib/notifications'
import toast from 'react-hot-toast'

/**
 * Notification Permission Toggle Component
 * Based on neverminder-pwa approach - simple and effective
 */
export default function NotificationToggle() {
  const [isEnabled, setIsEnabled] = useState(false)
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    // Check initial permission status
    if (typeof window !== 'undefined' && 'Notification' in window) {
      const currentPermission = getNotificationPermission()
      setPermission(currentPermission)
      setIsEnabled(currentPermission === 'granted')
    }
  }, [])

  const handleToggle = async () => {
    if (permission === 'granted') {
      // Already enabled - show info
      toast('Notifications are enabled! Disable them in your browser settings if needed.', {
        icon: '✅',
        duration: 4000,
      })
      return
    }

    if (permission === 'denied') {
      // Permission denied - show instructions
      toast.error(
        'Notifications are blocked. Please enable them in your browser settings:\n' +
        '1. Click the lock icon in the address bar\n' +
        '2. Find "Notifications"\n' +
        '3. Change to "Allow"',
        { duration: 8000 }
      )
      return
    }

    // Request permission
    setIsLoading(true)
    try {
      const granted = await requestNotificationPermission()
      const newPermission = getNotificationPermission()
      
      setPermission(newPermission)
      setIsEnabled(granted)

      if (granted) {
        toast.success('Notifications enabled! You\'ll receive reminders even when the app is closed.')
        
        // Send a test notification after 2 seconds
        setTimeout(async () => {
          try {
            await sendTestNotification()
            toast.success('Test notification sent! Check if you received it.')
          } catch (error) {
            console.error('Failed to send test notification:', error)
          }
        }, 2000)
      } else {
        toast.error('Notification permission denied. You won\'t receive reminders.')
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error)
      toast.error('Failed to request notification permission')
    } finally {
      setIsLoading(false)
    }
  }

  // Don't show if notifications not supported
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return null
  }

  return (
    <div className="flex items-center gap-3">
      <Button
        onClick={handleToggle}
        disabled={isLoading}
        variant={isEnabled ? 'default' : 'outline'}
        size="sm"
        className="gap-2"
      >
        {isEnabled ? (
          <>
            <Bell className="h-4 w-4" />
            <span>Notifications On</span>
          </>
        ) : (
          <>
            <BellOff className="h-4 w-4" />
            <span>Enable Notifications</span>
          </>
        )}
      </Button>

      {permission === 'denied' && (
        <span className="text-xs text-red-600">
          Blocked - Enable in settings
        </span>
      )}
    </div>
  )
}

// Made with Bob
