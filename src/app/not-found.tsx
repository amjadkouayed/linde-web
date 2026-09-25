import Link from 'next/link'

import { LindeMark } from '@/components/linde-mark'

export const metadata = { title: 'Seite nicht gefunden – Linde' }

/**
 * Every notFound() lands here: a stranger's chat, a card that was taken down,
 * a mistyped link. Without it Next shows a black English page with no way back.
 */
export default function NotFound() {
  return (
    <main className="mx-auto flex w-full max-w-[560px] flex-grow flex-col justify-center gap-6 px-6 py-16">
      <Link href="/" className="flex items-center gap-3 self-start text-ink no-underline">
        <LindeMark size={36} />
        <span className="font-serif text-[24px] font-bold">Linde</span>
      </Link>

      <h1 className="font-serif text-[34px] font-bold leading-tight">Diese Seite gibt es nicht</h1>
      <p className="text-pretty text-[19px] leading-relaxed">
        Vielleicht ist der Link alt, oder die Person hat ihr Angebot zurückgezogen.
      </p>

      <Link
        href="/discover"
        className="press flex min-h-[60px] items-center justify-center rounded-button bg-brand text-[20px] font-bold text-surface no-underline"
      >
        Zurück zu Linde
      </Link>
    </main>
  )
}
