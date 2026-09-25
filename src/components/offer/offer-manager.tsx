'use client'

import Link from 'next/link'
import { useState, useTransition } from 'react'

import { Avatar } from '@/components/avatar'
import { personLine } from '@/lib/labels'
import { deleteMyOffer, updateMyCard } from '@/lib/actions/profile'
import type { Offer, OfferStats, Profile } from '@/lib/data/profiles'

type View = 'empty' | 'form' | 'live'
const MAX_AVAILABILITY_LENGTH = 500
const MAX_DESCRIPTION_LENGTH = 1000

/**
 * Three states on one screen, as designed: nothing yet, the three-field form,
 * and the published card with its numbers. The location is not a field here —
 * it comes from the profile, and the form says so rather than asking twice.
 */
export function OfferManager({
  profile,
  offer,
  stats,
}: {
  profile: Profile
  offer: Offer | null
  stats: OfferStats | null
}) {
  const [view, setView] = useState<View>(offer ? 'live' : 'empty')
  const [availability, setAvailability] = useState(offer?.availability ?? '')
  const [description, setDescription] = useState(offer?.description ?? '')
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const availabilityTooLong = availability.length > MAX_AVAILABILITY_LENGTH
  const descriptionTooLong = description.length > MAX_DESCRIPTION_LENGTH

  function publish() {
    setError(null)
    if (!availability.trim() || !description.trim()) {
      setError('Bitte füllen Sie beide Felder aus.')
      return
    }
    if (availability.trim().length > MAX_AVAILABILITY_LENGTH) {
      setError(`Die Verfügbarkeit darf höchstens ${MAX_AVAILABILITY_LENGTH} Zeichen lang sein.`)
      return
    }
    if (description.trim().length > MAX_DESCRIPTION_LENGTH) {
      setError(`Die Beschreibung darf höchstens ${MAX_DESCRIPTION_LENGTH} Zeichen lang sein.`)
      return
    }
    startTransition(async () => {
      const formData = new FormData()
      formData.set('availability', availability.trim())
      formData.set('description', description.trim())
      formData.set('is_published', 'on')
      const result = await updateMyCard(formData)
      if (result.error) setError(result.error)
      else setView('live')
    })
  }

  function remove() {
    startTransition(async () => {
      const result = await deleteMyOffer()
      if (result.error) setError(result.error)
      else {
        setAvailability('')
        setDescription('')
        setConfirmingDelete(false)
        setView('empty')
      }
    })
  }

  if (view === 'form') {
    return (
      <form
        className="flex min-w-0 flex-col gap-6 rounded-card border border-line bg-raised p-7 md:grid md:grid-cols-2 md:gap-8"
        onSubmit={(event) => {
          event.preventDefault()
          publish()
        }}
      >
        <div className="flex min-w-0 flex-col gap-5">
          <p className="text-[19px] leading-relaxed text-muted">Zwei Angaben — dann sind Sie sichtbar.</p>

          <div className="flex flex-col gap-2">
            <label htmlFor="availability" className="text-[17px] font-bold">
              Wann haben Sie Zeit?
            </label>
            <input
              id="availability"
              maxLength={MAX_AVAILABILITY_LENGTH}
              value={availability}
              onChange={(event) => setAvailability(event.target.value)}
              aria-invalid={availabilityTooLong}
              placeholder="z. B. Dienstag und Donnerstag nachmittags"
              className="w-full min-w-0 max-w-full rounded-input border-2 border-control bg-surface px-4 py-3.5 text-[19px] focus:border-brand focus:outline-none"
            />
            <span className="text-[16px] text-muted">
              Genaue Zeiten machen Sie später im Chat aus.
            </span>
            <span className="text-[16px] text-muted">
              {availability.length}/{MAX_AVAILABILITY_LENGTH} Zeichen
            </span>
          </div>

          <div className="flex flex-col gap-2 rounded-input border border-line bg-surface p-4">
            <span className="text-[16px] font-bold">Ihr Ort</span>
            <span className="text-[18px]">
              {profile.postal_code} {profile.city}
            </span>
            <Link href="/profil" className="text-[16px] font-bold text-brand-pressed underline">
              Im Profil ändern
            </Link>
          </div>
        </div>

        <div className="flex min-w-0 flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label htmlFor="description" className="text-[17px] font-bold">
              Was suchen Sie, was bieten Sie?
            </label>
            <textarea
              id="description"
              rows={7}
              maxLength={MAX_DESCRIPTION_LENGTH}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              aria-invalid={descriptionTooLong}
              placeholder="Zum Beispiel: Ich möchte Deutsch üben und helfe gern beim Einkaufen."
              className="box-border min-h-0 w-full min-w-0 max-w-full resize-none rounded-input border-2 border-control bg-surface px-4 py-3.5 text-[18px] leading-relaxed focus:border-brand focus:outline-none"
            />
            <span className={`text-[16px] ${descriptionTooLong ? 'font-bold text-brand-pressed' : 'text-muted'}`}>
              {description.length}/{MAX_DESCRIPTION_LENGTH} Zeichen
            </span>
            {descriptionTooLong && (
              <p role="alert" className="text-[17px] font-bold text-brand-pressed">
                Die Beschreibung darf höchstens {MAX_DESCRIPTION_LENGTH} Zeichen lang sein.
              </p>
            )}
          </div>

          {error && <ErrorNote>{error}</ErrorNote>}

          <div className="flex flex-wrap justify-end gap-3">
            <button
              type="button"
              onClick={() => setView(offer ? 'live' : 'empty')}
              className="press min-h-[58px] rounded-button border-2 border-control bg-raised px-6 text-[18px] font-bold"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              disabled={pending}
              className="press min-h-[58px] rounded-button bg-brand px-8 text-[19px] font-bold text-surface disabled:opacity-60"
            >
              {pending ? 'Wird veröffentlicht …' : 'Veröffentlichen'}
            </button>
          </div>
        </div>
      </form>
    )
  }

  if (view === 'empty') {
    return (
      <div className="flex flex-col gap-10 rounded-card border border-line bg-raised p-8 md:grid md:grid-cols-[minmax(0,1fr)_380px] md:items-center md:gap-12">
        <div className="flex flex-col gap-5">
          <h2 className="font-serif text-[30px] font-bold">Sie haben noch kein Angebot</h2>
          <p className="max-w-[520px] text-pretty text-[20px] leading-relaxed">
            Ein Angebot ist wie ein kleiner Aushang: Andere sehen, wann Sie Zeit haben und was Sie
            gern gemeinsam machen möchten. So finden die Richtigen Sie leichter.
          </p>

          <ol className="flex flex-col gap-3">
            {['Wann Sie ungefähr Zeit haben', 'Was Sie suchen und was Sie anbieten'].map(
              (step, index) => (
                <li key={step} className="flex items-center gap-3.5 text-[19px]">
                  <span
                    aria-hidden="true"
                    className="flex h-9 w-9 flex-none items-center justify-center rounded-full border border-line bg-tag font-serif font-bold"
                  >
                    {index + 1}
                  </span>
                  {step}
                </li>
              ),
            )}
          </ol>

          <div className="flex flex-wrap items-center gap-5">
            <button
              type="button"
              onClick={() => setView('form')}
              className="press min-h-[62px] rounded-button bg-brand px-11 text-[20px] font-bold text-surface"
            >
              Angebot erstellen
            </button>
            <span className="text-[17px] text-muted">Dauert etwa zwei Minuten.</span>
          </div>

          <p className="text-[17px] leading-relaxed text-muted">
            Auch ohne Angebot können Sie andere{' '}
            <Link href="/discover" className="font-bold text-brand-pressed underline">
              entdecken
            </Link>{' '}
            und Anfragen senden.
          </p>
        </div>

        <ExampleCard name={profile.name} />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 md:grid md:grid-cols-[minmax(0,1fr)_340px] md:items-start">
      <section className="flex flex-col gap-5 rounded-card border border-line bg-raised p-7">
        <h2 className="text-[17px] font-bold text-muted">So sehen andere Ihr Angebot</h2>

        <div className="flex items-center gap-5">
          <Avatar name={profile.name} path={profile.avatar_path} size={96} />
          <div className="flex flex-col gap-1">
            <span className="font-serif text-[26px] font-semibold">{profile.name}</span>
            <span className="text-[18px] text-muted">
              {personLine({
                age: new Date().getFullYear() - profile.birth_year,
                role: profile.role,
                studyField: profile.study_field,
                status: profile.status,
              })}
            </span>
          </div>
        </div>

        {/* Everything the Discover card shows, so the preview does not lie. */}
        {profile.bio && <p className="text-pretty text-[19px] leading-relaxed">{profile.bio}</p>}
        <p className="text-pretty text-[19px] leading-relaxed">{offer?.description}</p>

        <ul className="flex flex-wrap gap-2">
          <Fact>
            {profile.postal_code} {profile.city}
          </Fact>
          {offer?.availability && <Fact>{offer.availability}</Fact>}
          {profile.interests.map((interest) => (
            <li
              key={interest}
              className="rounded-full border border-line bg-tag px-3.5 py-1.5 text-[16px] font-bold"
            >
              {interest}
            </li>
          ))}
        </ul>
      </section>

      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-4 rounded-card border border-line bg-raised p-6">
          <div className="flex items-center gap-4">
            <span className="font-serif text-[44px] font-bold leading-none text-brand-pressed">
              {stats?.views_this_week ?? 0}
            </span>
            <span className="text-[18px] leading-snug">
              {stats?.views_this_week === 1 ? 'Person hat' : 'Personen haben'} Ihr Angebot diese
              Woche angesehen.
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-2.5 rounded-card border border-line bg-raised p-6">
          {confirmingDelete ? (
            <div role="alertdialog" aria-label="Angebot löschen" className="flex flex-col gap-3">
              <p className="text-[18px] font-bold leading-relaxed">
                Angebot wirklich löschen? Andere finden Sie dann nicht mehr.
              </p>
              <button
                type="button"
                onClick={() => setConfirmingDelete(false)}
                className="press min-h-[54px] rounded-button border-2 border-control bg-raised text-[18px] font-bold"
              >
                Behalten
              </button>
              <button
                type="button"
                onClick={remove}
                disabled={pending}
                className="press min-h-[54px] rounded-button bg-ink text-[18px] font-bold text-surface disabled:opacity-60"
              >
                Ja, löschen
              </button>
            </div>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setView('form')}
                className="press min-h-[58px] rounded-button bg-brand text-[19px] font-bold text-surface"
              >
                Bearbeiten
              </button>
              <button
                type="button"
                onClick={() => setConfirmingDelete(true)}
                className="press min-h-[50px] text-[17px] font-bold text-muted underline"
              >
                Angebot löschen
              </button>
            </>
          )}
        </div>

        {(stats?.open_requests ?? 0) > 0 && (
          <Link
            href="/kontakte"
            className="press flex items-center gap-3.5 rounded-card border border-line bg-tag p-5 text-ink no-underline"
          >
            <span className="flex h-9 min-w-9 items-center justify-center rounded-full bg-accent px-2.5 text-[17px] font-bold">
              {stats?.open_requests}
            </span>
            <span className="text-[18px] leading-snug">
              <strong>{stats?.open_requests === 1 ? 'Neue Anfrage' : 'Neue Anfragen'}</strong>
              <br />
              unter Kontakte ansehen
            </span>
          </Link>
        )}

        {error && <ErrorNote>{error}</ErrorNote>}
      </div>
    </div>
  )
}

function Fact({ children }: { children: React.ReactNode }) {
  return (
    <li className="rounded-full border border-control bg-surface px-3.5 py-1.5 text-[16px] font-bold text-muted">
      {children}
    </li>
  )
}

function ErrorNote({ children }: { children: React.ReactNode }) {
  return (
    <p role="alert" className="rounded-input border-2 border-control bg-tag p-4 text-[17px] font-bold">
      {children}
    </p>
  )
}

/** Labelled as an example so nobody mistakes it for a published card. */
function ExampleCard({ name }: { name: string }) {
  return (
    <section
      aria-label="Beispiel für ein Angebot"
      className="relative flex flex-col gap-3.5 rounded-card border-2 border-dashed border-control bg-surface p-6 pt-8"
    >
      <span className="absolute -top-3.5 left-5 rounded-full bg-accent px-3.5 py-1 text-[16px] font-bold text-ink">
        Beispiel
      </span>
      <div className="flex items-center gap-3.5">
        <Avatar name={name} size={64} />
        <span className="font-serif text-[22px] font-semibold">{name}</span>
      </div>
      <p className="text-[18px] leading-relaxed">
        „Ich möchte mein Deutsch im Alltag verbessern. Gern helfe ich beim Einkaufen oder mit dem
        Handy.“
      </p>
      <ul className="flex flex-wrap gap-2">
        <Fact>Dienstag nachmittags</Fact>
      </ul>
    </section>
  )
}
