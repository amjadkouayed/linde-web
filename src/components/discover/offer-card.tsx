import Link from 'next/link'

import { Avatar } from '@/components/avatar'
import type { NearbyCard } from '@/lib/data/profiles'
import { personLine } from '@/lib/labels'

/**
 * Never "0 km" — someone in the same postal code is not zero metres away, and
 * the figure would read as broken. Never an exact number either: the distance
 * is between two postal code centres, so "ca." is the honest prefix.
 */
function distanceLabel(km: number | null): string | null {
  if (km === null) return null
  return km < 1 ? 'ganz in der Nähe' : `ca. ${km} km`
}


/**
 * Card anatomy, from the design:
 * - name on its own line, place right-aligned with a gold dot;
 * - age is a CHIP among the facts, never next to the name;
 * - one outlined action, so three cards do not shout three primary buttons.
 */
export function OfferCard({ card }: { card: NearbyCard }) {
  const firstName = (card.name ?? '').split(' ')[0] || 'diese Person'
  const line = personLine({ age: card.age, role: card.role, studyField: card.study_field, status: card.status })
  const distance = distanceLabel(card.km)

  return (
    <article className="flex flex-col gap-3.5 rounded-card border border-line bg-raised p-5">
      <div className="flex items-start gap-4">
        <Avatar name={card.name} path={card.avatar_path} size={80} />

        <div className="flex min-w-0 flex-grow flex-col gap-1.5">
          <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
            <h2 className="font-serif text-2xl font-semibold">{card.name}</h2>
            {(distance ?? card.city) && (
              <span className="flex items-center gap-1.5 whitespace-nowrap text-[17px] font-bold text-muted">
                <span aria-hidden="true" className="h-2.5 w-2.5 rounded-full bg-accent" />
                {distance ?? card.city}
              </span>
            )}
          </div>

          {/* Handoff rule: age sits underneath the name, smaller and muted —
              never beside it. It shares the line with study field / status. */}
          {line && <span className="text-[16px] text-muted">{line}</span>}
        </div>
      </div>

      {/* Full width, not beside the photo: in that column a phone fits three words a line. */}
      {card.bio && <p className="text-pretty text-[18px] leading-relaxed">{card.bio}</p>}

      {card.description && (
        <p className="text-pretty text-[18px] leading-relaxed">{card.description}</p>
      )}

      <ul aria-label="Verfügbarkeit und Interessen" className="flex flex-wrap gap-2">
        {card.availability && <Fact>{card.availability}</Fact>}
        {(card.interests ?? []).map((interest) => (
          <li
            key={interest}
            className="rounded-full border border-line bg-tag px-3.5 py-1.5 text-[16px] font-bold"
          >
            {interest}
          </li>
        ))}
      </ul>

      <Link
        href={`/anfrage/${card.username}`}
        className="press mt-auto flex min-h-[54px] items-center justify-center rounded-button border-2 border-brand bg-raised text-[18px] font-bold text-brand-pressed no-underline"
      >
        Anfrage an {firstName}
      </Link>
    </article>
  )
}

/** A fact about the person, visually distinct from interests, which are choices. */
function Fact({ children }: { children: React.ReactNode }) {
  return (
    <li className="rounded-full border border-control bg-raised px-3.5 py-1.5 text-[16px] font-bold text-muted">
      {children}
    </li>
  )
}
