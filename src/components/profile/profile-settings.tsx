'use client'

import { useState, useTransition } from 'react'

import { signOut, updateMyLocation } from '@/lib/actions/profile'

/**
 * Only the location is editable here. Name, age and role are set once during
 * onboarding: they are what the other person recognises you by, and quietly
 * changing them after someone has agreed to meet you would be the wrong
 * affordance to hand out.
 */
export function ProfileSettings({
  postalCode,
  city,
}: {
  postalCode: string | null
  city: string | null
}) {
  const [editing, setEditing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-3 rounded-card border border-line bg-raised p-5">
        <h2 className="font-serif text-[22px] font-bold">Wo Sie wohnen</h2>

        {!editing ? (
          <>
            <p className="text-[18px]">
              {postalCode} {city}
            </p>
            <p className="text-[16px] leading-relaxed text-muted">
              Wir speichern nur die Postleitzahl, nie Ihre Adresse. Andere sehen daraus eine
              ungefähre Entfernung, nie Ihren Wohnort.
            </p>
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="press min-h-[52px] self-start rounded-button border-2 border-control bg-surface px-5 text-[17px] font-bold text-ink"
            >
              Ändern
            </button>
          </>
        ) : (
          <form
            className="flex flex-col gap-4"
            onSubmit={(event) => {
              event.preventDefault()
              setError(null)
              const formData = new FormData(event.currentTarget)
              startTransition(async () => {
                const result = await updateMyLocation(formData)
                if (result.error) setError(result.error)
                else setEditing(false)
              })
            }}
          >
            <div className="flex flex-col gap-2">
              <label htmlFor="postal_code" className="text-[17px] font-bold">
                Postleitzahl
              </label>
              <input
                id="postal_code"
                name="postal_code"
                inputMode="numeric"
                required
                maxLength={5}
                defaultValue={postalCode ?? ''}
                className="rounded-input border-2 border-control bg-surface px-4 py-3.5 text-[18px] focus:border-brand focus:outline-none"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="city" className="text-[17px] font-bold">
                Ort
              </label>
              <input
                id="city"
                name="city"
                required
                defaultValue={city ?? ''}
                className="rounded-input border-2 border-control bg-surface px-4 py-3.5 text-[18px] focus:border-brand focus:outline-none"
              />
            </div>

            {error && (
              <p role="alert" className="rounded-input border border-control bg-tag p-3 text-[17px] font-bold">
                {error}
              </p>
            )}

            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={pending}
                className="press min-h-[56px] flex-1 rounded-button bg-brand text-[18px] font-bold text-surface disabled:opacity-60"
              >
                {pending ? 'Wird gespeichert …' : 'Speichern'}
              </button>
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="press min-h-[56px] rounded-button border-2 border-control bg-surface px-6 text-[18px] font-bold text-ink"
              >
                Abbrechen
              </button>
            </div>
          </form>
        )}
      </section>

      <form action={signOut}>
        <button
          type="submit"
          className="press min-h-[56px] w-full rounded-button border-2 border-control bg-raised text-[18px] font-bold text-ink"
        >
          Abmelden
        </button>
      </form>
    </div>
  )
}
