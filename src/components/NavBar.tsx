import { Link, NavLink } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import Avatar from './Avatar'

const pill = ({ isActive }: { isActive: boolean }) => `btn ${isActive ? 'btn-primary' : ''}`

export default function NavBar() {
  const { user } = useAuth()

  return (
    <header className="sticky top-0 z-20 flex flex-wrap items-center gap-2 border-b border-border bg-white px-4 py-3">
      <Link to="/" className="mr-1 flex items-center gap-2 font-bold text-text-h no-underline">
        <span
          aria-hidden="true"
          className="size-4 rounded-[5px] border border-[#c98a1a] bg-linear-to-br from-[#ffd36b] to-[#f0a52e]"
        />
        Crumbs
      </Link>

      <nav aria-label="Main" className="flex items-center gap-2">
        <NavLink to="/collections" className={pill}>
          collections
        </NavLink>
        <NavLink to="/search" className={pill}>
          search
        </NavLink>
        {user && (
          <NavLink to="/crumbs" className={pill}>
            crumbs
          </NavLink>
        )}
      </nav>

      <div className="ml-auto flex items-center gap-3 text-sm">
        {user ? (
          <Link to="/profile" className="flex items-center gap-2 text-text no-underline hover:text-accent">
            <span className="hidden sm:inline">Signed in as {user.username}</span>
            <Avatar user={user} className="size-7 text-sm" />
          </Link>
        ) : (
          <>
            <Link to="/login" className="btn">
              Login
            </Link>
            <Link to="/register" className="btn btn-primary">
              Register
            </Link>
          </>
        )}
      </div>
    </header>
  )
}
