import { Suspense } from 'react'

import { ProfileForm } from '@/components/profile/profile-form'
import { SiteNav } from '@/components/site-nav'
import { requireProfile } from '@/lib/data/profiles'

export default function ProfilePage() {
  return (
    <>
      <SiteNav active="profile" />

      <main className="mx-auto w-full max-w-[1080px] flex-grow px-6 py-8">
        <div className="flex flex-col gap-6">
          <h1 className="font-serif text-[38px] font-bold">Ihr Profil</h1>

          <Suspense
            fallback={
              <div aria-hidden="true" className="h-[420px] rounded-card border border-line bg-raised" />
            }
          >
            <Editor />
          </Suspense>
        </div>
      </main>
    </>
  )
}

async function Editor() {
  const profile = await requireProfile()
  return <ProfileForm profile={profile} />
}
