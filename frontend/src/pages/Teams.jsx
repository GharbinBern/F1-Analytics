import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import Card from '../components/Card'
import CustomSelect from '../components/CustomSelect'
import ErrorBanner from '../components/ErrorBanner'
import Skeleton from '../components/Skeleton'
import { api } from '../services/api'
import { getTeamColors } from '../utils/teamColors'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import './Teams.css'

const AVAILABLE_SEASONS = [2025, 2024, 2023, 2022, 2021, 2020]

const formatSeconds = (value) => (value || value === 0 ? `${Number(value).toFixed(3)}s` : '—')

function TeamsPage() {
  const [season, setSeason] = useState(2025)
  const [selectedRaceId, setSelectedRaceId] = useState(null)
  const [selectedTeam, setSelectedTeam] = useState('')

  const {
    data: racesData,
    isPending: racesPending,
    isError: racesError,
    error: racesErrorObj,
    refetch: refetchRaces,
  } = useQuery({
    queryKey: ['races', season, 'teams'],
    queryFn: () => api.races(season),
    staleTime: 5 * 60 * 1000,
  })

  const races = useMemo(() => racesData?.races ?? [], [racesData])

  useEffect(() => {
    if (races.length > 0) {
      const stillExists = races.some((race) => race.id === selectedRaceId)
      if (!stillExists) {
        setSelectedRaceId(races[0].id)
      }
    }
  }, [races, selectedRaceId])

  const {
    data: lapsData,
    isPending: lapsPending,
    isError: lapsError,
    error: lapsErrorObj,
    refetch: refetchLaps,
  } = useQuery({
    queryKey: ['race-laps', selectedRaceId, 'teams'],
    queryFn: () => api.raceLaps(selectedRaceId),
    enabled: Boolean(selectedRaceId),
    staleTime: 2 * 60 * 1000,
  })

  const teamOptions = useMemo(() => {
    const rawTeams = (lapsData?.laps ?? [])
      .map((lap) => lap.team)
      .filter(Boolean)
    const uniqueTeams = Array.from(new Set(rawTeams)).sort((a, b) => a.localeCompare(b))
    return uniqueTeams.map((team) => ({ value: team, label: team }))
  }, [lapsData])

  useEffect(() => {
    if (teamOptions.length > 0 && !teamOptions.find((option) => option.value === selectedTeam)) {
      setSelectedTeam(teamOptions[0].value)
    }
  }, [teamOptions, selectedTeam])

  const {
    data: performanceData,
    isPending: performancePending,
    isError: performanceError,
    error: performanceErrorObj,
    refetch: refetchPerformance,
  } = useQuery({
    queryKey: ['team-performance', selectedTeam, season],
    queryFn: () => api.teamPerformance(selectedTeam, season),
    enabled: Boolean(selectedTeam),
    staleTime: 3 * 60 * 1000,
  })

  const {
    data: pointsData,
    isPending: pointsPending,
    isError: pointsError,
    error: pointsErrorObj,
    refetch: refetchPoints,
  } = useQuery({
    queryKey: ['team-points-per-race', selectedTeam, season],
    queryFn: () => api.teamPointsPerRace(selectedTeam, season),
    enabled: Boolean(selectedTeam),
    staleTime: 3 * 60 * 1000,
  })

  const performance = performanceData?.stats
  const pointsSeries = pointsData?.points ?? []
  const teamTheme = getTeamColors(selectedTeam)
  const pointsChartData = useMemo(() => {
    return pointsSeries.map((point, index) => ({
      ...point,
      round: index + 1,
    }))
  }, [pointsSeries])

  return (
    <section className="section">
      <div className="section-header teams__header">
        <div>
          <h2 className="section-title">Team performance</h2>
          <p className="section-subtitle">Compare team race pace, points, and pit execution.</p>
        </div>
        <div className="teams__controls">
          <CustomSelect
            value={season}
            onChange={(value) => setSeason(Number(value))}
            options={AVAILABLE_SEASONS.map((year) => ({ value: year, label: `Season ${year}` }))}
            placeholder="Select season"
          />
          <CustomSelect
            value={selectedRaceId ?? ''}
            onChange={(value) => setSelectedRaceId(Number(value))}
            options={races.map((race) => ({ value: race.id, label: race.name }))}
            placeholder="Select race"
          />
          <CustomSelect
            value={selectedTeam}
            onChange={setSelectedTeam}
            options={teamOptions}
            placeholder={lapsPending ? 'Loading teams...' : 'Select team'}
          />
        </div>
      </div>

      {racesError ? (
        <ErrorBanner message={racesErrorObj?.message ?? 'Unable to load races.'} onRetry={refetchRaces} />
      ) : racesPending ? (
        <Skeleton lines={4} />
      ) : (
        <div className="grid two">
          <Card
            title="Team performance"
            subtitle={(teamTheme?.name ?? selectedTeam) || 'Select a team'}
          >
            {performanceError ? (
              <ErrorBanner
                message={performanceErrorObj?.message ?? 'Unable to load performance stats.'}
                onRetry={refetchPerformance}
              />
            ) : performancePending ? (
              <Skeleton lines={6} />
            ) : performance ? (
              <div className="teams__metrics">
                <div className="metric-row">
                  <span className="metric-label">Races entered</span>
                  <span className="metric-value">{performance.races_entered ?? '—'}</span>
                </div>
                <div className="metric-row">
                  <span className="metric-label">Total points</span>
                  <span className="metric-value">{performance.total_points ?? 0}</span>
                </div>
                <div className="metric-row">
                  <span className="metric-label">Average finish position</span>
                  <span className="metric-value">{performance.average_position ?? '—'}</span>
                </div>
                <div className="metric-row">
                  <span className="metric-label">Total laps</span>
                  <span className="metric-value">{performance.total_laps ?? '—'}</span>
                </div>
                <div className="metric-row">
                  <span className="metric-label">Average lap time</span>
                    <span className="metric-value">{formatSeconds(performance.average_lap_time)}</span>
                </div>
                <div className="metric-row">
                  <span className="metric-label">Drivers count</span>
                  <span className="metric-value">{performance.drivers_count ?? '—'}</span>
                </div>
              </div>
            ) : (
              <p className="section-note">{performanceData?.message ?? 'No team data available.'}</p>
            )}
          </Card>
          <Card title="Points per race" subtitle="Points scored in each round">
            {pointsError ? (
              <ErrorBanner
                message={pointsErrorObj?.message ?? 'Unable to load points per race.'}
                onRetry={refetchPoints}
              />
            ) : pointsPending ? (
              <Skeleton lines={3} />
            ) : pointsSeries.length === 0 ? (
              <p className="section-note">No points data available for this team.</p>
            ) : (
              <div className="teams__chart">
                <div className="teams__chart-wrap">
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={pointsChartData} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(225, 6, 0, 0.2)" />
                      <XAxis
                        dataKey="round"
                        tick={{ fill: 'var(--text-secondary)', fontSize: 10 }}
                        tickFormatter={(value) => `R${value}`}
                      />
                      <YAxis tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} />
                      <Tooltip
                        labelFormatter={(label, payload) => {
                          const raceName = payload?.[0]?.payload?.race_name
                          return raceName ? `Round ${label} · ${raceName}` : `Round ${label}`
                        }}
                        contentStyle={{
                          background: 'var(--surface-strong)',
                          border: '2px solid var(--border)',
                          borderRadius: 6,
                          color: 'var(--text-primary)',
                        }}
                      />
                      <Bar dataKey="points" fill={teamTheme.primary ?? 'var(--accent)'} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </Card>
        </div>
      )}

      {lapsError ? (
        <ErrorBanner message={lapsErrorObj?.message ?? 'Unable to load team options.'} onRetry={refetchLaps} />
      ) : lapsPending ? (
        <Skeleton lines={3} />
      ) : teamOptions.length === 0 ? (
        <p className="section-note">No team data available for the selected race.</p>
      ) : null}
    </section>
  )
}

export default TeamsPage
