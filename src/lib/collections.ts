import { api } from './api'

export interface Person {
  id: string
  username: string | null
}

// One of the four tiles on a collection card (date, note, image or link).
export interface Tile {
  type: 'date' | 'note' | 'image' | 'link'
  date?: string
  dateStatus?: string | null
  daysUntil?: number | null
  text?: string
  url?: string
  title?: string | null
  image?: string | null
  siteName?: string | null
}

export interface Collection {
  id: string
  title: string
  tags: string[]
  status: 'new' | 'draft' | 'planned' | 'done' | 'archived'
  nextStatuses: string[]
  role: 'owner' | 'collaborator'
  isOverdue: boolean
  owner: Person
  collaborators: Person[]
  rows: { id: string; name: string }[]
  summary: { eventDate: string | null; imageCount: number; tiles: Tile[] }
}

export interface Widget {
  id: string
  rowId: string
  type: 'notes' | 'date' | 'image' | 'link'
  body?: string
  checklist?: { id: string; text: string; done: boolean }[]
  date?: string | null
  label?: string
  dateStatus?: string | null
  daysUntil?: number | null
  image?: { url: string } | null
  url?: string | null
  embedUrl?: string | null
  preview?: { title: string | null; image: string | null; siteName: string | null; status: string } | null
}

export interface CollectionData {
  event: Collection // the backend still calls a collection an "event"
  widgets: Widget[]
}

type Method = 'get' | 'post' | 'patch' | 'delete'

async function call<T = unknown>(method: Method, url: string, data?: unknown): Promise<T> {
  // Files must go out as multipart/form-data; everything else is JSON.
  const headers = data instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : undefined
  return (await api.request<T>({ method, url, data, headers })).data
}

const base = '/api/events'

// ---- Collections ----
export const list = () => call<{ events: Collection[] }>('get', `${base}?limit=100`).then((r) => r.events)
export const search = (query: string) =>
  call<{ events: Collection[]; pagination: { total: number } }>('get', `${base}/search?${query}`)
export const create = () => call<CollectionData>('post', base, {})
export const get = (id: string) => call<CollectionData>('get', `${base}/${id}`)
export const patch = (id: string, body: { title?: string; tags?: string[] }) => call('patch', `${base}/${id}`, body)
export const setStatus = (id: string, status: string) => call('patch', `${base}/${id}/status`, { status })
export const remove = (id: string) => call('delete', `${base}/${id}`)

// ---- Rows ----
export const addRow = (id: string) => call('post', `${base}/${id}/rows`, {})
export const renameRow = (id: string, rowId: string, name: string) => call('patch', `${base}/${id}/rows/${rowId}`, { name })
export const deleteRow = (id: string, rowId: string) => call('delete', `${base}/${id}/rows/${rowId}`)

// ---- Widgets ----
export const addWidget = (id: string, rowId: string, type: Widget['type']) =>
  call<{ widget: Widget }>('post', `${base}/${id}/rows/${rowId}/widgets`, { type })
export const patchWidget = (widgetId: string, body: object) => call('patch', `/api/widgets/${widgetId}`, body)
export const deleteWidget = (widgetId: string) => call('delete', `/api/widgets/${widgetId}`)
export const tickItem = (widgetId: string, itemId: string, done: boolean) =>
  call('patch', `/api/widgets/${widgetId}/checklist/${itemId}`, { done })
export const uploadImage = (widgetId: string, file: File) => {
  const form = new FormData()
  form.append('image', file)
  return call('post', `/api/widgets/${widgetId}/image`, form)
}
export const removeImage = (widgetId: string) => call('delete', `/api/widgets/${widgetId}/image`)
