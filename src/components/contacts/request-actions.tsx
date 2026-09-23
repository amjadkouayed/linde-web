'use client'

import { useState, useTransition } from 'react'

import { answerConnectionRequest, withdrawConnectionRequest } from '@/lib/actions/connections'

/**
 * Accept and decline sit side by side with equal weight. Declining is not a
 * failure state and should not look like one — but accepting is the action
 * people came for, so only it is filled.
 */
export function RequestActions({ connectionId }: { connectionId: string }) {
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function answer(accept: boolean) {
    setError(null)
    startTransition(async () => {
      const result = await answerConnectionRequest(connectionId, accept)
      if (result.error) setError(result.error)
    })
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          disabled={pending}
          onClick={() => answer(true)}
          className="press min-h-[56px] flex-1 rounded-button bg-brand px-6 text-[18px] font-bold text-surface disabled:opacity-60"
        >
          Annehmen
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => answer(false)}
          className="press min-h-[56px] flex-1 rounded-button border-2 border-control bg-raised px-6 text-[18px] font-bold text-ink disabled:opacity-60"
        >
          Ablehnen
        </button>
      </div>
      {error && (
        <p role="alert" className="rounded-input border border-control bg-tag p-3 text-[16px] font-bold">
          {error}
        </p>
      )}
    </div>
  )
}

/** For a request you sent yourself and can take back. */
export function WithdrawAction({ connectionId }: { connectionId: string }) {
  const [pending, startTransition] = useTransition()

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => startTransition(() => withdrawConnectionRequest(connectionId).then(() => {}))}
      className="press min-h-[52px] self-start rounded-button border-2 border-control bg-raised px-5 text-[17px] font-bold text-ink disabled:opacity-60"
    >
      Anfrage zurückziehen
    </button>
  )
}
