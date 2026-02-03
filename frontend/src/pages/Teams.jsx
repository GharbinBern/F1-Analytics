import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import Card from '../components/Card'
import CustomSelect from '../components/CustomSelect'
import ErrorBanner from '../components/ErrorBanner'
import Skeleton from '../components/Skeleton'
import { api } from '../services/api'
import { getTeamCssVars, getTeamColors } from '../utils/teamColors'
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
    data: pitStopsData,
    isPending: pitStopsPending,
    isError: pitStopsError,
    error: pitStopsErrorObj,
    refetch: refetchPitStops,
  } = useQuery({
    queryKey: ['team-pit-stops', selectedTeam, season],
    queryFn: () => api.teamPitStops(selectedTeam, season),
    enabled: Boolean(selectedTeam),
    staleTime: 3 * 60 * 1000,
  })

  const performance = performanceData?.stats
  const pitStops = pitStopsData?.stats
  const teamTheme = getTeamColors(selectedTeam)

  return (
    <section className="section">
      <div className="section-header">
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

          <Card title="Pit stop analysis" subtitle="Stint strategy and pit cadence">
            {pitStopsError ? (
              <ErrorBanner
                message={pitStopsErrorObj?.message ?? 'Unable to load pit stop stats.'}
                onRetry={refetchPitStops}
              />
            ) : pitStopsPending ? (
              <Skeleton lines={6} />
            ) : pitStops ? (
              <div className="teams__metrics">
                <div className="metric-row">
                  <span className="metric-label">Total pit stops</span>
                  <span className="metric-value">{pitStops.total_pit_stops ?? '—'}</span>
                </div>
                <div className="metric-row">
                  <span className="metric-label">Races with pit stops</span>
                  <span className="metric-value">{pitStops.races_with_pit_stops ?? '—'}</span>
                </div>
                <div className="metric-row">
                  <span className="metric-label">Average stops per race</span>
                  <span className="metric-value">{pitStops.average_stops_per_race ?? '—'}</span>
                </div>
                <div className="metric-row">
                  <span className="metric-label">Average pit time</span>
                    <span className="metric-value">{formatSeconds(pitStops.average_pit_time_seconds)}</span>
                </div>
                <div className="metric-row">
                  <span className="metric-label">Fastest pit time</span>
                    <span className="metric-value">{formatSeconds(pitStops.fastest_pit_time_seconds)}</span>
                </div>
                <div className="metric-row">
                  <span className="metric-label">Slowest pit time</span>
                    <span className="metric-value">{formatSeconds(pitStops.slowest_pit_time_seconds)}</span>
                </div>
              </div>
            ) : (
              <p className="section-note">{pitStopsData?.message ?? 'No pit stop data available.'}</p>
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
