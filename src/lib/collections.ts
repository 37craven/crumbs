import { z } from 'zod'
import { api } from './api'

// Enough of a collection to fill the "add to a collection" picker. The full
// record is much bigger and the picker only needs a name to show.
export const collectionOptionSchema = z.object({
  id: z.string(),
  title: z.string(),
})

export type CollectionOption = z.infer<typeof collectionOptionSchema>

// Collections the signed-in user can file a crumb into: the ones they created
// plus the ones shared with them. A collection they cannot edit is not worth
// offering, and the server would refuse it anyway.
export async function fetchCollections(): Promise<CollectionOption[]> {
  const { data } = await api.get('/api/collections', { params: { limit: 50 } })
  return z
    .object({ collections: z.array(collectionOptionSchema) })
    .parse(data)
    .collections
}
