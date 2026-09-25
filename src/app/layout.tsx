import type { Metadata } from 'next'
import { Bitter, Karla } from 'next/font/google'

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
  description:
    'Grenzen überWinden: Linde bringt Seniorinnen und Senioren mit Studierenden aus ihrer Nachbarschaft zusammen.',
}

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="de" className={`${bitter.variable} ${karla.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        {children}
        <SiteFooter />
      </body>
    </html>
  )
}
