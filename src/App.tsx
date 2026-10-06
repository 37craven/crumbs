import { Route, Routes, useLocation } from 'react-router-dom'
import NavBar from './components/NavBar'
import RequireAuth from './components/RequireAuth'
import RedirectIfAuthed from './components/RedirectIfAuthed'
import AddEvent from './pages/AddEvent'
import Collections from './pages/Collections'
import Crumbs from './pages/Crumbs'
import EditProfile from './pages/EditProfile'
import ForgotPassword from './pages/ForgotPassword'
import Home from './pages/Home'
import Login from './pages/Login'
import NotFound from './pages/NotFound'
import Profile from './pages/Profile'
import Register from './pages/Register'
import Search from './pages/Search'

const authPaths = ['/login', '/register', '/forgot-password']

export default function App() {
  const { pathname } = useLocation()

  const layout =
    pathname === '/crumbs'
      ? 'w-full py-8'
      : authPaths.includes(pathname)
        ? 'mx-auto w-full max-w-md px-4 py-12 [&>section]:rounded-3xl [&>section]:border [&>section]:border-border [&>section]:bg-white [&>section]:p-8 [&>section]:shadow-sm'
        : 'mx-auto w-full max-w-[860px] px-6 py-8'

  return (
    <>
      <NavBar />
      <main className={layout}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<RedirectIfAuthed><Login /></RedirectIfAuthed>} />
          <Route path="/register" element={<RedirectIfAuthed><Register /></RedirectIfAuthed>} />
          <Route path="/forgot-password" element={<RedirectIfAuthed><ForgotPassword /></RedirectIfAuthed>} />
          <Route path="/collections" element={<Collections />} />
          <Route path="/search" element={<Search />} />
          <Route path="/addevent" element={<AddEvent />} />
          <Route path="/crumbs" element={<RequireAuth><Crumbs /></RequireAuth>} />
          <Route path="/profile" element={<RequireAuth><Profile /></RequireAuth>} />
          <Route path="/edit-profile" element={<RequireAuth><EditProfile /></RequireAuth>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
    </>
  )
}