import Link from 'next/link'
import { Suspense } from 'react'

import { RedirectIfSignedIn } from '@/components/auth-redirect'
import { LindeMark } from '@/components/linde-mark'

// Only promise phone help once there is a number to ring.
const PROMISES = ['Kostenlos', 'Kein Passwort nötig', ...(process.env.NEXT_PUBLIC_SUPPORT_PHONE ? ['Hilfe am Telefon'] : [])]

type Search = Promise<{ [key: string]: string | string[] | undefined }>

/**
 * One path in, for new and returning people alike: nobody has to work out
 * whether they already have an account. Static, so it loads instantly.
 */
export default function Home({ searchParams }: { searchParams: Search }) {
  return (
    <main className="mx-auto flex w-full max-w-[1080px] flex-grow flex-col justify-center gap-12 px-6 py-16 md:flex-row md:items-center md:gap-20">
      <Suspense fallback={null}>
        <RedirectIfSignedIn />
      </Suspense>

      <div className="flex flex-col gap-7">
        <Suspense fallback={null}>
          <DeletedNotice searchParams={searchParams} />
        </Suspense>

        <div className="flex items-center gap-3">
          <LindeMark size={48} />
          <span className="font-serif text-[30px] font-bold">Linde</span>
        </div>

        <h1 className="text-pretty font-serif text-[42px] leading-[1.1] font-bold tracking-tight md:text-[56px]">
          Zeit teilen,
          <br />
          Sprache lernen,
          <br />
          sich kennenlernen.
        </h1>

        <p className="max-w-[540px] text-pretty text-[21px] leading-relaxed">
          Linde verbindet Seniorinnen und Senioren mit Studierenden aus der Nachbarschaft — für
          Gespräche auf Deutsch, Gesellschaft und ein wenig Alltagshilfe.
        </p>

        <ul className="flex flex-wrap gap-3">
          {PROMISES.map((label) => (
            <li
              key={label}
              className="rounded-full border border-line bg-tag px-4.5 py-2.5 text-[17px] font-bold"
            >
              {label}
            </li>
          ))}
        </ul>
      </div>

      <div className="flex w-full flex-col gap-4 md:max-w-[380px]">
        <Link
          href="/login"
          className="press flex min-h-[64px] items-center justify-center rounded-button bg-brand text-[21px] font-bold text-surface no-underline"
        >
          Los geht’s
        </Link>
        <p className="text-center text-[17px] leading-relaxed text-muted">
          Für neue und bekannte Gesichter.
          <br />
          Ein Passwort brauchen Sie nicht.
        </p>
      </div>
    </main>
  )
}

/** Closure after "Konto löschen": say plainly that it happened. */
async function DeletedNotice({ searchParams }: { searchParams: Search }) {
  const { geloescht } = await searchParams
  if (geloescht !== '1') return null
  return (
    <p role="status" className="rounded-card border border-line bg-tag p-5 text-[19px] leading-relaxed">
      Ihr Konto und alle Ihre Daten wurden gelöscht. Danke, dass Sie Linde ausprobiert haben.
    </p>
  )
}
