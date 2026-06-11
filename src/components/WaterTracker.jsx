import { useState, useEffect } from 'react'
import { Plus, Droplet, Clock, History, BrainCircuit } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { analyzeWaterWithAI } from '../lib/ai'
import dayjs from 'dayjs'
import './WaterTracker.css'

const QUICK_AMOUNTS = [150, 250, 350, 500]

export default function WaterTracker({ targetMl = 2000, onAdd }) {
  const { user } = useAuth()
  const [customMl, setCustomMl]       = useState('')
  const [waterLogs, setWaterLogs]     = useState([])
  const [showHistory, setShowHistory] = useState(false)
  const [localTotal, setLocalTotal]   = useState(0)
  
  // AI State
  const [aiInsight, setAiInsight] = useState(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  const progress = Math.min((localTotal / targetMl) * 100, 100)

  // Fetch today's water logs from Supabase
  useEffect(() => {
    if (user) fetchWaterLogs()
  }, [user])

  const fetchWaterLogs = async () => {
    const today = dayjs().format('YYYY-MM-DD')
    const { data } = await supabase
      .from('water_logs')
      .select('*')
      .eq('user_id', user.id)
      .gte('logged_at', `${today}T00:00:00Z`)
      .order('logged_at', { ascending: false })

    if (data) {
      setWaterLogs(data)
      const total = data.reduce((sum, l) => sum + l.amount_ml, 0)
      setLocalTotal(total)
    }
  }

  const addWater = async (amount) => {
    const val = parseInt(amount)
    if (!val || val <= 0) return

    // Optimistic UI update
    setLocalTotal(prev => prev + val)
    setWaterLogs(prev => [{ id: Date.now(), amount_ml: val, logged_at: new Date().toISOString() }, ...prev])

    // Save to Supabase with timestamp
    if (user) {
      const { error } = await supabase.from('water_logs').insert({
        user_id:   user.id,
        amount_ml: val,
        logged_at: new Date().toISOString(),
      })
      if (error) {
        console.error("Failed to log water:", error)
        alert("Failed to save water log: " + error.message)
        fetchWaterLogs() // Revert optimistic update
        return
      }
    }

    if (onAdd) onAdd(val)
    setCustomMl('')
  }

  const handleCustomAdd = (e) => {
    e.preventDefault()
    addWater(customMl)
  }

  const handleAnalyze = async () => {
    if (waterLogs.length === 0) {
      alert("No water logged today yet!")
      return
    }
    setIsAnalyzing(true)
    try {
      // Fetch profile to send to AI
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      const insight = await analyzeWaterWithAI(profile || {}, waterLogs, targetMl)
      setAiInsight(insight)
    } catch (err) {
      console.error(err)
      alert("AI Analysis failed. Try again later.")
    } finally {
      setIsAnalyzing(false)
    }
  }

  return (
    <div className="glass-panel water-card animate-slide-in">
      <div className="water-header-premium">
        <div className="water-title">
          <div className="water-icon-wrapper">
            <Droplet size={20} className="water-icon" />
          </div>
          <h3>Hydration</h3>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <p className="water-stats">
            <span className="current">{localTotal}</span>
            <span className="target"> / {targetMl} ml</span>
          </p>
          <button
            className="btn btn-secondary"
            style={{ padding: '4px 8px', fontSize: '0.75rem' }}
            onClick={() => setShowHistory(v => !v)}
            title="Toggle History"
          >
            <History size={13} />
          </button>
        </div>
      </div>

      <div className="premium-progress-container">
        <div className="premium-progress-bg">
          <div className="premium-progress-fill" style={{ width: `${progress}%` }}>
            <div className="fluid-wave"></div>
          </div>
        </div>
      </div>

      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: 'rgba(255,255,255,0.02)',
        padding: '0.8rem 1rem',
        borderRadius: 'var(--radius-sm)',
        border: '1px solid rgba(255,255,255,0.05)',
        marginBottom: '0.5rem'
      }}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Hydration Score</span>
          <span style={{ fontSize: '1.2rem', fontWeight: 700, color: '#38bdf8' }}>96/100 <span style={{fontSize:'0.8rem', fontWeight:500, color:'var(--text-primary)'}}>Excellent</span></span>
        </div>
        <div style={{ textAlign: 'right', fontSize: '0.8rem', color: '#4ade80' }}>
          +12% compared<br/>to weekly avg
        </div>
      </div>

      {/* Quick add buttons */}
      <div className="water-quick-btns">
        {QUICK_AMOUNTS.map(amt => (
          <button
            key={amt}
            className="btn btn-secondary water-quick-btn"
            onClick={() => addWater(amt)}
          >
            +{amt}ml
          </button>
        ))}
      </div>

      {/* Custom amount form */}
      <form onSubmit={handleCustomAdd} className="water-custom-form">
        <input
          type="number"
          className="input-field water-input"
          placeholder="Custom ml"
          value={customMl}
          onChange={(e) => setCustomMl(e.target.value)}
        />
        <span className="ml-label">ml</span>
        <button type="submit" className="btn btn-primary water-custom-btn" disabled={!customMl}>
          <Plus size={16} /> Add
        </button>
      </form>
      
      {/* AI Analysis Button */}
      <button 
        className="btn btn-secondary w-full mt-3" 
        onClick={handleAnalyze}
        disabled={isAnalyzing}
        style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}
      >
        <BrainCircuit size={16} style={{ color: '#8b5cf6' }} />
        {isAnalyzing ? 'Analyzing with HydroAI...' : 'Get HydroAI Insight'}
      </button>

      {/* AI Insight Box */}
      {aiInsight && (
        <div className="glass-panel" style={{ marginTop: '15px', padding: '12px', background: 'rgba(139, 92, 246, 0.05)', border: '1px solid rgba(139, 92, 246, 0.2)' }}>
          <h4 style={{ margin: '0 0 8px 0', fontSize: '0.9rem', color: '#a78bfa', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <BrainCircuit size={14} /> HydroAI Analysis
          </h4>
          <p style={{ fontSize: '0.85rem', margin: 0, color: 'var(--text-secondary)' }}>
            <strong>Score: {aiInsight.hydration_score}/100</strong>
            <br />
            {aiInsight.ai_reasoning?.[0]}
          </p>
          {aiInsight.smart_suggestions?.length > 0 && (
            <p style={{ fontSize: '0.8rem', marginTop: '6px', color: 'var(--text-secondary)' }}>
              💡 {aiInsight.smart_suggestions[0]}
            </p>
          )}
        </div>
      )}

      {/* Timestamped History */}
      {showHistory && (
        <div className="water-history">
          <h4 className="water-history-title">Today's Water Log</h4>
          {waterLogs.length === 0 ? (
            <p className="text-secondary" style={{ fontSize: '0.88rem' }}>No water logged today yet.</p>
          ) : (
            waterLogs.map(log => (
              <div key={log.id} className="water-log-row">
                <div className="water-log-time">
                  <Clock size={12} />
                  {dayjs(log.logged_at).format('h:mm A')}
                </div>
                <div className="water-log-amount">+{log.amount_ml} ml</div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}

