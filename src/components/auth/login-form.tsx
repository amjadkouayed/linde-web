'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useTransition } from 'react'

import { LindeMark } from '@/components/site-nav'
import { createClient } from '@/lib/supabase/client'

/**
 * Passwordless: an e-mail address, then a 6-digit code. No password to invent,
 * forget or reset — which is the single biggest drop-off for older users.
 *
 * Google sits behind a flag until the provider is configured in Supabase: a
 * button that fails is worse than no button.
 */
const GOOGLE_ENABLED = false

export function LoginForm() {
  const router = useRouter()
  const params = useSearchParams()
  const next = params.get('next') ?? '/discover'

  const [step, setStep] = useState<'email' | 'code'>('email')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function requestCode() {
    setError(null)
    startTransition(async () => {
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { shouldCreateUser: true },
      })
      if (error) setError(error.message)
      else setStep('code')
    })
  }

  function verifyCode() {
    setError(null)
    startTransition(async () => {
      const supabase = createClient()
      const { error } = await supabase.auth.verifyOtp({ email, token: code, type: 'email' })
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
              onChange={(event) => setEmail(event.target.value.trim())}
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
              6-stelliger Code
            </label>
            <input
              id="code"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              required
              value={code}
              onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
              className="rounded-input border-2 border-control bg-raised px-4 py-4 text-center font-serif text-[32px] font-bold tracking-[0.3em] focus:border-brand focus:outline-none"
            />
          </div>

          <p className="flex items-start gap-3 rounded-card border border-line bg-tag p-4 text-[17px] leading-relaxed">
            <span aria-hidden="true" className="mt-1.5 h-3.5 w-3.5 flex-none rounded-full bg-brand" />
            Schauen Sie in Ihr E-Mail-Postfach. Keine E-Mail da? Sehen Sie auch im Ordner „Spam“ nach.
          </p>

          {error && <ErrorNote>{error}</ErrorNote>}

          <button
            type="submit"
            disabled={pending || code.length < 6}
            className="press min-h-[62px] rounded-button bg-brand text-[20px] font-bold text-surface disabled:opacity-60"
          >
            {pending ? 'Wird geprüft …' : 'Weiter'}
          </button>

          <button
            type="button"
            onClick={() => {
              setStep('email')
              setCode('')
              setError(null)
            }}
            className="press min-h-[52px] text-[17px] font-bold text-muted underline"
          >
            Andere E-Mail-Adresse verwenden
          </button>
        </form>
      )}

      <p className="mt-auto flex items-center gap-3 text-[17px] leading-relaxed">
        <span aria-hidden="true" className="h-[26px] w-[26px] flex-none rounded-full bg-accent" />
        <span>
          Probleme? Rufen Sie uns an: <strong className="whitespace-nowrap">[IHRE SERVICENUMMER]</strong>
        </span>
      </p>
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
