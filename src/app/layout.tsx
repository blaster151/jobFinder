import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Navbar } from '@/components/Navbar'
import { ReminderPollingDebug } from '@/components/ReminderPollingDebug'
import { ReminderNotification } from '@/components/ReminderNotification'
import { ReminderToastNotifications } from '@/components/ReminderToastNotifications'
import { ReminderPushNotifications } from '@/components/ReminderPushNotifications'
import { Toaster } from '@/components/ui/toaster'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'JobFinder',
  description: 'Your personal job search assistant',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Navbar />
        {children}
        <ReminderNotification />
        <ReminderToastNotifications />
        <ReminderPushNotifications />
        <Toaster />
        <ReminderPollingDebug show={process.env.NODE_ENV === 'development'} />
      </body>
    </html>
  )
} 