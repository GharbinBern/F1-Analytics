import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import Card from '../../components/Card'
import ErrorBanner from '../../components/ErrorBanner'
import Skeleton from '../../components/Skeleton'
import { api } from '../../services/api'

function DriverList() {
  const [search, setSearch] = useState('')

  const {
    data,
    isPending,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['drivers'],
    queryFn: api.drivers,
    staleTime: 5 * 60 * 1000,
  })

  const drivers = data?.drivers ?? []
  const [selected, setSelected] = useState('')

  const summary = useMemo(() => {
    const teams = new Set()
    drivers.forEach((d) => {
      if (d.team) teams.add(d.team)
    })
    return { total: drivers.length, teams: teams.size }
  }, [drivers])

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return drivers
    return drivers.filter((driver) =>
      driver.name.toLowerCase().includes(term) || driver.code.toLowerCase().includes(term)
    )
  }, [drivers, search])

  useEffect(() => {
    if (!selected && drivers.length > 0) {
      setSelected(drivers[0].code)
    }
  }, [drivers, selected])

  const {
    data: statsData,
    isPending: statsPending,
    isError: statsError,
    error: statsErrorObj,
    refetch: refetchStats,
  } = useQuery({
    queryKey: ['driver-stats', selected],
    queryFn: () => api.driverStats(selected, 2024),
    enabled: Boolean(selected),
    staleTime: 2 * 60 * 1000,
  })

  const stats = statsData?.stats

  return (
    <section className="section">
      <div className="section-header">
        <div>
          <h2 className="section-title">Driver explorer</h2>
          <p className="section-subtitle">Live data from the backend `/api/v1/drivers` endpoint.</p>
        </div>
        <div className="filter-bar">
          <input
            className="input"
            type="search"
            placeholder="Filter by name or code"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button className="button secondary" type="button" onClick={() => refetch()}>
            Refresh
          </button>
        </div>
      </div>

      {isError ? (
        <ErrorBanner message={error?.message} onRetry={refetch} />
      ) : isPending ? (
        <Skeleton lines={8} />
      ) : (
        <div className="grid two">
          <Card title="Drivers" subtitle={`Total: ${drivers.length}`}>
            {filtered.length === 0 ? (
              <p className="section-note">No drivers match that filter.</p>
            ) : (
              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Code</th>
                      <th>Number</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((driver) => (
                      <tr key={driver.id ?? driver.code}>
                        <td>{driver.name}</td>
                        <td className="text-muted">{driver.code}</td>
                        <td>{driver.number ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          <Card title="Driver stats" subtitle={`Season 2024${selected ? ' · ' + selected : ''}`}>
            <div className="filter-bar" style={{ justifyContent: 'flex-start' }}>
              <select className="select" value={selected} onChange={(e) => setSelected(e.target.value)}>
                {drivers.map((driver) => (
                  <option key={driver.code} value={driver.code}>
                    {driver.code} — {driver.name}
                  </option>
                ))}
              </select>
              <button className="button secondary" type="button" onClick={() => refetchStats()} disabled={!selected}>
                Refresh stats
              </button>
            </div>

            {statsError ? (
              <ErrorBanner message={statsErrorObj?.message} onRetry={refetchStats} />
            ) : statsPending ? (
              <Skeleton lines={4} />
            ) : stats ? (
              <div className="grid three">
                <p className="section-note">Races: {stats.races_entered ?? '—'}</p>
                <p className="section-note">Points: {stats.total_points ?? '—'}</p>
                <p className="section-note">Avg finish: {stats.average_finish_position ?? '—'}</p>
                <p className="section-note">Laps: {stats.total_laps ?? '—'}</p>
                <p className="section-note">Avg lap: {stats.average_lap_time ?? '—'}s</p>
                <p className="section-note">Fastest: {stats.fastest_lap ?? '—'}s</p>
              </div>
            ) : (
              <p className="section-note">Select a driver to load stats.</p>
            )}
          </Card>

          <Card title="Summary" subtitle="Live counts from backend">
            <p className="section-note">Drivers: {summary.total}</p>
            <p className="section-note">Teams (if provided): {summary.teams}</p>
          </Card>
        </div>
      )}
    </section>
  )
}

export default DriverList
