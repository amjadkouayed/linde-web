'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'

import { RADIUS_OPTIONS } from '@/lib/discover'

/**
 * Always visible, never behind a sheet — eBay-Kleinanzeigen style, which this
 * audience already knows. State lives in the URL so a search can be shared,
 * reloaded and used by the server component that reads it.
 *
 * Both values drive the real query: searchNearby() measures from the centre of
 * the entered postal code out to the chosen radius (0007_location_search).
 */
export function LocationFilter({
  defaultPostalCode,
  resultCount,
}: {
  defaultPostalCode: string
  resultCount: number
}) {
  const router = useRouter()
  const params = useSearchParams()

  const [postalCode, setPostalCode] = useState(params.get('plz') ?? defaultPostalCode)
  const [radius, setRadius] = useState(params.get('umkreis') ?? '25')
  const [error, setError] = useState<string | null>(null)

  function submit(nextRadius = radius) {
    if (!/^\d{5}$/.test(postalCode)) {
      setError('Bitte geben Sie eine fünfstellige Postleitzahl ein.')
      return
    }
    setError(null)
    router.push(`/discover?plz=${postalCode}&umkreis=${nextRadius}`)
  }

  return (
    <form
      className="flex flex-col gap-4 rounded-card border border-line bg-raised p-5"
      onSubmit={(event) => {
        event.preventDefault()
        submit()
      }}
    >
      <div className="flex flex-wrap items-end gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="plz" className="text-[17px] font-bold">
            Wo?
          </label>
          <input
            id="plz"
            name="plz"
            inputMode="numeric"
            autoComplete="postal-code"
            value={postalCode}
            onChange={(event) => setPostalCode(event.target.value.trim())}
            className="w-[220px] rounded-input border-2 border-control bg-surface px-4 py-3 text-[19px] focus:border-brand focus:outline-none"
          />
        </div>

        <fieldset className="flex w-full flex-col gap-1.5 sm:w-auto">
          <legend className="mb-1.5 text-[17px] font-bold">Umkreis in km</legend>
          {/* Five equal columns on a phone: in one unwrapped row the chips were
              497 px wide and pushed the whole Discover page sideways. */}
          <div className="grid grid-cols-5 gap-1.5 sm:flex">
            {RADIUS_OPTIONS.map((km) => {
              const value = String(km)
              const isActive = value === radius
              return (
                <button
                  key={value}
                  type="button"
                  aria-pressed={isActive}
                  aria-label={`${value} km`}
                  onClick={() => {
                    setRadius(value)
                    submit(value)
                  }}
                  className={`press min-h-[52px] whitespace-nowrap rounded-input border-2 px-1 text-[16px] font-bold sm:px-4 sm:text-[17px] ${
                    isActive
                      ? 'border-brand bg-brand text-surface'
                      : 'border-control bg-surface text-ink'
                  }`}
                >
                  {/* The legend says "km"; five "100 km" chips do not fit a phone. */}
                  {value}
                </button>
              )
            })}
          </div>
        </fieldset>

        <button
          type="submit"
          className="press ml-auto min-h-[56px] rounded-button bg-brand px-8 text-[19px] font-bold text-surface"
        >
          Suchen
        </button>
      </div>

      {error ? (
        <p role="alert" className="text-[17px] font-bold text-brand-pressed">
          {error}
        </p>
      ) : (
        <p aria-live="polite" className="text-[17px] font-bold text-muted">
          {resultCount === 0
            ? 'Niemand gefunden — versuchen Sie einen größeren Umkreis.'
            : `${resultCount} ${resultCount === 1 ? 'Person' : 'Personen'} im Umkreis von ${radius} km`}
        </p>
      )}
    </form>
  )
}
