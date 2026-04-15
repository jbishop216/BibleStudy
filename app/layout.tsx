import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Scripture Study',
  description: 'Weekly Bible reading, HEAR analysis, and memory verse practice',
  icons: { icon: '/favicon.ico' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang='en' className={`${geistSans.variable} ${geistMono.variable}`}>
      <head>
        {/* Ornate Bible-page fonts — used exclusively in the BibleBook viewer */}
        <link rel='preconnect' href='https://fonts.googleapis.com' />
        <link rel='preconnect' href='https://fonts.gstatic.com' crossOrigin='' />
        <link
          href='https://fonts.googleapis.com/css2?family=IM+Fell+English:ital@0;1&family=UnifrakturMaguntia&family=Cinzel+Decorative:wght@400;700&display=swap'
          rel='stylesheet'
        />
      </head>
      <body className='min-h-[100dvh] bg-[#f9f7f4] text-zinc-900 antialiased'>
        {children}
      </body>
    </html>
  )
}
