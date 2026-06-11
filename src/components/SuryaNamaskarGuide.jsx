import { X, Info, ShieldAlert, Target, TrendingUp } from 'lucide-react'
import './SuryaNamaskarGuide.css'

export default function SuryaNamaskarGuide({ onClose, userProfile, calcData }) {
  const { weight, goal_type, activity_level } = userProfile
  const { calories, MET, rpm, rounds, duration } = calcData
  
  // Safe defaults if profile data is missing
  const safeWeight = weight || 70
  const safeGoal = goal_type || 'general_fitness'
  const safeLevel = activity_level ? activity_level.toLowerCase() : 'beginner'

  const getRecommendations = () => {
    let rec = { start: '', progress: '', target: '' }
    
    if (safeGoal.includes('loss')) {
      if (safeWeight < 60) {
        if (safeLevel === 'beginner') rec = { start: '12–24 rounds', progress: '24–48 rounds', target: '48–108 rounds' }
        else if (safeLevel === 'intermediate') rec = { start: '24–48 rounds', progress: '48–72 rounds', target: '72–108 rounds' }
        else rec = { start: '48–108 rounds', progress: '108+ rounds', target: '108+ rounds' }
      } else if (safeWeight <= 80) {
        if (safeLevel === 'beginner') rec = { start: '12–36 rounds', progress: '36–72 rounds', target: '72–108 rounds' }
        else if (safeLevel === 'intermediate') rec = { start: '36–72 rounds', progress: '72–90 rounds', target: '90–108 rounds' }
        else rec = { start: '72–108 rounds', progress: '108+ rounds', target: '108+ rounds' }
      } else {
        if (safeLevel === 'beginner') rec = { start: '12–24 rounds', progress: '24–60 rounds', target: '60–108 rounds' }
        else if (safeLevel === 'intermediate') rec = { start: '24–60 rounds', progress: '60–84 rounds', target: '84–108 rounds' }
        else rec = { start: '60–108 rounds', progress: '108+ rounds', target: '108+ rounds' }
      }
    } else if (safeGoal.includes('flexibility')) {
      rec = { start: '12 slow rounds', progress: '12–24 slow rounds', target: '24 slow controlled rounds' }
    } else if (safeGoal.includes('endurance')) {
      rec = { start: '24–48 rounds', progress: '48–72 rounds', target: '72–108 rounds' }
    } else {
      // General Fitness
      if (safeLevel === 'beginner') rec = { start: '12 rounds', progress: '24 rounds', target: '24–48 rounds' }
      else if (safeLevel === 'intermediate') rec = { start: '24 rounds', progress: '36 rounds', target: '48 rounds' }
      else rec = { start: '48 rounds', progress: '72 rounds', target: '108 rounds' }
    }
    return rec
  }

  const recs = getRecommendations()

  return (
    <div className="guide-modal-overlay animate-fade-in">
      <div className="guide-modal-content glass-panel animate-slide-up">
        <button className="close-btn" onClick={onClose}><X size={24} /></button>
        
        <div className="guide-header">
          <h2 className="text-gradient-primary">Surya Namaskar Analysis</h2>
          <p className="text-secondary">Based on your {safeWeight}kg profile</p>
        </div>

        <div className="guide-summary-card">
          <div className="summary-stat">
            <span className="stat-value text-gradient-primary">{calories}</span>
            <span className="stat-label">kcal burned</span>
          </div>
          <div className="summary-math">
            <p><strong>RPM:</strong> {rounds} ÷ {duration} = {rpm.toFixed(1)}</p>
            <p><strong>MET:</strong> {MET.toFixed(1)}</p>
            <p className="math-formula">{MET.toFixed(1)} × {safeWeight} × ({duration} ÷ 60) ≈ {calories} kcal</p>
          </div>
        </div>

        <div className="guide-section image-section">
          <h3>Perfect Posture Guide</h3>
          <img src="/surya_namaskar.png" alt="12 Poses of Surya Namaskar" className="guide-image" />
        </div>

        <div className="guide-grid">
          <div className="guide-section">
            <h3><Target size={18}/> Personalized Plan</h3>
            <ul className="guide-list">
              <li><strong>Current Goal:</strong> {safeGoal.replace('_', ' ').toUpperCase()}</li>
              <li><strong>Start with:</strong> {recs.start} daily</li>
              <li><strong>Pace:</strong> 20–40 seconds per round</li>
            </ul>
          </div>

          <div className="guide-section">
            <h3><TrendingUp size={18}/> Progression</h3>
            <ul className="guide-list">
              <li><strong>Next Step:</strong> Progress to {recs.progress} after 2–3 weeks.</li>
              <li><strong>Target:</strong> {recs.target} for optimal results.</li>
              <li>Combine with adequate protein, sleep, and a proper diet.</li>
            </ul>
          </div>
        </div>

        <div className="guide-section">
          <h3><Info size={18}/> Scientific Accuracy (±15–25%)</h3>
          <p>This estimate uses the scientifically recognized MET (Metabolic Equivalent of Task) method. Actual calorie burn depends on your age, sex, muscle mass, fitness level, exercise intensity, technique, and metabolism. Therefore, the displayed value is a practical estimate, not a precise measurement.</p>
        </div>

        <div className="guide-section safety">
          <h3><ShieldAlert size={18} /> Safety Guidance</h3>
          <p>Keep your movements synchronized with your breath. Do not force stretches. If you experience sharp pain, especially in your lower back or knees, stop immediately. Focus on form over speed.</p>
        </div>
        
        <button className="btn btn-primary w-full mt-4" onClick={onClose}>
          Acknowledge & Close
        </button>
      </div>
    </div>
  )
}
