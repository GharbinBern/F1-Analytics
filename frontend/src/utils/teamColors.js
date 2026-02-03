const TEAM_COLORS = {
  mercedes: {
    name: 'Mercedes',
    primary: '#00D2BE',
    secondary: '#000000',
    accent: '#6CD3BF',
  },
  ferrari: {
    name: 'Ferrari',
    primary: '#DC0000',
    secondary: '#FFF200',
    accent: '#FF4444',
  },
  redbull: {
    name: 'Red Bull Racing',
    primary: '#0600EF',
    secondary: '#FCD700',
    accent: '#1E41FF',
  },
  mclaren: {
    name: 'McLaren',
    primary: '#FF8700',
    secondary: '#000000',
    accent: '#FFB800',
  },
  alpine: {
    name: 'Alpine',
    primary: '#FE86BC',
    secondary: '#0090FF',
    accent: '#FF9EC5',
  },
  astonmartin: {
    name: 'Aston Martin',
    primary: '#006F62',
    secondary: '#00352F',
    accent: '#229971',
  },
  sauber: {
    name: 'Kick Sauber',
    primary: '#00E701',
    secondary: '#000000',
    accent: '#52F066',
  },
  visarb: {
    name: 'Visa RB',
    primary: '#1634CB',
    secondary: '#FFFFFF',
    accent: '#4A69FF',
  },
  haas: {
    name: 'Haas',
    primary: '#B6BABD',
    secondary: '#ED1B24',
    accent: '#E8EAEA',
  },
  williams: {
    name: 'Williams',
    primary: '#00A0DD',
    secondary: '#041E42',
    accent: '#37BBED',
  },
}

const FALLBACK_COLORS = {
  name: 'Ferrari',
  primary: '#DC0000',
  secondary: '#FFF200',
  accent: '#FF4444',
}

const normalizeTeamName = (teamName = '') =>
  teamName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')

const TEAM_ALIASES = {
  mercedesamg: 'mercedes',
  mercedesamgpetronas: 'mercedes',
  mercedesamgpetronasf1team: 'mercedes',
  scuderiaferrari: 'ferrari',
  redbullracing: 'redbull',
  oracle: 'redbull',
  oracleredbullracing: 'redbull',
  mclarenf1team: 'mclaren',
  bwtalpinef1team: 'alpine',
  astonmartinaramco: 'astonmartin',
  astonmartinaramcof1team: 'astonmartin',
  kicksauer: 'sauber',
  stakef1teamkicksauber: 'sauber',
  visacashapp: 'visarb',
  visacashapprb: 'visarb',
  visacashapprbformulaone: 'visarb',
  haasf1team: 'haas',
  williamsracing: 'williams',
}

export const getTeamColors = (teamName = '') => {
  if (!teamName) return FALLBACK_COLORS
  const normalized = normalizeTeamName(teamName)
  const mappedKey = TEAM_ALIASES[normalized] ?? normalized
  return TEAM_COLORS[mappedKey] ?? FALLBACK_COLORS
}

export const getTeamCssVars = (teamName = '') => {
  const colors = getTeamColors(teamName)
  return {
    '--team-primary': colors.primary,
    '--team-secondary': colors.secondary,
    '--team-accent': colors.accent,
  }
}
