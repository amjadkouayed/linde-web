'use client'

import { useState, useTransition } from 'react'

import { PhotoPicker } from '@/components/photo-picker'
import {
  deleteMyAccount,
  removeMyAvatar,
  updateMyAbout,
  updateMyAvatar,
  updateMyLocation,
} from '@/lib/actions/profile'
import { INTERESTS } from '@/lib/labels'

/**
 * Photo, bio, interests and location are editable here. Name, age and role are set once during
 * onboarding: they are what the other person recognises you by, and quietly
 * changing them after someone has agreed to meet you would be the wrong
 * affordance to hand out.
 */
export function ProfileSettings({
  name,
  role,
  bio,
  interests,
  avatarPath,
  postalCode,
  city,
}: {
  name: string
  role: string
  bio: string | null
  interests: string[]
  avatarPath: string | null
  postalCode: string | null
  city: string | null
}) {
  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-3 rounded-card border border-line bg-raised p-5">
        <h2 className="font-serif text-[22px] font-bold">Ihr Foto</h2>
        <PhotoPicker
          name={name}
          path={avatarPath}
          onUploaded={async (path) => {
            await updateMyAvatar(path)
          }}
          onRemove={async () => {
            await removeMyAvatar()
          }}
        />
      </section>

      <About role={role} bio={bio} interests={interests} />

      <Location postalCode={postalCode} city={city} />

      <form method="post" action="/auth/signout">
        <button
          type="submit"
          className="press min-h-[56px] w-full rounded-button border-2 border-control bg-raised text-[18px] font-bold text-ink"
        >
          Abmelden
        </button>
      </form>

      <DeleteAccount />
    </div>
  )
}

function About({ role, bio, interests }: { role: string; bio: string | null; interests: string[] }) {
  const [editing, setEditing] = useState(false)
  const [draftBio, setDraftBio] = useState(bio ?? '')
  const [picked, setPicked] = useState(interests)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  // Older profiles may hold interests that are no longer on the list; offer
  // them too, so saving never silently drops one.
  const options = [...new Set([...INTERESTS[role === 'senior' ? 'senior' : 'student'], ...interests])]

  return (
    <section className="flex flex-col gap-3 rounded-card border border-line bg-raised p-5">
      <h2 className="font-serif text-[22px] font-bold">Über Sie</h2>

      {!editing ? (
        <>
          {bio ? (
            <p className="text-pretty text-[18px] leading-relaxed">{bio}</p>
          ) : (
            <p className="text-[17px] text-muted">Noch nichts geschrieben.</p>
          )}
          {interests.length > 0 && (
            <ul className="flex flex-wrap gap-2">
              {interests.map((interest) => (
                <li key={interest} className="rounded-full bg-tag px-3.5 py-1.5 text-[16px] font-bold">
                  {interest}
                </li>
              ))}
            </ul>
          )}
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
            const formData = new FormData()
            formData.set('bio', draftBio)
            formData.set('interests', picked.join(','))
            startTransition(async () => {
              const result = await updateMyAbout(formData)
              if (result.error) setError(result.error)
              else setEditing(false)
            })
          }}
        >
          <div className="flex flex-col gap-2">
            <label htmlFor="bio" className="text-[17px] font-bold">
              Ein paar Sätze über Sie
            </label>
            <textarea
              id="bio"
              rows={4}
              maxLength={1000}
              value={draftBio}
              onChange={(event) => setDraftBio(event.target.value)}
              className="resize-none rounded-input border-2 border-control bg-surface px-4 py-3.5 text-[18px] leading-relaxed focus:border-brand focus:outline-none"
            />
          </div>

          <fieldset className="flex flex-col gap-2">
            <legend className="mb-2 text-[17px] font-bold">Was machen Sie gern?</legend>
            <div className="flex flex-wrap gap-2.5">
              {options.map((interest) => {
                const active = picked.includes(interest)
                return (
                  <button
                    key={interest}
                    type="button"
                    aria-pressed={active}
                    onClick={() =>
                      setPicked(active ? picked.filter((entry) => entry !== interest) : [...picked, interest])
                    }
                    className={`press min-h-[48px] rounded-full border-2 px-5 text-[17px] font-bold ${
                      active ? 'border-brand bg-brand text-surface' : 'border-control bg-surface text-ink'
                    }`}
                  >
                    {interest}
                  </button>
                )
              })}
            </div>
          </fieldset>

          {error && <ErrorNote>{error}</ErrorNote>}

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
              onClick={() => {
                setDraftBio(bio ?? '')
                setPicked(interests)
                setEditing(false)
              }}
              className="press min-h-[56px] rounded-button border-2 border-control bg-surface px-6 text-[18px] font-bold text-ink"
            >
              Abbrechen
            </button>
          </div>
        </form>
      )}
    </section>
  )
}

function Location({ postalCode, city }: { postalCode: string | null; city: string | null }) {
  const [editing, setEditing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  return (
    <section className="flex flex-col gap-3 rounded-card border border-line bg-raised p-5">
      <h2 className="font-serif text-[22px] font-bold">Wo Sie wohnen</h2>

      {!editing ? (
        <>
          <p className="text-[18px]">
            {postalCode} {city}
          </p>
          <p className="text-[16px] leading-relaxed text-muted">
            Wir speichern nur die Postleitzahl, nie Ihre Adresse. Andere sehen daraus eine ungefähre
            Entfernung, nie Ihren Wohnort.
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
              maxLength={120}
              name="city"
              required
              defaultValue={city ?? ''}
              className="rounded-input border-2 border-control bg-surface px-4 py-3.5 text-[18px] focus:border-brand focus:outline-none"
            />
          </div>

          {error && <ErrorNote>{error}</ErrorNote>}

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
  )
}

/**
 * Two steps, and the second one says exactly what is lost. It is permanent,
 * and it also removes the conversation from the other person's side — that is
 * not obvious from the words "delete my account", so it is spelled out.
 */
function DeleteAccount() {
  const [confirming, setConfirming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="self-start text-[17px] font-bold text-muted underline"
      >
        Konto löschen
      </button>
    )
  }

  return (
    <section role="alertdialog" aria-labelledby="delete-title" className="flex flex-col gap-4 rounded-card border-2 border-ink bg-raised p-5">
      <h2 id="delete-title" className="font-serif text-[22px] font-bold">
        Konto wirklich löschen?
      </h2>
      <ul className="list-disc pl-6 text-[18px] leading-relaxed">
        <li>Ihr Profil, Ihr Foto und Ihr Angebot werden gelöscht.</li>
        <li>Alle Ihre Kontakte und Nachrichten werden gelöscht — auch bei den Menschen, mit denen Sie geschrieben haben.</li>
        <li>Das lässt sich nicht rückgängig machen.</li>
      </ul>

      {error && <ErrorNote>{error}</ErrorNote>}

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              const result = await deleteMyAccount()
              if (result?.error) setError(result.error)
            })
          }
          className="press min-h-[56px] flex-1 rounded-button bg-ink px-6 text-[18px] font-bold text-surface disabled:opacity-60"
        >
          {pending ? 'Wird gelöscht …' : 'Ja, endgültig löschen'}
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => setConfirming(false)}
          className="press min-h-[56px] rounded-button border-2 border-control bg-surface px-6 text-[18px] font-bold text-ink"
        >
          Abbrechen
        </button>
      </div>
    </section>
  )
}

function ErrorNote({ children }: { children: React.ReactNode }) {
  return (
    <p role="alert" className="rounded-input border border-control bg-tag p-3 text-[17px] font-bold">
      {children}
    </p>
  )
}
