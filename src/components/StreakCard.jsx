import { Flame, CheckCircle, Circle } from 'lucide-react'
import './StreakCard.css'

export default function StreakCard({ streakCount = 0, last7Days = [] }) {
  // last7Days is an array of booleans indicating if the user logged in/met goal
  // Example: [true, true, false, true, true, true, false] (oldest to newest)
  // Fill array up to 7 items if empty for demo
  const days = last7Days.length === 7 ? last7Days : [false, false, false, false, false, false, false];
  const daysOfWeek = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  
  // Fake momentum and level calculation for UI
  const activeDays = days.filter(Boolean).length;
  const momentum = Math.round((activeDays / 7) * 100) || 82; // Default 82 for demo
  const level = Math.floor(streakCount / 7) + 1;

  return (
    <div className="glass-panel animate-slide-in" style={{ position: 'relative', overflow: 'hidden', padding: '2rem' }}>
      {/* Background glow */}
      <div style={{ position: 'absolute', top: 0, right: 0, width: '150px', height: '150px', background: 'radial-gradient(circle, rgba(251, 146, 60, 0.1) 0%, transparent 70%)', pointerEvents: 'none' }} />
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(251, 146, 60, 0.1)', color: '#fb923c', padding: '4px 10px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>
            Level {level}
          </div>
          <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 600 }}>Consistency</h3>
          <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Momentum {momentum}%</p>
        </div>
        
        {/* Flame Ring */}
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '80px', height: '80px' }}>
          <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '4px solid rgba(251,146,60,0.1)' }}></div>
          <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '4px solid #fb923c', borderTopColor: 'transparent', borderRightColor: 'transparent', transform: 'rotate(-45deg)' }}></div>
          <Flame size={32} color="#fb923c" fill="rgba(251,146,60,0.2)" />
          <div style={{ position: 'absolute', bottom: '-10px', background: '#000', border: '1px solid rgba(255,255,255,0.1)', padding: '2px 8px', borderRadius: '10px', fontSize: '0.8rem', fontWeight: 700 }}>
            {streakCount}
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative' }}>
        <div style={{ position: 'absolute', top: '50%', left: '10px', right: '10px', height: '2px', background: 'rgba(255,255,255,0.05)', zIndex: 0 }}></div>
        {days.map((isActive, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', zIndex: 1 }}>
            <div style={{ 
              width: '24px', height: '24px', borderRadius: '50%', 
              background: isActive ? '#fb923c' : '#111', 
              border: isActive ? 'none' : '2px solid rgba(255,255,255,0.1)',
              boxShadow: isActive ? '0 0 10px rgba(251,146,60,0.4)' : 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              {isActive && <CheckCircle size={14} color="#000" />}
            </div>
            <span style={{ fontSize: '0.75rem', color: isActive ? '#fff' : 'var(--text-secondary)', fontWeight: isActive ? 600 : 400 }}>{daysOfWeek[i]}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
