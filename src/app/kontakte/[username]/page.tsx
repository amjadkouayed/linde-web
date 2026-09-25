import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'

import { Avatar } from '@/components/avatar'
import { Chat } from '@/components/contacts/chat'
import { getConnectionWith, getMessages } from '@/lib/data/connections'
import { requireProfile } from '@/lib/data/profiles'

type Params = Promise<{ username: string }>

export default function ChatPage({ params }: { params: Params }) {
  return (
    <Suspense
      fallback={<div aria-hidden="true" className="h-[520px] rounded-card border border-line bg-raised" />}
    >
      <Thread params={params} />
    </Suspense>
  )
}

async function Thread({ params }: { params: Params }) {
  const { username } = await params
  const profile = await requireProfile()

  // RLS decides this, not the UI: a connection you are not part of, or one that
  // has not been accepted, simply comes back empty.
  const connection = await getConnectionWith(username)
  if (!connection?.connection_id || connection.status !== 'accepted') notFound()

  const messages = await getMessages(connection.connection_id)

  return (
    <div className="flex flex-col gap-6">
      {/* A word, not a lone chevron: no icon-only controls anywhere in Linde. */}
      <Link
        href="/kontakte"
        className="press -my-2 flex min-h-[48px] items-center gap-1.5 self-start text-[18px] font-bold text-brand-pressed underline lg:hidden"
      >
        <span aria-hidden="true">‹</span> Alle Kontakte
      </Link>

      <div className="flex items-center gap-4">
        <Avatar name={connection.other_name} path={connection.other_avatar_path} size={56} />
        <div className="flex flex-col">
          <h1 className="font-serif text-[26px] font-bold">{connection.other_name}</h1>
          {connection.other_age !== null && (
            <span className="text-[17px] text-muted">{connection.other_age} Jahre</span>
          )}
        </div>
      </div>

      {/* Stays once the chat starts: it is how the conversation began. */}
      {connection.intro_message && (
        <div className="flex flex-col gap-1.5 rounded-card border border-line bg-tag p-4">
          <span className="text-[15px] font-bold text-muted">
            {connection.i_am_requester
              ? 'Ihre Anfrage'
              : `Anfrage von ${(connection.other_name ?? '').split(' ')[0]}`}
          </span>
          <p className="text-pretty text-[18px] leading-relaxed">{connection.intro_message}</p>
        </div>
      )}

      <Chat connectionId={connection.connection_id} myProfileId={profile.id} initialMessages={messages} />

      <p className="rounded-card border border-line bg-raised p-4 text-[16px] leading-relaxed text-muted">
        Termine vereinbaren Sie hier im Chat. Treffen Sie sich beim ersten Mal an einem
        öffentlichen Ort. Eine seriöse Anfrage fragt nie nach Geld oder Bankdaten.
      </p>
    </div>
  )
}
