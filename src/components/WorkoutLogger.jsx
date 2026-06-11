import { useState, useEffect } from 'react'
import { Dumbbell, Activity, Plus, Info } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import SuryaNamaskarGuide from './SuryaNamaskarGuide'
import RunningGuide, { calculateRunningCalories } from './RunningGuide'
import { estimateCaloriesWithAI } from '../lib/ai'
import './WorkoutLogger.css'

const ACTIVITY_TYPES = ['Slow Walk', 'Normal Walk', 'Brisk Walk', 'Jogging', 'Running']

export default function WorkoutLogger({ onLogWorkout }) {
  const { user } = useAuth()
  const [workoutType, setWorkoutType] = useState('Gym')
  const [userProfile, setUserProfile] = useState({ id: '', weight: 70, goal_type: 'general_fitness', activity_level: 'beginner' })
  const [isEstimating, setIsEstimating] = useState(false)

  // Gym
  const [muscleGroup, setMuscleGroup] = useState('Chest')
  const [caloriesBurned, setCaloriesBurned] = useState('')

  // Surya Namaskar
  const [rounds, setRounds] = useState('')
  const [duration, setDuration] = useState('')
  const [showSuryaGuide, setShowSuryaGuide] = useState(false)

  // Running / Walking — scientific MET calculator
  const [runActivity, setRunActivity]   = useState('Running')
  const [runDuration, setRunDuration]   = useState('')    // minutes
  const [runDistance, setRunDistance]   = useState('')    // km (optional)
  const [runIncline, setRunIncline]     = useState('')    // % incline (optional)
  const [showRunGuide, setShowRunGuide] = useState(false)
  const [runCalcData, setRunCalcData]   = useState(null)

  // Other
  const [customName, setCustomName] = useState('')

  useEffect(() => {
    if (user) {
      supabase.from('profiles')
        .select('id, current_weight_kg, goal_type, activity_level, age, gender, height_cm')
        .eq('id', user.id).single()
        .then(({ data }) => {
          if (data) {
            setUserProfile({
              id: data.id || user.id,
              weight: data.current_weight_kg || 70,
              goal_type: data.goal_type || 'general_fitness',
              activity_level: data.activity_level || 'beginner',
              age: data.age || '',
              gender: data.gender || '',
              height_cm: data.height_cm || '',
              current_weight_kg: data.current_weight_kg || 70
            })
          }
        })
    }
  }, [user])

  // ── Surya Namaskar calculation ────────────────────────────────────────────
  const calculateSuryaNamaskar = () => {
    if (!rounds || !duration) return null
    const total_rounds = parseInt(rounds)
    const duration_minutes = parseFloat(duration)
    if (duration_minutes <= 0) return null
    const rpm = total_rounds / duration_minutes
    let MET = 3.5
    if (rpm > 5) MET = 8.0
    else if (rpm >= 4) MET = 7.0
    else if (rpm >= 3) MET = 6.0
    else if (rpm >= 2) MET = 5.0
    const calories = Math.round(MET * userProfile.weight * (duration_minutes / 60))
    return { calories, MET, rpm, rounds: total_rounds, duration: duration_minutes }
  }

  // ── Running / Walking live calculation ───────────────────────────────────
  const liveRunData = calculateRunningCalories({
    activityType: runActivity,
    duration: parseFloat(runDuration) || 0,
    distance: parseFloat(runDistance) || 0,
    weight: userProfile.weight,
    incline: parseFloat(runIncline) || 0,
  })

  const runNeedsMoreInfo = runDistance && !runDuration  // distance w/o duration

  // ── Form submit ──────────────────────────────────────────────────────────
  const handleLogWorkout = async (e) => {
    e.preventDefault()
    let finalName = '', formulaCalories = 0, explanation = ''
    let workoutDataForAI = {}

    if (workoutType === 'Gym') {
      finalName = `Gym - ${muscleGroup}`
      formulaCalories = parseInt(caloriesBurned)
      workoutDataForAI = { type: 'Gym', duration: '', distance: '', speed: '', rounds: '' }

    } else if (workoutType === 'Surya Namaskar') {
      const calc = calculateSuryaNamaskar()
      if (!calc) return
      finalName = `Surya Namaskar (${rounds} rounds, ${duration} min)`
      formulaCalories = calc.calories
      explanation = `Formula: MET ${calc.MET.toFixed(1)} × ${userProfile.weight}kg × (${duration}÷60) = ${calc.calories} kcal`
      workoutDataForAI = { type: 'Surya Namaskar', duration, distance: '', speed: '', rounds }

    } else if (workoutType === 'Running') {
      if (!liveRunData || liveRunData.calories <= 0) return
      const finalIncline = parseFloat(runIncline) || 0
      finalName = `${runActivity}${runDistance ? ` – ${runDistance} km` : ''}${finalIncline > 0 ? ` (${finalIncline}% inc)` : ''} (${runDuration} min)`
      formulaCalories = liveRunData.calories
      explanation = `Formula: ${liveRunData.label} @ ${liveRunData.speed.toFixed(1)} km/h | MET ${liveRunData.MET} × ${userProfile.weight}kg × (${runDuration}÷60) = ${liveRunData.calories} kcal`
      workoutDataForAI = { type: runActivity, duration: runDuration, distance: runDistance, speed: liveRunData.speed, rounds: '', incline: runIncline }

    } else {
      finalName = customName || 'Other Workout'
      formulaCalories = parseInt(caloriesBurned)
      workoutDataForAI = { type: customName || 'Other', duration: '', distance: '', speed: '', rounds: '' }
    }

    if (!formulaCalories || formulaCalories <= 0) return

    setIsEstimating(true)
    try {
      const aiResult = await estimateCaloriesWithAI({
        userProfile,
        workoutData: workoutDataForAI,
        formulaCalories
      })

      const finalCalories = aiResult.recommended_calories || formulaCalories
      
      if (aiResult.reasoning && aiResult.reasoning.length > 0) {
        explanation += `\n\n🤖 FitAI Pro Assessment: ${aiResult.formula_assessment.toUpperCase()}`
        explanation += `\nReasoning: ${aiResult.reasoning.join(' ')}`
      }

      onLogWorkout({
        id: Date.now(),
        type: 'exercise',
        name: finalName,
        burned: finalCalories,
        category: workoutType,
        added_by_ai: true,
        timestamp: new Date().toISOString(),
        explanation
      })
    } catch (error) {
      console.error("AI Estimation failed", error)
      onLogWorkout({
        id: Date.now(),
        type: 'exercise',
        name: finalName,
        burned: formulaCalories,
        category: workoutType,
        added_by_ai: false,
        timestamp: new Date().toISOString(),
        explanation
      })
    } finally {
      setIsEstimating(false)
      // Reset
      setRounds(''); setDuration(''); setCaloriesBurned('')
      setCustomName(''); setRunDuration(''); setRunDistance(''); setRunIncline('')
    }
  }

  const liveSuryaData = calculateSuryaNamaskar()
  const suryaGuideData = liveSuryaData || { calories: 0, MET: 3.5, rpm: 0, rounds: 0, duration: 0 }

  const handleShowRunGuide = () => {
    setRunCalcData(liveRunData)
    setShowRunGuide(true)
  }

  return (
    <>
      <div className="glass-panel workout-logger-card animate-slide-in">
        <div className="workout-logger-header">
          <Dumbbell className="text-gradient-primary" size={20} />
          <h3>Log Workout</h3>
        </div>

        <form onSubmit={handleLogWorkout} className="workout-form">

          {/* ── Workout type tabs ─────────────────────────── */}
          <div className="workout-type-selector">
            {['Gym', 'Running', 'Surya Namaskar', 'Other'].map(type => (
              <button
                key={type}
                type="button"
                className={`workout-type-btn ${workoutType === type ? 'active' : ''}`}
                onClick={() => setWorkoutType(type)}
              >
                {type}
              </button>
            ))}
          </div>

          <div className="workout-inputs">

            {/* ── GYM ─────────────────────────────────────── */}
            {workoutType === 'Gym' && (
              <>
                <select className="input-field" value={muscleGroup} onChange={e => setMuscleGroup(e.target.value)}>
                  {['Chest', 'Back', 'Legs', 'Arms', 'Core', 'Shoulders', 'Full Body'].map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
                <input type="number" className="input-field" placeholder="Calories Burned" value={caloriesBurned} onChange={e => setCaloriesBurned(e.target.value)} required min="1" />
              </>
            )}

            {/* ── SURYA NAMASKAR ──────────────────────────── */}
            {workoutType === 'Surya Namaskar' && (
              <>
                <div className="surya-info-row">
                  <span className="surya-label">☀️ Surya Namaskar</span>
                  <button type="button" className="surya-info-btn" onClick={() => setShowSuryaGuide(true)}>
                    <Info size={15} /> Guide
                  </button>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input type="number" className="input-field" placeholder="Total Rounds" value={rounds} onChange={e => setRounds(e.target.value)} required style={{ flex: 1 }} min="1" />
                  <input type="number" className="input-field" placeholder="Mins" value={duration} onChange={e => setDuration(e.target.value)} required style={{ width: '80px' }} min="1" />
                </div>
                <div className="auto-calc-badge" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Activity size={14} />
                    <strong>{liveSuryaData ? `${liveSuryaData.calories} kcal burned` : 'Enter rounds and time above'}</strong>
                  </div>
                  {liveSuryaData && (
                    <span style={{ fontSize: '0.75rem', opacity: 0.8, marginTop: '4px' }}>
                      {liveSuryaData.rpm.toFixed(1)} RPM · MET {liveSuryaData.MET.toFixed(1)} · {userProfile.weight}kg
                    </span>
                  )}
                </div>
              </>
            )}

            {/* ── RUNNING / WALKING — full MET calculator ─── */}
            {workoutType === 'Running' && (
              <>
                {/* Header row with ℹ️ guide button */}
                <div className="surya-info-row">
                  <span className="surya-label">🏃 Walk / Run</span>
                  <button
                    type="button"
                    className="surya-info-btn"
                    onClick={handleShowRunGuide}
                    disabled={!liveRunData}
                    title={!liveRunData ? 'Enter duration first' : 'View full analysis'}
                  >
                    <Info size={15} /> Analysis
                  </button>
                </div>

                {/* Activity type selector */}
                <div className="run-activity-grid">
                  {ACTIVITY_TYPES.map(type => (
                    <button
                      key={type}
                      type="button"
                      className={`run-activity-btn ${runActivity === type ? 'active' : ''}`}
                      onClick={() => setRunActivity(type)}
                    >
                      {type === 'Slow Walk' && '🚶'}
                      {type === 'Normal Walk' && '🚶‍♂️'}
                      {type === 'Brisk Walk' && '💨'}
                      {type === 'Jogging' && '🏃'}
                      {type === 'Running' && '⚡'}
                      <span>{type}</span>
                    </button>
                  ))}
                </div>

                {/* Duration + Distance + Incline inputs */}
                <div className="run-inputs-row" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
                  <div className="run-input-group">
                    <label className="run-input-label">Duration <span style={{color:'#f87171'}}>*</span></label>
                    <input
                      type="number"
                      className="input-field"
                      placeholder="min"
                      value={runDuration}
                      onChange={e => setRunDuration(e.target.value)}
                      required
                      min="1"
                    />
                  </div>
                  <div className="run-input-group">
                    <label className="run-input-label">Distance</label>
                    <input
                      type="number"
                      className="input-field"
                      placeholder="km"
                      value={runDistance}
                      onChange={e => setRunDistance(e.target.value)}
                      step="0.1"
                      min="0"
                    />
                  </div>
                  <div className="run-input-group">
                    <label className="run-input-label">Incline</label>
                    <input
                      type="number"
                      className="input-field"
                      placeholder="%"
                      value={runIncline}
                      onChange={e => setRunIncline(e.target.value)}
                      step="0.1"
                      min="0"
                    />
                  </div>
                </div>

                {/* Warning: distance without duration */}
                {runNeedsMoreInfo && (
                  <div className="run-warning">
                    ⚠️ Please also enter Duration — needed to calculate calories from distance.
                  </div>
                )}

                {/* Live result badge */}
                {liveRunData ? (
                  <div className="auto-calc-badge run-result-badge" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Activity size={14} />
                      <strong>{liveRunData.calories} kcal burned</strong>
                      <span className="run-type-pill">{liveRunData.label}</span>
                    </div>
                    <span style={{ fontSize: '0.75rem', opacity: 0.8, marginTop: '4px' }}>
                      {liveRunData.speed.toFixed(1)} km/h · MET {liveRunData.MET} · {userProfile.weight}kg
                      {liveRunData.distance > 0 ? ` · ${liveRunData.distance} km` : ''}
                      {liveRunData.incline > 0 ? ` · ${liveRunData.incline}% inc` : ''}
                      {liveRunData.usingDefault && ' (default speed)'}
                    </span>
                  </div>
                ) : (
                  <div className="auto-calc-badge" style={{ opacity: 0.6 }}>
                    <Activity size={14} />
                    Enter duration to calculate calories automatically
                  </div>
                )}
              </>
            )}

            {/* ── OTHER ──────────────────────────────────────── */}
            {workoutType === 'Other' && (
              <>
                <input type="text" className="input-field" placeholder="Workout Name" value={customName} onChange={e => setCustomName(e.target.value)} required />
                <input type="number" className="input-field" placeholder="Calories Burned" value={caloriesBurned} onChange={e => setCaloriesBurned(e.target.value)} required min="1" />
              </>
            )}
          </div>

          <button type="submit" className="btn btn-primary w-full mt-3" disabled={isEstimating}>
            {isEstimating ? (
              <><Activity size={18} style={{animation: 'spin 1s linear infinite'}} /> FitAI Pro Analyzing...</>
            ) : (
              <><Plus size={18} /> Add Workout</>
            )}
          </button>
        </form>
      </div>

      {/* Surya Namaskar Guide Modal */}
      {showSuryaGuide && (
        <SuryaNamaskarGuide onClose={() => setShowSuryaGuide(false)} userProfile={userProfile} calcData={suryaGuideData} />
      )}

      {/* Running / Walking Guide Modal */}
      {showRunGuide && runCalcData && (
        <RunningGuide onClose={() => setShowRunGuide(false)} calcData={runCalcData} userProfile={userProfile} />
      )}
    </>
  )
}
