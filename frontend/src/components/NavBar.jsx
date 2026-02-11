import { useEffect } from 'react'
import { NavLink } from 'react-router-dom'

const links = [
  { href: '/', label: 'Overview' },
  { href: '/races', label: 'Races' },
  { href: '/drivers', label: 'Drivers' },
  { href: '/teams', label: 'Teams' },
  { href: '/laps', label: 'Laps' },
]

function NavBar() {
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const applyTheme = (isDark) => {
      document.documentElement.dataset.theme = isDark ? 'dark' : 'light'
    }

    applyTheme(mediaQuery.matches)

    const handleChange = (event) => applyTheme(event.matches)
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange)
    } else {
      mediaQuery.addListener(handleChange)
    }

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleChange)
      } else {
        mediaQuery.removeListener(handleChange)
      }
    }
  }, [])

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
    </header>
  )
}

export default NavBar