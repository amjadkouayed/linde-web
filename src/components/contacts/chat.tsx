'use client'

import { useEffect, useRef, useState, useTransition } from 'react'

import { markConversationRead, sendMessage } from '@/lib/actions/connections'
import { createClient } from '@/lib/supabase/client'
import type { Message } from '@/lib/data/connections'

/**
 * The thread plus its composer. Messages arrive over Realtime rather than by
 * polling, and sending goes through the server action so the insert is checked
 * by RLS like everything else.
 */
export function Chat({
  connectionId,
  myProfileId,
  initialMessages,
}: {
  connectionId: string
  myProfileId: string
  initialMessages: Message[]
}) {
  const [messages, setMessages] = useState(initialMessages)
  const [body, setBody] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' })
  }, [messages.length])

  // Opening the conversation is what marks it read.
  useEffect(() => {
    void markConversationRead(connectionId)
  }, [connectionId])

  useEffect(() => {
    const supabase = createClient()

    // Without this the channel stops delivering an hour in, when the access
    // token rotates — the socket keeps its original token otherwise and the
    // failure is silent.
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      supabase.realtime.setAuth(session?.access_token)
    })

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
            current.some((m) => m.id === incoming.id) ? current : [...current, incoming],
          )
          if (incoming.sender_id !== myProfileId) void markConversationRead(connectionId)
        },
      )
      .subscribe()

    return () => {
      sub.subscription.unsubscribe()
      void supabase.removeChannel(channel)
    }
  }, [connectionId, myProfileId])

  function submit() {
    const text = body.trim()
    if (!text) return
    setError(null)
    startTransition(async () => {
      const result = await sendMessage(connectionId, text)
      if (result.error) setError(result.error)
      else setBody('')
    })
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3" role="log" aria-live="polite">
        {messages.length === 0 && (
          <p className="rounded-card border border-line bg-raised p-6 text-[18px] leading-relaxed">
            Noch keine Nachrichten. Schreiben Sie die erste.
          </p>
        )}

        {messages.map((m) => {
          const mine = m.sender_id === myProfileId
          return (
            <div key={m.id} className={mine ? 'flex justify-end' : 'flex justify-start'}>
              <p
                className={`max-w-[80%] text-pretty rounded-card px-4 py-3 text-[18px] leading-relaxed ${
                  mine ? 'bg-brand text-surface' : 'border border-line bg-raised text-ink'
                }`}
              >
                {m.body}
              </p>
            </div>
          )
        })}
        <div ref={endRef} />
      </div>

      {error && (
        <p role="alert" className="rounded-input border border-control bg-tag p-3 text-[17px] font-bold">
          {error}
        </p>
      )}

      <form
        className="flex flex-col gap-3"
        onSubmit={(event) => {
          event.preventDefault()
          submit()
        }}
      >
        <label htmlFor="body" className="sr-only">
          Ihre Nachricht
        </label>
        <textarea
          id="body"
          rows={3}
          maxLength={2000}
          value={body}
          onChange={(event) => setBody(event.target.value)}
          placeholder="Nachricht schreiben …"
          className="resize-none rounded-input border-2 border-control bg-raised px-4 py-3.5 text-[18px] leading-relaxed focus:border-brand focus:outline-none"
        />
        <button
          type="submit"
          disabled={pending || !body.trim()}
          className="press min-h-[58px] rounded-button bg-brand text-[19px] font-bold text-surface disabled:opacity-60"
        >
          {pending ? 'Wird gesendet …' : 'Senden'}
        </button>
      </form>
    </div>
  )
}
