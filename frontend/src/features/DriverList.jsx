import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import Card from '../components/Card'
import ErrorBanner from '../components/ErrorBanner'
import Skeleton from '../components/Skeleton'
import CustomSelect from '../components/CustomSelect'
import { api } from '../services/api'
import './DriverList.css'

const AVAILABLE_SEASONS = [2025, 2024, 2023, 2022, 2021, 2020]

function DriverStatsCard({
  driverCode,
  drivers,
  driverInfo,
  stats,
  statsPending,
  statsError,
  statsErrorObj,
  onDriverChange,
  onRetry,
}) {
  const statItems = [
    { label: 'Races entered', value: stats?.races_entered },
    { label: 'Total points', value: stats?.total_points },
    { label: 'Average finish position', value: stats?.average_finish_position },
    { label: 'Wins', value: stats?.wins },
    { label: 'Podiums', value: stats?.podiums },
    { label: 'Total laps', value: stats?.total_laps },
  ]

  return (
    <Card
      title={driverInfo?.name ?? driverCode}
      subtitle={`Driver #${driverInfo?.number ?? '—'}`}
    >
      <div className="filter-bar driver-list__filter-bar">
        <CustomSelect
          value={driverCode}
          onChange={onDriverChange}
          options={drivers.map((driver) => ({
            value: driver.code,
            label: `${driver.number ? `#${driver.number}` : ''} ${driver.name || driver.code}`.trim()
          }))}
          placeholder="Select driver"
        />
      </div>

      {statsError ? (
        <ErrorBanner message={statsErrorObj?.message} onRetry={onRetry} />
      ) : statsPending ? (
        <Skeleton lines={6} />
      ) : stats ? (
        <div className="driver-list__stat-grid">
          {statItems.map((item) => (
            <div key={item.label}>
              <p className="stat-label">{item.label}</p>
              <div className="stat-value driver-list__stat-value">
                {item.value ?? '—'}{item.suffix ?? ''}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="section-note">No data available for this driver.</p>
      )}
    </Card>
  )
}

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
        <div className="driver-list__controls">
          <CustomSelect
            className="driver-list__season-select"
            value={season}
            onChange={(val) => setSeason(Number(val))}
            options={AVAILABLE_SEASONS.map((year) => ({
              value: year,
              label: `Season ${year}`
            }))}
            placeholder="Select season"
          />
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
        <div className="grid two driver-list__comparison-grid">
          <DriverStatsCard
            driverCode={driver1}
            drivers={drivers}
            driverInfo={getDriverInfo(driver1)}
            stats={stats1}
            statsPending={stats1Pending}
            statsError={stats1Error}
            statsErrorObj={stats1ErrorObj}
            onDriverChange={setDriver1}
            onRetry={refetchStats1}
          />
          <DriverStatsCard
            driverCode={driver2}
            drivers={drivers}
            driverInfo={getDriverInfo(driver2)}
            stats={stats2}
            statsPending={stats2Pending}
            statsError={stats2Error}
            statsErrorObj={stats2ErrorObj}
            onDriverChange={setDriver2}
            onRetry={refetchStats2}
          />
        </div>
      )}
    </section>
  )
}

export default DriverList