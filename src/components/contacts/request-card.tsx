'use client'

import { useState, useTransition } from 'react'

import { Avatar } from '@/components/avatar'
import { answerConnectionRequest } from '@/lib/actions/connections'
import type { ConnectionOverview } from '@/lib/data/connections'

/**
 * Accept and decline sit side by side and are both real buttons with words.
 * Declining is quiet — no confirmation — because the person is not told, and
 * an accidental decline can be repaired by the other side asking again.
 */
export function RequestCard({ request }: { request: ConnectionOverview }) {
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function answer(accept: boolean) {
    setError(null)
    startTransition(async () => {
      const result = await answerConnectionRequest(request.connection_id!, accept)
      if (result.error) setError(result.error)
    })
  }

  return (
    <article className="flex flex-col gap-4 rounded-card border border-line bg-raised p-5">
      <div className="flex items-start gap-4">
        <Avatar name={request.other_name} size={54} />
        <div className="flex flex-col gap-1.5">
          <h3 className="font-serif text-[21px] font-semibold">{request.other_name}</h3>
          {request.intro_message && (
            <p className="text-[17px] leading-relaxed">{request.intro_message}</p>
          )}
        </div>
      </div>

      {error && (
        <p role="alert" className="rounded-input border border-control bg-tag p-3 text-[16px] font-bold">
          {error}
        </p>
      )}

      <div className="flex gap-2.5">
        <button
          type="button"
          onClick={() => answer(true)}
          disabled={pending}
          className="press min-h-[54px] flex-1 rounded-button bg-brand text-[18px] font-bold text-surface disabled:opacity-60"
        >
          Annehmen
        </button>
        <button
          type="button"
          onClick={() => answer(false)}
          disabled={pending}
          className="press min-h-[54px] flex-1 rounded-button border-2 border-control bg-raised text-[18px] font-bold disabled:opacity-60"
        >
          Ablehnen
        </button>
      </div>
    </article>
  )
}
