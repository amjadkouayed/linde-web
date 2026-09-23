'use client'

import { useEffect, useRef, useState, useTransition } from 'react'

import { markConversationRead, sendMessage } from '@/lib/actions/connections'
import type { Message } from '@/lib/data/connections'
import { createClient } from '@/lib/supabase/client'

/**
 * Realtime, with the two things that break it if forgotten:
 *
 * 1. `setAuth()` on every token refresh, or the channel goes quiet after an
 *    hour and nobody can tell why (README, "Realtime chat").
 * 2. RLS is enforced per subscriber, so a broad filter is safe — but we filter
 *    by connection_id anyway to avoid waking every open tab.
 */
export function Conversation({
  connectionId,
  myProfileId,
  initialMessages,
}: {
  connectionId: string
  myProfileId: string
  initialMessages: Message[]
}) {
  const [messages, setMessages] = useState(initialMessages)
  const [draft, setDraft] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel(`messages:${connectionId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `connection_id=eq.${connectionId}`,
        },
        (payload) => {
          const incoming = payload.new as Message
          setMessages((current) =>
            current.some((message) => message.id === incoming.id)
              ? current
              : [...current, incoming],
          )
        },
      )
      .subscribe()

    const { data: auth } = supabase.auth.onAuthStateChange((_event, session) => {
      supabase.realtime.setAuth(session?.access_token)
    })

    return () => {
      auth.subscription.unsubscribe()
      supabase.removeChannel(channel)
    }
  }, [connectionId])

  // Anything unread is read the moment the screen is open.
  useEffect(() => {
    void markConversationRead(connectionId)
  }, [connectionId, messages.length])

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages.length])

  function send() {
    const body = draft.trim()
    if (!body) return
    setError(null)
    startTransition(async () => {
      const result = await sendMessage(connectionId, body)
      if (result.error) setError(result.error)
      else setDraft('')
    })
  }

  return (
    <div className="flex min-h-0 flex-grow flex-col">
      <div
        role="log"
        aria-label="Nachrichten"
        className="flex min-h-0 flex-grow flex-col gap-3 overflow-y-auto rounded-card border border-line bg-surface p-5"
      >
        <p className="mb-2 flex items-start gap-3 rounded-card border border-line bg-tag p-4 text-[17px] leading-relaxed">
          <span aria-hidden="true" className="mt-1.5 h-3 w-3 flex-none rounded-full bg-accent" />
          Machen Sie hier Zeit und Ort aus. Beim ersten Treffen am besten an einem öffentlichen Ort,
          zum Beispiel in einem Café.
        </p>

        {messages.map((message) => {
          const mine = message.sender_id === myProfileId
          return (
            <div
              key={message.id}
              className={`flex max-w-[75%] flex-col gap-1 ${mine ? 'items-end self-end' : 'items-start self-start'}`}
            >
              <p
                className={`text-pretty px-4 py-3 text-[18px] leading-relaxed ${
                  mine
                    ? 'rounded-[18px_18px_6px_18px] bg-brand text-surface'
                    : 'rounded-[18px_18px_18px_6px] border border-line bg-raised'
                }`}
              >
                {message.body}
              </p>
              <span className="text-[15px] text-muted">
                {new Date(message.created_at).toLocaleTimeString('de-DE', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
          )
        })}
        <div ref={endRef} />
      </div>

      {error && (
        <p role="alert" className="mt-3 rounded-input border border-control bg-tag p-3 text-[16px] font-bold">
          {error}
        </p>
      )}

      <form
        className="mt-4 flex items-end gap-3"
        onSubmit={(event) => {
          event.preventDefault()
          send()
        }}
      >
        <label htmlFor="draft" className="sr-only">
          Nachricht schreiben
        </label>
        <textarea
          id="draft"
          rows={2}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Nachricht schreiben …"
          className="min-w-0 flex-grow resize-none rounded-button border-2 border-control bg-raised px-4 py-3 text-[18px] leading-snug focus:border-brand focus:outline-none"
        />
        <button
          type="submit"
          disabled={pending || !draft.trim()}
          className="press min-h-[58px] rounded-button bg-brand px-7 text-[18px] font-bold text-surface disabled:opacity-60"
        >
          Senden
        </button>
      </form>
    </div>
  )
}
