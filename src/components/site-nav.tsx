import Link from 'next/link'

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
export function SiteNav({ active, openRequests = 0 }: { active: NavKey; openRequests?: number }) {
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
                {item.key === 'contacts' && openRequests > 0 && (
                  <span
                    aria-label={`${openRequests} ${openRequests === 1 ? 'neue Anfrage' : 'neue Anfragen'}`}
                    className="flex h-6 min-w-6 items-center justify-center rounded-full bg-accent px-1.5 text-sm font-bold text-ink"
                  >
                    {openRequests}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>
      </div>
    </header>
  )
}

/** Two overlapping circles with a gold lens. Never a leaf — see PRODUCT.md. */
export function LindeMark({ size = 38 }: { size?: number }) {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden="true" className="block">
      <circle cx="39" cy="50" r="30" fill="#55713F" />
      <circle cx="69" cy="50" r="22" fill="#55713F" />
      <path d="M60.93 29.53A22 22 0 0 0 60.93 70.47A30 30 0 0 0 60.93 29.53Z" fill="#C99A3E" />
    </svg>
  )
}
