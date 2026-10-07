import { useEffect, useState } from 'react'
import CollectionCard from '../components/CollectionCard'
import { search } from '../lib/collections'
import type { Collection } from '../lib/collections'
import { plural } from '../lib/format'
import { toast } from '../lib/toast'

// /search: just a search bar until the user types or picks a filter.
// The bar matches titles, tags and dates ("december" finds December dates).
export default function Search() {
  const [q, setQ] = useState('')
  const [scope, setScope] = useState('all')
  const [status, setStatus] = useState('')
  const [found, setFound] = useState<{ items: Collection[]; total: number; query: string } | null>(null)

  const text = q.trim()
  const active = Boolean(text || scope !== 'all' || status)

  useEffect(() => {
    if (!active) return
    const params = new URLSearchParams()
    if (text) params.set('q', text)
    if (scope !== 'all') params.set('scope', scope)
    if (status) params.set('status', status)
    const query = params.toString()

    const timer = setTimeout(() => {
      search(query)
        .then((r) => setFound({ items: r.events, total: r.pagination.total, query }))
        .catch((e: Error) => toast(e.message, true))
    }, 250) // wait until the user stops typing
    return () => clearTimeout(timer)
  }, [active, text, scope, status])

  const shown = active ? found : null

  return (
    <div className={`sw${active ? '' : ' idle'}`}>
      <h2>Search</h2>
      <input
        className="sbar"
        autoFocus
        autoComplete="off"
        placeholder="Search collections, tags or dates (try “december”)…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
      <div className="filters">
        <select value={scope} onChange={(e) => setScope(e.target.value)}>
          <option value="all">All Collections</option>
          <option value="mine">Created by me</option>
          <option value="shared">Shared with me</option>
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">Any status</option>
          {['draft', 'planned', 'done', 'archived'].map((s) => <option key={s}>{s}</option>)}
        </select>
      </div>
      {shown && (
        <>
          <p className="muted">{plural(shown.total, 'match')}</p>
          <div id="res">
            {shown.items.length ? (
              <div className="grid">{shown.items.map((c) => <CollectionCard key={c.id} c={c} />)}</div>
            ) : (
              <p className="empty">No collections match “{text}”.</p>
            )}
          </div>
        </>
      )}
    </div>
  )
}
