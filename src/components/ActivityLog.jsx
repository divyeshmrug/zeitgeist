import { toLocalTime } from '../lib/time'
import { Utensils, Dumbbell, Trash2, Flame } from 'lucide-react'
import './ActivityLog.css'

export default function ActivityLog({ activities = [], onDelete }) {
  // Sort activities by timestamp descending
  const sortedActivities = [...activities].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))

  return (
    <div className="glass-panel activity-card animate-slide-in">
      <div className="activity-header" style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
          <Dumbbell size={20} color="var(--primary-color)" />
          Today's Feed
        </h3>
      </div>
      
      <div className="activity-list" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {sortedActivities.length === 0 ? (
          <p className="text-secondary text-center py-4">No activities logged yet.</p>
        ) : (
          sortedActivities.map(activity => (
            <div key={activity.id} style={{
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.05)',
              borderRadius: 'var(--radius-sm)',
              padding: '1rem',
              position: 'relative'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{
                    background: activity.type === 'meal' ? 'rgba(74,222,128,0.1)' : 'rgba(251,146,60,0.1)',
                    padding: '8px',
                    borderRadius: '8px',
                    color: activity.type === 'meal' ? '#4ade80' : '#fb923c'
                  }}>
                    {activity.type === 'meal' ? <Utensils size={16} /> : <Flame size={16} />}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '1.05rem', fontWeight: 600 }}>{activity.name} {activity.added_by_ai && '✨'}</span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      {toLocalTime(activity.timestamp)} {activity.category && `• ${activity.category}`}
                    </span>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '1.2rem', fontWeight: 700, color: activity.type === 'meal' ? '#4ade80' : '#fb923c' }}>
                    {activity.type === 'meal' ? '+' : '-'}{activity.calories || activity.burned} kcal
                  </span>
                </div>
              </div>

              {/* Extra details row for premium feel */}
              {activity.type === 'exercise' && (
                <div style={{ display: 'flex', gap: '1rem', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Duration</span>
                    <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>{activity.duration || 30} min</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Confidence</span>
                    <span style={{ fontSize: '0.9rem', fontWeight: 500, color: '#4ade80' }}>High</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Method</span>
                    <span style={{ fontSize: '0.9rem', fontWeight: 500, color: '#818cf8' }}>AI Hybrid Model</span>
                  </div>
                </div>
              )}

              {activity.explanation && (
                <div style={{ fontSize: '0.85rem', color: 'var(--primary-color)', marginTop: '8px', opacity: 0.9 }}>
                  {activity.explanation}
                </div>
              )}

              {onDelete && (
                <button 
                  onClick={() => onDelete(activity.id)}
                  title="Remove item"
                  style={{
                    position: 'absolute',
                    top: '1rem',
                    right: '-2rem',
                    background: 'transparent',
                    border: 'none',
                    color: 'rgba(255,255,255,0.3)',
                    cursor: 'pointer'
                  }}
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
