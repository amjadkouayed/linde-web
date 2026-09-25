import { createClient } from '@supabase/supabase-js'
import { NextResponse, type NextRequest } from 'next/server'

const REQUIRE_EMAIL_OTP = process.env.SHOWCASE_REQUIRE_EMAIL_OTP === 'true'

function isValidEmail(value: string) {
  return value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

function safeNext(value: string | null) {
  return value && value.startsWith('/') && !value.startsWith('//') ? value : '/discover'
}

/**
 * Showcase-only passwordless sign-in.
 *
 * This endpoint is deliberately enabled by default. It uses the service-role
 * key only on the server to create/confirm a user and mint a one-time link;
 * the browser still receives the normal Supabase session through /auth/confirm.
 */
export async function POST(request: NextRequest) {
  if (REQUIRE_EMAIL_OTP) {
    return new NextResponse(null, { status: 404 })
  }

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceRoleKey) {
    return NextResponse.json({ error: 'Showcase-Anmeldung ist nicht konfiguriert.' }, { status: 503 })
  }

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

  const next = safeNext(typeof body.next === 'string' ? body.next : null)
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceRoleKey,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )

  const { error: createError } = await supabase.auth.admin.createUser({
    email,
    email_confirm: true,
  })

  if (createError && !/already registered|already exists/i.test(createError.message)) {
    return NextResponse.json({ error: 'Die Anmeldung konnte nicht gestartet werden.' }, { status: 502 })
  }

  const { data, error: linkError } = await supabase.auth.admin.generateLink({
    type: 'magiclink',
    email,
  })

  if (linkError || !data.properties?.hashed_token) {
    return NextResponse.json({ error: 'Die Anmeldung konnte nicht gestartet werden.' }, { status: 502 })
  }

  const confirmUrl = new URL('/auth/confirm', request.url)
  confirmUrl.searchParams.set('token_hash', data.properties.hashed_token)
  confirmUrl.searchParams.set('type', 'magiclink')
  confirmUrl.searchParams.set('next', next)

  return NextResponse.json({ redirectTo: confirmUrl.toString() })
}
