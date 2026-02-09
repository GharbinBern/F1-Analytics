import { useMemo } from 'react'
import { useQueries, useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import Card from '../components/Card'
import HelmetIcon from '../components/HelmetIcon'
import Skeleton from '../components/Skeleton'
import { api } from '../services/api'

const SEASON = 2025
const SPOTLIGHT_DRIVERS = [
  { code: 'VER', team: 'Red Bull Racing' },
  { code: 'NOR', team: 'McLaren' },
  { code: 'LEC', team: 'Ferrari' },
]

const formatSeconds = (value) => (value || value === 0 ? Number(value).toFixed(3) : '—')

function HomePage() {
  const {
    data: racesData,
    isPending: racesPending,
    isError: racesError,
  } = useQuery({
    queryKey: ['races', SEASON],
    queryFn: () => api.races(SEASON),
    staleTime: 5 * 60 * 1000,
  })

  const driverResults = useQueries({
    queries: SPOTLIGHT_DRIVERS.map(({ code }) => ({
      queryKey: ['driver-stats', code, SEASON, 'home'],
      queryFn: () => api.driverStats(code, SEASON),
      staleTime: 5 * 60 * 1000,
    })),
  })

  const races = racesData?.races ?? []

  const completedRaces = useMemo(() => {
    const now = new Date()
    return races
      .filter((race) => race.date && new Date(race.date) <= now)
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 5)
  }, [races])

  const recentResults = useQueries({
    queries: completedRaces.map((race) => ({
      queryKey: ['race-results', race.id],
      queryFn: () => api.raceResults(race.id),
      staleTime: 5 * 60 * 1000,
      enabled: Boolean(race.id),
    })),
  })

  const recentWinners = useMemo(() => {
    return completedRaces.map((race, idx) => {
      const resultQuery = recentResults[idx]
      const winner = resultQuery.data?.results?.find((r) => r.position === 1)
      return {
        race,
        winner: winner?.driver_name || 'TBD',
        loading: resultQuery.isPending,
      }
    })
  }, [completedRaces, recentResults])

  const { nextRace, lastRace, completed, totalRaces, progressPct, countdownDays } = useMemo(() => {
    const now = new Date()

    const withDates = races
      .map((race) => ({
        ...race,
        dateObj: race.date ? new Date(race.date) : null,
      }))
      .filter((race) => race.dateObj)

    const upcoming = withDates.filter((race) => race.dateObj > now)
    const past = withDates.filter((race) => race.dateObj <= now)
    const nextRace = upcoming[0]
    const lastRace = past[past.length - 1] ?? withDates[withDates.length - 1]
    const completed = past.length
    const totalRaces = races.length
    const progressPct = totalRaces ? Math.round((completed / totalRaces) * 100) : null
    const countdownDays = nextRace?.dateObj
      ? Math.max(0, Math.ceil((nextRace.dateObj - now) / (1000 * 60 * 60 * 24)))
      : null

    return { nextRace, lastRace, completed, totalRaces, progressPct, countdownDays }
  }, [races])

  const leaderboard = useMemo(() => {
    return driverResults
      .map((query, idx) => {
        const stats = query.data?.stats
        const driver = query.data?.driver
        if (!stats || !driver) return null
        const meta = SPOTLIGHT_DRIVERS[idx]
        return {
          code: driver.code,
          name: driver.name,
          team: meta?.team,
          points: stats.total_points ?? 0,
          avgFinish: stats.average_finish_position,
          races: stats.races_entered,
        }
      })
      .filter(Boolean)
      .sort((a, b) => (b.points ?? 0) - (a.points ?? 0))
  }, [driverResults])

  return (
    <>
      <section className="section">
        <div className="hero">
          <div>
            <span className="hero-kicker">Season {SEASON} dashboard</span>
            <h1 className="hero-title">F1 race breakdown: pace, stints, and track form.</h1>
            <p className="hero-copy">
              Track where the lap-time edge comes from, who is carrying qualifying momentum, and how the next stint
              should shape up. Dive into driver head-to-heads and calendar context with
              an F1-styled cockpit.
            </p>
            <div className="hero-actions">
              <Link className="button" to="/drivers">Driver comparison</Link>
              <Link className="button secondary" to="/races">Race calendar</Link>
            </div>
          </div>
          <div className="hero-visual">
            <div className="hero-visual__content">
              <div className="hero-helmet-row">
                {SPOTLIGHT_DRIVERS.map((driver) => (
                  <div key={driver.code} className="hero-helmet">
                    <HelmetIcon
                      label={`${driver.code} helmet`}
                      size={46}
                      teamName={driver.team}
                    />
                    <span>{driver.code}</span>
                  </div>
                ))}
              </div>
              <div className="hero-track-card">
                <div className="hero-track-header">
                  <span className="hero-track-title">Live track overlay</span>
                  <span className="badge">Telemetry</span>
                </div>
                <div className="hero-track-map" aria-hidden="true" />
                <div className="hero-track-metrics">
                  <div>
                    <p className="mini-title">DRS zones</p>
                    <p className="mini-sub">3 active</p>
                  </div>
                  <div>
                    <p className="mini-title">Avg pace</p>
                    <p className="mini-sub">1:18.4</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="section-header">
          <div>
            <h2 className="section-title">Race week signals</h2>
            <p className="section-subtitle">Calendar context with the next grand prix and the latest run.</p>
          </div>
          <span className="pill">Season {SEASON}</span>
        </div>

        <div className="grid two">
          <Card
            title={nextRace ? 'Next grand prix' : 'Season wrap'}
            subtitle={nextRace ? 'Prepare the run plan before FP1' : 'Latest completed round'}
          >
            {racesPending ? (
              <Skeleton lines={5} />
            ) : racesError ? (
              <p className="section-note">Calendar data unavailable right now.</p>
            ) : (
              <ul className="list-plain">
                {nextRace ? (
                  <>
                    <li className="lap-item">
                      <div>
                        <p className="lap-title">{nextRace.name}</p>
                        <p className="lap-sub">{nextRace.location ?? nextRace.country ?? 'Track TBD'}</p>
                      </div>
                      <span className="badge">Round {completed + 1}</span>
                    </li>
                    <li className="lap-item">
                      <div>
                        <p className="mini-title">Date</p>
                        <p className="mini-sub">{nextRace.date ? new Date(nextRace.date).toLocaleDateString() : 'TBC'}</p>
                      </div>
                      <span className="badge">{countdownDays !== null ? `${countdownDays} days out` : 'Schedule pending'}</span>
                    </li>
                    <li className="lap-item">
                      <div>
                        <p className="mini-title">Track notes</p>
                        <p className="mini-sub">Model pace delta before quali; overlay long-run stints for tyre choice.</p>
                      </div>
                    </li>
                  </>
                ) : lastRace ? (
                  <>
                    <li className="lap-item">
                      <div>
                        <p className="lap-title">{lastRace.name}</p>
                        <p className="lap-sub">{lastRace.location ?? lastRace.country ?? 'Completed round'}</p>
                      </div>
                      <span className="badge">Finished</span>
                    </li>
                    <li className="lap-item">
                      <div>
                        <p className="mini-title">Date</p>
                        <p className="mini-sub">{lastRace.date ? new Date(lastRace.date).toLocaleDateString() : '—'}</p>
                      </div>
                      <span className="badge">{totalRaces ? `${totalRaces} rounds in ${SEASON}` : 'Calendar loaded'}</span>
                    </li>
                    <li className="lap-item">
                      <div>
                        <p className="mini-title">Next step</p>
                        <p className="mini-sub">Select a driver to overlay lap traces or pull team pit-stop shapes.</p>
                      </div>
                    </li>
                  </>
                ) : (
                  <p className="section-note">No race information available yet.</p>
                )}
              </ul>
            )}
          </Card>

          <Card title="Season pulse" subtitle="Progress markers and pace anchors">
            <div className="progress" style={{ marginBottom: 'var(--space-4)' }}>
              <div className="progress-head">
                <p className="sparkline-label">Calendar coverage</p>
                <span className="spark">{progressPct !== null ? `${progressPct}%` : '—'}</span>
              </div>
              <div className="progress-bar">
                <span style={{ width: `${progressPct ?? 0}%` }} />
              </div>
              <p className="section-note">
                {totalRaces ? `${completed} of ${totalRaces} rounds processed` : 'Loading season data'}
              </p>
            </div>
            <div className="meta-grid">
              <div className="metric-row">
                <div className="metric-label">Next runway</div>
                <div className="metric-value">
                  {nextRace
                    ? `${countdownDays} days to ${nextRace.country ?? nextRace.location ?? nextRace.name}`
                    : 'Season complete'}
                </div>
              </div>
              <div className="metric-row">
                <div className="metric-label">Rounds logged</div>
                <div className="metric-value">{racesData?.count ?? totalRaces ?? '—'}</div>
              </div>
            </div>
          </Card>
        </div>
      </section>

      <section className="section">
        <div className="section-header">
          <div>
            <h2 className="section-title">Performance board</h2>
            <p className="section-subtitle">Recent race winners and the spotlight driver leaderboard.</p>
          </div>
          <Link className="button" to="/races">All races</Link>
        </div>

        <div className="grid two">
          <Card title="Recent winners" subtitle={`Last ${recentWinners.length} completed races`}>
            {racesPending ? (
              <Skeleton lines={6} />
            ) : racesError ? (
              <p className="section-note">Race data unavailable.</p>
            ) : recentWinners.length === 0 ? (
              <p className="section-note">No races completed yet this season.</p>
            ) : (
              <ul className="list-plain">
                {recentWinners.map(({ race, winner, loading }, idx) => (
                  <li key={race.id} className="lap-item">
                    <div>
                      <p className="lap-title">
                        {loading ? 'Loading winner...' : winner}
                      </p>
                      <p className="lap-sub">
                        {race.name} · {race.date ? new Date(race.date).toLocaleDateString() : 'Date TBD'}
                      </p>
                    </div>
                    <span className="badge">Round {races.indexOf(race) + 1}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card title="Spotlight leaderboard" subtitle="Points and average finishing position">
            {driverResults.some((q) => q.isPending) ? (
              <Skeleton lines={6} />
            ) : leaderboard.length === 0 ? (
              <p className="section-note">No driver stats available yet.</p>
            ) : (
              <div>
                {leaderboard.map((driver, idx) => (
                  <div key={driver.code} className="leader-item">
                    <div>
                      <p className="mini-title">P{idx + 1} · {driver.name}</p>
                      <p className="mini-sub">{driver.team ?? 'Spotlight driver'}</p>
                    </div>
                    <div className="leader-meta">
                      <span className="badge">{driver.points} pts</span>
                      <span className="muted">
                        Avg finish {driver.avgFinish ?? '—'} · {driver.races ?? 0} races
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </section>
    </>
  )
}

export default HomePage
