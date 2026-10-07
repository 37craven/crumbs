import type { FormEvent } from 'react'
import * as api from '../lib/collections'
import type { Widget } from '../lib/collections'
import { TYPES, fileUrl } from '../lib/format'

type Run = (fn: () => Promise<unknown>) => void

// The first input of a form, read when it is submitted.
const typed = (e: FormEvent<HTMLFormElement>) => {
  e.preventDefault()
  const input = e.currentTarget.elements[0] as HTMLInputElement
  const value = input.value.trim()
  input.value = ''
  return value
}

// What you edit inside the carousel, depending on the widget's type.
function Editor({ w, run }: { w: Widget; run: Run }) {
  const edit = (body: object) => run(() => api.patchWidget(w.id, body))

  if (w.type === 'image') {
    return (
      <>
        {w.image ? <img className="big-img" src={fileUrl(w.image.url)} alt="" /> : <p className="muted">No picture yet</p>}
        <div>
          <label className="btn">
            {w.image ? 'Replace picture' : 'Upload picture'}
            <input
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) run(() => api.uploadImage(w.id, file))
              }}
            />
          </label>{' '}
          {w.image && <button onClick={() => run(() => api.removeImage(w.id))}>Remove picture</button>}
        </div>
      </>
    )
  }

  if (w.type === 'date') {
    return (
      <>
        <input type="date" value={w.date ?? ''} onChange={(e) => edit({ date: e.target.value || null })} />
        <input
          key={w.label}
          placeholder="Label (e.g. Departure)"
          defaultValue={w.label}
          onBlur={(e) => e.target.value !== w.label && edit({ label: e.target.value })}
        />
      </>
    )
  }

  if (w.type === 'link') {
    return (
      <>
        {w.embedUrl ? (
          <iframe src={w.embedUrl} allowFullScreen />
        ) : (
          w.url && (
            <a className="prev" href={w.url} target="_blank" rel="noopener noreferrer">
              {w.preview?.image && <img src={w.preview.image} alt="" />}
              <b>{w.preview?.title ?? w.url}</b>
              <small className="muted">
                {w.preview?.siteName}
                {w.preview?.status === 'unavailable' && ' · preview unavailable'}
              </small>
            </a>
          )
        )}
        <form onSubmit={(e) => { e.preventDefault(); edit({ url: (e.currentTarget.elements[0] as HTMLInputElement).value }) }}>
          <input key={w.url} placeholder="https://…" defaultValue={w.url ?? ''} />
          <button>Save</button>
        </form>
      </>
    )
  }

  // Notes: free text and a checklist, together.
  const items = (w.checklist ?? []).map(({ id, text, done }) => ({ id, text, done }))
  return (
    <>
      <textarea
        key={w.body}
        rows={6}
        placeholder="Write notes…"
        defaultValue={w.body}
        onBlur={(e) => e.target.value !== w.body && edit({ body: e.target.value })}
      />
      <ul className="check">
        {items.map((i) => (
          <li key={i.id}>
            <label>
              <input type="checkbox" checked={i.done} onChange={(e) => run(() => api.tickItem(w.id, i.id, e.target.checked))} /> {i.text}
            </label>
            <button onClick={() => edit({ checklist: items.filter((x) => x.id !== i.id) })}>✕</button>
          </li>
        ))}
      </ul>
      <form onSubmit={(e) => { const text = typed(e); if (text) edit({ checklist: [...items, { text }] }) }}>
        <input placeholder="Add a checklist item…" />
        <button>Add</button>
      </form>
    </>
  )
}

interface CarouselProps {
  widgets: Widget[] // the widgets of the clicked widget's row
  index: number
  onStep: (direction: number) => void
  onClose: () => void
  onDelete: (w: Widget) => void
  run: Run
}

// The focus view: one widget at a time, with arrows to move along its row.
export function Carousel({ widgets, index, onStep, onClose, onDelete, run }: CarouselProps) {
  const w = widgets[index]
  return (
    <div id="modal" className="show" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <button className="nav" disabled={index === 0} onClick={() => onStep(-1)}>‹</button>
      <div className="sheet">
        <button className="x" onClick={onClose}>✕</button>
        <h3>{TYPES[w.type]} <small className="muted">{index + 1} / {widgets.length}</small></h3>
        <div className="mb"><Editor w={w} run={run} /></div>
        <button className="danger" onClick={() => onDelete(w)}>Delete this widget</button>
      </div>
      <button className="nav" disabled={index === widgets.length - 1} onClick={() => onStep(1)}>›</button>
    </div>
  )
}

// "Add widget": pick which kind to add.
export function Chooser({ onPick, onClose }: { onPick: (type: Widget['type']) => void; onClose: () => void }) {
  return (
    <div id="modal" className="show" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="sheet">
        <button className="x" onClick={onClose}>✕</button>
        <h3>Add a widget</h3>
        <div className="pick">
          {(Object.keys(TYPES) as Widget['type'][]).map((t) => (
            <button key={t} onClick={() => onPick(t)}>{TYPES[t]}</button>
          ))}
        </div>
      </div>
    </div>
  )
}
