import { X, Activity, Zap, Info, TrendingUp, ShieldAlert, CheckCircle2 } from 'lucide-react'
import './RunningGuide.css'

// Flat-ground MET table (only used when incline < 10%)
const MET_TABLE = [
  { speed: 3,  MET: 2.5,  label: 'Slow Walk' },
  { speed: 4,  MET: 3.0,  label: 'Normal Walk' },
  { speed: 5,  MET: 3.5,  label: 'Normal Walk' },
  { speed: 6,  MET: 4.5,  label: 'Brisk Walk' },
  { speed: 7,  MET: 7.0,  label: 'Jogging' },
  { speed: 8,  MET: 8.3,  label: 'Jogging' },
  { speed: 9,  MET: 9.0,  label: 'Jogging' },
  { speed: 10, MET: 9.8,  label: 'Running' },
  { speed: 11, MET: 10.5, label: 'Running' },
  { speed: 12, MET: 11.5, label: 'Running' },
  { speed: 14, MET: 13.5, label: 'Running' },
  { speed: 16, MET: 15.0, label: 'Running' },
]

export function getMETForSpeed(speed) {
  if (speed <= MET_TABLE[0].speed) return MET_TABLE[0]
  if (speed >= MET_TABLE[MET_TABLE.length - 1].speed) return MET_TABLE[MET_TABLE.length - 1]

  for (let i = 0; i < MET_TABLE.length - 1; i++) {
    const lo = MET_TABLE[i]
    const hi = MET_TABLE[i + 1]
    if (speed >= lo.speed && speed <= hi.speed) {
      const t = (speed - lo.speed) / (hi.speed - lo.speed)
      const MET = parseFloat((lo.MET + t * (hi.MET - lo.MET)).toFixed(2))
      const label = speed < 6 ? 'Walking' : speed < 7 ? 'Brisk Walk' : speed < 10 ? 'Jogging' : 'Running'
      return { speed, MET, label }
    }
  }
  return MET_TABLE[0]
}

const DEFAULT_SPEEDS = {
  'Slow Walk':   3,
  'Normal Walk': 5,
  'Brisk Walk':  6,
  'Jogging':     8,
  'Running':     10,
}

export function calculateRunningCalories({ activityType, duration, distance, weight, incline = 0 }) {
  if (!weight || weight <= 0) return null
  if (!duration || duration <= 0) return null

  let speed, usingDefault = false

  if (distance && distance > 0) {
    speed = distance / (duration / 60)
    usingDefault = false
  } else {
    speed = DEFAULT_SPEEDS[activityType] || 5
    usingDefault = true
  }

  const distanceCovered = distance || parseFloat((speed * duration / 60).toFixed(2))

  // ── 1. ACSM TREADMILL EQUATION ──────────────────────────────────────────
  const speedMpm = (speed * 1000) / 60
  const grade = incline / 100
  const vo2 = (0.1 * speedMpm) + (1.8 * speedMpm * grade) + 3.5
  const acsmMET = vo2 / 3.5
  const acsmCalories = acsmMET * weight * (duration / 60)

  // ── 2. DISTANCE CALORIES ──────────────────────────────────────────────────
  // Distance multiplier: running = 1.0 (weight × distance = kcal), walking = 0.75
  const speedLabel = speed < 6 ? 'Walking' : speed < 7 ? 'Brisk Walk' : speed < 10 ? 'Jogging' : 'Running'
  const isJogging  = speed >= 7  && speed < 10
  const isRunning  = speed >= 10 || activityType === 'Running'
  const isWalking  = !isJogging && !isRunning

  // Walking on flat or low incline: 0.75; incline ≥ 10 adds work but distance still underestimates, keep 0.75
  const distanceMultiplier = (isJogging || isRunning) ? 1.0 : 0.75
  const distanceCalories = distanceMultiplier * weight * distanceCovered

  // ── 3. ACTIVITY-SPECIFIC BLENDING ────────────────────────────────────────
  let finalCalories = 0
  let calculationMethod = ''
  let blendDetails = {}

  if (isWalking) {
    if (incline >= 10) {
      finalCalories = (acsmCalories * 0.80) + (distanceCalories * 0.20)
      calculationMethod = 'Steep Incline Walking Hybrid'
      blendDetails = { distPercent: 20, acsmPercent: 80 }
    } else if (incline >= 5) {
      finalCalories = (acsmCalories * 0.65) + (distanceCalories * 0.35)
      calculationMethod = 'Incline Walking Hybrid'
      blendDetails = { distPercent: 35, acsmPercent: 65 }
    } else {
      finalCalories = (distanceCalories * 0.60) + (acsmCalories * 0.40)
      calculationMethod = 'Flat Walking Hybrid'
      blendDetails = { distPercent: 60, acsmPercent: 40 }
    }
  } else if (isRunning) {
    // Distance-based running equations are more accurate than ACSM treadmill estimates
    finalCalories    = (distanceCalories * 0.90) + (acsmCalories * 0.10)
    calculationMethod = 'Running Hybrid Model'
    blendDetails      = { distPercent: 90, acsmPercent: 10 }

  } else if (isJogging) {
    // Jogging: distance model is reliable but ACSM adds useful correction
    finalCalories    = (distanceCalories * 0.85) + (acsmCalories * 0.15)
    calculationMethod = 'Jogging Hybrid Model'
    blendDetails      = { distPercent: 85, acsmPercent: 15 }
  }

  // ── 4. CONFIDENCE ─────────────────────────────────────────────────────────
  const hasDistance = distance && distance > 0
  const confidence = (!usingDefault && hasDistance && weight)
    ? 'High'
    : (!usingDefault && weight)
    ? 'Medium'
    : 'Low'

  const label = speedLabel

  return {
    calories: Math.round(finalCalories),
    acsmCalories: Math.round(acsmCalories),
    distanceCalories: Math.round(distanceCalories),
    vo2: parseFloat(vo2.toFixed(2)),
    acsmMET: parseFloat(acsmMET.toFixed(2)),
    speed,
    distance: distanceCovered,
    weight,
    incline,
    usingDefault,
    calculationMethod,
    blendDetails,
    label: incline > 0 ? `${label} (Incline)` : label,
    duration,
    rangeMin: Math.round(finalCalories * 0.90),
    rangeMax: Math.round(finalCalories * 1.10),
  }
}


export default function RunningGuide({ onClose, calcData, userProfile }) {
  if (!calcData) return null
  const {
    calories, acsmCalories, distanceCalories, vo2, acsmMET, speed, label, duration, distance, weight, incline,
    usingDefault, calculationMethod, blendDetails, rangeMin, rangeMax
  } = calcData

  const getAccuracy = () => {
    if (!usingDefault && distance && duration && weight) return { text: 'High', color: '#4ade80' }
    if (!usingDefault && duration && weight) return { text: 'Medium', color: '#fbbf24' }
    return { text: 'Low', color: '#ef4444' }
  }

  const getRecommendation = () => {
    const goal = userProfile?.goal_type || 'general_fitness'
    if (label.includes('Slow Walk') || label.includes('Normal Walk')) {
      if (goal.includes('loss')) return 'Increase to Brisk Walk (6 km/h) for better fat burn. Aim for 45–60 min/day.'
      return 'Great for recovery and active rest days. Try 30 min daily.'
    }
    if (label.includes('Brisk Walk') || label.includes('Incline Walk')) {
      if (goal.includes('loss')) return 'Excellent for fat burning! Target 45–60 min/day. Incline walking burns significantly more calories than flat.'
      return 'Ideal cardiovascular workout. Incline increases intensity without joint stress.'
    }
    if (label.includes('Jogging') || label.includes('Incline Jog')) {
      return 'Good aerobic intensity. Try interval training: 2 min jog + 1 min walk. Build to 30–40 min continuously.'
    }
    return 'Excellent calorie burn! Ensure proper warm-up and cool-down. 20–30 min runs are highly effective.'
  }

  const accuracy = getAccuracy()

  return (
    <div className="guide-modal-overlay animate-fade-in">
      <div className="guide-modal-content glass-panel animate-slide-up running-guide-modal">
        <button className="close-btn" onClick={onClose}><X size={24} /></button>

        <div className="guide-header">
          <h2 className="text-gradient-primary">🏃 Activity Analysis</h2>
          <p className="text-secondary">{label} · {weight}kg bodyweight</p>
        </div>

        {/* Summary card */}
        <div className="running-summary-card">
          <div className="run-stat-block">
            <span className="run-stat-value text-gradient-primary">{calories}</span>
            <span className="run-stat-label">kcal burned</span>
          </div>
          <div className="run-divider" />
          <div className="run-stat-block">
            <span className="run-stat-value">{speed.toFixed(1)}</span>
            <span className="run-stat-label">km/h speed</span>
          </div>
          {incline > 0 && (
            <>
              <div className="run-divider" />
              <div className="run-stat-block">
                <span className="run-stat-value">{incline}<span style={{fontSize:'1rem'}}>%</span></span>
                <span className="run-stat-label">incline</span>
              </div>
            </>
          )}
          <div className="run-divider" />
          <div className="run-stat-block">
            <span className="run-stat-value">{distance}</span>
            <span className="run-stat-label">km covered</span>
          </div>
          <div className="run-divider" />
          <div className="run-stat-block">
            <span className="run-stat-value">{duration}</span>
            <span className="run-stat-label">minutes</span>
          </div>
        </div>

        {/* Calculation breakdown */}
        <div className="guide-section">
          <h3><Zap size={16} /> Calculation</h3>
          <div className="calc-breakdown">
            <div className="calc-row">
              <span className="calc-label">Speed</span>
              <span className="calc-value">
                {usingDefault
                  ? `Default for ${label} = ${speed} km/h`
                  : `${distance} km ÷ (${duration} min ÷ 60) = ${speed.toFixed(1)} km/h`
                }
              </span>
            </div>

            <div className="calc-row" style={{ background: 'rgba(99,102,241,0.08)', borderRadius: 8, padding: '6px 10px', marginTop: 6 }}>
              <span className="calc-label" style={{ color: '#818cf8' }}>Calculation Method</span>
              <span className="calc-value" style={{ color: '#818cf8', fontWeight: 600 }}>✓ {calculationMethod}</span>
            </div>
            
            {/* Blending Contribution Details */}
            <div className="calc-row">
              <span className="calc-label">Distance Calories</span>
              <span className="calc-value">{distanceCalories} kcal <span style={{fontSize: '0.8rem', opacity: 0.6}}>({blendDetails.distPercent}%)</span></span>
            </div>
            <div className="calc-row">
              <span className="calc-label">ACSM Calories</span>
              <span className="calc-value">{acsmCalories} kcal <span style={{fontSize: '0.8rem', opacity: 0.6}}>({blendDetails.acsmPercent}%)</span></span>
            </div>

            <div className="calc-row">
              <span className="calc-label">Confidence</span>
              <span className="calc-value" style={{ color: accuracy.color, fontWeight: 600 }}>{accuracy.text}</span>
            </div>

            <div className="calc-formula" style={{ marginTop: 8 }}>
              Final Blended = <strong className="text-gradient-primary">{calories} kcal</strong>
            </div>

            <div className="calc-row" style={{ marginTop: 6 }}>
              <span className="calc-label">Estimated Range</span>
              <span className="calc-value" style={{ color: '#4ade80', fontWeight: 600 }}>{rangeMin}–{rangeMax} kcal</span>
            </div>
          </div>
        </div>

        {/* Recommendation */}
        <div className="guide-section">
          <h3><TrendingUp size={16} /> Fitness Recommendation</h3>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>{getRecommendation()}</p>
        </div>

        {/* Accuracy + Safety */}
        <div className="guide-grid">
          <div className="guide-section">
            <h3><Info size={16} /> Accuracy</h3>
            <p style={{ color: accuracy.color, fontWeight: 600 }}>{accuracy.text}</p>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
              {incline >= 10
                ? 'ACSM treadmill equation — validated for incline walking and running.'
                : 'Varies by age, sex, terrain, body composition & metabolism.'
              }
            </p>
          </div>
          <div className="guide-section safety">
            <h3><ShieldAlert size={16} /> Safety</h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Warm up 5 min before running. Stay hydrated. If you feel chest pain or dizziness, stop immediately.
            </p>
          </div>
        </div>

        <button className="btn btn-primary w-full mt-4" onClick={onClose}>
          Got it — Close
        </button>
      </div>
    </div>
  )
}
