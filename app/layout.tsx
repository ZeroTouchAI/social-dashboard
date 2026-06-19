import type { Metadata } from 'next'
import './globals.css'
import { Sidebar } from '@/components/ui/Sidebar'
import { Toaster } from 'sonner'

export const metadata: Metadata = {
  title: 'Social Intelligence Dashboard',
  description: 'AI-powered social media analytics and intelligence',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <div className="flex h-screen overflow-hidden">
          <Sidebar />
          <main className="flex-1 overflow-y-auto bg-grid" style={{ background: 'var(--bg-base)' }}>
            <div className="min-h-full">
              {children}
            </div>
          </main>
        </div>
        <Toaster
          theme="dark"
          toastOptions={{
            style: {
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-default)',
              color: 'var(--text-primary)',
            },
          }}
        />
      </body>
    </html>
  )
}
