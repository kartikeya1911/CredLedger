import { Routes, Route, Navigate, Outlet } from 'react-router-dom'
import type { ReactNode } from 'react'
import { Navbar } from './components/layout/Navbar'
import { Sidebar } from './components/layout/Sidebar'
import { DashboardPage } from './pages/Dashboard'
import { MarketplacePage } from './pages/Marketplace'
import { TransactionsPage } from './pages/Transactions'
import { ProfilePage } from './pages/Profile'
import { AuthPage } from './pages/AuthPage'
import { useAuth } from './context/auth.tsx'
import { JobDetailPage } from './pages/JobDetail'
import { TrustPage } from './pages/Trust'
import { EscrowPage } from './pages/Escrow'
import { LandingPage } from './pages/LandingPage'

function LoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-sc-bg text-slate-200">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-700 border-t-indigo-500" aria-label="Loading" />
    </div>
  )
}

function ProtectedShell() {
  const { user, loading } = useAuth()
  if (loading) return <LoadingScreen />
  if (!user) return <Navigate to="/auth" replace />
  return (
    <div className="min-h-screen bg-sc-bg px-3 py-4 lg:px-6">
      <div className="mx-auto flex max-w-7xl gap-4">
        <Sidebar />
        <div className="flex-1">
          <Navbar />
          <Outlet />
        </div>
      </div>
    </div>
  )
}

function PublicOnly({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return <LoadingScreen />
  if (user) return <Navigate to="/dashboard" replace />
  return <>{children}</>
}

function App() {
  return (
    <Routes>
      <Route
        path="/"
        element={(
          <PublicOnly>
            <LandingPage />
          </PublicOnly>
        )}
      />
      <Route
        path="/auth"
        element={(
          <PublicOnly>
            <AuthPage />
          </PublicOnly>
        )}
      />
      <Route path="/dashboard" element={<ProtectedShell />}>
        <Route index element={<DashboardPage />} />
        <Route path="marketplace" element={<MarketplacePage />} />
        <Route path="jobs/:id" element={<JobDetailPage />} />
        <Route path="escrow/:address" element={<EscrowPage />} />
        <Route path="transactions" element={<TransactionsPage />} />
        <Route path="trust" element={<TrustPage />} />
        <Route path="profile" element={<ProfilePage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
