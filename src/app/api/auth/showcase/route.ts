import { createClient } from '@supabase/supabase-js'
import { NextResponse, type NextRequest } from 'next/server'

// Off unless someone deliberately turns it off: only the exact value "false"
// skips the code. A missing variable must never open this door.
const SKIP_EMAIL_OTP = process.env.SHOWCASE_REQUIRE_EMAIL_OTP === 'false'

function isValidEmail(value: string) {
  return value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

// Same rule as /auth/confirm: in-app paths only, and `/\evil.com` is `//evil.com`.
function safeNext(value: unknown) {
  return typeof value === 'string' && /^\/(?![/\\])/.test(value) ? value : '/discover'
}

/**
 * Showcase-only sign-in without the e-mail code.
 *
 * Skipping the code means whoever types an address becomes that person, so it
 * is only ever allowed for showcase accounts: ones marked
 * `app_metadata.showcase` — the demo profiles, and anyone who signs up through
 * this route. A real account, made with a code, still needs its code; this
 * route answers 404 and the form falls back to the normal flow. Without that
 * check, anyone could open anyone's chats by typing their address.
 *
 * The service-role key is used only here, on the server, to create the user
 * and mint a one-time link that /auth/confirm exchanges for a normal session.
 */
export async function POST(request: NextRequest) {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!SKIP_EMAIL_OTP || !serviceRoleKey) {
    return new NextResponse(null, { status: 404 })
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

  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  // Look first, before generating anything: a generated link counts as a sent
  // e-mail, so doing it for a real account would trip Supabase's one-code-a-
  // minute limit and the normal code the form falls back to would be refused.
  const existing = await findUser(email, serviceRoleKey)
  if (existing === 'error') {
    return NextResponse.json({ error: 'Die Anmeldung konnte nicht gestartet werden.' }, { status: 502 })
  }
  if (existing && existing.app_metadata?.showcase !== true) {
    return new NextResponse(null, { status: 404 })
  }
  if (!existing) {
    const { error } = await admin.auth.admin.createUser({
      email,
      email_confirm: true,
      app_metadata: { showcase: true },
    })
    if (error) {
      return NextResponse.json({ error: 'Die Anmeldung konnte nicht gestartet werden.' }, { status: 502 })
    }
  }

  // generateLink sends nothing; /auth/confirm exchanges the hash for a session.
  const { data, error: linkError } = await admin.auth.admin.generateLink({ type: 'magiclink', email })
  if (linkError || !data.properties?.hashed_token) {
    return NextResponse.json({ error: 'Die Anmeldung konnte nicht gestartet werden.' }, { status: 502 })
  }

  const confirmUrl = new URL('/auth/confirm', request.url)
  confirmUrl.searchParams.set('token_hash', data.properties.hashed_token)
  confirmUrl.searchParams.set('type', 'magiclink')
  confirmUrl.searchParams.set('next', safeNext(body.next))

  return NextResponse.json({ redirectTo: confirmUrl.toString() })
}

type AuthUser = { email?: string; app_metadata?: { showcase?: boolean } }

/**
 * supabase-js has no lookup by e-mail; the admin endpoint's `filter` does a
 * substring search, so the exact match is picked out here.
 */
async function findUser(email: string, serviceRoleKey: string): Promise<AuthUser | null | 'error'> {
  const url = new URL('/auth/v1/admin/users', process.env.NEXT_PUBLIC_SUPABASE_URL)
  url.searchParams.set('filter', email)
  const response = await fetch(url, {
    headers: { apikey: serviceRoleKey, Authorization: `Bearer ${serviceRoleKey}` },
    cache: 'no-store',
  })
  if (!response.ok) return 'error'
  const { users } = (await response.json()) as { users?: AuthUser[] }
  return users?.find((user) => user.email?.toLowerCase() === email) ?? null
}
