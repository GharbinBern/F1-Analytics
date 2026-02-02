import { lazy } from 'react'

const Home = lazy(() => import('./pages/Home'))
const Driver = lazy(() => import('./pages/Driver'))
const Races = lazy(() => import('./pages/Races'))
const Teams = lazy(() => import('./pages/Teams'))
const Laps = lazy(() => import('./pages/Laps'))

export const routes = [
  { path: '/', element: <Home /> },
  { path: '/races', element: <Races /> },
  { path: '/drivers', element: <Driver /> },
  { path: '/teams', element: <Teams /> },
  { path: '/laps', element: <Laps /> },
]
