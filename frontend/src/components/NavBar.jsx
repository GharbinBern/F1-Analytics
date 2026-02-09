import { useEffect, useState } from 'react'
import { NavLink } from 'react-router-dom'

const links = [
  { href: '/', label: 'Overview' },
  { href: '/races', label: 'Races' },
  { href: '/drivers', label: 'Drivers' },
  { href: '/teams', label: 'Teams' },
  { href: '/laps', label: 'Laps' },
]

function NavBar() {
  const [theme, setTheme] = useState('light')

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme')
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
    const nextTheme = savedTheme || (prefersDark ? 'dark' : 'light')
    setTheme(nextTheme)
    document.documentElement.dataset.theme = nextTheme
  }, [])

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    localStorage.setItem('theme', theme)
  }, [theme])

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))
  }

  return (
    <header className="navbar">
      <div className="brand" aria-label="F1 Analytics">
        <span className="brand-mark" />
        <span>F1 Analytics</span>
      </div>
      <nav className="nav-links" aria-label="Primary">
        {links.map((link) => (
          <NavLink
            key={link.href}
            to={link.href}
            className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
            end={link.href === '/'}
          >
            {link.label}
          </NavLink>
        ))}
      </nav>
      <div className="nav-footer">
        <button type="button" className="theme-toggle" onClick={toggleTheme} aria-pressed={theme === 'dark'}>
          <span>{theme === 'dark' ? 'Dark mode' : 'Light mode'}</span>
        </button>
      </div>
    </header>
  )
}

export default NavBar