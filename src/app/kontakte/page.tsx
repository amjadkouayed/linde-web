import Link from 'next/link'
import { Suspense } from 'react'

import { Avatar } from '@/components/avatar'
import { RequestCard } from '@/components/contacts/request-card'
import { SiteNav } from '@/components/site-nav'
import { getConnections, type ConnectionOverview } from '@/lib/data/connections'
import { requireProfile } from '@/lib/data/profiles'

export default function ContactsPage() {
  return (
    <>
      <SiteNav active="contacts" />

      <main className="mx-auto w-full max-w-[760px] flex-grow px-6 py-8">
        <div className="flex flex-col gap-7">
          <h1 className="font-serif text-[38px] font-bold">Kontakte</h1>

          <Suspense
            fallback={
              <div aria-hidden="true" className="h-[320px] rounded-card border border-line bg-raised" />
            }
          >
            <Contacts />
          </Suspense>
        </div>
      </main>
    </>
  )
}

async function Contacts() {
  await requireProfile()
  const connections = await getConnections()

  // Someone else asked and is waiting on me — the only rows that need a decision.
  const requests = connections.filter((c) => c.status === 'pending' && !c.i_am_requester)
  const chats = connections.filter((c) => c.status === 'accepted')
  const waiting = connections.filter((c) => c.status === 'pending' && c.i_am_requester)

  return (
    <div className="flex flex-col gap-8">
      {requests.length > 0 && (
        <section className="flex flex-col gap-3.5">
          <div className="flex items-center gap-3">
            <h2 className="text-[19px] font-bold">Neue Anfragen</h2>
            <span className="flex h-7 min-w-7 items-center justify-center rounded-full bg-accent px-2 text-[16px] font-bold text-ink">
              {requests.length}
            </span>
          </div>
          {requests.map((request) => (
            <RequestCard key={request.connection_id} request={request} />
          ))}
        </section>
      )}

      <section className="flex flex-col gap-3">
        <h2 className="text-[19px] font-bold">Ihre Gespräche</h2>

        {chats.length === 0 ? (
          <div className="flex flex-col items-start gap-4 rounded-card border border-line bg-raised p-7">
            <p className="text-[19px] leading-relaxed">
              Noch keine Gespräche. Wenn jemand Ihre Anfrage annimmt, finden Sie das Gespräch hier.
            </p>
            <Link
              href="/discover"
              className="press flex min-h-[56px] items-center rounded-button bg-brand px-6 text-[19px] font-bold text-surface no-underline"
            >
              Menschen entdecken
            </Link>
          </div>
        ) : (
          chats.map((chat) => <ChatRow key={chat.connection_id} chat={chat} />)
        )}
      </section>

      {waiting.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-[19px] font-bold">Von Ihnen gesendet</h2>
          {waiting.map((chat) => (
            <div
              key={chat.connection_id}
              className="flex items-center gap-4 rounded-card border border-line bg-raised px-5 py-4"
            >
              <Avatar name={chat.other_name} size={48} />
              <div className="flex flex-col">
                <span className="font-serif text-[19px] font-semibold">{chat.other_name}</span>
                <span className="text-[16px] text-muted">Wartet auf Antwort</span>
              </div>
            </div>
          ))}
        </section>
      )}
    </div>
  )
}

function ChatRow({ chat }: { chat: ConnectionOverview }) {
  const unread = chat.unread_count ?? 0

  return (
    <Link
      href={`/kontakte/${chat.connection_id}`}
      className="press flex min-h-[84px] items-center gap-4 rounded-card border border-line bg-raised px-5 py-3.5 text-ink no-underline hover:bg-white"
    >
      <Avatar name={chat.other_name} size={52} />

      <div className="flex min-w-0 flex-grow flex-col gap-1">
        <div className="flex items-baseline justify-between gap-3">
          <span className="font-serif text-[19px] font-semibold">{chat.other_name}</span>
          {chat.last_message_at && (
            <span className="whitespace-nowrap text-[15px] text-muted">
              {formatWhen(chat.last_message_at)}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between gap-3">
          <span
            className={`truncate text-[16px] ${unread > 0 ? 'font-bold' : ''}`}
          >
            {chat.last_message_body ?? 'Noch keine Nachricht — schreiben Sie die erste.'}
          </span>
          {unread > 0 && (
            <span
              aria-label={`${unread} ${unread === 1 ? 'ungelesene Nachricht' : 'ungelesene Nachrichten'}`}
              className="flex h-7 min-w-7 items-center justify-center rounded-full bg-brand px-2 text-[15px] font-bold text-surface"
            >
              {unread}
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}

/** Today shows a clock, this week a weekday, older a date. */
function formatWhen(iso: string): string {
  const date = new Date(iso)
  const now = new Date()
  const sameDay = date.toDateString() === now.toDateString()
  if (sameDay) {
    return date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
  }
  const days = (now.getTime() - date.getTime()) / 86_400_000
  if (days < 7) return date.toLocaleDateString('de-DE', { weekday: 'long' })
  return date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })
}
