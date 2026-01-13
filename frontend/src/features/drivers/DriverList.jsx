import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import Card from '../../components/Card'
import ErrorBanner from '../../components/ErrorBanner'
import Skeleton from '../../components/Skeleton'
import { api } from '../../services/api'

// Current 2025 F1 drivers
const CURRENT_2025_DRIVERS = [
  { name: 'Max Verstappen', code: 'VER', number: 1, team: 'Red Bull Racing' },
  { name: 'Sergio Perez', code: 'PER', number: 11, team: 'Red Bull Racing' },
  { name: 'Charles Leclerc', code: 'LEC', number: 16, team: 'Ferrari' },
  { name: 'Carlos Sainz', code: 'SAI', number: 55, team: 'Ferrari' },
  { name: 'Lando Norris', code: 'NOR', number: 4, team: 'McLaren' },
  { name: 'Oscar Piastri', code: 'PIA', number: 81, team: 'McLaren' },
  { name: 'George Russell', code: 'RUS', number: 63, team: 'Mercedes' },
  { name: 'Lewis Hamilton', code: 'HAM', number: 44, team: 'Mercedes' },
  { name: 'Fernando Alonso', code: 'ALO', number: 14, team: 'Aston Martin' },
  { name: 'Lance Stroll', code: 'STR', number: 18, team: 'Aston Martin' },
  { name: 'Pierre Gasly', code: 'GAS', number: 10, team: 'Alpine' },
  { name: 'Esteban Ocon', code: 'OCO', number: 31, team: 'Alpine' },
  { name: 'Alexander Albon', code: 'ALB', number: 23, team: 'Williams' },
  { name: 'Logan Sargeant', code: 'SAR', number: 2, team: 'Williams' },
  { name: 'Valtteri Bottas', code: 'BOT', number: 77, team: 'Alfa Romeo' },
  { name: 'Zhou Guanyu', code: 'ZHO', number: 24, team: 'Alfa Romeo' },
  { name: 'Kevin Magnussen', code: 'MAG', number: 20, team: 'Haas' },
  { name: 'Nico Hulkenberg', code: 'HUL', number: 27, team: 'Haas' },
  { name: 'Yuki Tsunoda', code: 'TSU', number: 22, team: 'AlphaTauri' },
  { name: 'Daniel Ricciardo', code: 'RIC', number: 3, team: 'AlphaTauri' },
]

function DriverList() {
  const SEASON = 2024
  const [driver1, setDriver1] = useState('VER')
  const [driver2, setDriver2] = useState('NOR')

  const {
    data: stats1Data,
    isPending: stats1Pending,
    isError: stats1Error,
    error: stats1ErrorObj,
    refetch: refetchStats1,
  } = useQuery({
    queryKey: ['driver-stats', driver1, SEASON],
    queryFn: () => api.driverStats(driver1, SEASON),
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
    queryKey: ['driver-stats', driver2, SEASON],
    queryFn: () => api.driverStats(driver2, SEASON),
    enabled: Boolean(driver2),
    staleTime: 2 * 60 * 1000,
  })

  const stats1 = stats1Data?.stats
  const stats2 = stats2Data?.stats

  const getDriverInfo = (code) => CURRENT_2025_DRIVERS.find(d => d.code === code)

  return (
    <section className="section">
      <div className="section-header">
        <div>
          <h2 className="section-title">Driver comparison</h2>
          <p className="section-subtitle">2024 season · Head-to-head analysis</p>
        </div>
        <span className="pill">Season 2024</span>
      </div>

      <div className="grid two" style={{ alignItems: 'start' }}>
        {/* Driver 1 */}
        <Card 
          title={getDriverInfo(driver1)?.name ?? driver1} 
          subtitle={getDriverInfo(driver1)?.team ?? 'Select driver'}
        >
          <div className="filter-bar" style={{ justifyContent: 'flex-start', marginBottom: 'var(--space-4)' }}>
            <select 
              className="select" 
              value={driver1} 
              onChange={(e) => setDriver1(e.target.value)}
              style={{ minWidth: '220px' }}
            >
              {CURRENT_2025_DRIVERS.map((driver) => (
                <option key={driver.code} value={driver.code}>
                  {driver.number} · {driver.name}
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
          subtitle={getDriverInfo(driver2)?.team ?? 'Select driver'}
        >
          <div className="filter-bar" style={{ justifyContent: 'flex-start', marginBottom: 'var(--space-4)' }}>
            <select 
              className="select" 
              value={driver2} 
              onChange={(e) => setDriver2(e.target.value)}
              style={{ minWidth: '220px' }}
            >
              {CURRENT_2025_DRIVERS.map((driver) => (
                <option key={driver.code} value={driver.code}>
                  {driver.number} · {driver.name}
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
    </section>
  )
}

export default DriverList
