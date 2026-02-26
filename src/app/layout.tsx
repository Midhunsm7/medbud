import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from 'react-hot-toast'
import Navbar from '@/components/Navbar'
import InstallPrompt from '@/components/InstallPrompt'
import OneSignalInit from '@/components/OneSignalInit'
import Script from 'next/script'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'MediReminder - Never Miss a Dose',
  description: 'Smart medication reminder app with notifications and tracking',
  manifest: '/manifest.json',
  themeColor: '#3b82f6',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'MediReminder',
  },
  icons: {
    icon: '/logo.png',
    apple: '/logo.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#3b82f6" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="MediReminder" />
        <link rel="apple-touch-icon" href="/logo.png" />
        <link rel="icon" href="/logo.png" />
      </head>
      <body className={inter.className}>
        {/* OneSignal Initialization */}
        <OneSignalInit />
        
        <Navbar />
        <main className="min-h-screen">
          {children}
        </main>
        
        {/* Install Prompt */}
        <InstallPrompt />
        
        {/* PWA Service Worker Registration */}
        <Script id="sw-register" strategy="afterInteractive">
          {`
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', function() {
                navigator.serviceWorker.register('/sw.js').then(
                  function(registration) {
                    console.log('ServiceWorker registration successful');
                  },
                  function(err) {
                    console.log('ServiceWorker registration failed: ', err);
                  }
                );
              });
            }
          `}
        </Script>
        
        {/* Custom Sound Player */}
        <Script id="sound-player" strategy="afterInteractive">
          {`
            // Listen for messages from service worker to play custom sound
            if ('serviceWorker' in navigator) {
              navigator.serviceWorker.addEventListener('message', function(event) {
                if (event.data && event.data.type === 'PLAY_SOUND') {
                  console.log('Playing custom notification sound:', event.data.soundUrl);
                  
                  try {
                    const audio = new Audio(event.data.soundUrl);
                    audio.volume = 1.0; // Max volume
                    audio.loop = false;
                    
                    // Play the sound
                    audio.play().then(() => {
                      console.log('Custom sound played successfully');
                    }).catch(err => {
                      console.error('Error playing custom sound:', err);
                      // Fallback: try to play default notification sound
                      const fallbackAudio = new Audio('/sound.wav');
                      fallbackAudio.play().catch(e => console.error('Fallback sound also failed:', e));
                    });
                  } catch (error) {
                    console.error('Error creating audio element:', error);
                  }
                }
              });
            }
          `}
        </Script>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            className: 'toast-custom',
            style: {
              background: '#fff',
              color: '#1f2937',
              padding: '16px',
              borderRadius: '12px',
              border: '1px solid #e5e7eb',
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
              fontWeight: '500',
            },
            success: {
              duration: 3000,
              iconTheme: {
                primary: '#10b981',
                secondary: '#fff',
              },
              style: {
                background: '#f0fdf4',
                color: '#166534',
                border: '1px solid #86efac',
              },
            },
            error: {
              duration: 4000,
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
              style: {
                background: '#fef2f2',
                color: '#991b1b',
                border: '1px solid #fca5a5',
              },
            },
            loading: {
              iconTheme: {
                primary: '#3b82f6',
                secondary: '#fff',
              },
              style: {
                background: '#eff6ff',
                color: '#1e40af',
                border: '1px solid #93c5fd',
              },
            },
          }}
        />
      </body>
    </html>
  )
}