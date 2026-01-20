import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import Card from '../components/Card'
import ErrorBanner from '../components/ErrorBanner'
import Skeleton from '../components/Skeleton'
import { api } from '../services/api'

const AVAILABLE_SEASONS = [2025, 2024, 2023, 2022, 2021, 2020]

function DriverList() {
  const [season, setSeason] = useState(2025)
  const [driver1, setDriver1] = useState('VER')
  const [driver2, setDriver2] = useState('NOR')

  // Fetch drivers for selected season
  const {
    data: driversData,
    isPending: driversPending,
    isError: driversError,
  } = useQuery({
    queryKey: ['drivers', season],
    queryFn: () => api.drivers(season),
    staleTime: 5 * 60 * 1000,
  })

  const drivers = useMemo(() => {
    return (driversData?.drivers || []).sort((a, b) => 
      (a.name || '').localeCompare(b.name || '')
    )
  }, [driversData])

  // Reset driver selection when season changes if current drivers don't exist in new season
  useEffect(() => {
    if (drivers.length > 0) {
      const driver1Exists = drivers.some(d => d.code === driver1)
      const driver2Exists = drivers.some(d => d.code === driver2)
      
      if (!driver1Exists) setDriver1(drivers[0]?.code || 'VER')
      if (!driver2Exists) setDriver2(drivers[1]?.code || 'NOR')
    }
  }, [drivers, driver1, driver2])

  const {
    data: stats1Data,
    isPending: stats1Pending,
    isError: stats1Error,
    error: stats1ErrorObj,
    refetch: refetchStats1,
  } = useQuery({
    queryKey: ['driver-stats', driver1, season],
    queryFn: () => api.driverStats(driver1, season),
    enabled: Boolean(driver1),
    staleTime: 2 * 60 * 1000,
  })

  const {
    data: stats2Data,
    isPending: stats2Pending,
    isError: stats2Error,
    error: stats2ErrorObj,
    refetch: refetchStats2,
  } = useQuery({
    queryKey: ['driver-stats', driver2, season],
    queryFn: () => api.driverStats(driver2, season),
    enabled: Boolean(driver2),
    staleTime: 2 * 60 * 1000,
  })

  const stats1 = stats1Data?.stats
  const stats2 = stats2Data?.stats

  const getDriverInfo = (code) => drivers.find(d => d.code === code)

  return (
    <section className="section">
      <div className="section-header">
        <div>
          <h2 className="section-title">Driver comparison</h2>
          <p className="section-subtitle">Head-to-head season analysis</p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
          <select 
            className="select" 
            value={season} 
            onChange={(e) => setSeason(Number(e.target.value))}
            style={{ minWidth: '120px' }}
          >
            {AVAILABLE_SEASONS.map((year) => (
              <option key={year} value={year}>
                Season {year}
              </option>
            ))}
          </select>
          <span className="pill">
            {driversData?.count ?? 0} drivers
          </span>
        </div>
      </div>

      {driversError ? (
        <ErrorBanner message="Failed to load drivers for this season" />
      ) : driversPending ? (
        <Skeleton lines={4} />
      ) : drivers.length === 0 ? (
        <div className="card">
          <p className="section-note">No driver data available for season {season}.</p>
        </div>
      ) : (
        <div className="grid two" style={{ alignItems: 'start' }}>
          {/* Driver 1 */}
          <Card 
            title={getDriverInfo(driver1)?.name ?? driver1} 
            subtitle={`Driver #${getDriverInfo(driver1)?.number ?? '—'}`}
          >
            <div className="filter-bar" style={{ justifyContent: 'flex-start', marginBottom: 'var(--space-4)' }}>
              <select 
                className="select" 
                value={driver1} 
                onChange={(e) => setDriver1(e.target.value)}
                style={{ minWidth: '220px' }}
              >
                {drivers.map((driver) => (
                  <option key={driver.code} value={driver.code}>
                    {driver.number ? `#${driver.number}` : ''} {driver.name || driver.code}
                  </option>
                ))}
              </select>
              <button 
                className="button secondary" 
                type="button" 
                onClick={() => refetchStats1()}
              >
                Refresh
              </button>
            </div>

          {stats1Error ? (
            <ErrorBanner message={stats1ErrorObj?.message} onRetry={refetchStats1} />
          ) : stats1Pending ? (
            <Skeleton lines={6} />
          ) : stats1 ? (
            <div style={{ display: 'grid', gap: 'var(--space-3)' }}>
              <div>
                <p className="stat-label">Races entered</p>
                <div className="stat-value" style={{ fontSize: '28px' }}>{stats1.races_entered ?? '—'}</div>
              </div>
              <div>
                <p className="stat-label">Total points</p>
                <div className="stat-value" style={{ fontSize: '28px' }}>{stats1.total_points ?? '—'}</div>
              </div>
              <div>
                <p className="stat-label">Average finish position</p>
                <div className="stat-value" style={{ fontSize: '28px' }}>{stats1.average_finish_position ?? '—'}</div>
              </div>
              <div>
                <p className="stat-label">Total laps</p>
                <div className="stat-value" style={{ fontSize: '28px' }}>{stats1.total_laps ?? '—'}</div>
              </div>
              <div>
                <p className="stat-label">Average lap time</p>
                <div className="stat-value" style={{ fontSize: '28px' }}>{stats1.average_lap_time ?? '—'}s</div>
              </div>
              <div>
                <p className="stat-label">Fastest lap</p>
                <div className="stat-value" style={{ fontSize: '28px' }}>{stats1.fastest_lap ?? '—'}s</div>
              </div>
            </div>
          ) : (
            <p className="section-note">No data available for this driver.</p>
          )}
        </Card>

        {/* Driver 2 */}
        <Card 
          title={getDriverInfo(driver2)?.name ?? driver2} 
          subtitle={`Driver #${getDriverInfo(driver2)?.number ?? '—'}`}
        >
          <div className="filter-bar" style={{ justifyContent: 'flex-start', marginBottom: 'var(--space-4)' }}>
            <select 
              className="select" 
              value={driver2} 
              onChange={(e) => setDriver2(e.target.value)}
              style={{ minWidth: '220px' }}
            >
              {drivers.map((driver) => (
                <option key={driver.code} value={driver.code}>
                  {driver.number ? `#${driver.number}` : ''} {driver.name || driver.code}
                </option>
              ))}
            </select>
            <button 
              className="button secondary" 
              type="button" 
              onClick={() => refetchStats2()}
            >
              Refresh
            </button>
          </div>

          {stats2Error ? (
            <ErrorBanner message={stats2ErrorObj?.message} onRetry={refetchStats2} />
          ) : stats2Pending ? (
            <Skeleton lines={6} />
          ) : stats2 ? (
            <div style={{ display: 'grid', gap: 'var(--space-3)' }}>
              <div>
                <p className="stat-label">Races entered</p>
                <div className="stat-value" style={{ fontSize: '28px' }}>{stats2.races_entered ?? '—'}</div>
              </div>
              <div>
                <p className="stat-label">Total points</p>
                <div className="stat-value" style={{ fontSize: '28px' }}>{stats2.total_points ?? '—'}</div>
              </div>
              <div>
                <p className="stat-label">Average finish position</p>
                <div className="stat-value" style={{ fontSize: '28px' }}>{stats2.average_finish_position ?? '—'}</div>
              </div>
              <div>
                <p className="stat-label">Total laps</p>
                <div className="stat-value" style={{ fontSize: '28px' }}>{stats2.total_laps ?? '—'}</div>
              </div>
              <div>
                <p className="stat-label">Average lap time</p>
                <div className="stat-value" style={{ fontSize: '28px' }}>{stats2.average_lap_time ?? '—'}s</div>
              </div>
              <div>
                <p className="stat-label">Fastest lap</p>
                <div className="stat-value" style={{ fontSize: '28px' }}>{stats2.fastest_lap ?? '—'}s</div>
              </div>
            </div>
          ) : (
            <p className="section-note">No data available for this driver.</p>
          )}
        </Card>
      </div>
      )}
    </section>
  )
}

export default DriverList