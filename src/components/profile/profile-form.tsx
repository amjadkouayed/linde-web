'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'

import { updateMyLocation, updateMyProfile } from '@/lib/actions/profile'
import type { Profile } from '@/lib/data/profiles'
import { createClient } from '@/lib/supabase/client'

const INTERESTS: Record<string, string[]> = {
  student: ['Deutsch üben', 'Kochen', 'Musik', 'Geschichte', 'Spazieren', 'Schach', 'Technikhilfe'],
  senior: ['Deutsch beibringen', 'Backen', 'Erzählen', 'Karten spielen', 'Kino', 'Spazieren', 'Musik'],
}

const STATUSES = [
  { value: 'rentnerin', label: 'Rentnerin' },
  { value: 'rentner', label: 'Rentner' },
  { value: 'berufstaetig', label: 'Noch berufstätig' },
]

export function ProfileForm({ profile }: { profile: Profile }) {
  const router = useRouter()
  const [name, setName] = useState(profile.name)
  const [age, setAge] = useState(String(new Date().getFullYear() - profile.birth_year))
  const [studyField, setStudyField] = useState(profile.study_field ?? '')
  const [status, setStatus] = useState(profile.status ?? '')
  const [bio, setBio] = useState(profile.bio ?? '')
  const [interests, setInterests] = useState<string[]>(profile.interests ?? [])
  const [postalCode, setPostalCode] = useState(profile.postal_code)
  const [city, setCity] = useState(profile.city)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [pending, startTransition] = useTransition()

  function save() {
    setError(null)
    setSaved(false)
    startTransition(async () => {
      const profileData = new FormData()
      profileData.set('name', name.trim())
      profileData.set('age', age)
      profileData.set('bio', bio.trim())
      profileData.set('interests', interests.join(','))
      profileData.set('study_field', studyField.trim())
      profileData.set('status', status)

      const profileResult = await updateMyProfile(profileData)
      if (profileResult.error) return setError(profileResult.error)

      // Location is its own action: it is the one field the offer and the
      // discover filter both read, so it has its own validation and its own
      // reason to change.
      if (postalCode !== profile.postal_code || city !== profile.city) {
        const locationData = new FormData()
        locationData.set('postal_code', postalCode)
        locationData.set('city', city.trim())
        const locationResult = await updateMyLocation(locationData)
        if (locationResult.error) return setError(locationResult.error)
      }

      setSaved(true)
    })
  }

  function signOut() {
    startTransition(async () => {
      await createClient().auth.signOut()
      router.replace('/')
      router.refresh()
    })
  }

  return (
    <div className="flex flex-col gap-6 md:grid md:grid-cols-[300px_minmax(0,1fr)] md:items-start">
      <section
        aria-labelledby="account"
        className="flex flex-col gap-3.5 rounded-card border border-line bg-raised p-6"
      >
        <h2 id="account" className="font-serif text-[22px] font-bold">
          Ihr Konto
        </h2>
        <p className="text-[17px] leading-relaxed">
          Angemeldet als
          <br />
          <span className="break-all text-muted">{profile.id.slice(0, 8)}…</span>
        </p>
        <button
          type="button"
          onClick={signOut}
          disabled={pending}
          className="press min-h-[52px] rounded-button border-2 border-control bg-raised text-[17px] font-bold disabled:opacity-60"
        >
          Abmelden
        </button>
      </section>

      <form
        className="flex flex-col gap-5 rounded-card border border-line bg-raised p-7"
        onSubmit={(event) => {
          event.preventDefault()
          save()
        }}
      >
        <div className="grid gap-5 md:grid-cols-2">
          <Field id="name" label="Ihr Name">
            <input
              id="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              className={inputClass}
            />
          </Field>

          <Field id="age" label="Ihr Alter" hint="Steht klein bei Ihrem Angebot, nicht neben Ihrem Namen.">
            <input
              id="age"
              inputMode="numeric"
              value={age}
              onChange={(event) => setAge(event.target.value.replace(/\D/g, '').slice(0, 3))}
              className={inputClass}
            />
          </Field>

          <Field id="postal_code" label="Ihre Postleitzahl">
            <input
              id="postal_code"
              inputMode="numeric"
              autoComplete="postal-code"
              value={postalCode}
              onChange={(event) => setPostalCode(event.target.value.replace(/\D/g, '').slice(0, 5))}
              className={inputClass}
            />
          </Field>

          <Field id="city" label="Ihr Ort">
            <input
              id="city"
              value={city}
              onChange={(event) => setCity(event.target.value)}
              className={inputClass}
            />
          </Field>
        </div>

        {profile.role === 'student' ? (
          <Field id="study_field" label="Was studieren Sie?">
            <input
              id="study_field"
              value={studyField}
              onChange={(event) => setStudyField(event.target.value)}
              className={inputClass}
            />
          </Field>
        ) : (
          <fieldset className="flex flex-col gap-2.5">
            <legend className="mb-2 text-[17px] font-bold">Ihr Status</legend>
            <div className="flex flex-wrap gap-2.5">
              {STATUSES.map((option) => (
                <Chip
                  key={option.value}
                  active={status === option.value}
                  onClick={() => setStatus(status === option.value ? '' : option.value)}
                >
                  {option.label}
                </Chip>
              ))}
            </div>
          </fieldset>
        )}

        <Field id="bio" label="Über Sie">
          <textarea
            id="bio"
            rows={3}
            value={bio}
            onChange={(event) => setBio(event.target.value)}
            className={`${inputClass} resize-none leading-relaxed`}
          />
        </Field>

        <fieldset className="flex flex-col gap-2.5">
          <legend className="mb-2 text-[17px] font-bold">Was machen Sie gern?</legend>
          <div className="flex flex-wrap gap-2.5">
            {(INTERESTS[profile.role] ?? []).map((interest) => (
              <Chip
                key={interest}
                active={interests.includes(interest)}
                onClick={() =>
                  setInterests((current) =>
                    current.includes(interest)
                      ? current.filter((entry) => entry !== interest)
                      : [...current, interest],
                  )
                }
              >
                {interest}
              </Chip>
            ))}
          </div>
        </fieldset>

        {error && (
          <p role="alert" className="rounded-input border-2 border-control bg-tag p-4 text-[17px] font-bold">
            {error}
          </p>
        )}

        <div className="flex items-center justify-end gap-4 border-t border-line pt-5">
          {saved && (
            <span role="status" className="flex items-center gap-2 text-[17px] font-bold text-brand-pressed">
              <span aria-hidden="true" className="h-3 w-3 rounded-full bg-brand" />
              Gespeichert
            </span>
          )}
          <button
            type="submit"
            disabled={pending}
            className="press min-h-[58px] rounded-button bg-brand px-10 text-[19px] font-bold text-surface disabled:opacity-60"
          >
            {pending ? 'Wird gespeichert …' : 'Speichern'}
          </button>
        </div>
      </form>
    </div>
  )
}

const inputClass =
  'rounded-input border-2 border-control bg-surface px-4 py-3.5 text-[19px] focus:border-brand focus:outline-none'

function Field({
  id,
  label,
  hint,
  children,
}: {
  id: string
  label: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-[17px] font-bold">
        {label}
      </label>
      {children}
      {hint && <span className="text-[16px] leading-relaxed text-muted">{hint}</span>}
    </div>
  )
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`press min-h-[48px] rounded-full border-2 px-5 text-[17px] font-bold ${
        active ? 'border-brand bg-brand text-surface' : 'border-control bg-surface text-ink'
      }`}
    >
      {children}
    </button>
  )
}
