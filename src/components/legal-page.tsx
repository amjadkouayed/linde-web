import Link from 'next/link'
import type { ReactNode } from 'react'

import { LindeMark } from '@/components/site-nav'

/**
 * Shared shell for the three legal pages. Set in the same large, high-contrast
 * type as the rest of the app: these are the documents most likely to be read
 * by someone deciding whether to trust us with their address, and setting them
 * in small grey print would say the opposite of what they contain.
 */
export function LegalPage({
  title,
  updated,
  children,
}: {
  title: string
  updated: string
  children: ReactNode
}) {
  return (
    <main className="mx-auto flex w-full max-w-[760px] flex-grow flex-col gap-8 px-6 py-10">
      <Link href="/" className="flex items-center gap-3 self-start text-ink no-underline">
        <LindeMark size={36} />
        <span className="font-serif text-[24px] font-bold">Linde</span>
      </Link>

      <header className="flex flex-col gap-2">
        <h1 className="font-serif text-[34px] font-bold leading-tight">{title}</h1>
        <p className="text-[17px] text-muted">Stand: {updated}</p>
      </header>

      <div className="flex flex-col gap-7 text-[18px] leading-relaxed [&_a]:underline [&_h2]:mt-3 [&_h2]:font-serif [&_h2]:text-[25px] [&_h2]:font-bold [&_h3]:font-serif [&_h3]:text-[20px] [&_h3]:font-bold [&_li]:mb-2 [&_ul]:list-disc [&_ul]:pl-6">
        {children}
      </div>

      <nav className="mt-4 flex flex-wrap gap-5 border-t border-line pt-6 text-[17px]">
        <Link href="/impressum">Impressum</Link>
        <Link href="/datenschutz">Datenschutzerklärung</Link>
        <Link href="/nutzungsbedingungen">Nutzungsbedingungen</Link>
      </nav>
    </main>
  )
}

/**
 * Marks a value that is legally required and that we cannot invent: the
 * operator's real name, address and contact. Rendered visibly rather than as a
 * comment, so an unfilled placeholder cannot quietly ship.
 */
export function Todo({ children }: { children: ReactNode }) {
  return (
    <mark className="rounded bg-tag px-1.5 py-0.5 font-bold">
      [ausfüllen: {children}]
    </mark>
  )
}
