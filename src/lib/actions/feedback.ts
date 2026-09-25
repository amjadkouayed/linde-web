'use server'

import { createClient } from '@/lib/supabase/server'

import type { ActionResult } from './profile'

// Mirrors the CHECK constraints on public.feedback, so a too-long message is a
// sentence the person can act on rather than a database error.
const MAX_NAME_LENGTH = 120
const MAX_EMAIL_LENGTH = 254
const MAX_MESSAGE_LENGTH = 2000

/**
 * The only write in the app that does not need a session: the landing page is
 * public, and the people whose opinion is most worth having are the ones who
 * did not sign up.
 *
 * ponytail: no rate limit. The table is insert-only with length caps, so the
 * worst case is junk rows someone deletes in the dashboard. If that ever
 * happens, a unique index on (email, created_at::date) is the next step.
 */
export async function submitFeedback(formData: FormData): Promise<ActionResult> {
  const name = String(formData.get('name') ?? '').trim()
  const email = String(formData.get('email') ?? '').trim().toLowerCase()
  const message = String(formData.get('message') ?? '').trim()

  if (!name) return { error: 'Bitte geben Sie Ihren Namen an.' }
  if (name.length > MAX_NAME_LENGTH) {
    return { error: `Der Name darf höchstens ${MAX_NAME_LENGTH} Zeichen lang sein.` }
  }
  if (email.length > MAX_EMAIL_LENGTH || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: 'Bitte geben Sie eine gültige E-Mail-Adresse ein, zum Beispiel test@example.com.' }
  }
  if (!message) return { error: 'Bitte schreiben Sie uns ein paar Worte.' }
  if (message.length > MAX_MESSAGE_LENGTH) {
    return { error: `Ihr Text darf höchstens ${MAX_MESSAGE_LENGTH} Zeichen lang sein.` }
  }

  const supabase = await createClient()
  const { error } = await supabase.from('feedback').insert({ name, email, message })

  if (error) {
    return { error: 'Ihr Feedback konnte nicht gespeichert werden. Bitte versuchen Sie es noch einmal.' }
  }

  return { error: null }
}
