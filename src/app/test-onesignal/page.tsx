'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import toast from 'react-hot-toast'

/**
 * OneSignal Test & Debug Page
 * Use this page to verify OneSignal setup and subscription
 */
export default function TestOneSignalPage() {
  const [status, setStatus] = useState<any>({
    initialized: false,
    permission: 'default',
    subscriptionId: null,
    externalUserId: null,
    optedIn: false,
    loading: true,
  })

  useEffect(() => {
    checkStatus()
  }, [])

  const checkStatus = async () => {
    setStatus((prev: any) => ({ ...prev, loading: true }))
    
    try {
      // Check if OneSignal is loaded
      if (typeof window === 'undefined' || typeof (window as any).OneSignal === 'undefined') {
        setStatus({
          initialized: false,
          permission: 'default',
          subscriptionId: null,
          externalUserId: null,
          optedIn: false,
          loading: false,
          error: 'OneSignal not loaded',
        })
        return
      }

      const OneSignal = (window as any).OneSignal

      // Get permission status
      const permission = Notification.permission

      // Get subscription ID
      let subscriptionId = null
      try {
        subscriptionId = await OneSignal.User.PushSubscription.id
      } catch (e) {
        console.error('Error getting subscription ID:', e)
      }

      // Get external user ID
      let externalUserId = null
      try {
        externalUserId = await OneSignal.User.getExternalId()
      } catch (e) {
        console.error('Error getting external user ID:', e)
      }

      // Get opted in status
      let optedIn = false
      try {
        optedIn = await OneSignal.User.PushSubscription.optedIn
      } catch (e) {
        console.error('Error getting opted in status:', e)
      }

      setStatus({
        initialized: true,
        permission,
        subscriptionId,
        externalUserId,
        optedIn,
        loading: false,
      })
    } catch (error) {
      console.error('Error checking status:', error)
      setStatus((prev: any) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }))
    }
  }

  const requestPermission = async () => {
    try {
      if (typeof window === 'undefined' || typeof (window as any).OneSignal === 'undefined') {
        toast.error('OneSignal not loaded')
        return
      }

      const OneSignal = (window as any).OneSignal
      const granted = await OneSignal.Notifications.requestPermission()
      
      if (granted) {
        toast.success('Permission granted! Waiting for subscription...')
        
        // Wait for subscription to complete
        await new Promise(resolve => setTimeout(resolve, 3000))
        
        await checkStatus()
      } else {
        toast.error('Permission denied')
      }
    } catch (error) {
      console.error('Error requesting permission:', error)
      toast.error('Failed to request permission')
    }
  }

  const setExternalId = async () => {
    try {
      if (typeof window === 'undefined' || typeof (window as any).OneSignal === 'undefined') {
        toast.error('OneSignal not loaded')
        return
      }

      // Get user ID from session
      const sessionCookie = document.cookie
        .split('; ')
        .find(row => row.startsWith('custom_session='))
      
      if (!sessionCookie) {
        toast.error('Not logged in')
        return
      }

      const sessionValue = sessionCookie.split('=')[1]
      const session = JSON.parse(decodeURIComponent(sessionValue))
      const userId = session.user_id

      const OneSignal = (window as any).OneSignal
      await OneSignal.login(userId.toString())
      
      toast.success(`External user ID set to: ${userId}`)
      
      // Wait and check status
      await new Promise(resolve => setTimeout(resolve, 1000))
      await checkStatus()
    } catch (error) {
      console.error('Error setting external ID:', error)
      toast.error('Failed to set external user ID')
    }
  }

  const sendTestNotification = async () => {
    try {
      const response = await fetch('/api/notifications/schedule', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: 'Test Notification',
          message: 'This is a test notification from MediReminder!',
        }),
      })

      const result = await response.json()

      if (result.success) {
        toast.success('Test notification sent! Check your device.')
      } else {
        toast.error(`Failed: ${result.error}`)
      }
    } catch (error) {
      console.error('Error sending test notification:', error)
      toast.error('Failed to send test notification')
    }
  }

  const clearAndReset = async () => {
    try {
      if (typeof window === 'undefined' || typeof (window as any).OneSignal === 'undefined') {
        toast.error('OneSignal not loaded')
        return
      }

      const OneSignal = (window as any).OneSignal
      await OneSignal.logout()
      
      toast.success('Logged out from OneSignal. Refresh the page to start fresh.')
    } catch (error) {
      console.error('Error resetting:', error)
      toast.error('Failed to reset')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">OneSignal Test & Debug</h1>

        {/* Status Card */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Current Status</h2>
          
          {status.loading ? (
            <p className="text-gray-600">Loading...</p>
          ) : (
            <div className="space-y-3">
              <StatusRow 
                label="OneSignal Initialized" 
                value={status.initialized} 
                type="boolean"
              />
              <StatusRow 
                label="Browser Permission" 
                value={status.permission} 
                type="permission"
              />
              <StatusRow 
                label="Opted In" 
                value={status.optedIn} 
                type="boolean"
              />
              <StatusRow 
                label="Subscription ID" 
                value={status.subscriptionId || 'Not subscribed'} 
                type="text"
              />
              <StatusRow 
                label="External User ID" 
                value={status.externalUserId || 'Not set'} 
                type="text"
              />
              {status.error && (
                <StatusRow 
                  label="Error" 
                  value={status.error} 
                  type="error"
                />
              )}
            </div>
          )}

          <Button 
            onClick={checkStatus} 
            className="mt-4"
            variant="outline"
          >
            Refresh Status
          </Button>
        </div>

        {/* Actions Card */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Actions</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button 
              onClick={requestPermission}
              disabled={status.permission === 'granted'}
            >
              1. Request Permission
            </Button>
            
            <Button 
              onClick={setExternalId}
              disabled={!status.subscriptionId}
            >
              2. Set External User ID
            </Button>
            
            <Button 
              onClick={sendTestNotification}
              disabled={!status.externalUserId}
            >
              3. Send Test Notification
            </Button>
            
            <Button 
              onClick={clearAndReset}
              variant="destructive"
            >
              Reset OneSignal
            </Button>
          </div>
        </div>

        {/* Instructions Card */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Instructions</h2>
          
          <ol className="list-decimal list-inside space-y-2 text-gray-700">
            <li>Click "Request Permission" and allow notifications</li>
            <li>Wait for Subscription ID to appear (may take a few seconds)</li>
            <li>Click "Set External User ID" to link your account</li>
            <li>Click "Send Test Notification" to verify it works</li>
            <li>Check your browser/device for the notification</li>
          </ol>

          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h3 className="font-semibold text-yellow-800 mb-2">Troubleshooting</h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-yellow-700">
              <li>If Subscription ID is null, try refreshing the page</li>
              <li>If permission is denied, reset it in browser settings</li>
              <li>Check browser console (F12) for detailed errors</li>
              <li>Verify OneSignal credentials in .env.local</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

function StatusRow({ label, value, type }: { label: string; value: any; type: string }) {
  let displayValue = value
  let colorClass = 'text-gray-700'

  if (type === 'boolean') {
    displayValue = value ? '✅ Yes' : '❌ No'
    colorClass = value ? 'text-green-600' : 'text-red-600'
  } else if (type === 'permission') {
    if (value === 'granted') {
      displayValue = '✅ Granted'
      colorClass = 'text-green-600'
    } else if (value === 'denied') {
      displayValue = '❌ Denied'
      colorClass = 'text-red-600'
    } else {
      displayValue = '⚠️ Not asked'
      colorClass = 'text-yellow-600'
    }
  } else if (type === 'error') {
    colorClass = 'text-red-600'
  }

  return (
    <div className="flex justify-between items-center py-2 border-b border-gray-100">
      <span className="font-medium text-gray-600">{label}:</span>
      <span className={`${colorClass} font-mono text-sm`}>{displayValue}</span>
    </div>
  )
}

// Made with Bob
