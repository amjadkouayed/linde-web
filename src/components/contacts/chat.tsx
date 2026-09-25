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
  const logRef = useRef<HTMLDivElement>(null)

  // Scroll the thread, not the page: scrollIntoView would drag the whole
  // window down on every new message, list and all.
  useEffect(() => {
    const log = logRef.current
    if (log) log.scrollTop = log.scrollHeight
  }, [messages.length])

  // Opening the conversation is what marks it read.
  useEffect(() => {
    void markConversationRead(connectionId)
  }, [connectionId])

  // Server re-renders (after refresh(), or navigating back) bring a fresh
  // list; merge it in so anything Realtime missed still appears. Adjusted
  // during render rather than in an effect, which would render twice.
  const [seenInitial, setSeenInitial] = useState(initialMessages)
  if (initialMessages !== seenInitial) {
    setSeenInitial(initialMessages)
    setMessages((current) => mergeById(current, initialMessages))
  }

  useEffect(() => {
    const supabase = createClient()
    let channel: ReturnType<typeof supabase.channel> | null = null
    let cancelled = false

    // The token has to be on the socket BEFORE joining, or it joins as anon
    // and RLS (correctly) shows it no messages — the chat looks alive but never
    // updates. getSession() is awaited explicitly: it waits for the client to
    // finish loading the session from its cookie. A bare setAuth() does not
    // reliably wait for that, so it raced — live chat worked on some loads and
    // silently failed on others.
    void (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (cancelled) return
      await supabase.realtime.setAuth(session?.access_token ?? null)
      if (cancelled) return
      channel = supabase
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
            setMessages((current) => mergeById(current, [incoming]))
            if (incoming.sender_id !== myProfileId) void markConversationRead(connectionId)
          },
        )
        .subscribe((status) => {
          // Close the subscribe gap. The page rendered its messages on the
          // server, then took a few seconds to hydrate and join; anything sent
          // in between was never delivered to this socket. Once listening,
          // fetch the recent thread once and merge — duplicates collapse by id.
          if (status !== 'SUBSCRIBED') return
          void supabase
            .from('messages')
            .select('*')
            .eq('connection_id', connectionId)
            .order('created_at', { ascending: false })
            .limit(50)
            .then(({ data }) => {
              if (data && !cancelled) setMessages((current) => mergeById(current, data))
            })
        })
    })()

    // And keep it current: the access token rotates hourly, and a socket left
    // on the old one stops delivering without any error.
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      void supabase.realtime.setAuth(session?.access_token ?? null)
    })

    return () => {
      cancelled = true
      sub.subscription.unsubscribe()
      if (channel) void supabase.removeChannel(channel)
    }
  }, [connectionId, myProfileId])

  function submit() {
    const text = body.trim()
    if (!text) return
    setError(null)
    startTransition(async () => {
      const result = await sendMessage(connectionId, text)
      if (result.error) return setError(result.error)
      setBody('')
      if (result.message) setMessages((current) => mergeById(current, [result.message!]))
    })
  }

  return (
    <div className="flex flex-col gap-5">
      <div
        ref={logRef}
        role="log"
        aria-live="polite"
        className="flex max-h-[55vh] flex-col gap-3 overflow-y-auto rounded-card border border-line bg-surface p-4"
      >
        {messages.length === 0 && (
          <p className="px-2 py-6 text-center text-[18px] leading-relaxed text-muted">
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

/** Union by id, oldest first — Realtime, the action and the server can all report the same message. */
function mergeById(current: Message[], incoming: Message[]): Message[] {
  const byId = new Map(current.map((m) => [m.id, m]))
  for (const m of incoming) byId.set(m.id, m)
  return [...byId.values()].sort((a, b) => a.created_at.localeCompare(b.created_at))
}
