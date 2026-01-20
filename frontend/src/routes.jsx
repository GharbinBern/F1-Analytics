import { lazy } from 'react'

const HomePage = lazy(() => import('./features/HomePage'))
const DriverList = lazy(() => import('./features/DriverList'))

export const routes = [
  { path: '/', element: <HomePage /> },
  { path: '/drivers', element: <DriverList /> },
]
