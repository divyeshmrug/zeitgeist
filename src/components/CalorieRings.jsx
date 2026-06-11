import './CalorieRings.css'

export default function CalorieRings({ intake = 0, burned = 0, goal = 2000 }) {
  const radiusIntake = 60;
  const radiusBurned = 40;
  const strokeWidth = 12;
  const circumferenceIntake = 2 * Math.PI * radiusIntake;
  const circumferenceBurned = 2 * Math.PI * radiusBurned;

  const intakePercent = Math.min((intake / goal) * 100, 100);
  const burnedPercent = Math.min((burned / (goal * 0.3)) * 100, 100); // assume burn goal is 30% of intake goal for demo

  const strokeDashoffsetIntake = circumferenceIntake - (intakePercent / 100) * circumferenceIntake;
  const strokeDashoffsetBurned = circumferenceBurned - (burnedPercent / 100) * circumferenceBurned;

  return (
    <div className="glass-panel calorie-card animate-slide-in">
      <div className="rings-container">
        <svg width="160" height="160" viewBox="0 0 160 160">
          {/* Intake Ring Background */}
          <circle cx="80" cy="80" r={radiusIntake} stroke="rgba(118, 185, 0, 0.2)" strokeWidth={strokeWidth} fill="none" />
          {/* Intake Ring Progress */}
          <circle 
            cx="80" cy="80" r={radiusIntake} 
            stroke="var(--primary-color)" 
            strokeWidth={strokeWidth} 
            fill="none"
            strokeDasharray={circumferenceIntake}
            strokeDashoffset={strokeDashoffsetIntake}
            strokeLinecap="round"
            className="ring-progress"
            transform="rotate(-90 80 80)"
          />

          {/* Burned Ring Background */}
          <circle cx="80" cy="80" r={radiusBurned} stroke="rgba(255, 59, 48, 0.2)" strokeWidth={strokeWidth} fill="none" />
          {/* Burned Ring Progress */}
          <circle 
            cx="80" cy="80" r={radiusBurned} 
            stroke="#ff3b30" 
            strokeWidth={strokeWidth} 
            fill="none"
            strokeDasharray={circumferenceBurned}
            strokeDashoffset={strokeDashoffsetBurned}
            strokeLinecap="round"
            className="ring-progress"
            transform="rotate(-90 80 80)"
          />
        </svg>
        <div className="rings-center-text">
          <span className="deficit-value">{Math.max(0, goal - intake + burned)}</span>
          <span className="deficit-label">Deficit</span>
        </div>
      </div>

      <div className="calorie-stats">
        <div className="stat-item">
          <div className="stat-indicator intake"></div>
          <div className="stat-details">
            <span className="stat-label">Intake</span>
            <span className="stat-value">{intake} kcal</span>
          </div>
        </div>
        <div className="stat-item">
          <div className="stat-indicator burned"></div>
          <div className="stat-details">
            <span className="stat-label">Burned</span>
            <span className="stat-value">{burned} kcal</span>
          </div>
        </div>
      </div>
    </div>
  )
}
