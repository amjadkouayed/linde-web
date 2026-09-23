import { redirect } from 'next/navigation'

import { getCurrentProfile } from '@/lib/data/profiles'
import { createClient } from '@/lib/supabase/server'

/*
 * Rendered inside a <Suspense> on otherwise static pages. They read the session,
 * so under Cache Components they cannot sit at the page's top level without
 * making the whole page wait; behind a boundary the static shell still ships
 * instantly and the redirect streams in when it applies.
 */

/** The welcome page is for people who are not signed in yet. */
export async function RedirectIfSignedIn() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (user) redirect('/discover')
  return null
}

/**
 * Onboarding creates the profile, so running it twice would fail on the
 * primary key. Someone who already has a profile goes straight in instead.
 */
export async function RedirectIfOnboarded() {
  if (await getCurrentProfile()) redirect('/discover')
  return null
}
