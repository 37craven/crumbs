import { z } from 'zod'
import { api } from './api'
import { friendSchema } from './schemas'
import type { Friend } from './schemas'

export async function fetchFriends(): Promise<Friend[]> {
  const { data } = await api.get('/api/friends')
  return z.object({ friends: z.array(friendSchema) }).parse(data).friends
}

export async function fetchSuggestedFriends(): Promise<Friend[]> {
  const { data } = await api.get('/api/friends/suggestions')
  return z.object({ suggestions: z.array(friendSchema) }).parse(data).suggestions
}

// Send a request. If they already asked me, the server accepts theirs instead.
export async function sendFriendRequest(userId: string): Promise<void> {
  await api.post('/api/friends/requests', { userId })
}

export async function acceptFriendRequest(requestId: string): Promise<void> {
  await api.patch(`/api/friends/requests/${encodeURIComponent(requestId)}/accept`)
}

// Cancels a request I sent, or declines one sent to me.
export async function cancelFriendRequest(requestId: string): Promise<void> {
  await api.delete(`/api/friends/requests/${encodeURIComponent(requestId)}`)
}

export async function removeFriend(userId: string): Promise<void> {
  await api.delete(`/api/friends/${encodeURIComponent(userId)}`)
}