import Link from 'next/link'

import { Avatar } from '@/components/avatar'
import { ContactLink } from '@/components/contacts/contact-link'
import { RequestActions, WithdrawAction } from '@/components/contacts/request-actions'
import { getConnections, type ConnectionOverview } from '@/lib/data/connections'
import { requireProfile } from '@/lib/data/profiles'

/**
 * Requests on top, conversations below, sent requests last — the handoff's one
 * screen. Lives in the Kontakte layout so it stays in place on desktop while
 * the conversation on the right changes.
 */
export async function ContactList() {
  await requireProfile()

  // One query for the whole screen — connection_overview already carries the
  // other person, the last message and the unread count.
  const connections = await getConnections()

  const incoming = connections.filter((c) => c.status === 'pending' && !c.i_am_requester)
  const outgoing = connections.filter((c) => c.status === 'pending' && c.i_am_requester)
  const accepted = connections.filter((c) => c.status === 'accepted')

  return (
    <div className="flex flex-col gap-10">
      {incoming.length > 0 && (
        <section className="flex flex-col gap-4">
          <SectionHeading count={incoming.length}>Anfragen</SectionHeading>
          {incoming.map((c) => (
            <article key={c.connection_id} className="flex flex-col gap-4 rounded-card border border-line bg-raised p-5">
              <Person c={c} />
              {c.intro_message && (
                <p className="text-pretty rounded-input bg-tag p-4 text-[18px] leading-relaxed">
                  {c.intro_message}
                </p>
              )}
              <RequestActions connectionId={c.connection_id!} />
            </article>
          ))}
        </section>
      )}

      {accepted.length > 0 && (
        <section className="flex flex-col gap-4">
          <SectionHeading>Meine Kontakte</SectionHeading>
          {accepted.map((c) => (
            <ContactLink key={c.connection_id} href={`/kontakte/${c.connection_id}`}>
              <Avatar name={c.other_name} path={c.other_avatar_path} size={64} />
              <div className="flex min-w-0 flex-grow flex-col gap-1">
                <span className="font-serif text-[21px] font-semibold">{c.other_name}</span>
                {c.last_message_body ? (
                  <span className="truncate text-[17px] text-muted">{c.last_message_body}</span>
                ) : (
                  <span className="text-[17px] text-muted">Schreiben Sie die erste Nachricht.</span>
                )}
              </div>
              {(c.unread_count ?? 0) > 0 && (
                <span
                  aria-label={`${c.unread_count} ungelesene Nachrichten`}
                  className="flex h-9 min-w-9 flex-none items-center justify-center rounded-full bg-brand px-2 text-[17px] font-bold text-surface"
                >
                  {c.unread_count}
                </span>
              )}
            </ContactLink>
          ))}
        </section>
      )}

      {outgoing.length > 0 && (
        <section className="flex flex-col gap-4">
          <SectionHeading>Gesendete Anfragen</SectionHeading>
          {outgoing.map((c) => (
            <article key={c.connection_id} className="flex flex-col gap-4 rounded-card border border-line bg-raised p-5">
              <Person c={c} />
              <p className="text-[17px] text-muted">
                Noch keine Antwort. Sobald {firstName(c.other_name)} annimmt, können Sie schreiben.
              </p>
              <WithdrawAction connectionId={c.connection_id!} />
            </article>
          ))}
        </section>
      )}

      {connections.length === 0 && (
        <p className="rounded-card border border-line bg-raised p-8 text-[19px] leading-relaxed">
          Noch keine Kontakte. Unter <Link href="/discover" className="underline">Entdecken</Link>{' '}
          finden Sie Menschen in Ihrer Nähe.
        </p>
      )}
    </div>
  )
}

function firstName(name: string | null) {
  return (name ?? '').split(' ')[0] || 'die Person'
}

function Person({ c }: { c: ConnectionOverview }) {
  return (
    <div className="flex items-center gap-4">
      <Avatar name={c.other_name} path={c.other_avatar_path} size={64} />
      <div className="flex flex-col gap-0.5">
        <span className="font-serif text-[21px] font-semibold">{c.other_name}</span>
        {c.other_age !== null && <span className="text-[17px] text-muted">{c.other_age} Jahre</span>}
      </div>
    </div>
  )
}

function SectionHeading({ children, count }: { children: React.ReactNode; count?: number }) {
  return (
    <h2 className="flex items-center gap-3 text-[17px] font-bold uppercase tracking-wide text-muted">
      {children}
      {count !== undefined && (
        <span className="flex h-7 min-w-7 items-center justify-center rounded-full bg-brand px-2 text-[16px] text-surface">
          {count}
        </span>
      )}
    </h2>
  )
}

export function ContactListSkeleton() {
  return (
    <div className="flex flex-col gap-4" aria-hidden="true">
      <div className="h-[26px] w-[180px] rounded-full bg-tag" />
      <div className="h-[150px] rounded-card border border-line bg-raised" />
      <div className="h-[104px] rounded-card border border-line bg-raised" />
    </div>
  )
}
