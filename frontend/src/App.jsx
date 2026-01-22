
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useAuthStore } from './store/authStore'
import Layout from './components/Layout'
import LoginPage from './pages/LoginPage'
import CallbackPage from './pages/CallbackPage'
import Dashboard from './pages/Dashboard'
import Resources from './pages/Resources'
import Votes from './pages/Votes'
import Disputes from './pages/Disputes'
import Tests from './pages/Tests'
import RecodePage from './pages/recodepage'
import Profile from './pages/profile'

function ProtectedRoute({ children }) {
  const { token } = useAuthStore()
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    // Wait for zustand to hydrate from localStorage
    setIsHydrated(true)
  }, [])

  if (!isHydrated) {
    return (
      <div className="min-h-screen bg-[#0d1117] flex items-center justify-center">
        <div className="animate-spin w-12 h-12 border-4 border-[#00d4aa] border-t-transparent rounded-full"></div>
      </div>
    )
  }

  return token ? children : <Navigate to="/login" />
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/callback" element={<CallbackPage />} />
        <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route index element={<Dashboard />} />
          <Route path="resources" element={<Resources />} />
          <Route path="votes" element={<Votes />} />
          <Route path="disputes" element={<Disputes />} />
          <Route path="tests" element={<Tests />} />
          <Route path="recode" element={<RecodePage />} />
          <Route path="profile" element={<Profile />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}