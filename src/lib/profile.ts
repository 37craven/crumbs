import { api } from './api'
import { passwordChangeSchema, profileSchema, userSchema } from './schemas'
import type { PasswordChangeInput, ProfileInput, User } from './schemas'

export async function updateProfile(input: ProfileInput): Promise<User> {
  const body = profileSchema.parse(input)
  const { data } = await api.patch('/api/auth/me', body)
  return userSchema.parse(data.user)
}

export async function changePassword(input: PasswordChangeInput): Promise<void> {
  const { currentPassword, newPassword } = passwordChangeSchema.parse(input)
  await api.post('/api/auth/password', { currentPassword, newPassword })
}