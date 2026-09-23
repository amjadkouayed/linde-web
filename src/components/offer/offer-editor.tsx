'use client'

import { useState, useTransition } from 'react'

import { deleteMyOffer, updateMyCard } from '@/lib/actions/profile'
import type { Offer } from '@/lib/data/profiles'

/**
 * One offer per person, so this is always an edit of the same row rather than
 * a list with an "add" button. The publish switch is a real checkbox with a
 * word next to it, not a toggle: a switch with no label is ambiguous at a
 * glance, and this one decides whether strangers can see you.
 */
export function OfferEditor({ offer }: { offer: Offer | null }) {
  const [editing, setEditing] = useState(offer === null)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  if (!editing && offer) {
    return (
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="press min-h-[56px] rounded-button bg-brand px-6 text-[18px] font-bold text-surface"
        >
          Bearbeiten
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            if (!confirm('Ihr Angebot wird gelöscht. Ihre bestehenden Kontakte bleiben erhalten.')) return
            startTransition(async () => {
              const result = await deleteMyOffer()
              if (result.error) setError(result.error)
            })
          }}
          className="press min-h-[56px] rounded-button border-2 border-control bg-raised px-6 text-[18px] font-bold text-ink disabled:opacity-60"
        >
          Löschen
        </button>
        {error && (
          <p role="alert" className="w-full rounded-input border border-control bg-tag p-3 text-[17px] font-bold">
            {error}
          </p>
        )}
      </div>
    )
  }

  return (
    <form
      className="flex flex-col gap-5 rounded-card border border-line bg-raised p-5"
      onSubmit={(event) => {
        event.preventDefault()
        setError(null)
        const formData = new FormData(event.currentTarget)
        startTransition(async () => {
          const result = await updateMyCard(formData)
          if (result.error) setError(result.error)
          else setEditing(false)
        })
      }}
    >
      <div className="flex flex-col gap-2">
        <label htmlFor="availability" className="text-[17px] font-bold">
          Wann haben Sie Zeit?
        </label>
        <input
          id="availability"
          name="availability"
          required
          maxLength={500}
          defaultValue={offer?.availability ?? ''}
          placeholder="z. B. dienstags und donnerstags nachmittags"
          className="rounded-input border-2 border-control bg-surface px-4 py-3.5 text-[18px] focus:border-brand focus:outline-none"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="description" className="text-[17px] font-bold">
          Was möchten Sie zusammen machen?
        </label>
        <textarea
          id="description"
          name="description"
          required
          rows={4}
          maxLength={1000}
          defaultValue={offer?.description ?? ''}
          placeholder="Schreiben Sie ein paar Sätze, als würden Sie es jemandem erzählen."
          className="resize-none rounded-input border-2 border-control bg-surface px-4 py-3.5 text-[18px] leading-relaxed focus:border-brand focus:outline-none"
        />
      </div>

      <label className="flex items-start gap-3 text-[18px] leading-relaxed">
        <input
          type="checkbox"
          name="is_published"
          defaultChecked={offer?.is_published ?? true}
          className="mt-1 h-6 w-6 flex-none accent-[var(--color-brand)]"
        />
        <span>
          Mein Angebot veröffentlichen
          <span className="block text-[16px] text-muted">
            Nur veröffentlichte Angebote erscheinen bei der Suche. Sie können das jederzeit wieder
            ausschalten.
          </span>
        </span>
      </label>

      {error && (
        <p role="alert" className="rounded-input border border-control bg-tag p-3 text-[17px] font-bold">
          {error}
        </p>
      )}

      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={pending}
          className="press min-h-[58px] flex-1 rounded-button bg-brand text-[19px] font-bold text-surface disabled:opacity-60"
        >
          {pending ? 'Wird gespeichert …' : 'Speichern'}
        </button>
        {offer && (
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="press min-h-[58px] rounded-button border-2 border-control bg-surface px-6 text-[19px] font-bold text-ink"
          >
            Abbrechen
          </button>
        )}
      </div>
    </form>
  )
}
