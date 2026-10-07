import type { CSSProperties } from 'react'
import type { Widget } from '../lib/collections'
import { fileUrl, tilt, when } from '../lib/format'

// One widget in a row: a tilted, overlapping portrait card.
export default function WidgetCard({ w, onOpen }: { w: Widget; onOpen: () => void }) {
  const style = { '--r': `${tilt(w.id)}deg` } as CSSProperties

  if (w.type === 'image') {
    const photo = w.image ? { backgroundImage: `url(${fileUrl(w.image.url)})` } : {}
    return (
      <div className="pc fan" onClick={onOpen} style={{ ...style, ...photo }}>
        {!w.image && <em>Empty image<br />click to add a picture</em>}
      </div>
    )
  }

  if (w.type === 'link') {
    return (
      <div className="pc fan link" onClick={onOpen} style={style}>
        {w.preview?.image && <img src={w.preview.image} alt="" />}
        {w.url ? (
          <div className="lt">
            <b>{w.preview?.title ?? w.url}</b>
            <small className="muted">{w.preview?.siteName}</small>
          </div>
        ) : (
          <em>Empty link<br />click to paste one</em>
        )}
      </div>
    )
  }

  if (w.type === 'date') {
    return (
      <div className="pc fan" onClick={onOpen} style={style}>
        <b>📅 Date</b>
        {w.date ? (
          <>
            <p className="big">{w.date}</p>
            <p className="muted">{w.label}{w.label && <br />}{when(w)}</p>
          </>
        ) : (
          <em>No date yet<br />click to pick one</em>
        )}
      </div>
    )
  }

  const items = w.checklist ?? []
  return (
    <div className="pc fan" onClick={onOpen} style={style}>
      <b>📝 Notes</b>
      {w.body && <p>{w.body}</p>}
      <ul>
        {items.slice(0, 6).map((i) => (
          <li key={i.id}>{i.done ? '☑' : '☐'} {i.text}</li>
        ))}
      </ul>
      {!w.body && !items.length && <em>Empty notes<br />click to write</em>}
    </div>
  )
}
