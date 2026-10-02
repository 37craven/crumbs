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

export function avatarSrc(url: string): string {
  return /^https?:\/\//.test(url) ? url : `${api.defaults.baseURL ?? ''}${url}`
}

export async function uploadAvatar(image: Blob): Promise<User> {
  const { data } = await api.put('/api/auth/avatar', image, {
    headers: { 'Content-Type': image.type },
  })
  return userSchema.parse(data.user)
}

export async function removeAvatar(): Promise<User> {
  const { data } = await api.delete('/api/auth/avatar')
  return userSchema.parse(data.user)
}