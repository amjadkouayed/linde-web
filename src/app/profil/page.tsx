import { Suspense } from 'react'

import { Avatar } from '@/components/avatar'
import { ProfileSettings } from '@/components/profile/profile-settings'
import { SiteNav } from '@/components/site-nav'
import { requireProfile } from '@/lib/data/profiles'
import { personLine } from '@/lib/labels'

export const metadata = { title: 'Profil – Linde' }


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
  const age = new Date().getFullYear() - profile.birth_year

  return (
    <div className="flex flex-col gap-7">
      <section className="flex flex-col gap-4 rounded-card border border-line bg-raised p-5">
        <div className="flex items-center gap-4">
          <Avatar name={profile.name} path={profile.avatar_path} size={80} />
          <div className="flex flex-col gap-1">
            <span className="font-serif text-[25px] font-semibold">{profile.name}</span>
            <span className="text-[17px] text-muted">
              {personLine({ age, role: profile.role, studyField: profile.study_field, status: profile.status })}
            </span>
          </div>
        </div>
      </section>

      <ProfileSettings
        name={profile.name}
        role={profile.role}
        bio={profile.bio}
        interests={profile.interests}
        avatarPath={profile.avatar_path}
        postalCode={profile.postal_code}
        city={profile.city}
      />
    </div>
  )
}
