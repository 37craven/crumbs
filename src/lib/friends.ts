import { z } from 'zod'
import { api } from './api'
import { friendSchema } from './schemas'
import type { Friend } from './schemas'

export async function fetchFriends(): Promise<Friend[]> {
  const { data } = await api.get('/api/auth/friends')
  return z.object({ friends: z.array(friendSchema) }).parse(data).friends
}

export async function fetchSuggestedFriends(): Promise<Friend[]> {
  const { data } = await api.get('/api/auth/friends/suggestions')
  return z.object({ suggestions: z.array(friendSchema) }).parse(data).suggestions
}