import type { User } from './schemas'

export function fullName(user: User): string {
  return [user.firstName, user.lastName]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(' ')
}
