import type { Metadata } from 'next'
import { Bitter, Karla } from 'next/font/google'

import { HashSession } from '@/components/auth/hash-session'
import { SiteFooter } from '@/components/site-footer'

import './globals.css'

// Bitter carries headings and names, Karla everything else.
const bitter = Bitter({
  variable: '--font-bitter',
  subsets: ['latin'],
  weight: ['500', '600', '700'],
})

const karla = Karla({
  variable: '--font-karla',
  subsets: ['latin'],
  weight: ['400', '600', '700'],
})

export const metadata: Metadata = {
  title: 'Linde',
  description: 'Linde verbindet Seniorinnen und Senioren mit Studierenden.',
}

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="de" className={`${bitter.variable} ${karla.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <HashSession />
        {children}
        <SiteFooter />
      </body>
    </html>
  )
}
