import { Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { Navbar } from './components/layout/Navbar'
import { Sidebar } from './components/layout/Sidebar'
import { DashboardPage } from './pages/Dashboard'
import { MarketplacePage } from './pages/Marketplace'
import { TransactionsPage } from './pages/Transactions'
import { ProfilePage } from './pages/Profile'
import { AuthPage } from './pages/AuthPage'
import { useAuth } from './context/auth'
import { JobDetailPage } from './pages/JobDetail'
import { TrustPage } from './pages/Trust'

function LoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#050915] text-slate-200">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-700 border-t-indigo-500" aria-label="Loading" />
    </div>
  )
}

function ProtectedShell() {
  const { user, loading } = useAuth()
  if (loading) return <LoadingScreen />
  if (!user) return <Navigate to="/auth" replace />
  return (
    <div className="min-h-screen bg-[#050915] px-3 py-4 lg:px-6">
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

function PublicOnly({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return <LoadingScreen />
  if (user) return <Navigate to="/" replace />
  return <>{children}</>
}

function App() {
  return (
    <Routes>
      <Route
        path="/auth"
        element={(
          <PublicOnly>
            <AuthPage />
          </PublicOnly>
        )}
      />
      <Route element={<ProtectedShell />}>
        <Route index element={<DashboardPage />} />
        <Route path="marketplace" element={<MarketplacePage />} />
        <Route path="jobs/:id" element={<JobDetailPage />} />
        <Route path="transactions" element={<TransactionsPage />} />
        <Route path="trust" element={<TrustPage />} />
        <Route path="profile" element={<ProfilePage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
