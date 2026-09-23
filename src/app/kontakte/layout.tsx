import { Suspense, type ReactNode } from 'react'

import { ContactList, ContactListSkeleton } from '@/components/contacts/contact-list'
import { ContactsColumn } from '@/components/contacts/contacts-column'
import { SiteNav } from '@/components/site-nav'

export const metadata = { title: 'Kontakte – Linde' }

export default function KontakteLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <SiteNav active="contacts" />

      <main className="mx-auto w-full max-w-[1180px] flex-grow px-6 py-8">
        <div className="flex flex-col gap-7">
          <h1 className="font-serif text-[38px] font-bold">Kontakte</h1>

          <div className="lg:grid lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)] lg:items-start lg:gap-8">
            {/* ContactsColumn reads the URL to decide what fits on a phone, and
                on a dynamic route that has to wait behind its own boundary. */}
            <Suspense fallback={<div className="hidden lg:block"><ContactListSkeleton /></div>}>
              <ContactsColumn>
                <Suspense fallback={<ContactListSkeleton />}>
                  <ContactList />
                </Suspense>
              </ContactsColumn>
            </Suspense>

            {children}
          </div>
        </div>
      </main>
    </>
  )
}
