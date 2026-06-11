import { useState, useEffect } from 'react'
import { User, Bell, Download, Save, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react'
import { generateDailyPDF } from '../lib/pdfGenerator'
import { generateAdvancedDailyReport } from '../lib/ai'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import './Profile.css'

export default function ProfilePage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [saveStatus, setSaveStatus] = useState(null) // 'success' | 'error' | null
  const [saveError, setSaveError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})

  const [profile, setProfile] = useState({
    age: '',
    gender: 'Male',
    height_cm: '',
    current_weight_kg: '',
    goal_weight_kg: '',
    goal_type: 'weight_loss',
    diet_preference: 'non_vegetarian',
    allergies: '',
    medical_restrictions: '',
    activity_level: 'moderate',
    daily_calorie_goal: 2500,
    hydration_alerts: true,
    workout_alerts: true,
    sleep_alerts: true,
    ai_alerts: true
  })

  useEffect(() => {
    if (user) fetchProfile()
  }, [user])

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error && error.code !== 'PGRST116') throw error // PGRST116 = no rows found
      if (data) {
        setProfile(prev => ({
          ...prev,
          ...data,
          // Ensure numbers stay as numbers (not null)
          height_cm: data.height_cm || '',
          current_weight_kg: data.current_weight_kg || '',
          goal_weight_kg: data.goal_weight_kg || '',
          age: data.age || '',
          daily_calorie_goal: data.daily_calorie_goal || 2500,
          hydration_alerts: data.hydration_alerts ?? true,
          workout_alerts: data.workout_alerts ?? true,
          sleep_alerts: data.sleep_alerts ?? true,
          ai_alerts: data.ai_alerts ?? true
        }))
      }
    } catch (err) {
      console.error("Error fetching profile:", err)
    }
  }

  const validateForm = () => {
    const errors = {}
    if (!profile.height_cm || Number(profile.height_cm) <= 0)
      errors.height_cm = 'Height is required'
    if (!profile.current_weight_kg || Number(profile.current_weight_kg) <= 0)
      errors.current_weight_kg = 'Current weight is required'
    if (!profile.daily_calorie_goal || Number(profile.daily_calorie_goal) < 500)
      errors.daily_calorie_goal = 'Calorie goal must be at least 500 kcal'
    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSaveProfile = async (e) => {
    e.preventDefault()
    if (!user) return

    if (!validateForm()) {
      // Scroll to top of form to show errors
      document.querySelector('.settings-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      return
    }

    setLoading(true)
    setSaveStatus(null)
    setSaveError('')

    try {
      // Build clean payload — strip empty strings to null
      const payload = {
        id: user.id,
        email: user.email,
        age: profile.age ? parseInt(profile.age) : null,
        gender: profile.gender || null,
        height_cm: profile.height_cm ? parseInt(profile.height_cm) : null,
        current_weight_kg: profile.current_weight_kg ? parseFloat(profile.current_weight_kg) : null,
        goal_weight_kg: profile.goal_weight_kg ? parseFloat(profile.goal_weight_kg) : null,
        goal_type: profile.goal_type || 'weight_loss',
        diet_preference: profile.diet_preference || 'non_vegetarian',
        allergies: profile.allergies || null,
        medical_restrictions: profile.medical_restrictions || null,
        activity_level: profile.activity_level || 'moderate',
        daily_calorie_goal: profile.daily_calorie_goal ? parseInt(profile.daily_calorie_goal) : 2500,
        hydration_alerts: profile.hydration_alerts,
        workout_alerts: profile.workout_alerts,
        sleep_alerts: profile.sleep_alerts,
        ai_alerts: profile.ai_alerts,
        updated_at: new Date().toISOString()
      }

      // Use upsert — works whether the profile row exists or not
      const { error } = await supabase
        .from('profiles')
        .upsert(payload, { onConflict: 'id' })

      if (error) throw error

      setSaveStatus('success')
      setTimeout(() => setSaveStatus(null), 4000)
    } catch (err) {
      console.error("Profile save error:", err)
      setSaveStatus('error')
      setSaveError(err.message || 'Unknown error. Check Supabase RLS policies.')
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadPDF = async () => {
    if (!user) return alert("Please log in to generate reports")
    setLoading(true)
    try {
      const { data: userHistory, error } = await supabase.rpc('get_user_averages_7d', { user_uuid: user.id })
      if (error) throw error

      const todayData = {
        calories_intake: 1850,
        calories_burned: 450,
        water_ml: 1250,
        weight_kg: profile.current_weight_kg || 80
      }

      const aiResponse = await generateAdvancedDailyReport(profile, userHistory || {}, todayData)

      generateDailyPDF(
        { name: user?.email?.split('@')[0] || 'Warrior' },
        {
          intake: todayData.calories_intake,
          burned: todayData.calories_burned,
          goal: profile.daily_calorie_goal || 2500,
          pastWeight: 81,
          currentWeight: todayData.weight_kg
        },
        aiResponse
      )
    } catch (err) {
      console.error(err)
      alert("Failed to generate report: " + err.message)
    } finally {
      setLoading(false)
    }
  }

  const setField = (key, val) => {
    setProfile(prev => ({ ...prev, [key]: val }))
    if (fieldErrors[key]) {
      setFieldErrors(prev => ({ ...prev, [key]: undefined }))
    }
  }

  const goalLabels = {
    weight_loss: 'Weight Loss', maintenance: 'Maintenance',
    weight_gain: 'Weight Gain', muscle_gain: 'Muscle Gain', general_fitness: 'General Fitness'
  }
  const activityLabels = {
    sedentary: 'Sedentary', beginner: 'Beginner', moderate: 'Moderate', active: 'Highly Active', advanced: 'Advanced Athlete'
  }

  return (
    <div className="profile-container animate-slide-in" style={{ maxWidth: '900px', margin: '0 auto', padding: '3rem 1rem', display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>

      {/* Hero Card */}
      <div className="glass-panel" style={{ padding: '3rem', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-40%', right: '-5%', width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(118, 185, 0, 0.07) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', flexWrap: 'wrap' }}>
          {/* Avatar */}
          <div style={{ width: '80px', height: '80px', background: 'linear-gradient(135deg, var(--primary-color) 0%, #4a7500 100%)', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 8px 24px rgba(118,185,0,0.25)' }}>
            <User size={36} color="#000" />
          </div>
          <div style={{ flex: 1 }}>
            <h1 className="hero-title" style={{ margin: 0 }}>AI Health Profile</h1>
            <p style={{ color: 'var(--text-secondary)', marginTop: '6px', fontSize: '1rem' }}>{user?.email || 'Guest'}</p>
          </div>
          <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
            <div style={{ textAlign: 'center', background: 'rgba(255,255,255,0.03)', padding: '1rem 1.5rem', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#4ade80' }}>87</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px', marginTop: '4px' }}>Recovery</div>
            </div>
            <div style={{ textAlign: 'center', background: 'rgba(255,255,255,0.03)', padding: '1rem 1.5rem', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#818cf8' }}>{goalLabels[profile.goal_type] || 'General'}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px', marginTop: '4px' }}>Goal</div>
            </div>
            <div style={{ textAlign: 'center', background: 'rgba(255,255,255,0.03)', padding: '1rem 1.5rem', borderRadius: '20px', border: '1px solid rgba(118,185,0,0.1)', borderLeft: '3px solid var(--primary-color)' }}>
              <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--primary-color)' }}>Active</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px', marginTop: '4px' }}>AI Status</div>
            </div>
          </div>
        </div>
      </div>

      {/* Save Status Banner */}
      {saveStatus === 'success' && (
        <div className="glass-panel" style={{ padding: '1.2rem 2rem', display: 'flex', alignItems: 'center', gap: '12px', borderLeft: '4px solid #4ade80', background: 'rgba(74,222,128,0.06)' }}>
          <CheckCircle2 size={20} color="#4ade80" />
          <span style={{ color: '#4ade80', fontWeight: 500 }}>Profile saved successfully! Your workout recommendations are now personalized.</span>
        </div>
      )}
      {saveStatus === 'error' && (
        <div className="glass-panel" style={{ padding: '1.2rem 2rem', display: 'flex', alignItems: 'flex-start', gap: '12px', borderLeft: '4px solid #ef4444', background: 'rgba(239,68,68,0.06)' }}>
          <AlertCircle size={20} color="#ef4444" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div><strong style={{ color: '#ef4444' }}>Save failed:</strong> {saveError}</div>
        </div>
      )}

      <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }} noValidate>

        {/* Body Metrics */}
        <div className="glass-panel" style={{ padding: '2.5rem' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '2rem', fontSize: '1.3rem' }}>
            <span style={{ width: '36px', height: '36px', background: 'rgba(118,185,0,0.1)', borderRadius: '12px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>📏</span>
            Body Metrics <span style={{ fontSize: '0.8rem', color: '#ef4444', marginLeft: '4px' }}>* required</span>
          </h3>
          <div className="form-grid">
            <div className="input-group-col">
              <label>Age</label>
              <input type="number" className="input-field" placeholder="e.g. 25" value={profile.age || ''} onChange={e => setField('age', e.target.value)} min="1" max="120" />
            </div>
            <div className="input-group-col">
              <label>Gender</label>
              <select className="input-field" value={profile.gender || 'Male'} onChange={e => setField('gender', e.target.value)}>
                <option value="Male">Male</option><option value="Female">Female</option><option value="Other">Other</option>
              </select>
            </div>
            <div className={`input-group-col ${fieldErrors.height_cm ? 'has-error' : ''}`}>
              <label>Height (cm) <span className="required-star">*</span></label>
              <input type="number" className={`input-field ${fieldErrors.height_cm ? 'input-error' : ''}`} placeholder="e.g. 170" value={profile.height_cm || ''} onChange={e => setField('height_cm', e.target.value)} min="50" max="300" />
              {fieldErrors.height_cm && <span className="field-error"><AlertCircle size={12} /> {fieldErrors.height_cm}</span>}
            </div>
            <div className={`input-group-col ${fieldErrors.current_weight_kg ? 'has-error' : ''}`}>
              <label>Current Weight (kg) <span className="required-star">*</span></label>
              <input type="number" step="0.1" className={`input-field ${fieldErrors.current_weight_kg ? 'input-error' : ''}`} placeholder="e.g. 70.5" value={profile.current_weight_kg || ''} onChange={e => setField('current_weight_kg', e.target.value)} min="1" max="500" />
              {fieldErrors.current_weight_kg && <span className="field-error"><AlertCircle size={12} /> {fieldErrors.current_weight_kg}</span>}
            </div>
            <div className="input-group-col">
              <label>Goal Weight (kg)</label>
              <input type="number" step="0.1" className="input-field" placeholder="e.g. 65" value={profile.goal_weight_kg || ''} onChange={e => setField('goal_weight_kg', e.target.value)} min="1" max="500" />
            </div>
            <div className={`input-group-col ${fieldErrors.daily_calorie_goal ? 'has-error' : ''}`}>
              <label>Daily Calorie Goal (kcal) <span className="required-star">*</span></label>
              <input type="number" className={`input-field ${fieldErrors.daily_calorie_goal ? 'input-error' : ''}`} placeholder="e.g. 2000" value={profile.daily_calorie_goal || ''} onChange={e => setField('daily_calorie_goal', e.target.value)} min="500" max="10000" />
              {fieldErrors.daily_calorie_goal && <span className="field-error"><AlertCircle size={12} /> {fieldErrors.daily_calorie_goal}</span>}
            </div>
          </div>
        </div>

        {/* Goals & Activity */}
        <div className="glass-panel" style={{ padding: '2.5rem' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '2rem', fontSize: '1.3rem' }}>
            <span style={{ width: '36px', height: '36px', background: 'rgba(129,140,248,0.1)', borderRadius: '12px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>🎯</span>
            Goals & Activity
          </h3>
          <div className="form-grid">
            <div className="input-group-col">
              <label>Goal Type</label>
              <select className="input-field" value={profile.goal_type || 'weight_loss'} onChange={e => setField('goal_type', e.target.value)}>
                <option value="weight_loss">Weight Loss</option><option value="maintenance">Maintenance</option>
                <option value="weight_gain">Weight Gain</option><option value="muscle_gain">Muscle Gain</option>
                <option value="general_fitness">General Fitness</option>
              </select>
            </div>
            <div className="input-group-col">
              <label>Activity Level</label>
              <select className="input-field" value={profile.activity_level || 'moderate'} onChange={e => setField('activity_level', e.target.value)}>
                <option value="sedentary">Sedentary (Little/no exercise)</option><option value="beginner">Beginner (1-2 days/week)</option>
                <option value="moderate">Moderate (3-5 days/week)</option><option value="active">Highly Active (6-7 days/week)</option>
                <option value="advanced">Advanced Athlete</option>
              </select>
            </div>
          </div>
        </div>

        {/* Nutrition & Health */}
        <div className="glass-panel" style={{ padding: '2.5rem' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '2rem', fontSize: '1.3rem' }}>
            <span style={{ width: '36px', height: '36px', background: 'rgba(74,222,128,0.1)', borderRadius: '12px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>🥗</span>
            Nutrition & Health
          </h3>
          <div className="form-grid">
            <div className="input-group-col full-width">
              <label>Diet Preference</label>
              <select className="input-field" value={profile.diet_preference || 'non_vegetarian'} onChange={e => setField('diet_preference', e.target.value)}>
                <option value="non_vegetarian">Non-Vegetarian</option><option value="vegetarian">Vegetarian</option>
                <option value="vegan">Vegan</option><option value="eggetarian">Eggetarian</option>
              </select>
            </div>
            <div className="input-group-col full-width">
              <label>Allergies</label>
              <input type="text" className="input-field" placeholder="e.g. Peanuts, Gluten, Dairy" value={profile.allergies || ''} onChange={e => setField('allergies', e.target.value)} />
            </div>
            <div className="input-group-col full-width">
              <label>Medical Restrictions</label>
              <input type="text" className="input-field" placeholder="e.g. Knee injury, Asthma, Diabetes" value={profile.medical_restrictions || ''} onChange={e => setField('medical_restrictions', e.target.value)} />
            </div>
          </div>
        </div>

        <button type="submit" className="btn btn-aurora w-full" disabled={loading} style={{ padding: '1.2rem', fontSize: '1.1rem', borderRadius: '20px' }}>
          {loading
            ? <><Loader2 size={20} className="spin-icon" /> Saving to Supabase...</>
            : <><Save size={20} /> Save AI Health Profile</>
          }
        </button>
      </form>

      {/* Notification Settings */}
      <div className="glass-panel" style={{ padding: '2.5rem' }}>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '2rem', fontSize: '1.3rem' }}>
          <span style={{ width: '36px', height: '36px', background: 'rgba(251,191,36,0.1)', borderRadius: '12px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>🔔</span>
          Notification Settings
        </h3>
        <p className="text-secondary" style={{ marginBottom: '1.5rem', fontSize: '0.9rem' }}>Smart alerts adjust automatically based on your real-time activity.</p>
        <div className="toggles-list">
          <div className="toggle-item">
            <span className="capitalize">Hydration Reminders</span>
            <label className="switch">
              <input type="checkbox" checked={profile.hydration_alerts} onChange={() => setField('hydration_alerts', !profile.hydration_alerts)} />
              <span className="slider round"></span>
            </label>
          </div>
          <div className="toggle-item">
            <span className="capitalize">Workout Alerts</span>
            <label className="switch">
              <input type="checkbox" checked={profile.workout_alerts} onChange={() => setField('workout_alerts', !profile.workout_alerts)} />
              <span className="slider round"></span>
            </label>
          </div>
          <div className="toggle-item">
            <span className="capitalize">Sleep Coach</span>
            <label className="switch">
              <input type="checkbox" checked={profile.sleep_alerts} onChange={() => setField('sleep_alerts', !profile.sleep_alerts)} />
              <span className="slider round"></span>
            </label>
          </div>
          <div className="toggle-item">
            <span className="capitalize">AI Insights</span>
            <label className="switch">
              <input type="checkbox" checked={profile.ai_alerts} onChange={() => setField('ai_alerts', !profile.ai_alerts)} />
              <span className="slider round"></span>
            </label>
          </div>
        </div>
      </div>

      {/* AI Report */}
      <div className="glass-panel" style={{ padding: '2.5rem' }}>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1rem', fontSize: '1.3rem' }}>
          <span style={{ width: '36px', height: '36px', background: 'rgba(56,189,248,0.1)', borderRadius: '12px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>📊</span>
          Daily AI Report
        </h3>
        <p className="text-secondary mb-4" style={{ marginBottom: '1.5rem' }}>Generate your personalized 4-page PDF fitness manual powered by AI.</p>
        <button className="btn btn-secondary w-full" onClick={handleDownloadPDF} disabled={loading} style={{ padding: '1rem', borderRadius: '16px', fontSize: '1rem' }}>
        <Download size={18} /> Download Today's Report
        </button>
      </div>

    </div>
  )
}
