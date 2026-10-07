import type { Widget } from './collections'

export const apiBase: string = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000'

// Uploaded pictures are served by the backend, so their paths need its address.
export const fileUrl = (path: string) => apiBase + path

export const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`

// "Today", "in 3 days", "2 days ago"
export function when(x: { dateStatus?: string | null; daysUntil?: number | null }) {
  if (!x.dateStatus || x.daysUntil == null) return 'No date'
  if (x.dateStatus === 'today') return 'Today'
  return x.dateStatus === 'upcoming' ? `in ${plural(x.daysUntil, 'day')}` : `${plural(-x.daysUntil, 'day')} ago`
}

export const fmtDate = (d: string) =>
  new Date(`${d}T00:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })

// A steady tilt (-6 to 6 degrees) taken from the widget's id, so it never changes on reload.
export const tilt = (id: string) => (parseInt(id.slice(-4), 16) % 13) - 6

// How each kind of widget is named in the carousel and in the "Add a widget" chooser.
export const TYPES: Record<Widget['type'], string> = {
  notes: '📝 Notes',
  date: '📅 Date',
  image: '🖼️ Image',
  link: '🔗 Link',
}
