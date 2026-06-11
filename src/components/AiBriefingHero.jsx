import React from 'react'
import { Sparkles, Brain, Activity } from 'lucide-react'

export default function AiBriefingHero({ recoveryScore = 87 }) {
  return (
    <div className="glass-panel animate-slide-in" style={{
      position: 'relative',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      minHeight: '260px',
      padding: '3rem 4rem',
      gridColumn: '1 / -1',
      marginBottom: '1rem',
      background: 'linear-gradient(145deg, rgba(20,20,20,0.8) 0%, rgba(10,10,10,0.9) 100%)',
      borderLeft: '4px solid var(--primary-color)'
    }}>
      {/* Moving Background decoration */}
      <div className="animate-aurora-sweep" style={{
        position: 'absolute',
        top: '-50%',
        left: '-10%',
        width: '600px',
        height: '600px',
        background: 'radial-gradient(circle, rgba(118, 185, 0, 0.08) 0%, transparent 60%)',
        borderRadius: '50%',
        pointerEvents: 'none',
        zIndex: 0
      }} />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem', alignItems: 'center', zIndex: 1 }}>
        
        {/* Left: AI Insight */}
        <div style={{ paddingRight: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
            <Brain size={28} color="var(--primary-color)" />
            <h1 className="text-gradient" style={{ margin: 0, fontSize: '1.8rem' }}>FitAI Daily Briefing</h1>
          </div>
          
          <div>
            <h3 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.5rem' }}>
              Today's Insight
            </h3>
            <p style={{ fontSize: '1.15rem', fontWeight: 500, lineHeight: 1.5, color: 'var(--text-primary)' }}>
              "You are well hydrated but slightly under your protein target. Sleep quality was optimal."
            </p>
          </div>
        </div>

        {/* Center: Recommended Action */}
        <div style={{
          background: 'rgba(255,255,255,0.02)',
          borderRadius: '24px',
          padding: '1.5rem',
          border: '1px solid rgba(255,255,255,0.05)',
          boxShadow: 'inset 0 2px 10px rgba(255,255,255,0.02)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary-color)', marginBottom: '0.75rem' }}>
            <Sparkles size={18} />
            <span style={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.85rem' }}>Recommended Action</span>
          </div>
          <p style={{ fontSize: '1.1rem', color: 'rgba(255,255,255,0.9)', lineHeight: 1.5 }}>
            Consume 25g of protein within the next 2 hours and aim for a moderate 30-minute workout.
          </p>
        </div>

        {/* Right: Recovery Score */}
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center',
          background: 'rgba(0,0,0,0.4)',
          padding: '2rem',
          borderRadius: '24px',
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1)'
        }}>
          <Activity size={20} color="var(--primary-color)" style={{ marginBottom: '0.5rem' }} />
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
            Recovery Score
          </span>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', margin: '0.5rem 0' }}>
            <span className="text-gradient" style={{ fontSize: '3.5rem', fontWeight: 800, lineHeight: 1 }}>
              {recoveryScore}
            </span>
          </div>
          <span style={{ color: '#4ade80', fontWeight: 600, fontSize: '0.9rem' }}>Excellent Recovery</span>
        </div>

      </div>
    </div>
  )
}
