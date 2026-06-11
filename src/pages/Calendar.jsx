import { useState, useEffect } from 'react'
import { Calendar as CalendarIcon, Activity } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import ReactCalendar from 'react-calendar'
import dayjs from 'dayjs'
import './Calendar.css'

export default function CalendarPage() {
  const { user } = useAuth()
  const [date, setDate] = useState(new Date())
  const [logsMap, setLogsMap] = useState({})
  const [profile, setProfile] = useState(null)

  useEffect(() => {
    if (user) {
      fetchCalendarData()
      fetchProfile()
    }
  }, [user])

  const fetchProfile = async () => {
    const { data } = await supabase.from('profiles').select('daily_calorie_goal').eq('id', user.id).single()
    if (data) setProfile(data)
  }

  const fetchCalendarData = async () => {
    const { data, error } = await supabase
      .from('daily_logs')
      .select('log_date, calories_intake, calories_burned, water_ml')
      .eq('user_id', user.id)

    if (error) {
      console.error('Error fetching calendar data:', error)
      return
    }

    const map = {}
    if (data) {
      data.forEach(log => {
        map[log.log_date] = log
      })
    }
    setLogsMap(map)
  }

  const selectedDateStr = dayjs(date).format('YYYY-MM-DD')
  const selectedLog = logsMap[selectedDateStr]
  const goal = profile?.daily_calorie_goal || 2500
  const intake = selectedLog?.calories_intake || 0
  const burned = selectedLog?.calories_burned || 0
  const deficit = Math.max(0, goal - intake + burned)

  const tileContent = ({ date, view }) => {
    if (view === 'month') {
      const dateStr = dayjs(date).format('YYYY-MM-DD')
      if (logsMap[dateStr]) {
        return <div className="calendar-dot"></div>
      }
    }
    return null
  }

  return (
    <div className="calendar-container animate-slide-in" style={{ maxWidth: '900px', margin: '0 auto', padding: '3rem 1rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Premium Hero Section */}
      <div className="glass-panel" style={{ padding: '3rem', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-50%', left: '-10%', width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(118, 185, 0, 0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />
        
        <div className="calendar-header" style={{ marginBottom: '2.5rem' }}>
          <Activity color="var(--primary-color)" size={32} />
          <h1 className="hero-title">Fitness Journey</h1>
        </div>

        {/* Monthly Summary */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
          <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1.5rem', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>Cal Consumed</span>
            <div className="card-value" style={{ marginTop: '0.5rem', color: '#4ade80' }}>84k</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1.5rem', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>Cal Burned</span>
            <div className="card-value" style={{ marginTop: '0.5rem', color: '#fb923c' }}>12.4k</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1.5rem', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>Consistency</span>
            <div className="card-value" style={{ marginTop: '0.5rem', color: '#38bdf8' }}>92%</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1.5rem', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>Recovery</span>
            <div className="card-value" style={{ marginTop: '0.5rem', color: '#a78bfa' }}>88/100</div>
          </div>
        </div>
      </div>

      <div className="glass-panel" style={{ padding: '3rem' }}>
        <div className="react-calendar-wrapper">
          <ReactCalendar 
            onChange={setDate} 
            value={date} 
            tileContent={tileContent}
            prevLabel="‹"
            nextLabel="›"
          />
        </div>

        <div className="daily-detail-card" style={{ marginTop: '3rem', paddingTop: '2rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <h3 className="detail-date" style={{ fontSize: '1.8rem', textAlign: 'left', marginBottom: '1.5rem' }}>{dayjs(date).format('dddd, MMMM D')}</h3>
          {selectedLog ? (
            <div className="detail-metrics" style={{ gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
              <div className="detail-metric intake" style={{ padding: '2rem', borderRadius: '24px', background: 'rgba(255,255,255,0.02)' }}>
                <span className="label">Intake</span>
                <span className="value" style={{ fontSize: '2rem' }}>{intake}</span>
              </div>
              <div className="detail-metric burned" style={{ padding: '2rem', borderRadius: '24px', background: 'rgba(255,255,255,0.02)' }}>
                <span className="label">Burned</span>
                <span className="value" style={{ fontSize: '2rem' }}>{burned}</span>
              </div>
              <div className="detail-metric deficit" style={{ padding: '2rem', borderRadius: '24px', background: 'rgba(255,255,255,0.02)' }}>
                <span className="label">Deficit</span>
                <span className="value" style={{ fontSize: '2rem' }}>{deficit}</span>
              </div>
            </div>
          ) : (
            <div className="no-data" style={{ padding: '4rem 0', fontSize: '1.2rem', opacity: 0.6 }}>
              <CalendarIcon size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
              No activities logged for this day.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

