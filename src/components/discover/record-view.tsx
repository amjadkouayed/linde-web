'use client'

import { useEffect } from 'react'

import { recordOfferView } from '@/lib/actions/profile'

/**
 * Registers that someone opened this offer, so "Aufrufe diese Woche" on the
 * owner's own screen is a real number rather than a permanent zero.
 *
 * Runs from the client on purpose: a view is a mutation, and doing it while the
 * server renders the page would fire again on every prefetch and refresh. The
 * database deduplicates to one view per person per offer per day and refuses a
 * view of your own offer, so nothing here needs to guard against either.
 */
export function RecordView({ offerId }: { offerId: string }) {
  useEffect(() => {
    void recordOfferView(offerId)
  }, [offerId])

  return null
}
