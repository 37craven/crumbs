import { avatarSrc } from '../lib/profile'
import type { User } from '../lib/schemas'
import { fullName } from '../lib/user'

export default function Avatar({
  user,
  className,
}: {
  user: User
  className: string
}) {
  if (user.avatarUrl) {
    return (
      <img
        src={avatarSrc(user.avatarUrl)}
        alt=""
        className={`rounded-full border border-border object-cover ${className}`}
      />
    )
  }

  const initial = (fullName(user) || user.username).charAt(0).toUpperCase()

  return (
    <div
      aria-hidden="true"
      className={`grid select-none place-items-center rounded-full border border-accent-border bg-accent-bg font-heading leading-none text-accent ${className}`}
    >
      {initial}
    </div>
  )
}