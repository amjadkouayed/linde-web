'use client'

import Link from 'next/link'
import { useState, useTransition } from 'react'

import { sendConnectionRequest } from '@/lib/actions/connections'

/**
 * The message is pre-written and editable: a blank box asking an older person
 * to introduce themselves to a stranger is the point where people give up.
 */
export function RequestForm({
  recipientId,
  firstName,
}: {
  recipientId: string
  firstName: string
}) {
  const [message, setMessage] = useState(
    `Guten Tag, ${firstName}! Ich würde Sie gern kennenlernen. Wann hätten Sie Zeit für einen Kaffee?`,
  )
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)
  const [pending, startTransition] = useTransition()

  if (sent) {
    return (
      <div role="status" className="flex flex-col items-center gap-4 text-center">
        <span aria-hidden="true" className="flex h-[76px] w-[76px] items-center justify-center rounded-full bg-brand">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#F6F1E3" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12.5l4.5 4.5L19 7.5" />
          </svg>
        </span>
        <h2 className="font-serif text-[27px] font-bold">Anfrage gesendet</h2>
        <p className="text-[18px] leading-relaxed">
          Sobald {firstName} annimmt, finden Sie das Gespräch unter <strong>Kontakte</strong>.
        </p>
        <Link
          href="/discover"
          className="press flex min-h-[60px] w-full items-center justify-center rounded-button bg-brand text-[19px] font-bold text-surface no-underline"
        >
          Zurück zur Suche
        </Link>
      </div>
    )
  }

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault()
        startTransition(async () => {
          const result = await sendConnectionRequest(recipientId, message)
          if (result.error) setError(result.error)
          else setSent(true)
        })
      }}
    >
      <div className="flex flex-col gap-2">
        <label htmlFor="message" className="text-[17px] font-bold">
          Ihre Nachricht
        </label>
        <textarea
          id="message"
          rows={4}
          maxLength={500}
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          className="resize-none rounded-input border-2 border-control bg-raised px-4 py-3.5 text-[18px] leading-relaxed focus:border-brand focus:outline-none"
        />
        <span className="text-[16px] text-muted">
          Wir haben einen Vorschlag geschrieben. Sie können ihn ändern.
        </span>
      </div>

      {error && (
        <p role="alert" className="rounded-input border border-control bg-tag p-4 text-[17px] font-bold">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="press min-h-[64px] rounded-button bg-brand text-[21px] font-bold text-surface disabled:opacity-60"
      >
        {pending ? 'Wird gesendet …' : 'Anfrage senden'}
      </button>

      <Link
        href="/discover"
        className="press flex min-h-[56px] items-center justify-center rounded-button border-2 border-control bg-raised text-[19px] font-bold text-ink no-underline"
      >
        Abbrechen
      </Link>
    </form>
  )
}
