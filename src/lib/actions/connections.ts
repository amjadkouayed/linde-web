'use server'

import { refresh } from 'next/cache'
import { redirect } from 'next/navigation'

import { createClient } from '@/lib/supabase/server'

import type { Message } from '@/lib/data/connections'

import type { ActionResult } from './profile'

/**
 * Each of these re-reads the session rather than trusting the caller, and the
 * database refuses the rest: app.can_connect decides who may be asked,
 * app.connections_guard_update decides who may answer, and messages_insert
 * binds a message's sender to its thread.
 */

async function requireSession() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  return { supabase, userId: user.id }
}

/**
 * The greeting rides on the request itself rather than being a message: the
 * requests screen shows it before anything is accepted, and chat proper still
 * requires both sides to agree. It is immutable once sent.
 */
export async function sendConnectionRequest(
  recipientId: string,
  introMessage?: string,
): Promise<ActionResult> {
  const { supabase, userId } = await requireSession()

  const intro = introMessage?.trim()
  if (intro && intro.length > 500) {
    return { error: 'Die Nachricht ist zu lang (max. 500 Zeichen).' }
  }

  const { error } = await supabase.from('connections').insert({
    requester_id: userId,
    recipient_id: recipientId,
    status: 'pending',
    intro_message: intro || null,
  })

  if (error) {
    // The unique index on the profile pair is what makes a duplicate request
    // impossible in either direction.
    if (error.code === '23505') {
      return { error: 'Du hast dieser Person bereits eine Anfrage geschickt.' }
    }
    return { error: error.message }
  }

  refresh()
  return { error: null }
}

export async function answerConnectionRequest(
  connectionId: string,
  accept: boolean,
): Promise<ActionResult> {
  const { supabase } = await requireSession()

  const { error } = await supabase
    .from('connections')
    .update({ status: accept ? 'accepted' : 'declined' })
    .eq('id', connectionId)

  if (error) return { error: error.message }

  refresh()
  return { error: null }
}

/** Withdraw your own request, or clear one that was declined. */
export async function withdrawConnectionRequest(connectionId: string): Promise<ActionResult> {
  const { supabase } = await requireSession()

  const { error } = await supabase.from('connections').delete().eq('id', connectionId)
  if (error) return { error: error.message }

  refresh()
  return { error: null }
}

/**
 * Returns the stored message so the sender's screen shows it immediately.
 * Waiting for Realtime to echo your own message back is fragile — if the
 * socket is late or down, what you just wrote silently fails to appear.
 * Realtime is for the other person's messages.
 */
export async function sendMessage(
  connectionId: string,
  body: string,
): Promise<ActionResult & { message?: Message }> {
  const { supabase, userId } = await requireSession()

  const trimmed = body.trim()
  if (!trimmed) return { error: 'Die Nachricht ist leer.' }
  if (trimmed.length > 2000) return { error: 'Die Nachricht ist zu lang (max. 2000 Zeichen).' }

  const { data, error } = await supabase
    .from('messages')
    .insert({ connection_id: connectionId, sender_id: userId, body: trimmed })
    .select()
    .single()

  if (error) return { error: error.message }

  refresh()
  return { error: null, message: data }
}

/**
 * One UPDATE touching every unread message from the other person. The policy
 * refuses to touch your own messages, so no filter for that is needed here —
 * but keeping it makes the intent obvious and the statement cheaper.
 */
export async function markConversationRead(connectionId: string): Promise<ActionResult> {
  const { supabase, userId } = await requireSession()

  const { error } = await supabase
    .from('messages')
    .update({ read_at: new Date().toISOString() })
    .eq('connection_id', connectionId)
    .neq('sender_id', userId)
    .is('read_at', null)

  if (error) return { error: error.message }

  refresh()
  return { error: null }
}
