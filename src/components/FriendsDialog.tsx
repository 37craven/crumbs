import { useEffect, useMemo, useRef, useState } from 'react'
import { ApiError } from '../lib/api'
import { fetchFriends } from '../lib/friends'
import type { Friend } from '../lib/schemas'
import { fullName } from '../lib/user'
import Avatar from './Avatar'

type State =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; friends: Friend[] }

const FILTER_FROM = 6

function describeError(error: unknown): string {
  if (error instanceof ApiError && error.status === 404) {
    return 'The server has no friends list yet. Restart the backend with the latest version and try again.'
  }
  return error instanceof Error ? error.message : 'Could not load your friends.'
}

function FriendsList() {
  const [state, setState] = useState<State>({ status: 'loading' })
  const [attempt, setAttempt] = useState(0)
  const [query, setQuery] = useState('')

  useEffect(() => {
    let cancelled = false
    fetchFriends()
      .then((friends) => {
        if (!cancelled) setState({ status: 'ready', friends })
      })
      .catch((error: unknown) => {
        if (!cancelled) setState({ status: 'error', message: describeError(error) })
      })
    return () => {
      cancelled = true
    }
  }, [attempt])

  const visible = useMemo(() => {
    if (state.status !== 'ready') return []
    const q = query.trim().toLowerCase()
    if (!q) return state.friends
    return state.friends.filter((f) => `${fullName(f)} ${f.username}`.toLowerCase().includes(q))
  }, [state, query])

  if (state.status === 'loading') {
    return (
      <p role="status" className="px-6 py-8 text-center text-text">
        Loading friends…
      </p>
    )
  }

  if (state.status === 'error') {
    return (
      <div className="space-y-3 px-6 py-6">
        <p role="alert" className="text-accent">
          {state.message}
        </p>
        <button
          type="button"
          onClick={() => {
            setState({ status: 'loading' })
            setAttempt((n) => n + 1)
          }}
          className="btn"
        >
          Try again
        </button>
      </div>
    )
  }

  if (state.friends.length === 0) {
    return (
      <div className="space-y-1 px-6 py-10 text-center">
        <p className="text-2xl" aria-hidden="true">
          🫂
        </p>
        <p className="font-semibold text-text-h">No friends yet</p>
        <p className="text-sm">When you add friends, they'll show up here.</p>
      </div>
    )
  }

  return (
    <>
      {state.friends.length >= FILTER_FROM && (
        <div className="px-6 pb-3">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search friends…"
            aria-label="Search friends"
            className="field rounded-full px-4"
          />
        </div>
      )}

      {visible.length === 0 ? (
        <p className="px-6 py-6 text-center text-sm">No friends match “{query}”.</p>
      ) : (
        <ul className="overflow-y-auto px-3 pb-3">
          {visible.map((friend) => {
            const name = fullName(friend)
            return (
              <li key={friend.id} className="flex items-center gap-3 rounded-2xl px-3 py-2.5 hover:bg-page">
                <Avatar user={friend} className="size-11 shrink-0 text-lg" />
                <div className="min-w-0">
                  <p className="truncate font-semibold text-text-h">{name || friend.username}</p>
                  {name && <p className="truncate text-sm text-text">@{friend.username}</p>}
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </>
  )
}

export default function FriendsDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog
      ref={ref}
      aria-labelledby="friends-dialog-heading"
      onClose={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
      className="m-auto max-h-[80dvh] w-[min(26rem,calc(100%-2rem))] flex-col overflow-hidden rounded-3xl border-0 bg-white p-0 text-left text-text shadow-2xl open:flex backdrop:bg-black/45"
    >
      <div className="flex items-center justify-between gap-4 px-6 pt-5 pb-3">
        <h2 id="friends-dialog-heading" className="my-0!">
          Friends
        </h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="grid size-8 place-items-center rounded-full text-xl text-text-h hover:bg-page"
        >
          ×
        </button>
      </div>
      {open && <FriendsList />}
    </dialog>
  )
}