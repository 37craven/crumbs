import { useEffect, useRef } from 'react'
import { crumbLabel, crumbSrc } from '../lib/crumbs'
import type { Crumb } from '../lib/schemas'

export default function CrumbViewer({
  crumb,
  onClose,
}: {
  crumb: Crumb | null
  onClose: () => void
}) {
  const ref = useRef<HTMLDialogElement>(null)
  const open = crumb !== null

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog
      ref={ref}
      aria-label="Crumb"
      onClose={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
      className="m-auto max-h-[94dvh] max-w-[94vw] overflow-visible border-0 bg-transparent p-0 text-white open:flex backdrop:bg-black/40 backdrop:backdrop-blur-lg"
    >
      {crumb && (
        <figure className="m-0 flex flex-col items-center gap-3 text-center">
          <img
            src={crumbSrc(crumb.imageUrl)}
            alt={crumbLabel(crumb)}
            className="aspect-square w-[min(90vw,70dvh)] rounded-md object-cover shadow-2xl"
          />
          <figcaption className="w-[min(90vw,70dvh)] text-lg break-words">
            {crumbLabel(crumb)}
          </figcaption>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-white/50 px-4 py-2 font-heading text-white"
          >
            Close
          </button>
        </figure>
      )}
    </dialog>
  )
}