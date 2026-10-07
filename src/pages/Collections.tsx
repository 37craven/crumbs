import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import CollectionCard from '../components/CollectionCard'
import { list } from '../lib/collections'
import type { Collection } from '../lib/collections'
import { plural } from '../lib/format'
import { toast } from '../lib/toast'

// /collections: every collection I created or that was shared with me.
export default function Collections() {
  const [items, setItems] = useState<Collection[] | null>(null)

  useEffect(() => {
    list().then(setItems).catch((e: Error) => toast(e.message, true))
  }, [])

  if (!items) return null

  return (
    <>
      <h2>Collections <small className="muted">{plural(items.length, 'collection')}</small></h2>
      {!items.length && <p className="empty">No collections yet. Click “Add collection”.</p>}
      <div className="grid">
        {items.map((c) => <CollectionCard key={c.id} c={c} />)}
        <Link to="/newCollection" className="card add">
          <span style={{ fontSize: 34, color: 'var(--accent)' }}>＋</span>Add collection
        </Link>
      </div>
    </>
  )
}
