'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

export function RequestSentToast() {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    window.history.replaceState(null, '', '/discover')
  }, [])

  if (!visible) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/35 px-6 py-8">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="request-sent-title"
        className="flex w-full max-w-[480px] flex-col gap-5 rounded-card border border-line bg-raised p-6 shadow-[0_16px_40px_rgba(47,43,30,0.2)]"
      >
        <div className="flex items-start gap-4">
          <span
            aria-hidden="true"
            className="flex h-11 w-11 flex-none items-center justify-center rounded-full bg-brand text-surface"
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m5 12 4.5 4.5L19 7.5" />
            </svg>
          </span>
          <div className="flex flex-col gap-1.5">
            <h2 id="request-sent-title" className="font-serif text-[25px] font-bold">
              Anfrage gesendet
            </h2>
            <p className="text-[18px] leading-relaxed">
              Ihre Anfrage wurde erfolgreich gesendet.
            </p>
          </div>
        </div>

        <p className="text-[17px] leading-relaxed text-muted">
          Unter „Kontakte“ können Sie den Status Ihrer Anfrage sehen.
        </p>

        <div className="flex flex-col gap-3 sm:flex-row-reverse">
          <Link
            href="/kontakte"
            className="press flex min-h-[58px] flex-1 items-center justify-center rounded-button bg-brand px-5 text-[18px] font-bold text-surface no-underline"
          >
            Anfragen ansehen
          </Link>
          <button
            type="button"
            onClick={() => setVisible(false)}
            className="press min-h-[58px] flex-1 rounded-button border-2 border-control bg-raised px-5 text-[18px] font-bold text-ink"
          >
            Weiter suchen
          </button>
        </div>
      </div>
    </div>
  )
}
