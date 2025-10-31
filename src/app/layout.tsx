import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { Toaster } from 'react-hot-toast'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Ethan Work Logger - Time & Data Tracking',
  description: 'Caregiver time tracking and behavioral data logging application',
  manifest: '/site.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Work Logger'
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: 'website',
    siteName: 'Ethan Work Logger',
    title: 'Ethan Work Logger - Time & Data Tracking',
    description: 'Simple time tracking and data logging for caregivers',
  },
  keywords: ['caregiver', 'time tracking', 'data logging', 'work log', 'behavioral data']
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#059669',
  viewportFit: 'cover'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        {/* iOS PWA Meta Tags */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Work Logger" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="apple-touch-startup-image" href="/android-chrome-512x512.png" />
        
        {/* Android PWA Meta Tags */}
        <meta name="theme-color" content="#059669" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="application-name" content="Ethan Work Logger" />
        
        {/* Windows/General Meta Tags */}
        <meta name="msapplication-TileColor" content="#059669" />
        <meta name="msapplication-TileImage" content="/android-chrome-192x192.png" />
        
        {/* Favicon Links */}
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="mask-icon" href="/favicon.ico" color="#059669" />
        
        {/* Service Worker Registration */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js')
                    .then(function(registration) {
                      console.log('SW registered: ', registration);
                    })
                    .catch(function(registrationError) {
                      console.log('SW registration failed: ', registrationError);
                    });
                });
              }
            `,
          }}
        />
      </head>
      <body className={inter.className}>
        <Toaster position="top-center" />
        {children}
      </body>
    </html>
  )
}