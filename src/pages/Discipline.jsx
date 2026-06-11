import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { analyzeSleepWithAI } from '../lib/ai'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../components/ToastProvider'
import { Shield, Target, AlertTriangle, ArrowLeft, Moon, Sun, Clock, History } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import dayjs from 'dayjs'
import './Discipline.css'

const IDEAL_SLEEP_HOUR = 23   // 11 PM
const IDEAL_SLEEP_MIN  = 15   // 11:15 PM
const MIN_SLEEP_HOURS  = 7
const MAX_SLEEP_HOURS  = 9

function toMins(t) {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

function analyzeSleep(sleepTime, wakeTime) {
  if (!sleepTime || !wakeTime) return null

  const sleepMins = toMins(sleepTime)
  let   wakeMins  = toMins(wakeTime)
  if (wakeMins <= sleepMins) wakeMins += 24 * 60  // crossed midnight

  const durationHours = (wakeMins - sleepMins) / 60

  // Real-time check: sleep time should have at least MIN_SLEEP_HOURS elapsed in real world
  const now     = dayjs()
  let sleepDT   = dayjs(`${now.format('YYYY-MM-DD')} ${sleepTime}`)
  if (sleepDT.isAfter(now)) sleepDT = sleepDT.subtract(1, 'day')
  const realElapsed = now.diff(sleepDT, 'hour', true)
  const realTimeValid = realElapsed >= MIN_SLEEP_HOURS

  const idealSleepMins = IDEAL_SLEEP_HOUR * 60 + IDEAL_SLEEP_MIN
  const sleptOnTime    = sleepMins <= idealSleepMins
  const idealDuration  = durationHours >= MIN_SLEEP_HOURS && durationHours <= MAX_SLEEP_HOURS

  if (!realTimeValid) {
    return {
      durationHours, sleptOnTime, idealDuration,
      quality: 'invalid', confidenceBonus: 0, valid: false,
      // Confidence bonus goes to SPR, NOT NFP, NOT a separate sleep confidence
      sprBonus: 0,
      message: `❌ Invalid: only ${realElapsed.toFixed(1)}h elapsed since ${sleepTime}. Log after at least ${MIN_SLEEP_HOURS}h of real sleep.`
    }
  }

  let quality = 'poor', sprBonus = 0, message = ''

  if (!idealDuration && durationHours < MIN_SLEEP_HOURS) {
    quality = 'short'; sprBonus = 0
    message = `⚠️ Only ${durationHours.toFixed(1)}h. Minimum is ${MIN_SLEEP_HOURS}h for an SPR bonus.`
  } else if (!idealDuration && durationHours > MAX_SLEEP_HOURS) {
    quality = 'long'; sprBonus = 0
    message = `⚠️ ${durationHours.toFixed(1)}h is over the ${MAX_SLEEP_HOURS}h maximum.`
  } else if (sleptOnTime && idealDuration) {
    quality = 'excellent'; sprBonus = 2
    message = `🌟 Perfect sleep! ${durationHours.toFixed(1)}h before 11:15 PM → SPR +2% confidence!`
  } else {
    quality = 'good'; sprBonus = 1
    message = `✅ Good ${durationHours.toFixed(1)}h sleep. Sleep before 11:15 PM for SPR +2% bonus.`
  }

  return { durationHours, sleptOnTime, idealDuration, quality, sprBonus, valid: true, message,
           confidenceBonus: sprBonus }
}

const qualityColor = {
  excellent: '#10b981',
  good:      '#60a5fa',
  short:     '#f59e0b',
  long:      '#f59e0b',
  invalid:   '#ef4444',
  poor:      '#71717a',
}

// ── Helpers ──────────────────────────────────────────────────
function msToCountdown(ms) {
  if (ms <= 0) return ''
  const h = Math.floor(ms / 3600000)
  const m = Math.floor((ms % 3600000) / 60000)
  const s = Math.floor((ms % 60000) / 1000)
  return `${h}h ${m}m ${s}s`
}

function getStatus(lastCheckin) {
  if (!lastCheckin) return { canCheckIn: true, label: 'Ready to Check-in', penalty: false }
  const diff   = Date.now() - new Date(lastCheckin).getTime()
  const h24    = 86400000
  if (diff >= h24 * 2) return { canCheckIn: true, label: '⚠️ Streak Broken!', penalty: true }
  if (diff >= h24)     return { canCheckIn: true, label: '✅ Ready to Check-in!', penalty: false }
  return { canCheckIn: false, label: msToCountdown(h24 - diff), penalty: false }
}

function getStatusCalendarDay(lastCheckin) {
  if (!lastCheckin) return { canCheckIn: true, label: 'Ready to Check-in', penalty: false }
  const lastDate = new Date(lastCheckin)
  const now = new Date()
  
  // Normalize to local midnight for calendar day comparison
  const lastMidnight = new Date(lastDate.getFullYear(), lastDate.getMonth(), lastDate.getDate()).getTime()
  const nowMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  
  const diffDays = Math.floor((nowMidnight - lastMidnight) / 86400000)
  
  if (diffDays === 0) {
    // Already checked in today
    return { canCheckIn: false, label: 'Already logged today', penalty: false }
  }
  if (diffDays >= 2) {
    // Missed a whole calendar day
    return { canCheckIn: true, label: '⚠️ Streak Broken!', penalty: true }
  }
  
  // Checked in yesterday (diffDays === 1)
  return { canCheckIn: true, label: '✅ Ready to Check-in!', penalty: false }
}



// ─────────────────────────────────────────────────────────────
export default function Discipline() {
  const { user }   = useAuth()
  const { addRandomHinglishToast } = useToast()
  const navigate   = useNavigate()

  const [profile,      setProfile]      = useState(null)
  const [loading,      setLoading]      = useState(true)
  const [sleepLogs,    setSleepLogs]    = useState([])
  const [showSleepLogs,setShowSleepLogs]= useState(false)

  // Live countdown strings
  const [tick, setTick] = useState(0)   // just a number we increment every second
  const penaltyApplied = useState({})[0]  // tracks which types had penalty applied this session

  // Sleep tracking state (2-step process)
  const [activeSleepStart, setActiveSleepStart] = useState(() => localStorage.getItem('activeSleepStart'))
  const [sleepInputTime, setSleepInputTime] = useState(dayjs().format('HH:mm'))
  const [wakeInputTime, setWakeInputTime] = useState(dayjs().format('HH:mm'))
  const [sleepAnalysis, setSleepAnalysis] = useState(null)

  // Live analysis for wake time
  useEffect(() => {
    if (activeSleepStart && wakeInputTime) {
      const startDT = dayjs(activeSleepStart)
      // Construct wake datetime. Assume today, but if it's earlier than startDT, assume tomorrow.
      const wakeTimeParts = wakeInputTime.split(':')
      let wakeDT = dayjs().hour(wakeTimeParts[0]).minute(wakeTimeParts[1]).second(0)
      if (wakeDT.isBefore(startDT)) {
         // if wake time today is before sleep time, maybe sleep was yesterday
         // Actually, wakeDT is usually constructed on the day they wake up.
         // Let's just use wakeDT directly, if it's before startDT, add 1 day.
         if (wakeDT.isBefore(startDT)) wakeDT = wakeDT.add(1, 'day')
      }

      const durationHours = wakeDT.diff(startDT, 'hour', true)
      
      const idealSleepMins = IDEAL_SLEEP_HOUR * 60 + IDEAL_SLEEP_MIN
      const sleepMins = startDT.hour() * 60 + startDT.minute()
      const sleptOnTime = sleepMins <= idealSleepMins
      const idealDuration = durationHours >= MIN_SLEEP_HOURS && durationHours <= MAX_SLEEP_HOURS

      let quality = 'poor', sprBonus = 0, message = ''

      if (durationHours < MIN_SLEEP_HOURS) {
        quality = 'short'; sprBonus = 0
        message = `⚠️ Only ${durationHours.toFixed(1)}h. Min ${MIN_SLEEP_HOURS}h for bonus.`
      } else if (durationHours > MAX_SLEEP_HOURS) {
        quality = 'long'; sprBonus = 0
        message = `⚠️ ${durationHours.toFixed(1)}h is over ${MAX_SLEEP_HOURS}h max.`
      } else if (sleptOnTime && idealDuration) {
        quality = 'excellent'; sprBonus = 2
        message = `🌟 Perfect! ${durationHours.toFixed(1)}h before 11:15 PM → SPR +2%!`
      } else {
        quality = 'good'; sprBonus = 1
        message = `✅ Good ${durationHours.toFixed(1)}h sleep → SPR +1%!`
      }

      setSleepAnalysis({
        durationHours, sleptOnTime, idealDuration, quality, sprBonus, valid: true, message,
        sleepTimeStr: startDT.format('HH:mm'),
        wakeTimeStr: wakeDT.format('HH:mm'),
        ai_message: null
      })
    } else {
      setSleepAnalysis(null)
    }
  }, [activeSleepStart, wakeInputTime])

  const handleStartSleep = () => {
    // Construct start datetime
    const parts = sleepInputTime.split(':')
    const startDT = dayjs().hour(parts[0]).minute(parts[1]).second(0)
    const iso = startDT.toISOString()
    localStorage.setItem('activeSleepStart', iso)
    setActiveSleepStart(iso)
    setWakeInputTime(dayjs().format('HH:mm')) // reset wake input
    addRandomHinglishToast('Good night! Sleep started.')
  }

  const handleCancelSleep = () => {
    localStorage.removeItem('activeSleepStart')
    setActiveSleepStart(null)
    setSleepAnalysis(null)
  }

  const [isLoggingSleep, setIsLoggingSleep] = useState(false)

  const handleSleepCheckIn = async () => {
    if (!sleepAnalysis?.valid) return
    setIsLoggingSleep(true)
    
    // Call SleepAI Pro
    const aiInsight = await analyzeSleepWithAI(profile || {}, {
      sleep_time: sleepAnalysis.sleepTimeStr,
      wake_time: sleepAnalysis.wakeTimeStr,
      duration_hours: sleepAnalysis.durationHours
    })
    
    // Overwrite the local SPR bonus with AI's dynamic bonus if it exists
    const finalBonus = aiInsight.confidence_bonus !== undefined ? aiInsight.confidence_bonus : sleepAnalysis.sprBonus
    const sleepStreak = (profile?.sleep_streak || 0) + 1
    const sprConf     = Math.min(100, (profile?.spr_confidence ?? 100) + finalBonus)

    const updates = {
      sleep_streak:              sleepStreak,
      sleep_last_checkin:        new Date().toISOString(),
      sleep_last_sleep_time:     sleepAnalysis.sleepTimeStr,
      sleep_last_wake_time:      sleepAnalysis.wakeTimeStr,
      sleep_last_duration_hours: sleepAnalysis.durationHours,
      spr_confidence:            sprConf,
    }

    await supabase.from('profiles').update(updates).eq('id', user.id)
    await supabase.from('sleep_logs').insert({
      user_id:          user.id,
      sleep_time:       sleepAnalysis.sleepTimeStr,
      wake_time:        sleepAnalysis.wakeTimeStr,
      sleep_date:       dayjs().format('YYYY-MM-DD'),
      duration_hours:   sleepAnalysis.durationHours,
      slept_on_time:    sleepAnalysis.sleptOnTime,
      ideal_duration:   sleepAnalysis.idealDuration,
      quality:          aiInsight.sleep_quality || sleepAnalysis.quality,
      confidence_bonus: finalBonus,
    })

    setProfile(prev => ({ ...prev, ...updates }))
    setSleepLogs(prev => [{
      id: Date.now(), sleep_time: sleepAnalysis.sleepTimeStr, wake_time: sleepAnalysis.wakeTimeStr,
      sleep_date: dayjs().format('YYYY-MM-DD'),
      duration_hours: sleepAnalysis.durationHours,
      quality: aiInsight.sleep_quality || sleepAnalysis.quality, 
      confidence_bonus: finalBonus,
      created_at: new Date().toISOString()
    }, ...prev])
    
    // Clear active sleep
    localStorage.removeItem('activeSleepStart')
    setActiveSleepStart(null)
    setSleepAnalysis(null)
    setIsLoggingSleep(false)
    
    addRandomHinglishToast(`AI Insight: ${aiInsight.ai_message || 'Sleep logged!'}`)
  }

  useEffect(() => { fetchAll() }, [user])

  const fetchAll = async () => {
    if (!user) return
    const [{ data: prof }, { data: logs }] = await Promise.all([
      supabase.from('profiles')
        .select('*')         // select everything so no field is missing
        .eq('id', user.id).single(),
      supabase.from('sleep_logs')
        .select('*').eq('user_id', user.id)
        .order('created_at', { ascending: false }).limit(15)
    ])
    if (prof) setProfile(prof)
    if (logs) setSleepLogs(logs)
    setLoading(false)
  }

  // Tick every second to refresh countdowns
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 1000)
    return () => clearInterval(id)
  }, [])

  // Auto-apply penalty only once per session per type
  useEffect(() => {
    if (!profile) return
    const nfpS   = getStatus(profile.nfp_last_checkin)
    const sprS   = getStatusCalendarDay(profile.spr_last_checkin)
    const sleepS = getStatusCalendarDay(profile.sleep_last_checkin)
    if (nfpS.penalty   && profile.nfp_streak   > 0 && !penaltyApplied['nfp'])   { penaltyApplied['nfp']   = true; applyPenalty('nfp') }
    if (sprS.penalty   && profile.spr_streak   > 0 && !penaltyApplied['spr'])   { penaltyApplied['spr']   = true; applyPenalty('spr') }
    if (sleepS.penalty && profile.sleep_streak > 0 && !penaltyApplied['sleep']) { penaltyApplied['sleep'] = true; applyPenalty('sleep') }
  }, [profile])  // only runs when profile changes, not every tick

  const applyPenalty = async (type) => {
    const confKey = type === 'sleep' ? 'spr_confidence' : `${type}_confidence`
    const cur     = profile[confKey] ?? 100
    const updates = {
      [`${type}_streak`]:       0,
      [`${type}_last_checkin`]: null,
      [confKey]:                Math.max(0, cur - 10),
    }
    // If sleep streak breaks → also decrease spr_confidence
    await supabase.from('profiles').update(updates).eq('id', user.id)
    setProfile(prev => ({ ...prev, ...updates }))
    addRandomHinglishToast(`${type.toUpperCase()} streak broke! SPR Confidence -10%.`)
  }

  // NFP / SPR check-in: each only affects its own confidence
  const handleCheckIn = async (type) => {
    if (!user) { console.error('No user'); return }
    const streak    = (profile[`${type}_streak`] || 0) + 1
    const confKey   = `${type}_confidence`
    const newConf   = Math.min(100, (profile[confKey] ?? 100) + 1)
    const updates   = {
      [`${type}_streak`]:       streak,
      [confKey]:                newConf,
      [`${type}_last_checkin`]: new Date().toISOString(),
    }
    const { error } = await supabase.from('profiles').update(updates).eq('id', user.id)
    if (error) {
      console.error('Check-in failed:', error)
      addRandomHinglishToast(`Check-in failed: ${error.message}`)
      return
    }
    setProfile(prev => ({ ...prev, ...updates }))
    addRandomHinglishToast(`${type.toUpperCase()} Day ${streak}! +1% confidence.`)
  }



  const handleReset = async (type) => {
    if (!window.confirm(`Reset your ${type.toUpperCase()} streak? This drops confidence by 10%.`)) return
    const confKey = type === 'sleep' ? 'spr_confidence' : `${type}_confidence`
    const cur     = profile[confKey] ?? 100
    const updates = {
      [`${type}_streak`]:       0,
      [confKey]:                Math.max(0, cur - 10),
      [`${type}_last_checkin`]: null,
    }
    const { error } = await supabase.from('profiles').update(updates).eq('id', user.id)
    if (error) {
      console.error('Reset failed:', error)
      addRandomHinglishToast(`Reset failed: ${error.message}`)
      return
    }
    setProfile(prev => ({ ...prev, ...updates }))
    addRandomHinglishToast('Streak reset. Keep going!')
  }

  // Analyse sleep on input change (handled by effect now)

  if (loading) return <div className="loading-screen">Loading Discipline...</div>

  const nfpS   = getStatus(profile?.nfp_last_checkin)
  const sprS   = getStatusCalendarDay(profile?.spr_last_checkin)
  const sleepS = getStatusCalendarDay(profile?.sleep_last_checkin)

  const nfpConf   = parseFloat(profile?.nfp_confidence ?? 100).toFixed(1)
  const sprConf   = parseFloat(profile?.spr_confidence ?? 100).toFixed(1)

  const confBadge = (val, color = null) => {
    const pct   = parseFloat(val)
    const c     = color || (pct < 50 ? '#ef4444' : '#10b981')
    const bg    = color ? `${color}20` : (pct < 50 ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.15)')
    return (
      <div className="confidence-badge" style={{ backgroundColor: bg, color: c }}>
        {pct.toFixed(1)}% Confidence
      </div>
    )
  }

  const renderSimpleCard = (type, title, desc, icon, status, streak, conf, isCalendarDay = false) => {
    const pct = parseFloat(conf)
    const confColor = pct < 50 ? '#ef4444' : pct < 75 ? '#f59e0b' : '#4ade80'
    const momentum = Math.min(100, streak * 3)

    return (
      <div className="discipline-card glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '2rem', padding: '2.5rem', position: 'relative', overflow: 'hidden' }}>
        {/* Ambient glow decoration */}
        <div style={{ position: 'absolute', top: '-30%', right: '-10%', width: '200px', height: '200px', background: `radial-gradient(circle, ${confColor}10 0%, transparent 70%)`, pointerEvents: 'none' }} />
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: '52px', height: '52px', background: 'rgba(118,185,0,0.1)', border: '1px solid rgba(118,185,0,0.2)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {icon}
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.4rem' }}>{title}</h2>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '2px' }}>{desc}</p>
            </div>
          </div>
          <div style={{ background: `${confColor}15`, border: `1px solid ${confColor}40`, padding: '6px 14px', borderRadius: '24px', fontSize: '0.85rem', fontWeight: 700, color: confColor }}>
            {pct.toFixed(1)}%
          </div>
        </div>

        {/* Large streak number */}
        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', padding: '1.5rem', background: 'rgba(255,255,255,0.02)', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.04)' }}>
          <div style={{ textAlign: 'center', minWidth: '80px' }}>
            <div style={{ fontSize: '4rem', fontWeight: 800, lineHeight: 1, color: pct >= 75 ? '#a3e635' : pct >= 50 ? '#fbbf24' : '#ef4444' }}>{streak}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px', marginTop: '4px' }}>Day Streak</div>
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '6px', color: 'var(--text-secondary)' }}>
                <span>Confidence</span><span style={{ color: confColor }}>{conf}%</span>
              </div>
              <div style={{ height: '6px', background: 'rgba(255,255,255,0.08)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${conf}%`, background: confColor, borderRadius: '4px', transition: 'width 0.6s ease' }} />
              </div>
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '6px', color: 'var(--text-secondary)' }}>
                <span>Momentum</span><span style={{ color: '#818cf8' }}>{momentum}%</span>
              </div>
              <div style={{ height: '6px', background: 'rgba(255,255,255,0.08)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${momentum}%`, background: '#818cf8', borderRadius: '4px', transition: 'width 0.6s ease' }} />
              </div>
            </div>
          </div>
        </div>

        {/* Status badge */}
        <div style={{ padding: '1rem', background: status.canCheckIn ? 'rgba(74,222,128,0.06)' : 'rgba(255,255,255,0.02)', borderRadius: '16px', border: `1px solid ${status.canCheckIn ? 'rgba(74,222,128,0.15)' : 'rgba(255,255,255,0.05)'}`, fontSize: '0.9rem', color: status.canCheckIn ? '#4ade80' : 'var(--text-secondary)', textAlign: 'center', fontWeight: 500 }}>
          {status.canCheckIn ? `✅ Ready to Check-in!` : (isCalendarDay ? '✅ Already logged today — come back tomorrow!' : `⏳ Cooldown: ${status.label}`)}
        </div>

        <div className="action-section">
          <button
            className="btn btn-aurora w-full"
            disabled={!status.canCheckIn}
            onClick={() => handleCheckIn(type)}
            style={{ padding: '1rem', fontSize: '1rem', opacity: status.canCheckIn ? 1 : 0.4 }}
          >
            {status.canCheckIn ? `✅ Check-in  (+1% ${type.toUpperCase()} Confidence)` : 'Come back tomorrow'}
          </button>
          <button className="btn btn-secondary w-full reset-btn" onClick={() => handleReset(type)}>
            <AlertTriangle size={15} /> Reset Streak (−10% confidence)
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="dashboard-container animate-slide-in" style={{ padding: '3rem', maxWidth: '1400px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '3rem' }}>
      {/* Premium Hero */}
      <div className="glass-panel" style={{ padding: '3rem', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-40%', right: '-5%', width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(118, 185, 0, 0.06) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button className="btn btn-secondary" onClick={() => navigate('/dashboard')} style={{ padding: '10px', borderRadius: '16px' }}>
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="hero-title" style={{ margin: 0 }}>Achievement Center</h1>
              <p style={{ color: 'var(--text-secondary)', margin: '6px 0 0', fontSize: '1rem' }}>NFP: 24h cooldown · SPR: once per day · Sleep: once per day</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '1.5rem' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--primary-color)' }}>{(profile?.nfp_streak || 0) + (profile?.spr_streak || 0)}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>Total Streak Days</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', fontWeight: 700, color: '#818cf8' }}>{Math.round(((parseFloat(nfpConf) + parseFloat(sprConf)) / 2))}%</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>Avg Confidence</div>
            </div>
          </div>
        </div>
      </div>

      <div className="discipline-grid">
        {renderSimpleCard('nfp',
          'Nutrition & Food Plan (NFP)',
          'Stay consistent with healthy eating goals. Check-in daily (24h cooldown).',
          <Shield className="text-gradient-primary" size={24} />,
          nfpS, profile?.nfp_streak || 0, nfpConf, false
        )}

        {renderSimpleCard('spr',
          'Structured Personal Routine (SPR)',
          'Maintain your daily habits. Check-in once per day. Good sleep also boosts SPR confidence!',
          <Target className="text-gradient-primary" size={24} />,
          sprS, profile?.spr_streak || 0, sprConf, true
        )}
      </div>

      {/* ── Sleep Card ───────────────────────────────────────── */}
      <div className="sleep-card glass-panel" style={{ padding: '2.5rem', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-30%', left: '-5%', width: '250px', height: '250px', background: 'radial-gradient(circle, rgba(129,140,248,0.06) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div className="card-header" style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: '52px', height: '52px', background: 'rgba(129,140,248,0.1)', border: '1px solid rgba(129,140,248,0.2)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Moon color="#818cf8" size={24} />
            </div>
            <div>
              <h2 style={{ margin: 0 }}>Sleep Recovery</h2>
              <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#818cf8' }}>Boosts <strong>SPR Confidence</strong> — not NFP</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '2.5rem', fontWeight: 800, lineHeight: 1, color: '#818cf8' }}>{profile?.sleep_streak || 0}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>Sleep Days</div>
            </div>
            <button className="btn btn-secondary" style={{ padding: '8px 14px', fontSize: '0.78rem', borderRadius: '12px' }}
              onClick={() => setShowSleepLogs(v => !v)}>
              <History size={13} /> {showSleepLogs ? 'Hide' : 'History'}
            </button>
          </div>
        </div>

        {/* SPR Confidence indicator */}
        <div style={{
          background: 'rgba(129,140,248,0.08)', border: '1px solid rgba(129,140,248,0.2)',
          borderRadius: '10px', padding: '10px 14px', display: 'flex', justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span style={{ color: '#a1a1aa', fontSize: '0.85rem' }}>
            Your SPR Confidence (affected by sleep quality)
          </span>
          <span style={{ color: '#818cf8', fontWeight: 700, fontSize: '1.1rem' }}>{sprConf}%</span>
        </div>

        <p className="description text-secondary">
          Ideal: Sleep <strong style={{ color: '#818cf8' }}>before 11:15 PM</strong> · Wake after
          <strong style={{ color: '#818cf8' }}> 7–9 hours</strong>.
          &nbsp;Perfect = <strong style={{ color: '#10b981' }}>SPR +2%</strong>.
          Good duration = SPR +1%.
        </p>

        {/* Last night stats */}
        {profile?.sleep_last_sleep_time && (
          <div className="sleep-stats-row">
            <div className="stat-box">
              <span className="stat-val" style={{ color: '#60a5fa', fontSize: '1.4rem' }}>
                {profile.sleep_last_sleep_time}
              </span>
              <span className="stat-label">Last Slept</span>
            </div>
            <div className="stat-box">
              <span className="stat-val" style={{ color: '#f59e0b', fontSize: '1.4rem' }}>
                {profile.sleep_last_wake_time}
              </span>
              <span className="stat-label">Woke Up</span>
            </div>
            {profile.sleep_last_duration_hours != null && (
              <div className="stat-box">
                <span className="stat-val" style={{ color: '#818cf8' }}>
                  {parseFloat(profile.sleep_last_duration_hours).toFixed(1)}h
                </span>
                <span className="stat-label">Duration</span>
              </div>
            )}
          </div>
        )}

        {/* Input form or cooldown timer */}
        {sleepS.canCheckIn ? (
          <div className="sleep-form">
            {!activeSleepStart ? (
              // Step 1: Start Sleep
              <div className="sleep-time-inputs" style={{ gridTemplateColumns: '1fr' }}>
                <div className="run-input-group">
                  <label className="run-input-label">
                    <Moon size={13} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                    Going to sleep at
                  </label>
                  <input type="time" className="input-field" value={sleepInputTime}
                    onChange={e => setSleepInputTime(e.target.value)} />
                </div>
                <button className="btn btn-primary w-full" onClick={handleStartSleep}>
                  <Moon size={16} /> Start Sleep
                </button>
              </div>
            ) : (
              // Step 2: Wake Up
              <div className="sleep-time-inputs" style={{ gridTemplateColumns: '1fr' }}>
                <div className="run-input-group">
                  <label className="run-input-label">
                    <Sun size={13} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                    Woke up at (Slept at {dayjs(activeSleepStart).format('HH:mm')})
                  </label>
                  <input type="time" className="input-field" value={wakeInputTime}
                    onChange={e => setWakeInputTime(e.target.value)} />
                </div>
                
                {sleepAnalysis && (
                  <div className="sleep-analysis-box" style={{
                    borderColor: qualityColor[sleepAnalysis.quality],
                    backgroundColor: `${qualityColor[sleepAnalysis.quality]}15`
                  }}>
                    <p style={{ color: qualityColor[sleepAnalysis.quality], fontWeight: 600, margin: 0 }}>
                      {sleepAnalysis.message}
                    </p>
                    <div className="sleep-detail-chips">
                      <span className="chip">
                        <Clock size={11} /> {sleepAnalysis.durationHours.toFixed(1)}h
                      </span>
                      <span className="chip" style={{ color: sleepAnalysis.sleptOnTime ? '#10b981' : '#f59e0b' }}>
                        {sleepAnalysis.sleptOnTime ? '✅ Before 11:15 PM' : '⚠️ After 11:15 PM'}
                      </span>
                      <span className="chip" style={{ color: sleepAnalysis.idealDuration ? '#10b981' : '#f59e0b' }}>
                        {sleepAnalysis.idealDuration ? '✅ 7–9h range' : '⚠️ Outside 7–9h'}
                      </span>
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button className="btn btn-primary w-full"
                    disabled={!sleepAnalysis || !sleepAnalysis.valid || isLoggingSleep}
                    onClick={handleSleepCheckIn}>
                    <Sun size={16} /> {isLoggingSleep ? 'AI Analyzing...' : 'Log Wake Up'}
                  </button>
                  <button className="btn btn-secondary" disabled={isLoggingSleep} onClick={handleCancelSleep}>
                    Cancel
                  </button>
                </div>
              </div>
            )}
            
            <button className="btn btn-secondary w-full reset-btn" style={{ marginTop: '10px' }} onClick={() => handleReset('sleep')}>
              <AlertTriangle size={15} /> Reset Sleep Streak (−10% SPR Confidence)
            </button>
          </div>
        ) : (
          <div className="sleep-locked">
            <Clock size={20} style={{ opacity: 0.6 }} />
            <span>
              Sleep already logged today · Next check-in in
              <strong style={{ color: '#818cf8', marginLeft: '6px' }}>{sleepS.label}</strong>
            </span>
          </div>
        )}

        {/* Sleep History */}
        {showSleepLogs && (
          <div className="sleep-history">
            <h4 style={{ color: '#a1a1aa', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 10px' }}>
              Sleep History
            </h4>
            {sleepLogs.length === 0
              ? <p className="text-secondary" style={{ fontSize: '0.88rem' }}>No sleep logs yet.</p>
              : sleepLogs.map(log => (
                <div key={log.id} className="sleep-log-row">
                  <div className="sleep-log-left">
                    <span className="sleep-log-date">{dayjs(log.created_at).format('ddd, MMM D · h:mm A')}</span>
                    <span className="sleep-log-time">{log.sleep_time} → {log.wake_time}</span>
                  </div>
                  <div className="sleep-log-right">
                    <span className="sleep-log-dur">{parseFloat(log.duration_hours).toFixed(1)}h</span>
                    <span className="sleep-log-badge"
                      style={{ backgroundColor: `${qualityColor[log.quality]}20`, color: qualityColor[log.quality] }}>
                      {log.quality}{log.confidence_bonus > 0 ? ` · SPR+${log.confidence_bonus}%` : ''}
                    </span>
                  </div>
                </div>
              ))
            }
          </div>
        )}
      </div>
    </div>
  )
}
