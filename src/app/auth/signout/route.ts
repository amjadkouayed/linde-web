import { NextResponse, type NextRequest } from 'next/server'

import { createClient } from '@/lib/supabase/server'

/**
 * Sign-out as a plain form POST to a fixed URL rather than a Server Action.
 *
 * A Server Action is addressed by an id that changes with every deployment, so
 * a tab left open across a deploy sends an id the new server does not know and
 * "Abmelden" silently does nothing. A route has the same address in every
 * build, and works without JavaScript too.
 *
 * On a shared or borrowed device, no working sign-out means the next person is
 * signed in as you.
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  await supabase.auth.signOut()
  // 303: follow with a GET, not a repeated POST to "/".
  return NextResponse.redirect(new URL('/', request.url), 303)
}
