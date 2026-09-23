import { OnboardingForm } from '@/components/onboarding/onboarding-form'
import { LindeMark } from '@/components/site-nav'

/**
 * No navigation on this screen on purpose: until there is a profile there is
 * nowhere to navigate to, and a half-finished sign-up is the worst place to
 * offer an exit. The proxy already guarantees a signed-in user here.
 */
export default function OnboardingPage() {
  return (
    <main className="mx-auto flex w-full max-w-[560px] flex-grow flex-col gap-8 px-6 py-10">
      <div className="flex items-center gap-3">
        <LindeMark size={40} />
        <span className="font-serif text-[26px] font-bold">Linde</span>
      </div>

      <OnboardingForm />
    </main>
  )
}
