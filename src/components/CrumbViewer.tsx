import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Trash01 } from '@untitledui/icons/Trash01'
import { crumbPosted, crumbSrc, deleteCrumb } from '../lib/crumbs'
import { fetchUser } from '../lib/user'
import { profilePath } from '../lib/people'
import { ApiError } from '../lib/api'
import type { Crumb } from '../lib/schemas'
import type { PublicUser } from '../lib/user'
import Avatar from './Avatar'
import Button from './Button'
import Modal from './Modal'
import Squircle from './Squircle'
import { focusRing, RADIUS } from '../lib/ui'

export default function CrumbViewer({
  crumb,
  onClose,
  onDeleted,
}: {
  crumb: Crumb | null
  onClose: () => void
  // Called after the crumb is gone server-side, so the page can drop it from
  // whatever list it is holding.
  onDeleted?: (id: string) => void
}) {
  const ref = useRef<HTMLDialogElement>(null)
  const open = crumb !== null

  const [busy, setBusy] = useState(false)
  // The error is tagged with the crumb it belongs to, so opening a different one
  // can never show a message about this. Cheaper than clearing it in an effect.
  const [error, setError] = useState<{ crumbId: string; message: string } | null>(null)
  // Tagged with the crumb it belongs to, for the same reason as the error above:
  // opening a different crumb can never show a name belonging to this one, and
  // nothing has to be cleared when it changes.
  const [author, setAuthor] = useState<{ crumbId: string; user: PublicUser } | null>(null)
  const [confirming, setConfirming] = useState(false)

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  useEffect(() => {
    // Nothing to look up: the viewer is closed, or the crumb came from an API
    // that does not say who posted it.
    const target = crumb
    if (!target?.userId) return

    let cancelled = false
    fetchUser(target.userId)
      .then((user) => {
        if (!cancelled) setAuthor({ crumbId: target.id, user })
      })
      .catch(() => {
        if (!cancelled) setAuthor(null)
      })
    return () => {
      cancelled = true
    }
  }, [crumb])

  const user = author && crumb && author.crumbId === crumb.id ? author.user : null
  const posted = crumb ? crumbPosted(crumb) : ''
  const caption = crumb?.caption.trim() ?? ''

// Closing the viewer takes the confirmation with it, and clears `busy`.
//
// `busy` is the one piece of state here that is not tagged with a crumb, so it is
// the one that has to be reset by hand — and a successful delete never reaches
// the line that does that, because it closes the viewer instead. Without this,
// deleting one crumb left Delete and Close disabled on every crumb opened after
// it, for as long as the page was alive.
const close = () => {
  setConfirming(false)
  setBusy(false)
  onClose()
}

  const remove = async () => {
    if (!crumb) return

    setBusy(true)
    setError(null)
    try {
      await deleteCrumb(crumb.id)
      onDeleted?.(crumb.id)
      close()
    } catch (err) {
      // The error is shown in the viewer, which the confirmation is sitting on
      // top of — so the confirmation steps aside rather than leaving the message
      // behind a modal nobody can see.
      setConfirming(false)
      setError({
        crumbId: crumb.id,
        message: err instanceof ApiError ? err.message : 'Could not delete that crumb.',
      })
      setBusy(false)
    }
  }

  return (
    // Two dialogs, not one: the photo is the lightbox, and the confirmation is
    // stacked on the top layer above it, so the photo stays visible behind the
    // question being asked about it.
    <>
      <dialog
        ref={ref}
        aria-label="Crumb"
        onClose={close}
        onClick={(event) => {
          if (event.target === event.currentTarget) close()
        }}
        className="m-auto max-h-[94dvh] max-w-[94vw] overflow-visible border-0 bg-transparent p-0 text-text open:flex backdrop:bg-black/45 backdrop:backdrop-blur-lg"
      >
        {crumb && (
          <figure className="m-0 flex flex-col items-center gap-3 text-center">
            <Squircle
              radius={RADIUS.card}
              className="overflow-hidden bg-fill shadow-float"
            >
              <img
                src={crumbSrc(crumb.imageUrl)}
                alt={caption}
                className="aspect-square w-[min(90vw,70dvh)] object-cover"
              />
            </Squircle>

            {/* Who posted it and when, as one line: on a feed of other people's
                photos a picture alone does not say who to thank. Each half can be
                missing — the handle needs a lookup, and the date needs the upload
                to have carried one — so the separator only appears between two
                things that are actually there. */}
            {(user || posted) && (
              <div className="flex items-center gap-2">
                {user && (
                  <div className="size-8 shrink-0">
                    <Avatar user={user} to={profilePath(user.username)} />
                  </div>
                )}
                <p className="text-[17px] font-medium text-text-h">
                  {user && (
                    <Link
                      to={profilePath(user.username)}
                      className={`rounded font-bold no-underline hover:underline ${focusRing}`}
                    >
                      @{user.username}
                    </Link>
                  )}
                  {user && posted && <span className="px-1.5">·</span>}
                  {posted && <span className="text-[15px] opacity-70">{posted}</span>}
                </p>
              </div>
            )}

            {/* The caption, or nothing. crumbLabel() stands in the date when a
                crumb has none, which is right on the canvas — a photo with no
                words still needs a label there — but here it would print the date
                a second time, directly under the line above that already says
                when it was posted. So the caption is taken as the caption. */}
            {caption && (
              <figcaption className="max-w-[min(90vw,40rem)] text-[15px] break-words text-text-h">
                {caption}
              </figcaption>
            )}

            {error?.crumbId === crumb.id && (
              <p role="alert" className="text-[15px] text-danger">
                {error.message}
              </p>
            )}

            <div className="flex flex-wrap justify-center gap-3">
              {/* Only asks. The question and the answer are a modal of their own,
                  so a slip on this button cannot destroy a photo. */}
              <Button
                variant="danger"
                onClick={() => setConfirming(true)}
                disabled={busy}
                className="text-danger backdrop-blur-xl"
              >
                <Trash01 size={16} strokeWidth={1.75} />
                Delete
              </Button>
              <Button
                variant="secondary"
                onClick={close}
                disabled={busy}
                className="text-text-h backdrop-blur-xl"
              >
                Close
              </Button>
            </div>
          </figure>
        )}
      </dialog>

      <Modal
        open={confirming}
        onClose={() => (busy ? undefined : setConfirming(false))}
        title="Delete this crumb?"
      >
        <div className="space-y-4">
          <p className="text-[15px] text-text">
            This photo
            {caption && <> captioned &ldquo;{caption}&rdquo;</>} will be gone. This
            cannot be undone.
          </p>

          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setConfirming(false)} disabled={busy}>
              Keep it
            </Button>
            <Button variant="danger" onClick={() => void remove()} disabled={busy}>
              <Trash01 size={16} strokeWidth={1.75} />
              {busy ? 'Deleting…' : 'Delete it'}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
