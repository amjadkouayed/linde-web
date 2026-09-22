import 'server-only'

import { createClient } from '@/lib/supabase/server'

export type ConnectionOverview = {
  connection_id: string
  status: 'pending' | 'accepted' | 'declined'
  created_at: string
  i_am_requester: boolean
  other_profile_id: string
  other_full_name: string
  other_role: 'student' | 'senior'
  other_bio: string | null
  other_interests: string[]
  other_study_field: string | null
  other_avatar_path: string | null
  other_availability: string | null
  other_card_description: string | null
  last_message_body: string | null
  last_message_at: string | null
  last_message_sender_id: string | null
  unread_count: number
}

export type Message = {
  id: string
  connection_id: string
  sender_profile_id: string
  body: string
  created_at: string
}

/**
 * Everything the connections screen needs, in one round trip: the other
 * person's card, the last message, and an unread count per conversation.
 *
 * Fetching connections and then looping for profiles, last messages and counts
 * would be four queries per row. The connection_overview view does it with
 * LATERALs instead — see supabase/migrations/0002_views.sql.
 */
export async function getConnections(): Promise<ConnectionOverview[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('connection_overview')
    .select('*')
    .order('last_message_at', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })

  if (error) throw error
  return data ?? []
}

/** Total unread across all conversations — the nav badge. */
export async function getUnreadTotal(): Promise<number> {
  const connections = await getConnections()
  return connections.reduce((total, c) => total + c.unread_count, 0)
}

export async function getMessages(connectionId: string, limit = 50): Promise<Message[]> {
  const supabase = await createClient()

  // RLS (app.can_read_messages) returns nothing unless the caller is a
  // participant of an accepted connection, so an unknown id simply yields [].
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('connection_id', connectionId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw error
  return (data ?? []).reverse()
}
