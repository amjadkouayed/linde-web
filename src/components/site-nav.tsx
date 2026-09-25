import Link from 'next/link'
import { Suspense } from 'react'

import { ContactsBadge } from '@/components/contacts-badge'
import { LindeMark } from '@/components/linde-mark'

const ITEMS = [
  { key: 'discover', label: 'Entdecken', href: '/discover' },
  // "Angebot" on phones, as in the mobile design: "Mein Angebot" alone would
  // not fit a quarter of a 390 px screen.
  { key: 'offer', label: 'Mein Angebot', short: 'Angebot', href: '/angebot' },
  { key: 'contacts', label: 'Kontakte', href: '/kontakte' },
  { key: 'profile', label: 'Profil', href: '/profil' },
] as const

export type NavKey = (typeof ITEMS)[number]['key']

/**
 * Every nav item carries a word — no icon-only controls anywhere in Linde.
 * The active item is a filled pill rather than a colour change, so "where am I"
 * survives poor contrast, sunlight and older eyes.
 *
 * On a phone the four tabs take their own row as equal quarters. In one row
 * beside the logo they measured 625 px on a 390 px screen, so every signed-in
 * page scrolled sideways. Still top navigation, as the handoff asks for web.
 */
export function SiteNav({ active }: { active: NavKey }) {
  return (
    <header className="border-b border-line bg-raised">
      <div className="mx-auto flex max-w-[1080px] flex-col gap-2.5 px-4 py-3 md:flex-row md:items-center md:justify-between md:gap-6 md:px-6">
        <Link href="/discover" className="flex items-center gap-3 text-ink" aria-label="Linde, zur Startseite">
          <LindeMark />
          <span className="font-serif text-2xl font-bold">Linde</span>
        </Link>

        <nav aria-label="Hauptnavigation" className="grid grid-cols-4 gap-1 md:flex md:gap-1.5">
          {ITEMS.map((item) => {
            const isActive = item.key === active
            return (
              <Link
                key={item.key}
                href={item.href}
                aria-current={isActive ? 'page' : undefined}
                className={`press relative flex min-h-[48px] items-center justify-center gap-1.5 rounded-full px-1.5 text-[15px] font-bold no-underline md:min-h-[52px] md:gap-2 md:px-5 md:text-[18px] ${
                  isActive ? 'bg-brand text-surface' : 'text-ink hover:bg-tag'
                }`}
              >
                {'short' in item ? (
                  <>
                    <span className="md:hidden">{item.short}</span>
                    <span className="hidden md:inline">{item.label}</span>
                  </>
                ) : (
                  item.label
                )}
                {item.key === 'contacts' && (
                  <Suspense fallback={null}>
                    <ContactsBadge />
                  </Suspense>
                )}
              </Link>
            )
          })}
        </nav>
      </div>
    </header>
  )
}

