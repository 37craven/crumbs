import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Avatar from '../components/Avatar'
import CrumbViewer from '../components/CrumbViewer'
import FriendsDialog from '../components/FriendsDialog'
import { ApiError } from '../lib/api'
import { crumbLabel, crumbSrc, fetchCrumbs } from '../lib/crumbs'
import { fetchCollections } from '../lib/collections'
import type { Crumb } from '../lib/schemas'
import type { CollectionOption } from '../lib/collections'
import { useAuth } from '../hooks/useAuth'
import { fullName } from '../lib/user'

const focusRing =
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent'

const linkClass = `text-accent underline underline-offset-4 ${focusRing}`

const PREVIEW_COUNT = 6

export default function Profile() {
  const { user, logout } = useAuth()
  const [signingOut, setSigningOut] = useState(false)
  const [signOutError, setSignOutError] = useState<string | null>(null)
  const [friendsOpen, setFriendsOpen] = useState(false)
  const [crumbs, setCrumbs] = useState<Crumb[] | null>(null)
  const [crumbsFailed, setCrumbsFailed] = useState(false)
  const [selected, setSelected] = useState<Crumb | null>(null)
  const [collections, setCollections] = useState<CollectionOption[] | null>(null)

  useEffect(() => {
    let cancelled = false
    fetchCollections()
      .then((list) => {
        if (!cancelled) setCollections(list)
      })
      .catch(() => {
        if (!cancelled) setCollections([])
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    fetchCrumbs()
      .then((list) => {
        if (!cancelled) setCrumbs(list)
      })
      .catch(() => {
        if (!cancelled) setCrumbsFailed(true)
      })
    return () => {
      cancelled = true
    }
  }, [])

  if (!user) {
    return null
  }

  const displayName = fullName(user) || user.username

  const stats = [
    { label: 'Friends', value: user.friendsCount, onClick: () => setFriendsOpen(true) },
    { label: 'Crumbs', value: crumbs ? crumbs.length : 0, to: '/crumbs' },
    { label: 'Collections', value: collections ? collections.length : 0, to: '/collections' },
  ]

  const handleSignOut = async () => {
    setSignOutError(null)
    setSigningOut(true)
    try {
      await logout()
    } catch (error) {
      setSignOutError(
        error instanceof ApiError
          ? error.message
          : 'Could not sign you out. Try again.',
      )
      setSigningOut(false)
    }
  }

  return (
    <section aria-labelledby="profile-heading" className="space-y-8">
      <div className="text-left">
        <Link
          to="/"
          className={`text-accent underline underline-offset-4 ${focusRing}`}
        >
          Back to home
        </Link>
      </div>

      <header className="flex flex-col items-center gap-3">
        <Avatar user={user} className="size-28 text-5xl" />

        {/* index.css styles bare h1 outside Tailwind's layers, so size and margin need ! to win. */}
        <h1
          id="profile-heading"
          className="my-0! text-4xl! font-heading break-words text-text-h"
        >
          {displayName}
        </h1>
        {displayName !== user.username && (
          <p className="text-text">@{user.username}</p>
        )}

        <Link
          to="/edit-profile"
          className={`mt-1 rounded-md bg-accent px-4 py-2 font-heading text-bg ${focusRing}`}
        >
          Edit profile
        </Link>
      </header>

      <ul className="grid grid-cols-3 divide-x divide-border overflow-hidden rounded-lg border border-border text-center">
        {stats.map(({ label, value, onClick, to }) => {
          const content = (
            <>
              <span className="text-sm text-text">{label}</span>
              <span className="font-heading text-2xl text-text-h">{value ?? '–'}</span>
            </>
          )
          const cell = 'flex w-full flex-col-reverse items-center px-2 py-4'
          const clickable = `${cell} cursor-pointer hover:bg-accent-bg focus-visible:-outline-offset-2 focus-visible:outline-2 focus-visible:outline-accent`
          return (
            <li key={label}>
              {onClick ? (
                <button
                  type="button"
                  onClick={onClick}
                  aria-haspopup="dialog"
                  className={clickable}
                >
                  {content}
                </button>
              ) : to ? (
                <Link to={to} className={clickable}>
                  {content}
                </Link>
              ) : (
                <div className={cell}>{content}</div>
              )}
            </li>
          )
        })}
      </ul>

      <section aria-labelledby="profile-crumbs-heading" className="space-y-3 text-left">
        <div className="flex items-baseline justify-between gap-4">
          <h2 id="profile-crumbs-heading" className="my-0!">
            Crumbs
          </h2>
          <Link to="/crumbs" className={linkClass}>
            View all
          </Link>
        </div>

        {crumbsFailed ? (
          <p className="text-text">Couldn't load your crumbs.</p>
        ) : crumbs === null ? (
          <p role="status" className="text-text">
            Loading crumbs…
          </p>
        ) : crumbs.length === 0 ? (
          <p className="text-text">
            No crumbs yet.{' '}
            <Link to="/crumbs" className={linkClass}>
              Add your first
            </Link>
          </p>
        ) : (
          <ul className="grid grid-cols-3 gap-2">
            {crumbs.slice(0, PREVIEW_COUNT).map((crumb) => (
              <li key={crumb.id}>
                <button
                  type="button"
                  onClick={() => setSelected(crumb)}
                  aria-label={crumbLabel(crumb) || 'Open crumb'}
                  className={`block aspect-square w-full cursor-pointer overflow-hidden ${focusRing}`}
                >
                  <img
                    src={crumbSrc(crumb.imageUrl)}
                    alt=""
                    loading="lazy"
                    className="size-full object-cover"
                  />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="profile-collections-heading" className="space-y-3 text-left">
        <div className="flex items-baseline justify-between gap-4">
          <h2 id="profile-collections-heading" className="my-0!">
            Collections
          </h2>
          <Link to="/collections" className={linkClass}>
            View all
          </Link>
        </div>

        {collections === null ? (
          <p role="status" className="text-text">
            Loading collections…
          </p>
        ) : collections.length === 0 ? (
          <p className="text-text">No collections yet.</p>
        ) : (
          <ul className="divide-y divide-border rounded-lg border border-border">
            {collections.slice(0, PREVIEW_COUNT).map((collection) => (
              <li key={collection.id}>
                <Link
                  to="/collections"
                  className={`block px-4 py-3 font-heading text-text-h hover:bg-accent-bg ${focusRing}`}
                >
                  {collection.title || 'Untitled collection'}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="flex flex-col items-center gap-3 border-t border-border pt-6">
        <button
          type="button"
          onClick={() => void handleSignOut()}
          disabled={signingOut}
          className={`rounded-md border border-border px-4 py-2 font-heading text-text-h disabled:opacity-50 ${focusRing}`}
        >
          {signingOut ? 'Signing out…' : 'Sign out'}
        </button>

        <div aria-live="polite">
          {signOutError && (
            <p role="alert" className="text-sm text-accent">
              {signOutError}
            </p>
          )}
        </div>
      </div>

      <FriendsDialog open={friendsOpen} onClose={() => setFriendsOpen(false)} />
      <CrumbViewer crumb={selected} onClose={() => setSelected(null)} />
    </section>
  )
}