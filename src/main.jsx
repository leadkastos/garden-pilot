import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './styles/globals.css'

import Layout from './components/layout/Layout'
import DashboardPage from './pages/DashboardPage'
import ProfilePage from './pages/ProfilePage'
import FlowerTrackerPage from './pages/FlowerTrackerPage'
import PlantsPage from './pages/PlantsPage'
import JournalPage from './pages/JournalPage'
import BedsPage from './pages/BedsPage'
import LedgerPage from './pages/LedgerPage'
import CalendarPage from './pages/CalendarPage'
import { ReportsPage, ShopPage } from './pages/StubPages'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<DashboardPage />} />
          <Route path="calendar" element={<CalendarPage />} />
          <Route path="plants" element={<PlantsPage />} />
          <Route path="beds" element={<BedsPage />} />
          <Route path="journal" element={<JournalPage />} />
         <Route path="expenses" element={<LedgerPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="shop" element={<ShopPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="profile/flowers" element={<FlowerTrackerPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />)
