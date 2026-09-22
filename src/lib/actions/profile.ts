'use server'

import { refresh } from 'next/cache'
import { redirect } from 'next/navigation'

import { createClient } from '@/lib/supabase/server'

/**
 * Server Actions are directly reachable POST endpoints. proxy.ts does not
 * protect them — a matcher change can silently drop coverage — so every action
 * here re-reads the session itself, and RLS is the backstop underneath.
 */

export type ActionResult = { error: string | null }

const ROLES = ['student', 'senior'] as const

function parseInterests(raw: FormDataEntryValue | null): string[] {
  return String(raw ?? '')
    .split(',')
    .map((interest) => interest.trim())
    .filter(Boolean)
    .slice(0, 20)
}

export async function completeOnboarding(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const role = String(formData.get('role') ?? '')
  if (!ROLES.includes(role as (typeof ROLES)[number])) {
    return { error: 'Bitte wähle aus, ob du Studierende:r oder Senior:in bist.' }
  }

  const fullName = String(formData.get('full_name') ?? '').trim()
  if (!fullName) {
    return { error: 'Bitte gib deinen Namen an.' }
  }

  // profiles.id IS the auth user id, so the row can only ever be the caller's.
  const { error } = await supabase.from('profiles').insert({
    id: user.id,
    role: role as (typeof ROLES)[number],
    full_name: fullName,
    bio: String(formData.get('bio') ?? '').trim() || null,
    interests: parseInterests(formData.get('interests')),
    study_field: role === 'student'
      ? String(formData.get('study_field') ?? '').trim() || null
      : null,
  })

  if (error) return { error: error.message }

  refresh()
  redirect('/discover')
}

/** "Meine Karte" — availability, description, and whether it is discoverable. */
export async function updateMyCard(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { error } = await supabase
    .from('profiles')
    .update({
      full_name: String(formData.get('full_name') ?? '').trim(),
      bio: String(formData.get('bio') ?? '').trim() || null,
      interests: parseInterests(formData.get('interests')),
      availability: String(formData.get('availability') ?? '').trim() || null,
      card_description: String(formData.get('card_description') ?? '').trim() || null,
      is_published: formData.get('is_published') === 'on',
    })
    .eq('id', user.id)

  if (error) return { error: error.message }

  // getCurrentProfile caches in the browser, so refresh the router to pick the
  // edit up immediately rather than waiting out its 30s stale window.
  refresh()
  return { error: null }
}
