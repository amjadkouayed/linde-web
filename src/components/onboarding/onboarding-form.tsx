'use client'

import { useState, useTransition } from 'react'

import { PhotoPicker } from '@/components/photo-picker'
import { completeOnboarding } from '@/lib/actions/profile'

type Role = 'student' | 'senior'

const INTERESTS: Record<Role, string[]> = {
  student: ['Deutsch üben', 'Kochen', 'Musik', 'Geschichte', 'Spazieren', 'Schach', 'Technikhilfe'],
  senior: ['Deutsch beibringen', 'Backen', 'Erzählen', 'Karten spielen', 'Kino', 'Spazieren', 'Musik'],
}

const STATUSES = [
  { value: 'rentnerin', label: 'Rentnerin' },
  { value: 'rentner', label: 'Rentner' },
  { value: 'berufstaetig', label: 'Noch berufstätig' },
]

/**
 * Three short steps rather than one long form: less on each screen, and no tab
 * bar to wander off into halfway through. The role decides what step 2 asks for
 * and which interests step 3 offers.
 */
export function OnboardingForm() {
  const [step, setStep] = useState(1)
  const [role, setRole] = useState<Role | null>(null)
  const [name, setName] = useState('')
  const [username, setUsername] = useState('')
  const [age, setAge] = useState('')
  const [postalCode, setPostalCode] = useState('')
  const [city, setCity] = useState('')
  const [studyField, setStudyField] = useState('')
  const [status, setStatus] = useState('')
  const [bio, setBio] = useState('')
  const [interests, setInterests] = useState<string[]>([])
  const [avatarPath, setAvatarPath] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function next() {
    setError(null)
    if (step === 1 && !role) return setError('Bitte wählen Sie aus, wer Sie sind.')
    if (step === 2) {
      if (!name.trim()) return setError('Bitte geben Sie Ihren Namen an.')
      if (!/^[a-z0-9](?:[a-z0-9-]{1,28}[a-z0-9])?$/.test(username.trim().toLowerCase())) {
        return setError('Bitte wählen Sie einen Nutzernamen mit 3 bis 30 Zeichen.')
      }
      if (!/^\d{1,3}$/.test(age) || Number(age) < 16 || Number(age) > 120) {
        return setError('Bitte geben Sie ein Alter zwischen 16 und 120 an.')
      }
      if (!/^\d{5}$/.test(postalCode)) {
        return setError('Bitte geben Sie eine fünfstellige Postleitzahl an.')
      }
      if (!city.trim()) return setError('Bitte geben Sie Ihren Ort an.')
    }
    setStep(step + 1)
  }

  function submit() {
    setError(null)
    startTransition(async () => {
      const formData = new FormData()
      formData.set('role', role ?? '')
      formData.set('name', name.trim())
      formData.set('username', username.trim().toLowerCase())
      formData.set('age', age)
      formData.set('postal_code', postalCode)
      formData.set('city', city.trim())
      formData.set('bio', bio.trim())
      formData.set('interests', interests.join(','))
      if (role === 'student') formData.set('study_field', studyField.trim())
      if (role === 'senior') formData.set('status', status)
      if (avatarPath) formData.set('avatar_path', avatarPath)

      // On success the action redirects to /discover itself.
      const result = await completeOnboarding(formData)
      if (result?.error) setError(result.error)
    })
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2.5">
        <div aria-hidden="true" className="flex gap-2">
          {[1, 2, 3].map((n) => (
            <span
              key={n}
              className={`h-2 flex-1 rounded-full ${n <= step ? 'bg-brand' : 'bg-line'}`}
            />
          ))}
        </div>
        <p className="text-[17px] font-bold text-muted">Schritt {step} von 3</p>
      </div>

      {step === 1 && (
        <section className="flex flex-col gap-5">
          <h1 className="font-serif text-[30px] font-bold">Wer sind Sie?</h1>
          <div role="radiogroup" aria-label="Wer sind Sie?" className="flex flex-col gap-3.5">
            <RoleCard
              checked={role === 'senior'}
              onSelect={() => setRole('senior')}
              title="Ich bin Seniorin oder Senior"
              text="Ich teile gern Zeit, erzähle und lerne neue Menschen kennen."
            />
            <RoleCard
              checked={role === 'student'}
              onSelect={() => setRole('student')}
              title="Ich studiere"
              text="Ich möchte Deutsch üben, helfen und Gesellschaft leisten."
            />
          </div>
          <p className="text-[17px] leading-relaxed text-muted">
            Das legt fest, wen Sie in der App finden. Sie können es später nicht ändern.
          </p>
        </section>
      )}

      {step === 2 && (
        <section className="flex flex-col gap-5">
          <h1 className="font-serif text-[30px] font-bold">Ihr Profil</h1>

          {/* Uploaded now, saved with the profile at the end: the photo goes to
              storage straight away, but only the path waits in this form. */}
          <PhotoPicker
            name={name}
            path={avatarPath}
            onUploaded={setAvatarPath}
            onRemove={() => setAvatarPath(null)}
          />

          <Field label="Ihr Name" hint="Zum Beispiel „Helga B.“ — Ihr Nachname muss nicht sichtbar sein.">
            <input
              id="name"
              autoComplete="given-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              className={inputClass}
            />
          </Field>

          <Field label="Ihr Nutzername" hint="Dieser Name steht später in Ihrem Link, zum Beispiel helga-b. Nur a–z, 0–9 und Bindestriche.">
            <input
              id="username"
              autoComplete="username"
              value={username}
              onChange={(event) =>
                setUsername(event.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 30))
              }
              className={inputClass}
            />
          </Field>

          <Field label="Ihr Alter" hint="Steht später klein bei Ihrem Angebot, nicht neben Ihrem Namen.">
            <input
              id="age"
              inputMode="numeric"
              value={age}
              onChange={(event) => setAge(event.target.value.replace(/\D/g, '').slice(0, 3))}
              className={`${inputClass} w-[140px]`}
            />
          </Field>

          <Field label="Ihre Postleitzahl" hint="Nur die Postleitzahl. Ihre Adresse fragen wir nie — andere sehen später nur die Entfernung.">
            <input
              id="postal_code"
              inputMode="numeric"
              autoComplete="postal-code"
              value={postalCode}
              onChange={(event) => setPostalCode(event.target.value.replace(/\D/g, '').slice(0, 5))}
              className={`${inputClass} w-[180px]`}
            />
          </Field>

          <Field label="Ihr Ort">
            <input
              id="city"
              autoComplete="address-level2"
              value={city}
              onChange={(event) => setCity(event.target.value)}
              className={inputClass}
            />
          </Field>

          {role === 'student' && (
            <Field label="Was studieren Sie?">
              <input
                id="study_field"
                value={studyField}
                onChange={(event) => setStudyField(event.target.value)}
                placeholder="z. B. Informatik"
                className={inputClass}
              />
            </Field>
          )}

          {role === 'senior' && (
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
        </section>
      )}

      {step === 3 && (
        <section className="flex flex-col gap-5">
          <h1 className="font-serif text-[30px] font-bold">Über Sie</h1>

          <Field label="Ein paar Sätze über Sie" hint="Wenn Sie möchten, können Sie hier auch Ihr Alter nennen.">
            <textarea
              id="bio"
              rows={4}
              value={bio}
              onChange={(event) => setBio(event.target.value)}
              className={`${inputClass} resize-none leading-relaxed`}
            />
          </Field>

          <fieldset className="flex flex-col gap-2.5">
            <legend className="mb-2 text-[17px] font-bold">
              Was machen Sie gern? <span className="font-normal text-muted">(mehrere möglich)</span>
            </legend>
            <div className="flex flex-wrap gap-2.5">
              {INTERESTS[role ?? 'student'].map((interest) => (
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
        </section>
      )}

      {error && (
        <p role="alert" className="rounded-input border-2 border-control bg-tag p-4 text-[17px] font-bold">
          {error}
        </p>
      )}

      <div className="flex gap-3 border-t border-line pt-5">
        {step > 1 && (
          <button
            type="button"
            onClick={() => setStep(step - 1)}
            className="press min-h-[60px] rounded-button border-2 border-control bg-raised px-6 text-[19px] font-bold"
          >
            Zurück
          </button>
        )}
        <button
          type="button"
          onClick={step === 3 ? submit : next}
          disabled={pending}
          className="press min-h-[60px] flex-1 rounded-button bg-brand text-[20px] font-bold text-surface disabled:opacity-60"
        >
          {step === 3 ? (pending ? 'Wird gespeichert …' : 'Fertig') : 'Weiter'}
        </button>
      </div>
    </div>
  )
}

const inputClass =
  'rounded-input border-2 border-control bg-raised px-4 py-3.5 text-[19px] focus:border-brand focus:outline-none'

function Field({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: React.ReactElement<{ id?: string }>
}) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={children.props.id} className="text-[17px] font-bold">
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
        active ? 'border-brand bg-brand text-surface' : 'border-control bg-raised text-ink'
      }`}
    >
      {children}
    </button>
  )
}

function RoleCard({
  checked,
  onSelect,
  title,
  text,
}: {
  checked: boolean
  onSelect: () => void
  title: string
  text: string
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={checked}
      onClick={onSelect}
      className={`press flex w-full items-start gap-4 rounded-card border-2 p-5 text-left ${
        checked ? 'border-brand bg-tag' : 'border-control bg-raised'
      }`}
    >
      <span
        aria-hidden="true"
        className={`mt-0.5 flex h-7 w-7 flex-none items-center justify-center rounded-full border-[2.5px] ${
          checked ? 'border-brand' : 'border-control'
        }`}
      >
        <span className={`h-3.5 w-3.5 rounded-full ${checked ? 'bg-brand' : 'bg-transparent'}`} />
      </span>
      <span className="flex flex-col gap-1.5">
        <span className="font-serif text-[22px] font-semibold">{title}</span>
        <span className="text-[17px] font-normal leading-relaxed">{text}</span>
      </span>
    </button>
  )
}
