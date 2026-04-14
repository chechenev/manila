import { Navigate, Route, Routes } from 'react-router-dom'
import { AnalyticsPage } from '../features/analytics/AnalyticsPage.tsx'
import { RefundExplorerPage } from '../features/refunds/RefundExplorerPage.tsx'
import { AppShell } from './AppShell.tsx'

export function AppRouter() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<Navigate replace to="/explorer" />} />
        <Route path="/explorer" element={<RefundExplorerPage />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
      </Route>
    </Routes>
  )
}
