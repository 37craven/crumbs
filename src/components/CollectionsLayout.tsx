import { useEffect, useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import './collections.css'

// The header, the cream background and the message bar shared by the
// collections, search and collection pages.
export default function CollectionsLayout() {
  const { user } = useAuth()
  const [note, setNote] = useState<{ msg: string; bad: boolean } | null>(null)

  useEffect(() => {
    let timer = 0
    const show = (e: Event) => {
      setNote((e as CustomEvent<{ msg: string; bad: boolean }>).detail)
      clearTimeout(timer)
      timer = window.setTimeout(() => setNote(null), 4000)
    }
    window.addEventListener('toast', show)
    return () => {
      window.removeEventListener('toast', show)
      clearTimeout(timer)
    }
  }, [])

  const tab = ({ isActive }: { isActive: boolean }) => (isActive ? 'on' : '')

  return (
    <div className="crumbs">
      <header>
        <b>🍞 Crumbs</b>
        <nav>
          <NavLink to="/collections" className={tab}>collections</NavLink>
          <NavLink to="/search" className={tab}>search</NavLink>
        </nav>
        <span id="who">{user ? `Signed in as ${user.username}` : ''}</span>
      </header>
      <main>
        <Outlet />
      </main>
      <div id="toast" className={note ? `show${note.bad ? ' bad' : ''}` : ''}>
        {note?.msg}
      </div>
    </div>
  )
}
