import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus } from '@untitledui/icons/Plus'
import FolderCard from '../components/FolderCard'
import Chip from '../components/Chip'
import { ApiError } from '../lib/api'
import {
  createCollection,
  fetchUpcoming,
  searchCollections,
  DEFAULT_FILTERS,
} from '../lib/collections'
import type { Collection } from '../lib/collectionSchemas'

type Filter = 'all' | 'mine' | 'shared' | 'upcoming'
const FILTERS: { value: Filter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'mine', label: 'Created by me' },
  { value: 'shared', label: 'Shared with me' },
  { value: 'upcoming', label: 'Upcoming' },
]

export default function Collections() {
  const navigate = useNavigate()
  const [filter, setFilter] = useState<Filter>('all')
  const [collections, setCollections] = useState<Collection[] | null>(null)
  // Which filter the list on screen belongs to. While these differ the list is
  // stale, so the page shows "Loading" instead of the old results.
  const [shownFilter, setShownFilter] = useState<Filter | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)

  const loading = shownFilter !== filter

  useEffect(() => {
    let cancelled = false

    const run = async (which: Filter) => {
      try {
        const { collections: list } =
          which === 'upcoming'
            ? await fetchUpcoming(30, 12)
            : await searchCollections({ ...DEFAULT_FILTERS, scope: which })

        if (cancelled) return
        setCollections(list)
        setLoadError(null)
        setShownFilter(which)
      } catch (error) {
        if (cancelled) return
        setLoadError(
          error instanceof Error ? error.message : 'Could not load your collections.',
        )
        setCollections([])
        setShownFilter(which)
      }
    }

    void run(filter)
    return () => {
      cancelled = true
    }
  }, [filter])

  // A new collection is opened straight away, empty, and titled where it is
  // filled in. It stays "new" — out of every list — until something is put in
  // it, and the page it opens on deletes it again if nothing is, so a stray
  // click leaves nothing behind.
  const create = async (title = '') => {
    setCreating(true)
    setCreateError(null)
    try {
      const created = await createCollection({ title })
      navigate(`/collections/${created.id}`)
    } catch (error) {
      setCreateError(
        error instanceof ApiError ? error.message : 'Could not create it. Try again.',
      )
      setCreating(false)
    }
  }

  return (
    <section className="space-y-6">
      <header className="flex flex-wrap items-baseline justify-between gap-4">
        <h1 className="text-[28px] font-semibold tracking-heading text-text-h">Collections</h1>
        {collections !== null && (
          <span className="text-[14px] text-text">
            {collections.length === 1 ? '1 collection' : `${collections.length} collections`}
          </span>
        )}
      </header>

      {createError && (
        <p role="alert" className="text-[15px] text-danger">
          {createError}
        </p>
      )}

      <nav aria-label="Filter collections" className="flex flex-wrap gap-2">
        {FILTERS.map(({ value, label }) => (
          <Chip key={value} selected={filter === value} onClick={() => setFilter(value)}>
            {label}
          </Chip>
        ))}
      </nav>

      {loadError && (
        <p role="alert" className="text-[15px] text-danger">
          {loadError}
        </p>
      )}

      {loading || collections === null ? (
        <p role="status" className="text-[15px] text-text">
          Loading collections…
        </p>
      ) : collections.length === 0 ? (
        <div className="rounded-card border-2 border-dashed border-inactive px-6 py-12 text-center">
          <p className="text-[15px] text-text">
            {filter === 'upcoming'
              ? 'Nothing coming up in the next 30 days.'
              : filter === 'shared'
                ? 'Nothing has been shared with you.'
                : filter === 'mine'
                  ? 'You have not created any collections.'
                  : 'No collections yet.'}
          </p>
          {filter !== 'upcoming' && filter !== 'shared' && (
            <button
              type="button"
              onClick={() => void create()}
              disabled={creating}
              className="mt-2 rounded text-accent underline underline-offset-4 disabled:opacity-40"
            >
              Start one
            </button>
          )}
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {collections.map((collection) => (
            <li key={collection.id}>
              <FolderCard collection={collection} />
            </li>
          ))}

          {/* The last tile is the way to make another one, sitting in the grid
              rather than off in a header. It opens an empty collection straight
              away rather than a form to fill in first. */}
          <li>
            <button
              type="button"
              onClick={() => void create()}
              disabled={creating}
              className="flex h-full min-h-64 w-full flex-col items-center justify-center gap-1 rounded-card border-2 border-dashed border-inactive px-6 py-10 text-center text-text transition-colors duration-200 ease-ios focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent hover:border-accent hover:text-accent disabled:opacity-40"
            >
              <Plus size={34} strokeWidth={1.5} />
              <span className="text-[14px] font-medium">
                {creating ? 'Creating…' : 'New collection'}
              </span>
            </button>
          </li>
        </ul>
      )}
    </section>
  )
}