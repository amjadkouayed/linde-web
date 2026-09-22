'use server'

import { refresh } from 'next/cache'
import { redirect } from 'next/navigation'

import { createClient } from '@/lib/supabase/server'

import type { ActionResult } from './profile'

/**
 * Each of these re-reads the session rather than trusting the caller, and the
 * database refuses the rest: app.can_connect decides who may be asked,
 * app.connections_guard_update decides who may answer and which columns may
 * move, and app.can_post_message binds a message's sender to its thread.
 */

async function requireUserId(): Promise<string> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  return user.id
}

export async function sendConnectionRequest(addresseeProfileId: string): Promise<ActionResult> {
  const userId = await requireUserId()
  const supabase = await createClient()

  const { error } = await supabase.from('connections').insert({
    requester_profile_id: userId,
    addressee_profile_id: addresseeProfileId,
    status: 'pending',
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
  await requireUserId()
  const supabase = await createClient()

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
  await requireUserId()
  const supabase = await createClient()

  const { error } = await supabase.from('connections').delete().eq('id', connectionId)
  if (error) return { error: error.message }

  refresh()
  return { error: null }
}

export async function sendMessage(connectionId: string, body: string): Promise<ActionResult> {
  const userId = await requireUserId()
  const supabase = await createClient()

  const trimmed = body.trim()
  if (!trimmed) return { error: 'Die Nachricht ist leer.' }
  if (trimmed.length > 2000) return { error: 'Die Nachricht ist zu lang (max. 2000 Zeichen).' }

  const { error } = await supabase.from('messages').insert({
    connection_id: connectionId,
    sender_profile_id: userId,
    body: trimmed,
  })

  if (error) return { error: error.message }

  // Realtime delivers the message to the other side; refresh updates this one.
  refresh()
  return { error: null }
}

export async function markConversationRead(connectionId: string): Promise<ActionResult> {
  const userId = await requireUserId()
  const supabase = await createClient()

  // Which side am I on? The guard trigger rejects any attempt to mark the other
  // participant's side read, so this has to pick the right column.
  const { data: connection, error: readError } = await supabase
    .from('connections')
    .select('requester_profile_id')
    .eq('id', connectionId)
    .maybeSingle()

  if (readError) return { error: readError.message }
  if (!connection) return { error: 'Unterhaltung nicht gefunden.' }

  const column =
    connection.requester_profile_id === userId
      ? 'requester_last_read_at'
      : 'addressee_last_read_at'

  const { error } = await supabase
    .from('connections')
    .update({ [column]: new Date().toISOString() })
    .eq('id', connectionId)

  if (error) return { error: error.message }

  refresh()
  return { error: null }
}
