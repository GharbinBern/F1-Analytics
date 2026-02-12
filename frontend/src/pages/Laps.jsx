import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import Card from '../components/Card'
import CustomSelect from '../components/CustomSelect'
import ErrorBanner from '../components/ErrorBanner'
import Skeleton from '../components/Skeleton'
import { api } from '../services/api'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import './Laps.css'

const AVAILABLE_SEASONS = [2025, 2024, 2023, 2022, 2021, 2020]

const formatSeconds = (value) => (value || value === 0 ? `${Number(value).toFixed(3)}s` : '—')

function LapsPage() {
  const [season, setSeason] = useState(2025)
  const [selectedRaceId, setSelectedRaceId] = useState(null)
  const [driverFilter, setDriverFilter] = useState('ALL')

  const {
    data: racesData,
    isPending: racesPending,
    isError: racesError,
    error: racesErrorObj,
    refetch: refetchRaces,
  } = useQuery({
    queryKey: ['races', season, 'laps'],
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
    queryKey: ['race-laps', selectedRaceId],
    queryFn: () => api.raceLaps(selectedRaceId),
    enabled: Boolean(selectedRaceId),
    staleTime: 2 * 60 * 1000,
  })


  const allLaps = lapsData?.laps ?? []
  const driverOptions = useMemo(() => {
    const unique = Array.from(new Set(allLaps.map((lap) => lap.driver_code).filter(Boolean))).sort()
    return [{ value: 'ALL', label: 'All drivers' }, ...unique.map((code) => ({ value: code, label: code }))]
  }, [allLaps])

  useEffect(() => {
    if (!driverOptions.find((option) => option.value === driverFilter)) {
      setDriverFilter('ALL')
    }
  }, [driverOptions, driverFilter])

  const filteredLaps = useMemo(() => {
    if (driverFilter === 'ALL') return allLaps
    return allLaps.filter((lap) => lap.driver_code === driverFilter)
  }, [allLaps, driverFilter])

  const lapTimes = filteredLaps.map((lap) => lap.lap_time_seconds).filter((value) => value || value === 0)
  const sortedLapTimes = [...lapTimes].sort((a, b) => a - b)
  const avgLapTime = lapTimes.length ? lapTimes.reduce((a, b) => a + b, 0) / lapTimes.length : null
  const fastestLap = lapTimes.length ? Math.min(...lapTimes) : null
  const medianLapTime = sortedLapTimes.length
    ? sortedLapTimes[Math.floor(sortedLapTimes.length / 2)]
    : null
  const lapVariance = lapTimes.length
    ? lapTimes.reduce((sum, value) => sum + Math.pow(value - avgLapTime, 2), 0) / lapTimes.length
    : null
  const lapStdDev = lapVariance !== null ? Math.sqrt(lapVariance) : null

  const lapHistogram = useMemo(() => {
    if (!lapTimes.length) return []
    const min = Math.min(...lapTimes)
    const max = Math.max(...lapTimes)
    const bins = 8
    const size = (max - min) / bins || 1
    const buckets = Array.from({ length: bins }, (_, idx) => ({
      start: min + idx * size,
      end: min + (idx + 1) * size,
      count: 0,
    }))

    lapTimes.forEach((value) => {
      const index = Math.min(bins - 1, Math.floor((value - min) / size))
      buckets[index].count += 1
    })

    return buckets.map((bucket) => ({
      label: `${bucket.start.toFixed(1)}-${bucket.end.toFixed(1)}s`,
      count: bucket.count,
    }))
  }, [lapTimes])


  const compoundSummary = useMemo(() => {
    const map = new Map()
    filteredLaps.forEach((lap) => {
      const compound = lap.compound ?? 'Unknown'
      const entry = map.get(compound) ?? { compound, count: 0, times: [] }
      entry.count += 1
      if (lap.lap_time_seconds || lap.lap_time_seconds === 0) {
        entry.times.push(lap.lap_time_seconds)
      }
      map.set(compound, entry)
    })

    return Array.from(map.values())
      .map((entry) => {
        const avg = entry.times.length
          ? entry.times.reduce((a, b) => a + b, 0) / entry.times.length
          : null
        return {
          compound: entry.compound,
          count: entry.count,
          average: avg,
        }
      })
      .sort((a, b) => b.count - a.count)
  }, [filteredLaps])

  const stintSummary = useMemo(() => {
    const map = new Map()
    filteredLaps.forEach((lap) => {
      const stintKey = `${lap.driver_code ?? 'UNK'}-${lap.stint ?? 'NA'}-${lap.compound ?? 'Unknown'}`
      const entry = map.get(stintKey) ?? {
        driver: lap.driver_code ?? '—',
        stint: lap.stint ?? '—',
        compound: lap.compound ?? 'Unknown',
        laps: 0,
        times: [],
      }
      entry.laps += 1
      if (lap.lap_time_seconds || lap.lap_time_seconds === 0) {
        entry.times.push(lap.lap_time_seconds)
      }
      map.set(stintKey, entry)
    })

    const summary = Array.from(map.values()).map((entry) => {
      const avg = entry.times.length
        ? entry.times.reduce((a, b) => a + b, 0) / entry.times.length
        : null
      return { ...entry, average: avg }
    })

    return summary
      .sort((a, b) => {
        if (a.average === null && b.average === null) return 0
        if (a.average === null) return 1
        if (b.average === null) return -1
        return a.average - b.average
      })
      .slice(0, driverFilter === 'ALL' ? 8 : summary.length)
  }, [filteredLaps, driverFilter])

  return (
    <section className="section section--fill">
      <div className="section-header laps__header">
        <div>
          <h2 className="section-title">Lap telemetry</h2>
          <p className="section-subtitle">Inspect lap pace trends and fastest laps for the season.</p>
        </div>
        <div className="laps__controls">
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
            value={driverFilter}
            onChange={setDriverFilter}
            options={driverOptions}
            placeholder="All drivers"
          />
        </div>
      </div>

      {racesError ? (
        <ErrorBanner message={racesErrorObj?.message ?? 'Unable to load races.'} onRetry={refetchRaces} />
      ) : racesPending ? (
        <Skeleton lines={4} />
      ) : (
        <div className="grid two laps__section">
          <Card title="Race pace intelligence" subtitle="Aggregate pace, consistency, and spread">
            {lapsError ? (
              <ErrorBanner message={lapsErrorObj?.message ?? 'Unable to load laps.'} onRetry={refetchLaps} />
            ) : lapsPending ? (
              <Skeleton lines={6} />
            ) : filteredLaps.length === 0 ? (
              <p className="section-note">No lap data available for this race.</p>
            ) : (
              <div className="laps__metrics">
                <div className="laps__chart">
                  <p className="laps__chart-title">Lap time distribution</p>
                  <div className="laps__chart-wrap">
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={lapHistogram} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(225, 6, 0, 0.2)" />
                        <XAxis dataKey="label" tick={{ fill: 'var(--text-secondary)', fontSize: 10 }} />
                        <YAxis tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} />
                        <Tooltip
                          contentStyle={{
                            background: 'var(--surface-strong)',
                            border: '2px solid var(--border)',
                            borderRadius: 6,
                            color: 'var(--text-primary)',
                          }}
                        />
                        <Bar dataKey="count" fill="var(--accent)" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div className="metric-row">
                  <span className="metric-label">Total laps</span>
                  <span className="metric-value">{filteredLaps.length}</span>
                </div>
                <div className="metric-row">
                  <span className="metric-label">Average lap time</span>
                    <span className="metric-value">{formatSeconds(avgLapTime)}</span>
                </div>
                <div className="metric-row">
                  <span className="metric-label">Median lap time</span>
                  <span className="metric-value">{formatSeconds(medianLapTime)}</span>
                </div>
                <div className="metric-row">
                  <span className="metric-label">Lap-time variability (σ)</span>
                  <span className="metric-value">{formatSeconds(lapStdDev)}</span>
                </div>
                <div className="metric-row">
                  <span className="metric-label">Fastest lap</span>
                    <span className="metric-value">{formatSeconds(fastestLap)}</span>
                </div>
                <div className="metric-row">
                  <span className="metric-label">Driver filter</span>
                  <span className="metric-value">{driverFilter === 'ALL' ? 'All drivers' : driverFilter}</span>
                </div>
              </div>
            )}
          </Card>

          <Card title="Compound mix" subtitle="Usage volume and average pace">
            {lapsError ? (
              <ErrorBanner message={lapsErrorObj?.message ?? 'Unable to load laps.'} onRetry={refetchLaps} />
            ) : lapsPending ? (
              <Skeleton lines={6} />
            ) : compoundSummary.length === 0 ? (
              <p className="section-note">No compound data available.</p>
            ) : (
              <ul className="list-plain">
                {compoundSummary.map((compound) => (
                  <li key={compound.compound} className="lap-item">
                    <div>
                      <p className="lap-title">{compound.compound}</p>
                      <p className="lap-sub">{compound.count} laps logged</p>
                    </div>
                    <span className="badge">{formatSeconds(compound.average)}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      )}

      <div className="grid two laps__section">
        <Card title="Stint efficiency" subtitle="Fastest stint averages across the race">
          {lapsError ? (
            <ErrorBanner message={lapsErrorObj?.message ?? 'Unable to load laps.'} onRetry={refetchLaps} />
          ) : lapsPending ? (
            <Skeleton lines={6} />
          ) : stintSummary.length === 0 ? (
            <p className="section-note">No stint data available.</p>
          ) : (
            <ul className="list-plain">
              {stintSummary.map((stint, index) => (
                <li key={`${stint.driver}-${stint.stint}-${stint.compound}-${index}`} className="lap-item">
                  <div>
                    <p className="lap-title">
                      {stint.driver} · Stint {stint.stint}
                    </p>
                    <p className="lap-sub">
                      {stint.compound} · {stint.laps} laps
                    </p>
                  </div>
                  <span className="badge">{formatSeconds(stint.average)}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </section>
  )
}

export default LapsPage
