import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'

import { Avatar } from '@/components/avatar'
import { Conversation } from '@/components/contacts/conversation'
import { SiteNav } from '@/components/site-nav'
import { getConnections, getMessages } from '@/lib/data/connections'
import { requireProfile } from '@/lib/data/profiles'

type Params = Promise<{ id: string }>

export default function ConversationPage({ params }: { params: Params }) {
  return (
    <>
      <SiteNav active="contacts" />

      <main className="mx-auto flex w-full max-w-[760px] flex-grow flex-col px-6 py-6">
        <Suspense
          fallback={
            <div aria-hidden="true" className="h-[520px] rounded-card border border-line bg-raised" />
          }
        >
          <Thread params={params} />
        </Suspense>
      </main>
    </>
  )
}

async function Thread({ params }: { params: Params }) {
  const { id } = await params
  const profile = await requireProfile()

  // The overview is already scoped to the caller's own connections, so a row
  // that is not in it is not theirs to read.
  const connection = (await getConnections()).find((entry) => entry.connection_id === id)
  if (!connection || connection.status !== 'accepted') notFound()

  const messages = await getMessages(id)

  return (
    <>
      <header className="mb-4 flex items-center gap-3.5 border-b border-line pb-4">
        <Link
          href="/kontakte"
          className="press flex min-h-[48px] items-center gap-1.5 rounded-full border-[1.5px] border-line bg-tag px-4 text-[16px] font-bold text-ink no-underline"
        >
          <span aria-hidden="true" className="text-[22px] leading-none">
            ‹
          </span>
          Kontakte
        </Link>
        <Avatar name={connection.other_name} size={48} />
        <h1 className="font-serif text-[24px] font-bold">{connection.other_name}</h1>
      </header>

      <Conversation connectionId={id} myProfileId={profile.id} initialMessages={messages} />
    </>
  )
}
