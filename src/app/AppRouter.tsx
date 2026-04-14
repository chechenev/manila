import { Suspense, lazy } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from './AppShell.tsx'

const AnalyticsPage = lazy(() =>
  import('../features/analytics/AnalyticsPage.tsx').then((module) => ({
    default: module.AnalyticsPage,
  })),
)

const RefundExplorerPage = lazy(() =>
  import('../features/refunds/RefundExplorerPage.tsx').then((module) => ({
    default: module.RefundExplorerPage,
  })),
)

function RouteFallback() {
  return (
    <div className="page-stack">
      <section className="ui-card empty-state" aria-live="polite">
        <h2>Loading workspace</h2>
        <p>Preparing the next operational view.</p>
      </section>
    </div>
  )
}

export function AppRouter() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<Navigate replace to="/explorer" />} />
        <Route
          path="/explorer"
          element={
            <Suspense fallback={<RouteFallback />}>
              <RefundExplorerPage />
            </Suspense>
          }
        />
        <Route
          path="/analytics"
          element={
            <Suspense fallback={<RouteFallback />}>
              <AnalyticsPage />
            </Suspense>
          }
        />
      </Route>
    </Routes>
  )
}
