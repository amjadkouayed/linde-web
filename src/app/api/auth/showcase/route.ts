import { NextResponse, type NextRequest } from 'next/server'

import { createClient } from '@/lib/supabase/server'

function isValidEmail(value: string) {
  return value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

// Same rule as /auth/confirm: in-app paths only, and `/\evil.com` is `//evil.com`.
function safeNext(value: unknown) {
  return typeof value === 'string' && /^\/(?![/\\])/.test(value) ? value : '/discover'
}

/**
 * Showcase sign-in without the e-mail code.
 *
 * public.showcase_password (0014) decides everything: whether the showcase is
 * open, and whether this address is a showcase account. It returns a fresh
 * one-time password, and we sign in with it here on the server, so the session
 * cookie is set on this response and the password never reaches the browser.
 *
 * 404 means "not for this address right now" — the showcase is closed, or it
 * is a real account — and the login form falls back to the e-mail code.
 */
export async function POST(request: NextRequest) {
  let body: { email?: unknown; next?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Ungültige Anfrage.' }, { status: 400 })
  }

  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
  if (!isValidEmail(email)) {
    return NextResponse.json({ error: 'Bitte geben Sie eine gültige E-Mail-Adresse ein.' }, { status: 400 })
  }

  const supabase = await createClient()
  const { data: password, error } = await supabase.rpc('showcase_password', { p_email: email })
  if (error) {
    return NextResponse.json({ error: 'Die Anmeldung konnte nicht gestartet werden.' }, { status: 502 })
  }
  if (!password) {
    return new NextResponse(null, { status: 404 })
  }

  const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
  if (signInError) {
    return NextResponse.json({ error: 'Die Anmeldung konnte nicht gestartet werden.' }, { status: 502 })
  }

  return NextResponse.json({ redirectTo: safeNext(body.next) })
}
