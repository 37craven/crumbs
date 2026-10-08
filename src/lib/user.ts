import { z } from 'zod'
import { api } from './api'
import { crumbRecordSchema, publicProfileSchema } from './schemas'
import type { Crumb, PublicProfile } from './schemas'

// The minimum a person needs for us to show their name and avatar. Users,
// friends and public profiles all satisfy this.
export type NamedUser = {
  username: string
  firstName?: string | null
  lastName?: string | null
  avatarUrl?: string | null
}

// "First Last", or whichever part exists, or '' when neither is set.
export function fullName(user: Pick<NamedUser, 'firstName' | 'lastName'>): string {
  return [user.firstName, user.lastName]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(' ')
}

// One person's profile. Any signed-in user may ask; rejects with an ApiError
// whose status is 404 when there is no such username.
export async function fetchUserProfile(username: string): Promise<PublicProfile> {
  const { data } = await api.get(`/api/users/${encodeURIComponent(username)}`)
  return publicProfileSchema.parse(data.user)
}

// That person's crumbs. The server only answers for accepted friends (anyone
// else gets a 404), so only ask when the profile says relationship: 'friends'.
export async function fetchUserCrumbs(username: string): Promise<Crumb[]> {
  const { data } = await api.get(`/api/users/${encodeURIComponent(username)}/crumbs`)
  return z.object({ crumbs: z.array(crumbRecordSchema) }).parse(data).crumbs
}