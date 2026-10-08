import { useCallback, useEffect, useRef, useState } from 'react'
import { ApiError } from '../lib/api'
import { DEFAULT_FILTERS, searchCollections } from '../lib/collections'
import { searchPeople } from '../lib/people'
import type { SearchHit } from '../lib/people'
import {
  COLLECTION_STATUSES,
  SCOPES,
  SORT_OPTIONS,
  STATUS_LABELS,
  WIDGET_TYPES,
} from '../lib/collectionSchemas'
import type {
  Scope,
  SearchFilters,
  Sort,
  WidgetType,
} from '../lib/collectionSchemas'
import Button from '../components/Button'
import Card from '../components/Card'
import Chip from '../components/Chip'
import { focusRing } from '../lib/ui'

const selectClass =
  'rounded-full bg-fill px-4 py-2 text-[14px] text-text-h outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent'

const SCOPE_LABELS: Record<Scope, string> = {
  all: 'Everything',
  mine: 'Created by me',
  shared: 'Shared with me',
}

const SORT_LABELS: Record<Sort, string> = {
  recent: 'Recently edited',
  newest: 'Newest first',
  oldest: 'Oldest first',
  title: 'Title A–Z',
  date_asc: 'Date, soonest first',
  date_desc: 'Date, latest first',
}

const HAS_LABELS: Record<WidgetType, string> = {
  notes: 'Notes',
  image: 'A picture',
  date: 'A date',
  link: 'A link',
}

// People are looked up by username, and the server refuses anything outside
// 2-20 characters (validators/friends.js). So the people request is only made
// inside that window: never on an empty box, and never on a long phrase, which
// would come back a 400.
const PEOPLE_MIN = 2
const PEOPLE_MAX = 20

// A checkbox list. Toggling one keeps the others as they are.
function Toggles<T extends string>({
  legend,
  options,
  selected,
  onChange,
  labels,
}: {
  legend: string
  options: readonly T[]
  selected: T[]
  onChange: (next: T[]) => void
  labels?: Partial<Record<T, string>>
}) {
  const toggle = (value: T) =>
    onChange(
      selected.includes(value)
        ? selected.filter((item) => item !== value)
        : [...selected, value],
    )

  // Chips rather than checkboxes: these are the same kind of choice the
  // Collections page already makes with pills, and the selected state reads at
  // a glance from the accent tint.
  return (
    <fieldset className="space-y-2">
      <legend className="text-[13px] font-medium text-text-h">{legend}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <Chip
            key={option}
            selected={selected.includes(option)}
            onClick={() => toggle(option)}
          >
            {labels?.[option] ?? option}
          </Chip>
        ))}
      </div>
    </fieldset>
  )
}

export default function Search() {
  const [filters, setFilters] = useState<SearchFilters>(DEFAULT_FILTERS)
  const [collectionError, setCollectionError] = useState<string | null>(null)
  const [peopleError, setPeopleError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  // Both requests fire per search, so responses can arrive out of order. Only
  // the newest run is allowed to write state.
  const runId = useRef(0)

  const run = useCallback(async (next: SearchFilters) => {
    const id = ++runId.current
    const term = next.q.trim()
    const lookForPeople = term.length >= PEOPLE_MIN && term.length <= PEOPLE_MAX

    setBusy(true)

    // Settled separately: a failing people search must not be reported as a
    // failed collection search, and the other way round.
    const [collectionsOutcome, peopleOutcome] = await Promise.allSettled([
      searchCollections(next),
      lookForPeople ? searchPeople(term) : Promise.resolve([] as SearchHit[]),
    ])

    // A newer search has started; this one's answers are stale.
    if (runId.current !== id) return

    if (collectionsOutcome.status === 'fulfilled') {
      setCollectionError(null)
    } else {
      const err = collectionsOutcome.reason
      setCollectionError(
        err instanceof ApiError ? err.message : 'Could not search collections.',
      )
    }

    if (lookForPeople) {
      if (peopleOutcome.status === 'fulfilled') {
        setPeopleError(null)
      } else {
        const err = peopleOutcome.reason
        setPeopleError(
          err instanceof ApiError ? err.message : 'Could not search people.',
        )
      }
    } else {
      setPeopleError(null)
    }

    setBusy(false)
  }, [])

  // Debounced, so typing does not fire two requests per keystroke.
  useEffect(() => {
    const handle = setTimeout(() => void run(filters), filters.q ? 300 : 0)
    return () => clearTimeout(handle)
  }, [filters, run])

  const set = <K extends keyof SearchFilters>(key: K, value: SearchFilters[K]) =>
    setFilters((current) => ({ ...current, [key]: value, page: 1 }))

  const term = filters.q.trim()
  const peopleRequested = term.length >= PEOPLE_MIN && term.length <= PEOPLE_MAX
  const activeFilterCount =
    (filters.scope !== 'all' ? 1 : 0) +
    filters.status.length +
    filters.has.length +
    (filters.sort !== 'recent' ? 1 : 0)

  // With nothing typed and nothing narrowed, the bar is the whole page: it sits
  // on its own in the middle of the space rather than crowding the top of a
  // list of everything. The moment anything is entered the header collapses back
  // to the top and the results take over.
  const idle =
    term.length === 0 &&
    activeFilterCount === 0 &&
    filters.dateFrom === '' &&
    filters.dateTo === ''

  // The extra narrowings live in a popover, so — unlike a disclosure sitting in
  // the flow — it has to be dismissed deliberately: on Escape, or on a click
  // anywhere else. `open` is mirrored into state because a <details> toggling is
  // not a React update, and without it the listeners below would only ever be
  // attached on a render that happened to find the menu shut.
  const filterMenu = useRef<HTMLDetailsElement>(null)
  const [filtersOpen, setFiltersOpen] = useState(false)

  useEffect(() => {
    const menu = filterMenu.current
    if (!menu || !filtersOpen) return

    const close = () => {
      menu.open = false
    }
    const onPointerDown = (event: PointerEvent) => {
      if (!menu.contains(event.target as Node)) close()
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      close()
      menu.querySelector('summary')?.focus()
    }

    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [filtersOpen])

  return (
    <section className="space-y-6">
      <header
        className={`mx-auto flex w-full max-w-[900px] flex-col items-center gap-3 text-center ${
          idle ? 'min-h-[46svh] justify-center' : 'pb-2'
        }`}
      >
        <h1 className="text-[28px] font-semibold tracking-heading text-text-h">Search</h1>

        {/* One box for everything, and the only thing on the page until it is
            used. Collections search every word in a collection; people search
            usernames. Both run off this same query. */}
        <div className="w-full">
          <label htmlFor="search-q" className="sr-only">
            Search collections and people
          </label>
          <input
            id="search-q"
            type="search"
            value={filters.q}
            onChange={(event) => set('q', event.target.value)}
            placeholder="trip budget, or a username"
            autoComplete="off"
            className="w-full rounded-full bg-surface px-7 py-4 text-[18px] text-text-h shadow-float outline-none placeholder:text-inactive focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          />
          <p className="mt-3 text-[13px] text-text">
            {peopleRequested
              ? 'Every word must appear in a collection. People are matched on username.'
              : term.length > PEOPLE_MAX
                ? `Usernames are at most ${PEOPLE_MAX} characters, so only collections are searched.`
                : `Leave this empty to browse collections. Type ${PEOPLE_MIN} or more characters to find people.`}
          </p>
        </div>

        {/* The two narrowings that matter most sit out in the open under the bar;
            the rest stay tucked away behind the summary. */}
        <div className="flex flex-wrap items-center justify-center gap-2">
          <label htmlFor="search-scope" className="sr-only">
            Whose collections
          </label>
          <select
            id="search-scope"
            value={filters.scope}
            onChange={(event) => set('scope', event.target.value as Scope)}
            className={selectClass}
          >
            {SCOPES.map((scope) => (
              <option key={scope} value={scope}>
                {SCOPE_LABELS[scope]}
              </option>
            ))}
          </select>

          <details
            ref={filterMenu}
            className="group relative"
            onToggle={(event) => setFiltersOpen(event.currentTarget.open)}
          >
            <summary
              className={`flex cursor-pointer list-none items-center gap-1.5 rounded-full bg-fill px-4 py-2 text-[14px] text-text-h ${focusRing}`}
            >
              Filters
              {activeFilterCount > 0 && (
                <span className="rounded-full bg-accent px-2 py-0.5 text-[12px] font-medium text-on-accent">
                  {activeFilterCount}
                </span>
              )}
            </summary>

            <Card className="absolute top-full left-1/2 z-10 mt-2 w-[min(30rem,90vw)] -translate-x-1/2">
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label htmlFor="search-sort" className="text-[13px] font-medium text-text-h">
                    Sort by
                  </label>
                  <select
                    id="search-sort"
                    value={filters.sort}
                    onChange={(event) => set('sort', event.target.value as Sort)}
                    className={`${selectClass} w-full`}
                  >
                    {SORT_OPTIONS.map((sort) => (
                      <option key={sort} value={sort}>
                        {SORT_LABELS[sort]}
                      </option>
                    ))}
                  </select>
                </div>

                <Toggles
                  legend="Status"
                  options={COLLECTION_STATUSES.filter((status) => status !== 'new')}
                  selected={filters.status}
                  onChange={(next) => set('status', next)}
                  labels={STATUS_LABELS}
                />

                <Toggles
                  legend="Contains"
                  options={WIDGET_TYPES}
                  selected={filters.has}
                  onChange={(next) => set('has', next)}
                  labels={HAS_LABELS}
                />

                <Button
                  variant="secondary"
                  onClick={() => setFilters(DEFAULT_FILTERS)}
                >
                  Clear filters
                </Button>
              </div>
            </Card>
          </details>
        </div>
      </header>

      {busy && (
        <p role="status" className="text-center text-[15px] text-text">
          Searching…
        </p>
      )}

      {collectionError && (
        <p role="alert" className="text-[15px] text-danger">
          {collectionError}
        </p>
      )}

      {peopleError && (
        <p role="alert" className="text-[15px] text-danger">
          {peopleError}
        </p>
      )}
    </section>
  )
}