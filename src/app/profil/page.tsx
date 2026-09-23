import Link from 'next/link'
import { Suspense } from 'react'

import { Avatar } from '@/components/avatar'
import { ProfileSettings } from '@/components/profile/profile-settings'
import { SiteNav } from '@/components/site-nav'
import { requireProfile } from '@/lib/data/profiles'

export const metadata = { title: 'Profil – Linde' }

const STATUS_LABEL: Record<string, string> = {
  rentner: 'Rentner',
  rentnerin: 'Rentnerin',
  berufstaetig: 'Noch berufstätig',
}

export default function ProfilPage() {
  return (
    <>
      <SiteNav active="profile" />

      <main className="mx-auto w-full max-w-[720px] flex-grow px-6 py-8">
        <div className="flex flex-col gap-7">
          <h1 className="font-serif text-[38px] font-bold">Ihr Profil</h1>

          <Suspense
            fallback={<div aria-hidden="true" className="h-[420px] rounded-card border border-line bg-raised" />}
          >
            <Content />
          </Suspense>
        </div>
      </main>
    </>
  )
}

async function Content() {
  const profile = await requireProfile()
  const age = profile.birth_year ? new Date().getFullYear() - profile.birth_year : null
  const detail =
    profile.role === 'student' ? profile.study_field : STATUS_LABEL[profile.status ?? '']

  return (
    <div className="flex flex-col gap-7">
      <section className="flex flex-col gap-4 rounded-card border border-line bg-raised p-5">
        <div className="flex items-center gap-4">
          <Avatar name={profile.name} size={80} />
          <div className="flex flex-col gap-1">
            <span className="font-serif text-[25px] font-semibold">{profile.name}</span>
            <span className="text-[17px] text-muted">
              {[
                profile.role === 'student' ? 'Studierende:r' : 'Senior:in',
                age ? `${age} Jahre` : null,
                detail,
              ]
                .filter(Boolean)
                .join(' · ')}
            </span>
          </div>
        </div>

        {profile.bio && <p className="text-pretty text-[18px] leading-relaxed">{profile.bio}</p>}

        {profile.interests.length > 0 && (
          <ul className="flex list-none flex-wrap gap-2 p-0">
            {profile.interests.map((interest) => (
              <li key={interest} className="rounded-full bg-tag px-3.5 py-1.5 text-[16px] font-bold">
                {interest}
              </li>
            ))}
          </ul>
        )}
      </section>

      <ProfileSettings postalCode={profile.postal_code} city={profile.city} />

      <nav className="flex flex-wrap gap-5 border-t border-line pt-6 text-[17px]">
        <Link href="/datenschutz" className="underline">
          Datenschutzerklärung
        </Link>
        <Link href="/nutzungsbedingungen" className="underline">
          Nutzungsbedingungen
        </Link>
        <Link href="/impressum" className="underline">
          Impressum
        </Link>
      </nav>
    </div>
  )
}
