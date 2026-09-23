import Link from 'next/link'
import { Suspense } from 'react'

import { ContactsBadge } from '@/components/contacts-badge'
import { LindeMark } from '@/components/linde-mark'

const ITEMS = [
  { key: 'discover', label: 'Entdecken', href: '/discover' },
  { key: 'offer', label: 'Mein Angebot', href: '/angebot' },
  { key: 'contacts', label: 'Kontakte', href: '/kontakte' },
  { key: 'profile', label: 'Profil', href: '/profil' },
] as const

export type NavKey = (typeof ITEMS)[number]['key']

/**
 * Every nav item carries a word — no icon-only controls anywhere in Linde.
 * The active item is a filled pill rather than a colour change, so "where am I"
 * survives poor contrast, sunlight and older eyes.
 */
export function SiteNav({ active }: { active: NavKey }) {
  return (
    <header className="border-b border-line bg-raised">
      <div className="mx-auto flex max-w-[1080px] items-center justify-between gap-6 px-6 py-3">
        <Link href="/discover" className="flex items-center gap-3 text-ink" aria-label="Linde, zur Startseite">
          <LindeMark />
          <span className="font-serif text-2xl font-bold">Linde</span>
        </Link>

        <nav aria-label="Hauptnavigation" className="flex gap-1.5">
          {ITEMS.map((item) => {
            const isActive = item.key === active
            return (
              <Link
                key={item.key}
                href={item.href}
                aria-current={isActive ? 'page' : undefined}
                className={`press flex min-h-[52px] items-center gap-2 rounded-full px-5 text-[18px] font-bold no-underline ${
                  isActive ? 'bg-brand text-surface' : 'text-ink hover:bg-tag'
                }`}
              >
                {item.label}
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

