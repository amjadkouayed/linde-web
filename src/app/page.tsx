import Link from 'next/link'

import { LindeMark } from '@/components/site-nav'

/**
 * One path in, for new and returning people alike: nobody has to work out
 * whether they already have an account. Static, so it loads instantly.
 */
export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-[1080px] flex-grow flex-col justify-center gap-12 px-6 py-16 md:flex-row md:items-center md:gap-20">
      <div className="flex flex-col gap-7">
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
          {['Kostenlos', 'Kein Passwort nötig', 'Hilfe am Telefon'].map((label) => (
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
