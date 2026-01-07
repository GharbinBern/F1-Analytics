import { lazy } from 'react'

const HomePage = lazy(() => import('./features/home/HomePage'))
const DriverList = lazy(() => import('./features/drivers/DriverList'))

export const routes = [
  { path: '/', element: <HomePage /> },
  { path: '/drivers', element: <DriverList /> },
]
