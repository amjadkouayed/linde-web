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

  const name = String(formData.get('name') ?? '').trim()
  if (!name) {
    return { error: 'Bitte gib deinen Namen an.' }
  }

  // profiles.id IS the auth user id, so the row can only ever be the caller's.
  const { error } = await supabase.from('profiles').insert({
    id: user.id,
    role: role as (typeof ROLES)[number],
    name,
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

/**
 * "Meine Karte" — the offer. One per person (unique on user_id), so this
 * upserts rather than branching on whether one already exists.
 *
 * postal_code is validated here and again by a CHECK in the database. It is
 * also the only location we store: lat/lng are a postal-code centroid, never
 * an address, so a radius filter cannot be used to locate anyone's home.
 */
export async function updateMyCard(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const postalCode = String(formData.get('postal_code') ?? '').trim()
  if (!/^\d{5}$/.test(postalCode)) {
    return { error: 'Bitte gib eine gültige fünfstellige Postleitzahl an.' }
  }

  const availability = String(formData.get('availability') ?? '').trim()
  const description = String(formData.get('description') ?? '').trim()
  const city = String(formData.get('city') ?? '').trim()
  if (!availability || !description || !city) {
    return { error: 'Verfügbarkeit, Beschreibung und Ort dürfen nicht leer sein.' }
  }

  const { error } = await supabase.from('offers').upsert(
    {
      user_id: user.id,
      availability,
      description,
      postal_code: postalCode,
      city,
      is_published: formData.get('is_published') === 'on',
    },
    { onConflict: 'user_id' },
  )

  if (error) return { error: error.message }

  // getCurrentProfile caches in the browser, so refresh the router to pick the
  // edit up immediately rather than waiting out its 30s stale window.
  refresh()
  return { error: null }
}
