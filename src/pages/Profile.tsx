import { useState } from 'react'
import { Link } from 'react-router-dom'
import Avatar from '../components/Avatar'
import FriendsDialog from '../components/FriendsDialog'
import { ApiError } from '../lib/api'
import { useAuth } from '../hooks/useAuth'
import { fullName } from '../lib/user'

const focusRing =
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent'

export default function Profile() {
  const { user, logout } = useAuth()
  const [signingOut, setSigningOut] = useState(false)
  const [signOutError, setSignOutError] = useState<string | null>(null)
  const [friendsOpen, setFriendsOpen] = useState(false)

  if (!user) {
    return null
  }

  const displayName = fullName(user) || user.username

  const stats = [
    { label: 'Friends', value: user.friendsCount, onClick: () => setFriendsOpen(true) },
    { label: 'Crumbs', value: user.crumbsCount },
    { label: 'Collections', value: user.collectionsCount },
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
        {stats.map(({ label, value, onClick }) => {
          const content = (
            <>
              <span className="text-sm text-text">{label}</span>
              <span className="font-heading text-2xl text-text-h">{value ?? '–'}</span>
            </>
          )
          const cell = 'flex w-full flex-col-reverse items-center px-2 py-4'
          return (
            <li key={label}>
              {onClick ? (
                <button
                  type="button"
                  onClick={onClick}
                  aria-haspopup="dialog"
                  className={`${cell} cursor-pointer hover:bg-accent-bg focus-visible:-outline-offset-2 focus-visible:outline-2 focus-visible:outline-accent`}
                >
                  {content}
                </button>
              ) : (
                <div className={cell}>{content}</div>
              )}
            </li>
          )
        })}
      </ul>

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
    </section>
  )
}