import React from 'react'
import { Sparkles, ArrowRight } from 'lucide-react'

const PROMPTS = [
  "How much protein do I need?",
  "Can I eat pizza today?",
  "Why is my recovery low?",
  "How much water should I drink?"
]

export default function AiPromptSection() {
  return (
    <div className="glass-panel animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', gridColumn: '1 / -1', animationDelay: '0.2s' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Sparkles size={20} color="var(--primary-color)" />
        <h3 style={{ margin: 0 }}>Ask FitAI</h3>
      </div>
      
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        {PROMPTS.map((prompt, idx) => (
          <button 
            key={idx}
            className="btn btn-secondary"
            style={{ 
              borderRadius: '24px', 
              padding: '0.75rem 1.25rem',
              fontSize: '0.9rem',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.08)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            {prompt}
            <ArrowRight size={14} style={{ opacity: 0.5 }} />
          </button>
        ))}
      </div>
    </div>
  )
}
