import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './lib/AuthContext'
import './styles/globals.css'

import Layout from './components/layout/Layout'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import { CalendarPage, PlantsPage, BedsPage, ExpensesPage, ReportsPage, ShopPage } from './pages/StubPages'
import ProfilePage from './pages/ProfilePage'
import FlowerTrackerPage from './pages/FlowerTrackerPage'

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return (
    <div className="min-h-screen bg-parchment flex items-center justify-center">
      <div className="text-center">
        <div className="w-10 h-10 border-2 border-garden-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm text-garden-500 font-body">Loading Garden Pilot...</p>
      </div>
    </div>
  )
  return user ? children : <Navigate to="/login" replace />
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route index element={<DashboardPage />} />
            <Route path="calendar" element={<CalendarPage />} />
            <Route path="plants" element={<PlantsPage />} />
            <Route path="beds" element={<BedsPage />} />
            <Route path="expenses" element={<ExpensesPage />} />
            <Route path="reports" element={<ReportsPage />} />
            <Route path="shop" element={<ShopPage />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="profile/flowers" element={<FlowerTrackerPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />)
