import type { CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import type { Collection, Tile } from '../lib/collections'
import { fileUrl, fmtDate, when } from '../lib/format'

const TILT = [-5, 4, -3, 5] // left, right, left, right, like the reference

function TileCard({ t, rotate }: { t: Tile; rotate: number }) {
  const style = { '--r': `${rotate}deg` } as CSSProperties
  if (t.type === 'date') {
    return (
      <div className="ft" style={style}>
        <b>📅 Date</b>
        <span className="d">{t.date}</span>
        <span className="muted">{when(t)}</span>
      </div>
    )
  }
  if (t.type === 'note') {
    return (
      <div className="ft" style={style}>
        <b>📝 Notes</b>
        {t.text?.slice(0, 70)}
      </div>
    )
  }
  if (t.type === 'image') {
    return <div className="ft" style={{ ...style, backgroundImage: `url(${fileUrl(t.url ?? '')})` }} />
  }
  return (
    <div className="ft lk" style={style}>
      {t.image && <img src={t.image} alt="" />}
      <div className="lt">
        <b>{(t.title ?? t.siteName ?? t.url ?? '').slice(0, 30)}</b>
        <span className="muted">{t.siteName}</span>
      </div>
    </div>
  )
}

// One collection on the Collections and Search pages: a fanned row of up to
// four cards, then the title, the date and photo count, and the people.
export default function CollectionCard({ c }: { c: Collection }) {
  const s = c.summary
  const memories = s.imageCount ? `${s.imageCount} ${s.imageCount === 1 ? 'Memory' : 'Memories'}` : ''
  const people = [c.owner, ...c.collaborators]
  const wobble = (parseInt(c.id.slice(-2), 16) % 3) - 1 // a little variety between collections
  const info = [s.eventDate && fmtDate(s.eventDate), memories, c.isOverdue && 'overdue'].filter(Boolean).join(' • ')

  return (
    <Link to={`/collection/${c.id}`} className="card folder">
      <div className="fan4">
        {s.tiles.length ? (
          s.tiles.map((t, i) => <TileCard key={i} t={t} rotate={TILT[i] + wobble} />)
        ) : (
          <div className="ft empty" style={{ '--r': '0deg' } as CSSProperties}>Empty collection</div>
        )}
      </div>
      <b>{c.title || 'Untitled collection'}</b>
      <span className="muted">{info}</span>
      <div className="fm">
        {people.slice(0, 3).map((p) => (
          <span key={p.id} className="av" title={p.username ?? ''}>{(p.username ?? '?')[0].toUpperCase()}</span>
        ))}
        {people.length > 3 && <span className="av more">+{people.length - 3}</span>}
        <span className={`badge ${c.status}`} style={{ marginLeft: 8 }}>{c.status}</span>
      </div>
    </Link>
  )
}
