import { useEffect, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import Avatar from '../components/Avatar'
import CrumbViewer from '../components/CrumbViewer'
import { ApiError } from '../lib/api'
import { crumbLabel, crumbSrc } from '../lib/crumbs'
import {
  acceptFriendRequest,
  cancelFriendRequest,
  removeFriend,
  sendFriendRequest,
} from '../lib/friends'
import type { Crumb, PublicProfile, Relationship } from '../lib/schemas'
import { fullName } from '../lib/user'
import { fetchUserCrumbs, fetchUserProfile } from '../lib/user'

const focusRing =
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent'

const card = 'rounded-3xl border border-border bg-white shadow-sm'
const wrap = 'mx-auto max-w-xl space-y-6'

const joinedFormat = new Intl.DateTimeFormat(undefined, { month: 'long', year: 'numeric' })

const relationshipLabel: Partial<Record<Relationship, string>> = {
  friends: 'Friends',
  request_sent: 'Friend request sent',
  request_received: 'Wants to be your friend',
}

type State =
  | { status: 'loading' }
  | { status: 'notfound' }
  | { status: 'error'; message: string }
  | { status: 'ready'; profile: PublicProfile }

function BackLink() {
  return (
    <div className="text-left">
      <Link to="/profile" className="text-sm text-accent no-underline hover:underline">
        ← Back to profile
      </Link>
    </div>
  )
}

function UserProfileView({ username }: { username: string }) {
  const [state, setState] = useState<State>({ status: 'loading' })
  const [attempt, setAttempt] = useState(0)
  const [crumbs, setCrumbs] = useState<Crumb[] | null>(null)
  const [crumbsFailed, setCrumbsFailed] = useState(false)
  const [selected, setSelected] = useState<Crumb | null>(null)
  const [busy, setBusy] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  async function runAction(action: () => Promise<void>) {
    setBusy(true)
    setActionError(null)
    try {
      await action()
      setCrumbs(null)
      setCrumbsFailed(false)
      setAttempt((n) => n + 1) // reload the profile so the relationship is fresh
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Something went wrong.')
    } finally {
      setBusy(false)
    }
  }

  useEffect(() => {
    let cancelled = false

    fetchUserProfile(username)
      .then((profile) => {
        if (cancelled) return
        setState({ status: 'ready', profile })

        // The server only hands crumbs to friends; asking anyone else is a 404.
        if (profile.relationship !== 'friends') return
        fetchUserCrumbs(username)
          .then((list) => {
            if (!cancelled) setCrumbs(list)
          })
          .catch(() => {
            if (!cancelled) setCrumbsFailed(true)
          })
      })
      .catch((error: unknown) => {
        if (cancelled) return
        setState(
          error instanceof ApiError && error.status === 404
            ? { status: 'notfound' }
            : {
                status: 'error',
                message: error instanceof Error ? error.message : 'Could not load this profile.',
              },
        )
      })

    return () => {
      cancelled = true
    }
  }, [username, attempt])

  if (state.status === 'loading') {
    return (
      <section aria-label="Profile" className={wrap}>
        <BackLink />
        <p role="status" className="text-text">
          Loading profile…
        </p>
      </section>
    )
  }

  if (state.status === 'notfound') {
    return (
      <section aria-label="Profile" className={wrap}>
        <BackLink />
        <div className={`${card} space-y-1 px-6 py-10 text-center`}>
          <h1 className="my-0! text-2xl! font-heading text-text-h">User not found</h1>
          <p className="text-text">No one goes by @{username}.</p>
        </div>
      </section>
    )
  }

  if (state.status === 'error') {
    return (
      <section aria-label="Profile" className={wrap}>
        <BackLink />
        <div className={`${card} space-y-3 px-6 py-6 text-left`}>
          <p role="alert" className="text-accent">
            {state.message}
          </p>
          <button
            type="button"
            onClick={() => {
              setState({ status: 'loading' })
              setCrumbs(null)
              setCrumbsFailed(false)
              setAttempt((n) => n + 1)
            }}
            className="btn"
          >
            Try again
          </button>
        </div>
      </section>
    )
  }

  const { profile } = state

  // Your own profile has its own page, with editing and sign-out.
  if (profile.isSelf) {
    return <Navigate to="/profile" replace />
  }

  const name = fullName(profile)
  const displayName = name || profile.username
  const isFriend = profile.relationship === 'friends'
  const label = relationshipLabel[profile.relationship]

  const joined = new Date(profile.createdAt)
  const meta: string[] = []
  if (!Number.isNaN(joined.getTime())) meta.push(`Joined ${joinedFormat.format(joined)}`)
  if (profile.friendsCount !== null) {
    meta.push(`${profile.friendsCount} ${profile.friendsCount === 1 ? 'friend' : 'friends'}`)
  }

  return (
    <section aria-labelledby="user-profile-heading" className={wrap}>
      <BackLink />

      <header className={`${card} flex flex-col items-center gap-3 px-6 py-8`}>
        <Avatar user={profile} className="size-28 text-5xl" />

        {/* index.css styles bare h1 outside Tailwind's layers, so size and margin need ! to win. */}
        <h1
          id="user-profile-heading"
          className="my-0! text-4xl! font-heading break-words text-text-h"
        >
          {displayName}
        </h1>
        {displayName !== profile.username && <p className="text-text">@{profile.username}</p>}

        {label && (
          <p className="rounded-full border border-accent-border bg-accent-bg px-3 py-1 text-sm font-semibold text-accent">
            {label}
          </p>
        )}
        {meta.length > 0 && <p className="text-sm text-text">{meta.join(' · ')}</p>}

        <div className="flex flex-wrap justify-center gap-2 pt-1">
          {profile.relationship === 'none' && (
            <button
              type="button"
              disabled={busy}
              onClick={() => runAction(() => sendFriendRequest(profile.id))}
              className="btn btn-primary"
            >
              {busy ? 'Sending…' : 'Add friend'}
            </button>
          )}

          {profile.relationship === 'request_sent' && profile.requestId && (
            <button
              type="button"
              disabled={busy}
              onClick={() => runAction(() => cancelFriendRequest(profile.requestId as string))}
              className="btn"
            >
              Cancel request
            </button>
          )}

          {profile.relationship === 'request_received' && profile.requestId && (
            <>
              <button
                type="button"
                disabled={busy}
                onClick={() => runAction(() => acceptFriendRequest(profile.requestId as string))}
                className="btn btn-primary"
              >
                Accept
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => runAction(() => cancelFriendRequest(profile.requestId as string))}
                className="btn"
              >
                Decline
              </button>
            </>
          )}

          {profile.relationship === 'friends' && (
            <button
              type="button"
              disabled={busy}
              onClick={() => {
                if (window.confirm(`Remove ${displayName} from your friends?`)) {
                  void runAction(() => removeFriend(profile.id))
                }
              }}
              className="btn btn-danger"
            >
              Remove friend
            </button>
          )}
        </div>

        {actionError && (
          <p role="alert" className="text-sm text-accent">
            {actionError}
          </p>
        )}
      </header>

      {isFriend ? (
        <section aria-labelledby="user-crumbs-heading" className={`${card} space-y-3 p-5 text-left`}>
          <h2 id="user-crumbs-heading" className="my-0!">
            Crumbs
          </h2>

          {crumbsFailed ? (
            <p className="text-text">Couldn't load their crumbs.</p>
          ) : crumbs === null ? (
            <p role="status" className="text-text">
              Loading crumbs…
            </p>
          ) : crumbs.length === 0 ? (
            <p className="text-text">No crumbs yet.</p>
          ) : (
            <ul className="grid grid-cols-3 gap-2">
              {crumbs.map((crumb) => (
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
      ) : (
        <p className={`${card} px-6 py-5 text-center text-text`}>
          Only friends can see @{profile.username}'s crumbs and friends.
        </p>
      )}

      <CrumbViewer crumb={selected} onClose={() => setSelected(null)} />
    </section>
  )
}

export default function UserProfile() {
  const { username } = useParams<{ username: string }>()

  if (!username) {
    return <Navigate to="/profile" replace />
  }

  // Keyed by username so moving from one profile to another starts clean
  // instead of briefly showing the previous person's crumbs.
  return <UserProfileView key={username} username={username} />
}