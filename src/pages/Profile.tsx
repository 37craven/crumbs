import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Avatar from '../components/Avatar'
import CrumbViewer from '../components/CrumbViewer'
import FriendsDialog from '../components/FriendsDialog'
import { ApiError } from '../lib/api'
import { crumbLabel, crumbSrc, fetchCrumbs } from '../lib/crumbs'
import type { Crumb } from '../lib/schemas'
import { useAuth } from '../hooks/useAuth'
import { fullName } from '../lib/user'

const focusRing =
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent'

const linkClass = `text-sm font-semibold text-accent no-underline hover:underline ${focusRing}`
const card = 'rounded-3xl border border-border bg-white shadow-sm'

const PREVIEW_COUNT = 6

// No collections data exists in the app yet. Replace this with the real list
// (each item needs an id and a name) once the Collections page provides it.
const collections: { id: string; name: string }[] = []

export default function Profile() {
  const { user, logout } = useAuth()
  const [signingOut, setSigningOut] = useState(false)
  const [signOutError, setSignOutError] = useState<string | null>(null)
  const [friendsOpen, setFriendsOpen] = useState(false)
  const [crumbs, setCrumbs] = useState<Crumb[] | null>(null)
  const [crumbsFailed, setCrumbsFailed] = useState(false)
  const [selected, setSelected] = useState<Crumb | null>(null)

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
    { label: 'Crumbs', value: crumbs ? crumbs.length : user.crumbsCount, to: '/crumbs' },
    { label: 'Collections', value: user.collectionsCount, to: '/collections' },
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
    <section aria-labelledby="profile-heading" className="mx-auto max-w-xl space-y-6">
      <div className="text-left">
        <Link to="/" className="text-sm text-accent no-underline hover:underline">
          ← Home
        </Link>
      </div>

      <header className={`${card} flex flex-col items-center gap-3 px-6 py-8`}>
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
          className="btn btn-primary mt-1 px-5 py-2 no-underline"
        >
          Edit profile
        </Link>
      </header>

      <ul className={`${card} grid grid-cols-3 divide-x divide-border overflow-hidden text-center`}>
        {stats.map(({ label, value, onClick, to }) => {
          const content = (
            <>
              <span className="text-xs font-semibold tracking-wide text-text uppercase">{label}</span>
              <span className="text-2xl font-extrabold text-text-h">{value ?? '–'}</span>
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

      <section aria-labelledby="profile-crumbs-heading" className={`${card} space-y-3 p-5 text-left`}>
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
                  className={`block aspect-square w-full cursor-pointer overflow-hidden rounded-2xl shadow-sm transition-transform hover:-translate-y-0.5 ${focusRing}`}
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

      <section aria-labelledby="profile-collections-heading" className={`${card} space-y-3 p-5 text-left`}>
        <div className="flex items-baseline justify-between gap-4">
          <h2 id="profile-collections-heading" className="my-0!">
            Collections
          </h2>
          <Link to="/collections" className={linkClass}>
            View all
          </Link>
        </div>

        {collections.length === 0 ? (
          <p className="text-text">No collections yet.</p>
        ) : (
          <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border">
            {collections.map((collection) => (
              <li key={collection.id}>
                <Link
                  to="/collections"
                  className={`block px-4 py-3 font-semibold text-text-h no-underline hover:bg-accent-bg ${focusRing}`}
                >
                  {collection.name}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="flex flex-col items-center gap-3 pt-2">
        <button
          type="button"
          onClick={() => void handleSignOut()}
          disabled={signingOut}
          className="btn px-5 py-2 disabled:opacity-50"
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