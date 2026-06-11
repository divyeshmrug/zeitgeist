import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ToastProvider } from './components/ToastProvider'
import { Home, Calendar as CalendarIcon, User, Dumbbell, Target } from 'lucide-react'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Discipline from './pages/Discipline'
import CalendarPage from './pages/Calendar'
import ProfilePage from './pages/Profile'
import WorkoutPage from './pages/WorkoutPage'
import FitAI from './pages/FitAI'
import { ActivityProvider } from './context/ActivityContext'

import { notificationEngine } from './lib/NotificationEngine'
import { useEffect } from 'react'
import './index.css'
import './AppLayout.css'

const PrivateRoute = ({ children }) => {
  const { user } = useAuth()
  // Mock auth for demo purposes if user hasn't setup supabase
  // return children; 
  return user ? children : <Navigate to="/login" />
}

const BottomNav = () => {
  const location = useLocation()
  if (location.pathname === '/login') return null

  return (
    <nav className="bottom-nav glass-panel">
      <Link to="/" className={`nav-item ${location.pathname === '/' ? 'active' : ''}`}>
        <Home size={24} />
        <span>Home</span>
      </Link>
      <Link to="/calendar" className={`nav-item ${location.pathname === '/calendar' ? 'active' : ''}`}>
        <CalendarIcon size={24} />
        <span>Calendar</span>
      </Link>
      <Link to="/workout" className={`nav-item ${location.pathname === '/workout' ? 'active' : ''}`}>
        <Dumbbell size={24} />
        <span>Workout</span>
      </Link>
      <Link to="/discipline" className={`nav-item ${location.pathname === '/discipline' ? 'active' : ''}`}>
        <Target size={24} />
        <span>Discipline</span>
      </Link>
      <Link to="/profile" className={`nav-item ${location.pathname === '/profile' ? 'active' : ''}`}>
        <User size={24} />
        <span>Profile</span>
      </Link>
    </nav>
  )
}

function AppRoutes() {
  const { user } = useAuth()

  useEffect(() => {
    if (user) {
      notificationEngine.init(user.id).then(() => {
        notificationEngine.listenForServerPushes();
      })
    }
  }, [user])

  return (
    <div className="app-layout">
      <div className="main-content">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/calendar" element={
            <PrivateRoute>
              <CalendarPage />
            </PrivateRoute>
          } />
          <Route path="/workout" element={
            <PrivateRoute>
              <WorkoutPage />
            </PrivateRoute>
          } />
          <Route path="/dashboard" element={<PrivateRoute><ActivityProvider><Dashboard /></ActivityProvider></PrivateRoute>} />
          <Route path="/discipline" element={<PrivateRoute><Discipline /></PrivateRoute>} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/profile" element={
            <PrivateRoute>
              <ProfilePage />
            </PrivateRoute>
          } />
          <Route path="/fitai" element={
            <PrivateRoute>
              <FitAI />
            </PrivateRoute>
          } />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
      <BottomNav />
      {/* Temporary debug panel — remove once Supabase is confirmed working */}

    </div>
  )
}

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <ActivityProvider>
          <Router>
            <AppRoutes />
          </Router>
        </ActivityProvider>
      </ToastProvider>
    </AuthProvider>
  )
}

export default App
