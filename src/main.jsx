import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import './styles/globals.css'

import { AuthProvider, useAuth } from './lib/AuthContext'
import Layout from './components/layout/Layout'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import ProfilePage from './pages/ProfilePage'
import FlowerTrackerPage from './pages/FlowerTrackerPage'
import PlantsPage from './pages/PlantsPage'
import JournalPage from './pages/JournalPage'
import BedsPage from './pages/BedsPage'
import LedgerPage from './pages/LedgerPage'
import CalendarPage from './pages/CalendarPage'
import ReportsPage from './pages/ReportsPage'
import CommunityPage from './pages/CommunityPage'

// Protected route — redirects to login if not authenticated
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-parchment flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-3 border-garden-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-garden-500 text-sm">Loading your garden...</p>
        </div>
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />
  return children
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public route */}
          <Route path="/login" element={<LoginPage />} />

          {/* Protected routes */}
          <Route path="/" element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }>
            <Route index element={<DashboardPage />} />
            <Route path="calendar" element={<CalendarPage />} />
            <Route path="plants" element={<PlantsPage />} />
            <Route path="beds" element={<BedsPage />} />
            <Route path="journal" element={<JournalPage />} />
            <Route path="expenses" element={<LedgerPage />} />
            <Route path="reports" element={<ReportsPage />} />
            <Route path="community" element={<CommunityPage />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="profile/flowers" element={<FlowerTrackerPage />} />
          </Route>

          {/* Catch all — redirect to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />)
