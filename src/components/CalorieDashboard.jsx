import { Plus, Flame, Utensils, TrendingDown, ShieldCheck } from 'lucide-react'
import './CalorieDashboard.css'

export default function CalorieDashboard({ intake = 0, burned = 0, goal = 2000, onQuickAdd }) {
  const deficit = Math.max(0, goal - intake + burned)
  const progressPercent = Math.min((intake / goal) * 100, 100)

  const handleQuickAdd = (type) => {
    const amountStr = prompt(`How many calories to add to ${type === 'intake' ? 'food' : 'burned'}?`)
    if (!amountStr) return
    const amount = parseInt(amountStr)
    if (isNaN(amount) || amount <= 0) return
    onQuickAdd(type, amount)
  }

  return (
    <div className="glass-panel calorie-dash-card animate-slide-in">
      <div className="calorie-dash-header" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Flame size={20} color="var(--primary-color)" />
          <h3 style={{ margin: 0 }}>Calories</h3>
        </div>
        <span className="goal-badge" style={{ background: 'rgba(255,255,255,0.1)', padding: '4px 10px', borderRadius: '12px', fontSize: '0.8rem' }}>
          Goal: {goal} kcal
        </span>
      </div>

      {/* Goal Progress Bar */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          <span>Daily Goal Progress</span>
          <span>{Math.round(progressPercent)}%</span>
        </div>
        <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
          <div style={{ width: `${progressPercent}%`, height: '100%', background: 'var(--primary-color)', borderRadius: '4px' }} />
        </div>
      </div>

      <div className="metrics-grid" style={{ gap: '1rem', marginBottom: '1.5rem' }}>
        <div className="metric-box intake" style={{ padding: '1rem', borderRadius: 'var(--radius-sm)', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
          <span className="metric-label" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Intake</span>
          <span className="metric-value" style={{ fontSize: '1.5rem', fontWeight: 700 }}>{intake}</span>
        </div>
        <div className="metric-box burned" style={{ padding: '1rem', borderRadius: 'var(--radius-sm)', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
          <span className="metric-label" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Burned</span>
          <span className="metric-value" style={{ fontSize: '1.5rem', fontWeight: 700, color: '#fb923c' }}>{burned}</span>
        </div>
        <div className="metric-box deficit" style={{ padding: '1rem', borderRadius: 'var(--radius-sm)', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
          <span className="metric-label" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Deficit</span>
          <span className="metric-value" style={{ fontSize: '1.5rem', fontWeight: 700, color: '#4ade80' }}>{deficit}</span>
        </div>
      </div>

      {/* AI & Trend Info */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '1.5rem', padding: '1rem', background: 'rgba(0,0,0,0.2)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(255,255,255,0.03)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            <TrendingDown size={14} color="#4ade80" /> Weekly Trend
          </div>
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#4ade80' }}>-350 kcal avg</span>
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            <ShieldCheck size={14} color="#818cf8" /> AI Confidence
          </div>
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#818cf8' }}>88%</span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginLeft: '20px' }}>Recovery Impact</span>
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fbbf24' }}>Moderate</span>
        </div>
      </div>

      <div className="quick-actions" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <button className="btn btn-secondary quick-btn" style={{ fontSize: '0.85rem', padding: '0.6rem' }} onClick={() => handleQuickAdd('intake')}>
          <Utensils size={14} /> Quick Food
        </button>
        <button className="btn btn-secondary quick-btn" style={{ fontSize: '0.85rem', padding: '0.6rem' }} onClick={() => handleQuickAdd('burned')}>
          <Flame size={14} /> Quick Burn
        </button>
      </div>
    </div>
  )
}

