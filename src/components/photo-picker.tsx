'use client'

import { useRef, useState } from 'react'

import { Avatar } from '@/components/avatar'
import { createClient } from '@/lib/supabase/client'

const SIZE = 480

/**
 * Crops the centre square and scales it to 480 px before upload. Phone photos
 * are routinely 3–5 MB and the bucket accepts 2 MB, so without this most
 * uploads would simply fail — and a circle only ever shows the middle anyway.
 * createImageBitmap honours EXIF rotation, so a portrait photo stays upright.
 */
async function toSquareJpeg(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
  const side = Math.min(bitmap.width, bitmap.height)
  const canvas = document.createElement('canvas')
  canvas.width = SIZE
  canvas.height = SIZE
  canvas
    .getContext('2d')!
    .drawImage(bitmap, (bitmap.width - side) / 2, (bitmap.height - side) / 2, side, side, 0, 0, SIZE, SIZE)
  bitmap.close()

  return new Promise((resolve, reject) =>
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('encode'))), 'image/jpeg', 0.85),
  )
}

/**
 * Uploads into the caller's own folder (`<uid>/…`, enforced by the storage
 * policy) and reports the stored path. Saving that path onto the profile is the
 * parent's job, so onboarding can hold it until the profile exists.
 *
 * The file name carries a timestamp: the bucket is public and cached, so
 * reusing one name would keep showing the old face after a change.
 */
export function PhotoPicker({
  name,
  path,
  onUploaded,
  onRemove,
}: {
  name: string
  path: string | null
  onUploaded: (path: string) => void | Promise<void>
  onRemove?: () => void | Promise<void>
}) {
  const input = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function pick(file: File) {
    setError(null)
    setBusy(true)
    try {
      let blob: Blob
      try {
        blob = await toSquareJpeg(file)
      } catch {
        throw new Error('Dieses Bild können wir nicht öffnen. Bitte wählen Sie ein Foto im JPG- oder PNG-Format.')
      }

      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error('Bitte melden Sie sich erneut an.')

      const objectPath = `${user.id}/${Date.now()}.jpg`
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(objectPath, blob, { contentType: 'image/jpeg' })
      if (uploadError) throw new Error('Das Hochladen hat nicht geklappt. Bitte versuchen Sie es noch einmal.')

      await onUploaded(objectPath)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Das hat nicht geklappt.')
    } finally {
      setBusy(false)
      if (input.current) input.current.value = ''
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-5">
        <Avatar name={name || '?'} path={path} size={96} />

        <div className="flex flex-col items-start gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => input.current?.click()}
            className="press min-h-[52px] whitespace-nowrap rounded-button border-2 border-control bg-raised px-5 text-[17px] font-bold text-ink disabled:opacity-60"
          >
            {busy ? 'Wird hochgeladen …' : path ? 'Foto ändern' : 'Foto auswählen'}
          </button>
          {path && onRemove && !busy && (
            <button type="button" onClick={() => void onRemove()} className="text-[16px] font-bold text-muted underline">
              Foto entfernen
            </button>
          )}
        </div>
      </div>

      <p className="text-[16px] leading-relaxed text-muted">
        Ein freundliches Foto erhöht die Antworten deutlich. Es ist freiwillig.
      </p>

      {error && (
        <p role="alert" className="rounded-input border border-control bg-tag p-3 text-[16px] font-bold">
          {error}
        </p>
      )}

      <input
        ref={input}
        type="file"
        accept="image/*"
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
        onChange={(event) => {
          const file = event.target.files?.[0]
          if (file) void pick(file)
        }}
      />
    </div>
  )
}
