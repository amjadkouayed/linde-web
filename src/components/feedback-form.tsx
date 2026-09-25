'use client'

import { useRef, useState, useTransition } from 'react'

import { submitFeedback } from '@/lib/actions/feedback'

const MAX_MESSAGE_LENGTH = 2000

const labelClass = 'text-[17px] font-bold'
const inputClass =
  'w-full min-w-0 rounded-input border-2 border-control bg-raised px-4 py-3.5 text-[18px] focus:border-brand focus:outline-none'

export function FeedbackForm() {
  const formRef = useRef<HTMLFormElement>(null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)
  const [pending, startTransition] = useTransition()

  if (sent) {
    return (
      <div
        role="status"
        className="flex flex-col items-start gap-3 rounded-card border border-line bg-raised p-7"
      >
        <h3 className="font-serif text-[24px] font-bold">Vielen Dank!</h3>
        <p className="text-[19px] leading-relaxed">
          Ihr Feedback ist angekommen. Wir lesen jede Rückmeldung — melden uns aber nur, wenn Sie
          eine Frage gestellt haben.
        </p>
        <button
          type="button"
          onClick={() => {
            setSent(false)
            setMessage('')
          }}
          className="press min-h-[56px] rounded-button border-2 border-control bg-raised px-6 text-[18px] font-bold text-ink"
        >
          Noch etwas schreiben
        </button>
      </div>
    )
  }

  return (
    <form
      ref={formRef}
      className="flex flex-col gap-5 rounded-card border border-line bg-raised p-7"
      onSubmit={(event) => {
        event.preventDefault()
        const formData = new FormData(event.currentTarget)
        setError(null)
        startTransition(async () => {
          const result = await submitFeedback(formData)
          if (result.error) setError(result.error)
          else {
            setSent(true)
            formRef.current?.reset()
          }
        })
      }}
    >
      <div className="flex flex-col gap-2">
        <label htmlFor="feedback-name" className={labelClass}>
          Ihr Name
        </label>
        <input id="feedback-name" name="name" autoComplete="name" maxLength={120} className={inputClass} />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="feedback-email" className={labelClass}>
          Ihre E-Mail-Adresse
        </label>
        <input
          id="feedback-email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          maxLength={254}
          className={inputClass}
        />
        <span className="text-[16px] text-muted">Nur damit wir antworten können, falls Sie etwas fragen.</span>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="feedback-message" className={labelClass}>
          Ihr Feedback
        </label>
        <textarea
          id="feedback-message"
          name="message"
          rows={5}
          maxLength={MAX_MESSAGE_LENGTH}
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder="Was gefällt Ihnen? Was fehlt? Was war unklar?"
          className={`${inputClass} resize-none leading-relaxed`}
        />
        <span className="text-[16px] text-muted">
          {message.length}/{MAX_MESSAGE_LENGTH} Zeichen
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
        className="press min-h-[60px] rounded-button bg-brand text-[19px] font-bold text-surface disabled:opacity-60"
      >
        {pending ? 'Wird gesendet …' : 'Feedback senden'}
      </button>
    </form>
  )
}
