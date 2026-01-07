import { NavLink } from 'react-router-dom'

const links = [
  { href: '/', label: 'Overview' },
  { href: '/races', label: 'Races' },
  { href: '/drivers', label: 'Drivers' },
  { href: '/teams', label: 'Teams' },
  { href: '/laps', label: 'Lap Analytics' },
]

function NavBar() {
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
