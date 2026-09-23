/**
 * The list itself lives in the layout. What remains here is the right-hand
 * pane on desktop before any conversation is open; on a phone the list fills
 * the screen and this stays hidden.
 */
export default function KontaktePage() {
  return (
    <div className="hidden min-h-[360px] items-center justify-center rounded-card border border-dashed border-control bg-raised p-10 text-center lg:flex">
      <p className="max-w-[340px] text-[19px] leading-relaxed text-muted">
        Wählen Sie links ein Gespräch aus, um weiterzuschreiben.
      </p>
    </div>
  )
}
