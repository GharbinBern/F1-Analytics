const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'
const API_PREFIX = '/api/v1'

async function request(path) {
  const response = await fetch(`${BASE_URL}${path}`)

  if (!response.ok) {
    const text = await response.text()
    throw new Error(text || `Request failed with status ${response.status}`)
  }

  return response.json()
}

export const api = {
  drivers: (season = null) => 
    request(`${API_PREFIX}/drivers${season ? `?season=${season}` : ''}`),
  driver: (code) => request(`${API_PREFIX}/drivers/${code}`),
  driverStats: (code, season = 2024) =>
    request(`${API_PREFIX}/drivers/${code}/stats?season=${season}`),
  driverRaces: (code, season = 2024) =>
    request(`${API_PREFIX}/drivers/${code}/races?season=${season}`),
  driverCompare: (driver1, driver2, season = 2024) =>
    request(`${API_PREFIX}/drivers/compare?driver1=${driver1}&driver2=${driver2}&season=${season}`),

  races: (season) => request(`${API_PREFIX}/races?season=${season}`),
  race: (id) => request(`${API_PREFIX}/races/${id}`),
  raceResults: (raceId) => request(`${API_PREFIX}/races/${raceId}/results`),
  raceLaps: (raceId, driverCode = null) =>
    request(`${API_PREFIX}/races/${raceId}/laps${driverCode ? `?driver_code=${driverCode}` : ''}`),
  laps: (raceId, driverCode = null) =>
    request(`${API_PREFIX}/races/${raceId}/laps${driverCode ? `?driver_code=${driverCode}` : ''}`),
  fastestLaps: (season = 2024, limit = 8) =>
    request(`${API_PREFIX}/laps/fastest?season=${season}&limit=${limit}`),
  teamPerformance: (team, season = 2024) =>
    request(`${API_PREFIX}/team/${encodeURIComponent(team)}/performance?season=${season}`),
  teamPitStops: (team, season = 2024) =>
    request(`${API_PREFIX}/team/${encodeURIComponent(team)}/pit-stops?season=${season}`),
}
