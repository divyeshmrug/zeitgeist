import React from 'react'
import { Activity, Moon, Droplets, Flame, Utensils } from 'lucide-react'

export default function RecoveryScoreCard({ score = 87 }) {
  const radius = 46;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;
  
  const getStatus = (s) => {
    if (s >= 80) return { text: 'Excellent Recovery', color: '#4ade80' };
    if (s >= 60) return { text: 'Moderate Recovery', color: '#fbbf24' };
    return { text: 'Poor Recovery', color: '#ef4444' };
  };

  const status = getStatus(score);

  return (
    <div className="glass-panel animate-slide-up" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
      
      {/* Background Glow */}
      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '120px', height: '120px', background: `radial-gradient(circle, ${status.color}33 0%, transparent 70%)`, pointerEvents: 'none' }} />
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.5rem', alignSelf: 'flex-start' }}>
        <Activity size={18} color={status.color} />
        <h3 style={{ margin: 0, fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-secondary)' }}>Readiness</h3>
      </div>

      <div style={{ position: 'relative', width: '120px', height: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
        <svg width="120" height="120" style={{ position: 'absolute', top: 0, left: 0 }}>
          <circle cx="60" cy="60" r={radius} fill="transparent" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
          <circle cx="60" cy="60" r={radius} fill="transparent" stroke={status.color} strokeWidth="8" 
                  strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} strokeLinecap="round" 
                  style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%', transition: 'stroke-dashoffset 1.5s cubic-bezier(0.16, 1, 0.3, 1)' }} />
        </svg>
        <span style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--text-primary)', zIndex: 1 }}>{score}</span>
      </div>

      <div style={{ textAlign: 'center' }}>
        <p style={{ fontSize: '1.1rem', fontWeight: 600, color: status.color, marginBottom: '0.5rem' }}>{status.text}</p>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
          {score >= 80 ? 'Your body is primed for a heavy workout.' : score >= 60 ? 'Optimal for moderate activity today.' : 'Prioritize rest and hydration today.'}
        </p>
      </div>

    </div>
  )
}
