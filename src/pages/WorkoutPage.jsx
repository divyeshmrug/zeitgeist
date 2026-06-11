import { useActivities } from '../context/ActivityContext'
import WorkoutLogger from '../components/WorkoutLogger'
import ActivityLog from '../components/ActivityLog'
import { getUTCNow } from '../lib/time'
import { Dumbbell, BrainCircuit, Activity, ShieldCheck, Flame } from 'lucide-react'

export default function WorkoutPage() {
  const { activities, logActivity, deleteActivity } = useActivities()

  const handleLogWorkout = (workoutData) => {
    logActivity({...workoutData, timestamp: workoutData.timestamp || getUTCNow()})
  }

  const workoutActivities = activities.filter(a => a.type === 'exercise')

  return (
    <div className="dashboard-container animate-slide-in" style={{ padding: '3rem', maxWidth: '1400px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '3rem' }}>
      
      {/* Workout Intelligence Hero */}
      <div className="glass-panel" style={{ padding: '3rem', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-50%', right: '-10%', width: '400px', height: '400px', background: 'radial-gradient(circle, rgba(118, 185, 0, 0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2.5rem' }}>
          <BrainCircuit size={36} color="var(--primary-color)" />
          <h1 className="hero-title" style={{ margin: 0 }}>Workout Intelligence</h1>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '24px', padding: '1.5rem', display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
            <Activity color="#a78bfa" size={24} />
            <div>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '4px' }}>AI Tracking</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>Multi-variable machine learning model for calorie expenditure.</p>
            </div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '24px', padding: '1.5rem', display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
            <Flame color="#fb923c" size={24} />
            <div>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '4px' }}>Calorie Engine</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>Blended ACSM & Distance algorithms for high accuracy.</p>
            </div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '24px', padding: '1.5rem', display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
            <ShieldCheck color="#4ade80" size={24} />
            <div>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '4px' }}>Recovery Impact</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>Real-time CNS and muscle recovery impact calculation.</p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="dashboard-grid">
        <WorkoutLogger onLogWorkout={handleLogWorkout} />
        <ActivityLog activities={workoutActivities} onDelete={deleteActivity} />
      </div>
    </div>
  )
}
