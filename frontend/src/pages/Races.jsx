import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import Card from '../components/Card'
import CustomSelect from '../components/CustomSelect'
import ErrorBanner from '../components/ErrorBanner'
import Skeleton from '../components/Skeleton'
import { api } from '../services/api'
import './Races.css'

const AVAILABLE_SEASONS = [2025, 2024, 2023, 2022, 2021, 2020]

function RacesPage() {
  const [season, setSeason] = useState(2025)
  const [selectedRaceId, setSelectedRaceId] = useState(null)

  const {
    data: racesData,
    isPending: racesPending,
    isError: racesError,
    error: racesErrorObj,
    refetch: refetchRaces,
  } = useQuery({
    queryKey: ['races', season, 'list'],
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

  const selectedRace = races.find((race) => race.id === selectedRaceId)

  const {
    data: resultsData,
    isPending: resultsPending,
    isError: resultsError,
    error: resultsErrorObj,
    refetch: refetchResults,
  } = useQuery({
    queryKey: ['race-results', selectedRaceId],
    queryFn: () => api.raceResults(selectedRaceId),
    enabled: Boolean(selectedRaceId),
    staleTime: 3 * 60 * 1000,
  })

  const results = resultsData?.results ?? []
  const winner = results.find((result) => result.position === 1)
  const sortedResults = useMemo(() => {
    const isRetired = (result) => /retired|dnf|not classified/i.test(result?.status ?? '')
    const toNumber = (value) => {
      if (typeof value === 'number') return Number.isFinite(value) ? value : null
      if (typeof value === 'string') {
        const parsed = Number(value)
        return Number.isFinite(parsed) ? parsed : null
      }
      return null
    }

    return [...results].sort((a, b) => {
      const aRetired = isRetired(a)
      const bRetired = isRetired(b)

      if (aRetired !== bRetired) return aRetired ? 1 : -1

      const aPos = toNumber(a.position)
      const bPos = toNumber(b.position)

      if (aPos === null && bPos === null) return 0
      if (aPos === null) return 1
      if (bPos === null) return -1

      return aPos - bPos
    })
  }, [results])

  return (
    <section className="section">
      <div className="section-header">
        <div>
          <h2 className="section-title">Race calendar</h2>
          <p className="section-subtitle">Select a round to view finishing order and race details.</p>
        </div>
        <div className="races__controls">
          <CustomSelect
            value={season}
            onChange={(value) => setSeason(Number(value))}
            options={AVAILABLE_SEASONS.map((year) => ({ value: year, label: `Season ${year}` }))}
            placeholder="Select season"
          />
          <span className="pill">{racesData?.count ?? 0} races</span>
        </div>
      </div>

      <div className="grid two">
        <Card title="Race list" subtitle="Tap a race to load results">
          {racesError ? (
            <ErrorBanner message={racesErrorObj?.message ?? 'Unable to load races.'} onRetry={refetchRaces} />
          ) : racesPending ? (
            <Skeleton lines={6} />
          ) : races.length === 0 ? (
            <p className="section-note">No races found for season {season}.</p>
          ) : (
            <ul className="list-plain">
              {races.map((race, index) => (
                <li key={race.id}>
                  <button
                    type="button"
                    className={`races__race-button ${race.id === selectedRaceId ? 'is-active' : ''}`}
                    onClick={() => setSelectedRaceId(race.id)}
                  >
                    <div>
                      <p className="lap-title">{race.name}</p>
                      <p className="lap-sub">
                        {race.location ?? race.country ?? 'Track TBD'} ·{' '}
                        {race.date ? new Date(race.date).toLocaleDateString() : 'Date TBC'}
                      </p>
                    </div>
                    <span className="badge">Round {index + 1}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card
          title={selectedRace ? `${selectedRace.name} results` : 'Race results'}
          subtitle={winner ? `Winner: ${winner.driver_name}` : 'Finishing order'}
        >
          {resultsError ? (
            <ErrorBanner message={resultsErrorObj?.message ?? 'Unable to load results.'} onRetry={refetchResults} />
          ) : resultsPending ? (
            <Skeleton lines={6} />
          ) : results.length === 0 ? (
            <p className="section-note">Select a race to view results.</p>
          ) : (
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Pos</th>
                    <th>Driver</th>
                    <th>Grid</th>
                    <th>Points</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedResults.map((result) => (
                    <tr key={`${result.driver_code}-${result.position}`}>
                      <td>{result.position ?? '—'}</td>
                      <td>{result.driver_name ?? result.driver_code}</td>
                      <td>{result.grid_position ?? '—'}</td>
                      <td>{result.points ?? 0}</td>
                      <td>{result.status ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </section>
  )
}

export default RacesPage
