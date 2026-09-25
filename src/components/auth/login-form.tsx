'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useTransition } from 'react'

import { LindeMark } from '@/components/linde-mark'
import { createClient } from '@/lib/supabase/client'

// Set NEXT_PUBLIC_SUPPORT_PHONE to show the telephone help line.
const SUPPORT_PHONE = process.env.NEXT_PUBLIC_SUPPORT_PHONE

/**
 * Passwordless: an e-mail address, then the code from that e-mail. No password
 * to invent, forget or reset — the single biggest drop-off for older users.
 *
 * Google sits behind a flag until the provider is configured in Supabase: a
 * button that fails is worse than no button.
 */
const GOOGLE_ENABLED = false

/**
 * The code length is a server setting (auth.email.otp_length), not something
 * this form gets to decide. It was 8 in the cloud project while this input
 * capped at 6, so every verification failed with a code the user had typed
 * correctly. Accept the whole supported range and let Supabase judge it.
 */
const MIN_CODE_LENGTH = 6
const MAX_CODE_LENGTH = 10

function normalizeEmail(value: string) {
  return value.trim().toLowerCase()
}

function isValidEmail(value: string) {
  return value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

/** Sent here by /auth/confirm when a link in an e-mail could not be used. */
const LINK_ERRORS: Record<string, string> = {
  abgelaufen: 'Dieser Link ist abgelaufen. Fordern Sie bitte einen neuen Code an.',
  link: 'Mit diesem Link stimmt etwas nicht. Fordern Sie bitte einen neuen Code an.',
}

export function LoginForm() {
  const router = useRouter()
  const params = useSearchParams()
  const next = params.get('next') ?? '/discover'

  const [step, setStep] = useState<'email' | 'code'>('email')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(LINK_ERRORS[params.get('fehler') ?? ''] ?? null)
  const [resent, setResent] = useState(false)
  const [pending, startTransition] = useTransition()

  function requestCode() {
    const normalizedEmail = normalizeEmail(email)
    if (!isValidEmail(normalizedEmail)) {
      setError('Bitte geben Sie eine gültige E-Mail-Adresse ein, zum Beispiel test@example.com.')
      return
    }

    setError(null)
    setEmail(normalizedEmail)
    startTransition(async () => {
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithOtp({
        email: normalizedEmail,
        options: { shouldCreateUser: true },
      })
      if (error) {
        // Supabase allows one code per address a minute.
        setError(
          error.status === 429
            ? 'Bitte warten Sie eine Minute, bevor Sie einen neuen Code anfordern.'
            : 'Der Anmeldecode konnte nicht gesendet werden. Bitte prüfen Sie die E-Mail-Adresse und versuchen Sie es erneut.',
        )
        return
      }
      setResent(step === 'code')
      setStep('code')
    })
  }

  function verifyCode() {
    const normalizedEmail = normalizeEmail(email)
    if (!isValidEmail(normalizedEmail)) {
      setError('Bitte geben Sie eine gültige E-Mail-Adresse ein.')
      setStep('email')
      return
    }

    setError(null)
    setEmail(normalizedEmail)
    startTransition(async () => {
      const supabase = createClient()
      const { error } = await supabase.auth.verifyOtp({
        email: normalizedEmail,
        token: code,
        type: 'email',
      })
      if (error) {
        setError('Der Code stimmt nicht. Bitte prüfen Sie ihn noch einmal.')
        return
      }
      // The profile may not exist yet; /discover sends new people to onboarding.
      router.replace(next)
      router.refresh()
    })
  }

  return (
    <main className="mx-auto flex w-full max-w-[520px] flex-grow flex-col gap-6 px-6 py-12">
      <Link href="/" className="flex items-center gap-3 self-start text-ink no-underline">
        <LindeMark size={44} />
        <span className="font-serif text-[28px] font-bold">Linde</span>
      </Link>

      {step === 'email' ? (
        <form
          className="flex flex-col gap-5"
          onSubmit={(event) => {
            event.preventDefault()
            requestCode()
          }}
        >
          <div className="flex flex-col gap-2">
            <h1 className="font-serif text-[30px] font-bold">Anmelden</h1>
            <p className="text-[18px] leading-relaxed">
              Wir schicken Ihnen einen Code per E-Mail. Ein Passwort brauchen Sie nicht.
            </p>
          </div>

          {GOOGLE_ENABLED && (
            <button
              type="button"
              className="press flex min-h-[60px] items-center justify-center gap-3 rounded-button border-[1.5px] border-[#747775] bg-white text-[19px] font-bold text-[#1f1f1f]"
            >
              Mit Google anmelden
            </button>
          )}

          <div className="flex flex-col gap-2">
            <label htmlFor="email" className="text-[17px] font-bold">
              Ihre E-Mail-Adresse
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              placeholder="name@beispiel.de"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              onBlur={() => setEmail(normalizeEmail(email))}
              aria-invalid={error ? 'true' : undefined}
              className="rounded-input border-2 border-control bg-raised px-4 py-4 text-[20px] focus:border-brand focus:outline-none"
            />
          </div>

          {error && <ErrorNote>{error}</ErrorNote>}

          <button
            type="submit"
            disabled={pending || !email}
            className="press min-h-[62px] rounded-button bg-brand text-[20px] font-bold text-surface disabled:opacity-60"
          >
            {pending ? 'Wird gesendet …' : 'Code per E-Mail schicken'}
          </button>
        </form>
      ) : (
        <form
          className="flex flex-col gap-5"
          onSubmit={(event) => {
            event.preventDefault()
            verifyCode()
          }}
        >
          <div className="flex flex-col gap-2">
            <h1 className="font-serif text-[30px] font-bold">Code eingeben</h1>
            <p className="text-[18px] leading-relaxed">
              Wir haben einen Code an <strong>{email}</strong> geschickt.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="code" className="text-[17px] font-bold">
              Code aus der E-Mail
            </label>
            <input
              id="code"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={MAX_CODE_LENGTH}
              required
              value={code}
              onChange={(event) =>
                setCode(event.target.value.replace(/\D/g, '').slice(0, MAX_CODE_LENGTH))
              }
              className="rounded-input border-2 border-control bg-raised px-4 py-4 text-center font-serif text-[32px] font-bold tracking-[0.3em] focus:border-brand focus:outline-none"
            />
          </div>

          <p className="flex items-start gap-3 rounded-card border border-line bg-tag p-4 text-[17px] leading-relaxed">
            <span aria-hidden="true" className="mt-1.5 h-3.5 w-3.5 flex-none rounded-full bg-brand" />
            Schauen Sie in Ihr E-Mail-Postfach. Keine E-Mail da? Sehen Sie auch im Ordner „Spam“ nach.
          </p>

          {error && <ErrorNote>{error}</ErrorNote>}
          {resent && !error && (
            <p role="status" className="text-[17px] font-bold text-brand-pressed">
              Ein neuer Code ist unterwegs.
            </p>
          )}

          <button
            type="submit"
            disabled={pending || code.length < MIN_CODE_LENGTH}
            className="press min-h-[62px] rounded-button bg-brand text-[20px] font-bold text-surface disabled:opacity-60"
          >
            {pending ? 'Wird geprüft …' : 'Weiter'}
          </button>

          <button
            type="button"
            disabled={pending}
            onClick={() => {
              setCode('')
              requestCode()
            }}
            className="press min-h-[56px] rounded-button border-2 border-control bg-raised text-[18px] font-bold text-ink disabled:opacity-60"
          >
            Neuen Code schicken
          </button>

          <button
            type="button"
            onClick={() => {
              setStep('email')
              setCode('')
              setError(null)
              setResent(false)
            }}
            className="press min-h-[52px] text-[17px] font-bold text-muted underline"
          >
            Andere E-Mail-Adresse verwenden
          </button>
        </form>
      )}

      {/*
        Only shown once a real number exists. Telling someone who is already
        stuck to ring "[IHRE SERVICENUMMER]" is worse than offering nothing —
        and this audience is the one most likely to actually dial it.
      */}
      {SUPPORT_PHONE && (
        <p className="mt-auto flex items-center gap-3 text-[17px] leading-relaxed">
          <span aria-hidden="true" className="h-[26px] w-[26px] flex-none rounded-full bg-accent" />
          <span>
            Probleme? Rufen Sie uns an:{' '}
            <a href={`tel:${SUPPORT_PHONE.replace(/\s/g, '')}`} className="font-bold whitespace-nowrap">
              {SUPPORT_PHONE}
            </a>
          </span>
        </p>
      )}
    </main>
  )
}

function ErrorNote({ children }: { children: React.ReactNode }) {
  return (
    <p role="alert" className="rounded-input border-2 border-control bg-tag p-4 text-[17px] font-bold">
      {children}
    </p>
  )
}
