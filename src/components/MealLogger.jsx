import { useState } from 'react'
import { Sparkles, Send, Edit3, Plus } from 'lucide-react'
import { analyzeFoodWithAI } from '../lib/ai'
import './MealLogger.css'

export default function MealLogger({ onLogMeal }) {
  const [activeTab, setActiveTab] = useState('ai')
  
  // AI State
  const [aiInput, setAiInput] = useState('')
  const [loading, setLoading] = useState(false)
  
  // Manual State
  const [manualName, setManualName] = useState('')
  const [manualCals, setManualCals] = useState('')
  const [manualCat, setManualCat] = useState('Snack')

  const handleAIAnalyze = async (e) => {
    e.preventDefault()
    if (!aiInput.trim()) return
    setLoading(true)
    try {
      const data = await analyzeFoodWithAI(aiInput)
      onLogMeal({
        id: Date.now(),
        type: 'meal',
        name: data.meal_name || aiInput,
        calories: data.calories,
        category: data.category || 'Snack',
        added_by_ai: true,
        timestamp: new Date().toISOString()
      })
      setAiInput('')
      alert(`AI Advice: ${data.advice}`)
    } catch (err) {
      alert("Failed to analyze food. Try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleManualLog = (e) => {
    e.preventDefault()
    if (!manualName || !manualCals) return
    onLogMeal({
      id: Date.now(),
      type: 'meal',
      name: manualName,
      calories: parseInt(manualCals),
      category: manualCat,
      added_by_ai: false,
      timestamp: new Date().toISOString()
    })
    setManualName('')
    setManualCals('')
  }

  return (
    <div className="glass-panel meal-logger-card animate-slide-in">
      <div className="logger-tabs">
        <button 
          type="button"
          className={`tab-btn ${activeTab === 'ai' ? 'active' : ''}`} 
          onClick={() => setActiveTab('ai')}
        >
          <Sparkles size={16} /> AI Magic ✨
        </button>
        <button 
          type="button"
          className={`tab-btn ${activeTab === 'manual' ? 'active' : ''}`} 
          onClick={() => setActiveTab('manual')}
        >
          <Edit3 size={16} /> Manual ✍️
        </button>
      </div>

      {activeTab === 'ai' ? (
        <form onSubmit={handleAIAnalyze} className="logger-form ai-form">
          <p className="text-secondary text-sm mb-3">Tell the AI what you ate in any language!</p>
          <div className="input-with-btn">
            <input 
              type="text" 
              className="input-field" 
              placeholder="e.g. maine aaj 2 roti aur dal khayi" 
              value={aiInput}
              onChange={(e) => setAiInput(e.target.value)}
              disabled={loading}
            />
            <button type="submit" className="btn btn-primary" disabled={loading || !aiInput.trim()}>
              {loading ? <span className="loader"></span> : <Send size={18} />}
            </button>
          </div>
        </form>
      ) : (
        <form onSubmit={handleManualLog} className="logger-form manual-form">
          <div className="manual-grid">
            <select className="input-field" value={manualCat} onChange={e => setManualCat(e.target.value)}>
              <option value="Breakfast">Breakfast</option>
              <option value="Lunch">Lunch</option>
              <option value="Dinner">Dinner</option>
              <option value="Snack">Snack</option>
            </select>
            <input 
              type="text" 
              className="input-field" 
              placeholder="Food Name" 
              value={manualName} 
              onChange={e => setManualName(e.target.value)} 
            />
            <input 
              type="number" 
              className="input-field" 
              placeholder="Calories" 
              value={manualCals} 
              onChange={e => setManualCals(e.target.value)} 
            />
          </div>
          <button type="submit" className="btn btn-primary w-full mt-3" disabled={!manualName || !manualCals}>
            <Plus size={18} /> Add Meal
          </button>
        </form>
      )}
    </div>
  )
}
