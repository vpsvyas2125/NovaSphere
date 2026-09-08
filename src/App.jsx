import { AuthProvider, useAuth } from './contexts/AuthContext'

import Login from './pages/auth/Login.jsx'
import StudentDashboard from './pages/student/StudentDashboard.jsx'
import CoordinatorDashboard from './pages/coordinator/CoordinatorDashboard.jsx'

function AppContent() {
  const {
    user,
    profile,
    loading,
  } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#070b1a] text-white">

        <div className="text-center">

          <div className="mb-4 mx-auto h-10 w-10 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />

          <h1 className="text-lg font-semibold">
            Entering NovaSphere...
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Preparing your academic universe
          </p>

        </div>

      </div>
    )
  }

  if (!user) {
    return <Login />
  }

  if (profile?.role === 'coordinator') {
    return <CoordinatorDashboard />
  }

  return <StudentDashboard />
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

export default App