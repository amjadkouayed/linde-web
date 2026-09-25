import Link from 'next/link'

/**
 * Sits in the root layout so the legal pages are reachable from anywhere. In
 * Germany the Impressum has to be findable from every page, and a privacy
 * policy nobody can find is not a privacy policy.
 */
export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-line px-6 py-7">
      <nav className="mx-auto flex w-full max-w-[1080px] flex-wrap items-center gap-x-6 gap-y-3 text-[16px] text-muted">
        <span>Linde · Grenzen überWinden</span>
        <Link href="/impressum" className="underline">
          Impressum
        </Link>
        <Link href="/datenschutz" className="underline">
          Datenschutz
        </Link>
        <Link href="/nutzungsbedingungen" className="underline">
          Nutzungsbedingungen
        </Link>
      </nav>
    </footer>
  )
}
