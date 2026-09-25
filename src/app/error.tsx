'use client'

import Link from 'next/link'

import { LindeMark } from '@/components/linde-mark'

/** Anything that throws while rendering: say so in German, and offer a way on. */
export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="mx-auto flex w-full max-w-[560px] flex-grow flex-col justify-center gap-6 px-6 py-16">
      <Link href="/" className="flex items-center gap-3 self-start text-ink no-underline">
        <LindeMark size={36} />
        <span className="font-serif text-[24px] font-bold">Linde</span>
      </Link>

      <h1 className="font-serif text-[34px] font-bold leading-tight">Da ist etwas schiefgegangen</h1>
      <p className="text-pretty text-[19px] leading-relaxed">
        Das lag nicht an Ihnen. Versuchen Sie es bitte noch einmal.
      </p>

      <button
        type="button"
        onClick={reset}
        className="press min-h-[60px] rounded-button bg-brand text-[20px] font-bold text-surface"
      >
        Noch einmal versuchen
      </button>
    </main>
  )
}
