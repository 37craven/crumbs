import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import WidgetCard from '../components/WidgetCard'
import { Carousel, Chooser } from '../components/WidgetModal'
import * as api from '../lib/collections'
import type { CollectionData, Widget } from '../lib/collections'
import { apiBase, plural } from '../lib/format'
import { toast } from '../lib/toast'

// /newCollection and /collection/:id. Opening /newCollection creates a blank
// collection straight away. Leave without adding anything and it is deleted;
// add a title, a tag or a widget and it becomes a draft with its own address.
function CollectionView({ id }: { id?: string }) {
  const navigate = useNavigate()
  const [data, setData] = useState<CollectionData | null>(null)
  const [focusId, setFocusId] = useState<string | null>(null) // the widget open in the carousel
  const [chooserRow, setChooserRow] = useState<string | null>(null) // the row getting a new widget
  const blank = useRef<string | null>(null) // id of a still-blank collection, to discard on leaving
  const creating = useRef(false)

  const load = useCallback((cid: string) => api.get(cid).then((d) => {
    setData(d)
    blank.current = d.event.status === 'new' ? cid : null
  }), [])

  useEffect(() => {
    const fail = (e: Error) => { toast(e.message, true); navigate('/collections') }
    if (id) { load(id).catch(fail); return }
    if (creating.current) return // React runs effects twice in development
    creating.current = true
    api.create().then((d) => { setData(d); blank.current = d.event.id }).catch(fail)
  }, [id, load, navigate])

  // The first thing added to a blank collection gives it its own address.
  useEffect(() => {
    if (!id && data && data.event.status !== 'new') navigate(`/collection/${data.event.id}`, { replace: true })
  }, [id, data, navigate])

  // Leaving (or closing the tab) with a collection still blank deletes it.
  useEffect(() => {
    const discard = () => {
      if (blank.current) void fetch(`${apiBase}/api/events/${blank.current}`, { method: 'DELETE', credentials: 'include', keepalive: true })
    }
    window.addEventListener('pagehide', discard)
    return () => { window.removeEventListener('pagehide', discard); discard() }
  }, [])

  const eventId = data?.event.id
  // Runs a change, shows any error, then reloads so the page matches the server.
  const run = useCallback(async (fn: () => Promise<unknown>) => {
    try { await fn() } catch (e) { toast((e as Error).message, true) }
    if (eventId) await load(eventId)
  }, [eventId, load])

  const focus = data?.widgets.find((w) => w.id === focusId)
  const strip = useMemo(
    () => (focus ? data?.widgets.filter((w) => w.rowId === focus.rowId) ?? [] : []),
    [focus, data],
  )
  const step = useCallback((d: number) => {
    const i = strip.findIndex((w) => w.id === focusId)
    setFocusId(strip[i + d]?.id ?? focusId)
  }, [strip, focusId])

  // Keyboard: Escape closes, the arrow keys move along the row.
  useEffect(() => {
    if (!focusId && !chooserRow) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setFocusId(null); setChooserRow(null) }
      if (!focusId || /INPUT|TEXTAREA|SELECT/.test((e.target as HTMLElement).tagName)) return
      if (e.key === 'ArrowRight') step(1)
      if (e.key === 'ArrowLeft') step(-1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [focusId, chooserRow, step])

  if (!data) return null
  const e = data.event
  const cid = e.id

  const pick = async (type: Widget['type']) => {
    const row = chooserRow
    setChooserRow(null)
    if (!row) return
    try { setFocusId((await api.addWidget(cid, row, type)).widget.id) } catch (err) { toast((err as Error).message, true) }
    await load(cid)
  }

  const removeCollection = async () => {
    if (!window.confirm('Delete this collection for everyone?')) return
    try {
      const r = (await api.remove(cid)) as { deleted: { widgets: number; images: number } }
      blank.current = null
      toast(`Deleted: ${plural(r.deleted.widgets, 'widget')}, ${plural(r.deleted.images, 'picture')}`)
      navigate('/collections')
    } catch (err) { toast((err as Error).message, true) }
  }

  return (
    <>
      <button className="link" onClick={() => navigate('/collections')}>← Collections</button>

      <div className="head">
        <input
          className="title-input"
          key={e.title}
          defaultValue={e.title}
          placeholder="Collection title…"
          maxLength={80}
          onBlur={(ev) => ev.target.value !== e.title && void run(() => api.patch(cid, { title: ev.target.value }))}
        />
        <span className={`badge ${e.isOverdue ? 'overdue' : e.status}`}>{e.isOverdue ? 'overdue' : e.status}</span>
      </div>
      <p className="muted">
        {e.status === 'new' ? 'Add a title or a widget to keep this collection. Leave now and it is discarded.' : ''}
      </p>
      <p className="muted">
        By <b>{e.owner.username}</b>
        {e.collaborators.length > 0 && ` · shared with ${e.collaborators.map((c) => c.username).join(', ')}`} · you are the {e.role}
      </p>

      <div className="tagbar">
        {e.tags.map((t) => (
          <span key={t} className="chip">
            #{t}
            <button title="Remove tag" onClick={() => void run(() => api.patch(cid, { tags: e.tags.filter((x) => x !== t) }))}>✕</button>
          </span>
        ))}
        <form onSubmit={(ev) => {
          ev.preventDefault()
          const input = ev.currentTarget.elements[0] as HTMLInputElement
          const tag = input.value.trim().replace(/^#/, '')
          input.value = ''
          if (tag) void run(() => api.patch(cid, { tags: [...e.tags, tag] }))
        }}>
          <input placeholder="＋ Add a tag" maxLength={24} />
        </form>
      </div>

      <div className="actions">
        {e.nextStatuses.length > 0 && (
          <label>
            Status{' '}
            <select value="" onChange={(ev) => void run(() => api.setStatus(cid, ev.target.value))}>
              <option value="" disabled>{e.status}</option>
              {e.nextStatuses.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </label>
        )}
        {e.role === 'owner' && <button className="danger" onClick={() => void removeCollection()}>Delete collection</button>}
      </div>

      {e.rows.map((row) => (
        <section className="row" key={row.id}>
          <div className="rowhead">
            <input
              className="rn"
              key={row.name}
              defaultValue={row.name}
              placeholder="Name this row"
              maxLength={40}
              onBlur={(ev) => ev.target.value !== row.name && void run(() => api.renameRow(cid, row.id, ev.target.value))}
            />
            <button
              className="danger"
              title="Delete row"
              onClick={() => window.confirm('Delete this row and everything in it?') && void run(() => api.deleteRow(cid, row.id))}
            >🗑</button>
          </div>
          <div className="strip">
            {data.widgets.filter((w) => w.rowId === row.id).map((w) => (
              <WidgetCard key={w.id} w={w} onOpen={() => setFocusId(w.id)} />
            ))}
            <div className="pc add" onClick={() => setChooserRow(row.id)}><span>＋</span>Add widget</div>
          </div>
        </section>
      ))}
      <button className="addrow" onClick={() => void run(() => api.addRow(cid))}>＋ Add a row</button>

      {chooserRow && <Chooser onPick={(t) => void pick(t)} onClose={() => setChooserRow(null)} />}
      {focus && (
        <Carousel
          widgets={strip}
          index={strip.findIndex((w) => w.id === focusId)}
          onStep={step}
          onClose={() => setFocusId(null)}
          onDelete={(w) => { if (window.confirm('Delete this widget?')) { setFocusId(null); void run(() => api.deleteWidget(w.id)) } }}
          run={(fn) => void run(fn)}
        />
      )}
    </>
  )
}

// The key makes React start fresh whenever the collection (or "new") changes.
export default function Collection() {
  const { id } = useParams()
  return <CollectionView key={id ?? 'new'} id={id} />
}
