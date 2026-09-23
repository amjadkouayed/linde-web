import { Suspense } from 'react'

import { LoginForm } from '@/components/auth/login-form'

/**
 * The form reads `?next=` to send people back where they were headed, which
 * makes it dynamic — so it sits behind Suspense and the rest prerenders.
 */
export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto flex w-full max-w-[520px] flex-grow flex-col gap-6 px-6 py-12">
          <div aria-hidden="true" className="h-[340px] rounded-card border border-line bg-raised" />
        </main>
      }
    >
      <LoginForm />
    </Suspense>
  )
}
