import { Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import PageShell from './components/PageShell'
import Skeleton from './components/Skeleton'
import { routes } from './routes'
import './App.css'

function App() {
  return (
    <PageShell>
      <Suspense fallback={<Skeleton lines={8} />}> 
        <Routes>
          {routes.map((route) => (
            <Route key={route.path} path={route.path} element={route.element} />
          ))}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </PageShell>
  )
}

export default App
