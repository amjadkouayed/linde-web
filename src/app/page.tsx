import Link from 'next/link'
import { Suspense } from 'react'

import { RedirectIfSignedIn } from '@/components/auth-redirect'
import { FeedbackForm } from '@/components/feedback-form'
import { LindeMark } from '@/components/linde-mark'

// Only promise phone help once there is a number to ring.
const PROMISES = [
  'Kostenlos',
  'Nur Postleitzahl, keine Adresse',
  ...(process.env.NEXT_PUBLIC_SUPPORT_PHONE ? ['Hilfe am Telefon'] : []),
]

const STEPS = [
  {
    title: 'Profil anlegen',
    body: 'Name, Alter und Postleitzahl — mehr braucht es nicht. Ihre genaue Adresse sieht niemand.',
  },
  {
    title: 'In der Nähe umsehen',
    body: 'Sie sehen, wer sich im Umkreis Ihrer Postleitzahl Zeit nimmt, und wofür. Standardmäßig 25 Kilometer.',
  },
  {
    title: 'Schreiben und treffen',
    body: 'Sie schreiben eine Anfrage. Nimmt die andere Person an, machen Sie in Ruhe Zeit und Ort aus.',
  },
]

type Search = Promise<{ [key: string]: string | string[] | undefined }>

/**
 * Three bands: what Linde is, how it works, and a way to tell us what is
 * missing. One path in, for new and returning people alike — nobody has to work
 * out whether they already have an account.
 */
export default function Home({ searchParams }: { searchParams: Search }) {
  return (
    <main className="flex flex-grow flex-col">
      <Suspense fallback={null}>
        <RedirectIfSignedIn />
      </Suspense>

      {/* 1 — What this is, and the one button in. */}
      <section className="mx-auto flex w-full max-w-[1080px] flex-col justify-center gap-12 px-6 py-16 md:flex-row md:items-center md:gap-20 md:py-24">
        <div className="flex flex-col gap-7">
          <Suspense fallback={null}>
            <DeletedNotice searchParams={searchParams} />
          </Suspense>

          <div className="flex items-center gap-3">
            <LindeMark size={48} />
            <span className="font-serif text-[30px] font-bold">Linde</span>
          </div>

          {/* The project motto, spelled as the team writes it. */}
          <p className="-mb-3 text-[18px] font-bold tracking-wide text-brand-pressed">Grenzen überWinden</p>

          {/* No hard line breaks: these three phrases are longer than the ones
              they replaced, and a <br /> that fits at 1280px splits into rags at
              the width where the button column first sits beside them. */}
          <h1 className="text-balance font-serif text-[38px] leading-[1.1] font-bold tracking-tight md:text-[48px]">
            Erfahrungen teilen, Kulturen entdecken, Generationen verbinden.
          </h1>

          <p className="max-w-[540px] text-pretty text-[21px] leading-relaxed">
            Linde bringt Seniorinnen und Senioren mit Studierenden aus aller Welt zusammen, die in
            ihrer Nähe wohnen: für Gespräche auf Deutsch, gemeinsame Zeit und ein wenig Hilfe im
            Alltag.
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
            Ob neu oder schon dabei:
            <br />
            Sie brauchen nur Ihre E-Mail-Adresse.
          </p>
        </div>
      </section>

      {/* 2 — Three steps, numbered, because "how does this work" is the question
          that stops people before they start. */}
      <section className="border-y border-line bg-tag">
        <div className="mx-auto flex w-full max-w-[1080px] flex-col gap-10 px-6 py-16 md:py-20">
          <h2 className="font-serif text-[32px] leading-tight font-bold md:text-[40px]">
            So funktioniert Linde
          </h2>

          <ol className="grid gap-6 md:grid-cols-3 md:gap-8">
            {STEPS.map((step, index) => (
              <li
                key={step.title}
                className="flex flex-col gap-3 rounded-card border border-line bg-raised p-7"
              >
                <span
                  aria-hidden="true"
                  className="flex h-12 w-12 items-center justify-center rounded-full bg-brand font-serif text-[22px] font-bold text-surface"
                >
                  {index + 1}
                </span>
                <h3 className="font-serif text-[24px] font-bold">{step.title}</h3>
                <p className="text-[19px] leading-relaxed">{step.body}</p>
              </li>
            ))}
          </ol>

          <p className="text-[19px] leading-relaxed text-muted">
            Linde ist kein Marktplatz: hier wird nichts gekauft, verkauft oder bezahlt.
          </p>
        </div>
      </section>

      {/* 3 — Feedback. The people worth hearing from are the ones who did not
          sign up, so this sits on the public page and needs no account. */}
      <section className="mx-auto flex w-full max-w-[1080px] flex-col gap-10 px-6 py-16 md:flex-row md:gap-20 md:py-20">
        <div className="flex flex-col gap-5 md:max-w-[420px] md:pt-2">
          <h2 className="font-serif text-[32px] leading-tight font-bold md:text-[40px]">
            Was sagen Sie dazu?
          </h2>
          <p className="text-[20px] leading-relaxed">
            Linde ist ein Schulprojekt für die UNESCO-Projekttage und noch nicht fertig. Wenn etwas
            fehlt, unklar ist oder Sie eine Idee haben: schreiben Sie es uns.
          </p>
          <p className="text-[18px] leading-relaxed text-muted">
            Sie brauchen dafür kein Konto. Wir lesen jede Rückmeldung.
          </p>
        </div>

        <div className="w-full md:flex-1">
          <FeedbackForm />
        </div>
      </section>
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
