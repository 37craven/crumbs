import { z } from 'zod'
import { api } from './api'
import { crumbRecordSchema } from './schemas'
import type { Crumb } from './schemas'

const dateFormat = new Intl.DateTimeFormat(undefined, { dateStyle: 'long' })

export function crumbSrc(url: string): string {
  return /^https?:\/\//.test(url) ? url : `${api.defaults.baseURL ?? ''}${url}`
}

// The caption if there is one, otherwise the day it was uploaded.
export function crumbLabel(crumb: Crumb): string {
  const caption = crumb.caption.trim()
  if (caption) return caption
  const date = new Date(crumb.createdAt)
  return Number.isNaN(date.getTime()) ? '' : dateFormat.format(date)
}

export async function fetchCrumbs(): Promise<Crumb[]> {
  const { data } = await api.get('/api/crumbs')
  return z.object({ crumbs: z.array(crumbRecordSchema) }).parse(data).crumbs
}

export async function uploadCrumb(image: Blob, caption: string): Promise<Crumb> {
  const trimmed = caption.trim()
  const { data } = await api.post('/api/crumbs', image, {
    params: trimmed ? { caption: trimmed } : undefined,
    headers: { 'Content-Type': image.type },
    timeout: 60_000,
  })
  return crumbRecordSchema.parse(data.crumb)
}
