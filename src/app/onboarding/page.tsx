import { Suspense } from 'react'

import { RedirectIfOnboarded } from '@/components/auth-redirect'
import { OnboardingForm } from '@/components/onboarding/onboarding-form'
import { LindeMark } from '@/components/linde-mark'
import { signOut } from '@/lib/actions/profile'

/**
 * No navigation on this screen on purpose: until there is a profile there is
 * nowhere to navigate to, and a half-finished sign-up is the worst place to
 * offer an exit. The proxy already guarantees a signed-in user here.
 *
 * The one way out is quiet and last: someone who typed the wrong address would
 * otherwise be stuck here with no way to sign out.
 */
export default function OnboardingPage() {
  return (
    <main className="mx-auto flex w-full max-w-[560px] flex-grow flex-col gap-8 px-6 py-10">
      <div className="flex items-center gap-3">
        <LindeMark size={40} />
        <span className="font-serif text-[26px] font-bold">Linde</span>
      </div>

      <Suspense fallback={null}>
        <RedirectIfOnboarded />
      </Suspense>

      <OnboardingForm />

      <form action={signOut} className="self-center">
        <button type="submit" className="press min-h-[48px] text-[17px] font-bold text-muted underline">
          Falsche E-Mail-Adresse? Abmelden
        </button>
      </form>
    </main>
  )
}
