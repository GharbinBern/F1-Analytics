import { useId } from 'react'
import { getTeamColors } from '../utils/teamColors'

function HelmetIcon({ label = 'Driver helmet', size = 44, teamName }) {
  const viewBox = '0 0 64 64'
  const gradientId = useId()
  const shellId = `${gradientId}-shell`
  const accentId = `${gradientId}-accent`
  const teamColors = getTeamColors(teamName)
  const shellColor = teamColors.secondary
  const primaryColor = teamColors.primary
  const accentColor = teamColors.accent

  return (
    <svg
      width={size}
      height={size}
      viewBox={viewBox}
      role="img"
      aria-label={label}
      className="helmet-icon"
    >
      <defs>
        <linearGradient id={shellId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={shellColor} stopOpacity="0.9" />
          <stop offset="100%" stopColor={primaryColor} />
        </linearGradient>
        <linearGradient id={accentId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={primaryColor} />
          <stop offset="100%" stopColor={accentColor} />
        </linearGradient>
      </defs>
      <path
        d="M10 36c0-12.7 9.9-23 22-23s22 10.3 22 23v10.5c0 2.5-2 4.5-4.5 4.5H16.5C14 51 12 49 12 46.5V36z"
        fill={`url(#${shellId})`}
      />
      <path
        d="M16 36c0-9.4 7.6-17 17-17s17 7.6 17 17v7H16v-7z"
        fill={shellColor}
        opacity="0.85"
      />
      <path
        d="M19 34h26c3.9 0 7 3.1 7 7v2H12v-2c0-3.9 3.1-7 7-7z"
        fill={primaryColor}
      />
      <path
        d="M20 28h24l4 6H16l4-6z"
        fill={`url(#${accentId})`}
      />
      <circle cx="20" cy="46" r="2" fill={accentColor} />
      <circle cx="44" cy="46" r="2" fill={accentColor} />
    </svg>
  )
}

export default HelmetIcon
