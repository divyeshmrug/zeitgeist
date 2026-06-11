import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../components/ToastProvider'
import { getUTCNow } from '../lib/time'
import StreakCard from '../components/StreakCard'
import CalorieDashboard from '../components/CalorieDashboard'
import WaterTracker from '../components/WaterTracker'
import MealLogger from '../components/MealLogger'
import ActivityLog from '../components/ActivityLog'
import AiBriefingHero from '../components/AiBriefingHero'
import RecoveryScoreCard from '../components/RecoveryScoreCard'
import AiPromptSection from '../components/AiPromptSection'
import NotificationCenter from '../components/NotificationCenter'
import { notificationEngine } from '../lib/NotificationEngine'
import { useActivities } from '../context/ActivityContext'
import { LogOut, Clock, Mail, Brain } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import dayjs from 'dayjs'
import { sendDailyReportEmail } from '../lib/sendEmail'
import './Dashboard.css'

export default function Dashboard() {
  const { user, signOut } = useAuth()
  const { addRandomHinglishToast } = useToast()
  const navigate = useNavigate()
  
  const [waterMl, setWaterMl] = useState(0)
  const { activities, logActivity, deleteActivity } = useActivities()
  const [profile, setProfile] = useState(null)
  const [currentDateTime, setCurrentDateTime] = useState(dayjs().format('dddd, MMMM D, YYYY • h:mm A'))
  const [isEmailing, setIsEmailing] = useState(false)
  
  useEffect(() => {
    // Keep time synced forever
    const timer = setInterval(() => {
      setCurrentDateTime(dayjs().format('dddd, MMMM D, YYYY • h:mm A'))
    }, 1000 * 60)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    if (user) {
      // Record login to update streak
      supabase.rpc('record_user_login', { 
        user_uuid: user.id, 
        login_timestamp: getUTCNow() 
      }).then(() => {
        // After recording, fetch profile data to get updated streak
        supabase.from('profiles')
          .select('*')
          .eq('id', user.id).single()
          .then(({ data }) => {
            if (data) setProfile(data)
          })
      })
    }
  }, [user])

  const handleAddWater = (amount) => {
    setWaterMl(prev => prev + amount)
  }

  const handleLogActivity = (activityData) => {
    // Ensure we use the proper UTC formatting when storing new logs
    logActivity({...activityData, timestamp: activityData.timestamp || getUTCNow()})
  }

  // Calculate current intake from activities
  const currentIntake = activities
    .filter(a => a.type === 'meal')
    .reduce((sum, a) => sum + (a.calories || 0), 0)

  const currentBurned = activities
    .filter(a => a.type === 'exercise')
    .reduce((sum, a) => sum + (a.burned || 0), 0)

  const handleQuickAdd = (type, amount) => {
    const newActivity = {
      id: Date.now(),
      type: type === 'intake' ? 'meal' : 'exercise',
      name: type === 'intake' ? 'Quick Meal' : 'Quick Workout',
      [type === 'intake' ? 'calories' : 'burned']: amount,
      category: 'Quick Add',
      timestamp: getUTCNow()
    }
    logActivity(newActivity)
  }

  const handleDeleteActivity = (id) => {
    deleteActivity(id)
  }

  const handleSendEmail = async () => {
    setIsEmailing(true)
    try {
      const dailyLogs = {
        total_calories_burned: currentBurned,
        total_calories_intake: currentIntake,
        total_water_ml: waterMl,
        activities
      }
      await sendDailyReportEmail(user, profile || {}, dailyLogs)
      addRandomHinglishToast('Email sent successfully! Check your inbox 🚀')
    } catch (err) {
      addRandomHinglishToast('Failed to send email. Server might be down.')
      console.error(err)
    } finally {
      setIsEmailing(false)
    }
  }

  return (
    <div className="dashboard-container">
      <header className="dashboard-header glass-panel">
        <div>
          <h1 className="text-gradient">Hello, {user?.email?.split('@')[0] || 'Warrior'}!</h1>
          <p className="text-secondary" style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
            <Clock size={14} /> 
            {currentDateTime}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <NotificationCenter />
          <button 
            onClick={() => navigate('/fitai')}
            className="btn btn-aurora"
            style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem', fontWeight: 600 }}
          >
            <Brain size={16} /> <span className="hidden-mobile">FitAI</span>
          </button>
          <button 
            className="btn btn-primary" 
            onClick={handleSendEmail} 
            disabled={isEmailing}
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <Mail size={18} />
            <span className="hidden-mobile">{isEmailing ? 'Sending...' : 'Email Report'}</span>
          </button>
          <button className="btn btn-secondary" onClick={signOut}>
            <LogOut size={18} />
            <span className="hidden-mobile">Exit</span>
          </button>
        </div>
      </header>

      {/* Temporary Test Button for V5 Notifications */}
      <button 
        className="btn btn-aurora" 
        style={{ width: '100%', padding: '12px', borderRadius: '16px', marginBottom: '10px' }}
        onClick={async () => {
          // Force permission request on Safari via explicit user click
          if ('Notification' in window && Notification.permission !== 'granted') {
            const permission = await Notification.requestPermission();
            notificationEngine.hasPermission = permission === 'granted';
          }

          notificationEngine.triggerNotification(
            "test_alert", 
            "LOW", 
            "FitAI Test", 
            "Notifications are working correctly.", 
            "/dashboard",
            true // ignoreCooldown flag
          )
        }}
      >
        🔔 Send Test Notification
      </button>

      <div className="dashboard-grid">
        <AiBriefingHero recoveryScore={87} />
        
        <RecoveryScoreCard score={87} />
        <StreakCard streakCount={profile?.current_streak || 0} last7Days={[false, false, false, false, false, false, false]} />
        <CalorieDashboard 
          intake={currentIntake} 
          burned={currentBurned} 
          goal={profile?.daily_calorie_goal || 2500} 
          onQuickAdd={handleQuickAdd}
        />
        <WaterTracker currentMl={waterMl} targetMl={2000} onAdd={handleAddWater} />
      </div>

      <div className="dashboard-grid">
        <AiPromptSection />
        <MealLogger onLogMeal={handleLogActivity} />
        <ActivityLog activities={activities} onDelete={handleDeleteActivity} />
      </div>
    </div>
  )
}
