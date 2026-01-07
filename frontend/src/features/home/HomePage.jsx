import Card from '../../components/Card'

const stats = [
  { label: 'Latest Winner', value: 'Max Verstappen', detail: 'Abu Dhabi GP' },
  { label: 'Current Season', value: '2025', detail: 'Round 18 of 24' },
  { label: 'Pole vs Win %', value: '62%', detail: 'Correlation this season' },
]

const featuredDrivers = [
  { name: 'Max Verstappen', team: 'Red Bull', metric: '+0.38s avg qualy delta' },
  { name: 'Lando Norris', team: 'McLaren', metric: '+0.12s race pace delta' },
  { name: 'Charles Leclerc', team: 'Ferrari', metric: '6 poles, 3 wins' },
]

function HomePage() {
  return (
    <>
      <section className="section">
        <div className="hero">
          <div>
            <span className="hero-kicker">F1 analytics cockpit</span>
            <h1 className="hero-title">Race pace, qualifying edges, and stint DNA at a glance.</h1>
            <p className="hero-copy">
              Explore season-wide performance for teams and drivers. Quickly jump into driver head-to-heads,
              recent race results, and lap-time shapes with an interface built for pace analysis.
            </p>
            <div className="hero-actions">
              <a className="button" href="/drivers">Driver explorer</a>
              <a className="button secondary" href="/">Race overview</a>
            </div>
          </div>
          <div className="hero-visual">
            <div className="sparkline">
              <div className="sparkline-row">
                <span className="sparkline-label">Race pace delta</span>
                <div className="sparkline-bar"><span style={{ width: '78%' }} /></div>
                <span className="spark">-0.28s</span>
              </div>
              <div className="sparkline-row">
                <span className="sparkline-label">Qualy consistency</span>
                <div className="sparkline-bar"><span style={{ width: '64%' }} /></div>
                <span className="spark">+0.14s</span>
              </div>
              <div className="sparkline-row">
                <span className="sparkline-label">Pit stop median</span>
                <div className="sparkline-bar"><span style={{ width: '52%' }} /></div>
                <span className="spark">2.48s</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="section-header">
          <div>
            <h2 className="section-title">Season snapshot</h2>
            <p className="section-subtitle">High-level signals for the current championship run.</p>
          </div>
          <span className="pill">Live 2025</span>
        </div>
        <div className="grid three">
          {stats.map((stat) => (
            <div key={stat.label} className="card">
              <p className="stat-label">{stat.label}</p>
              <div className="stat-value">{stat.value}</div>
              <p className="section-note">{stat.detail}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="section-header">
          <div>
            <h2 className="section-title">Featured drivers</h2>
            <p className="section-subtitle">Quick read on who is trending upward.</p>
          </div>
          <a className="button" href="/drivers">See all drivers</a>
        </div>
        <div className="grid two">
          <Card title="Momentum board" subtitle="Recent form vs grid median">
            <ul className="mini-list">
              {featuredDrivers.map((driver) => (
                <li key={driver.name} className="mini-row">
                  <div>
                    <p className="mini-title">{driver.name}</p>
                    <p className="mini-sub">{driver.team}</p>
                  </div>
                  <span className="badge">{driver.metric}</span>
                </li>
              ))}
            </ul>
          </Card>
          <Card title="Standout metrics" subtitle="Surface-level deltas; connect data later">
            <p className="section-note">
              Hook up the backend API to replace these placeholders with live pace gaps, tire stints, and pit
              windows. Each section is wired to accept data from `api` once endpoints are ready.
            </p>
          </Card>
        </div>
      </section>
    </>
  )
}

export default HomePage
