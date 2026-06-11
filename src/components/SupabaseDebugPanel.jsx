import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { CheckCircle2, XCircle, Loader2, RefreshCw } from 'lucide-react'

/**
 * SupabaseDebug — a temporary diagnostic panel.
 * Add <SupabaseDebugPanel /> anywhere in your app to test connection.
 * Remove it once everything works.
 */
export default function SupabaseDebugPanel() {
  const { user } = useAuth()
  const [results, setResults] = useState([])
  const [running, setRunning] = useState(false)

  const run = async () => {
    setRunning(true)
    setResults([])
    const log = (label, ok, detail) =>
      setResults(prev => [...prev, { label, ok, detail }])

    // 1. Auth check
    log('User Authenticated', !!user, user ? user.email : 'No session found')

    if (!user) {
      setRunning(false)
      return
    }

    // 2. Read profile
    try {
      const { data, error } = await supabase.from('profiles').select('id, email, height_cm, current_weight_kg').eq('id', user.id).single()
      if (error) throw error
      log('Read profiles table', true, `height=${data?.height_cm ?? 'null'}, weight=${data?.current_weight_kg ?? 'null'}`)
    } catch (e) {
      log('Read profiles table', false, e.message)
    }

    // 3. Upsert profile
    try {
      const { error } = await supabase.from('profiles').upsert({ id: user.id, email: user.email, updated_at: new Date().toISOString() }, { onConflict: 'id' })
      if (error) throw error
      log('Upsert profiles table', true, 'Write succeeded')
    } catch (e) {
      log('Upsert profiles table', false, e.message)
    }

    // 4. Read activity_logs
    try {
      const { data, error } = await supabase.from('activity_logs').select('id').eq('user_id', user.id).limit(1)
      if (error) throw error
      log('Read activity_logs table', true, `${data?.length ?? 0} rows found for today`)
    } catch (e) {
      log('Read activity_logs table', false, e.message + ' → Run fix_all_tables.sql in Supabase SQL editor')
    }

    // 5. Insert activity_logs
    try {
      const { error } = await supabase.from('activity_logs').insert({
        user_id: user.id, log_date: new Date().toISOString().split('T')[0],
        activity_type: 'meal', name: 'Debug Test Meal', calories_intake: 1, calories_burned: 0
      })
      if (error) throw error
      log('Insert into activity_logs', true, 'Write succeeded ✓')
      // Clean up test row
      await supabase.from('activity_logs').delete().eq('user_id', user.id).eq('name', 'Debug Test Meal')
    } catch (e) {
      log('Insert into activity_logs', false, e.message)
    }

    // 6. Read daily_logs
    try {
      const { data, error } = await supabase.from('daily_logs').select('log_date, calories_intake, calories_burned').eq('user_id', user.id).limit(3)
      if (error) throw error
      log('Read daily_logs table', true, `${data?.length ?? 0} days of history`)
    } catch (e) {
      log('Read daily_logs table', false, e.message)
    }

    setRunning(false)
  }

  return (
    <div style={{
      position: 'fixed', bottom: '80px', right: '16px', zIndex: 9999,
      background: 'rgba(15,15,25,0.97)', border: '1px solid rgba(99,102,241,0.4)',
      borderRadius: '12px', padding: '1rem', width: '340px',
      boxShadow: '0 8px 32px rgba(0,0,0,0.6)', backdropFilter: 'blur(12px)',
      fontFamily: 'monospace', fontSize: '0.78rem'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
        <strong style={{ color: '#a5b4fc' }}>🔌 Supabase Debug</strong>
        <button onClick={run} disabled={running} style={{
          background: 'rgba(99,102,241,0.2)', border: '1px solid rgba(99,102,241,0.5)',
          borderRadius: '6px', padding: '4px 10px', color: '#a5b4fc', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: '4px'
        }}>
          {running ? <Loader2 size={12} style={{ animation: 'spin 0.8s linear infinite' }} /> : <RefreshCw size={12} />}
          {running ? 'Running...' : 'Run Tests'}
        </button>
      </div>

      {results.length === 0 && !running && (
        <p style={{ color: '#6b7280', textAlign: 'center', margin: '1rem 0' }}>Click "Run Tests" to diagnose</p>
      )}

      {results.map((r, i) => (
        <div key={i} style={{
          display: 'flex', gap: '8px', alignItems: 'flex-start',
          padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.05)'
        }}>
          {r.ok
            ? <CheckCircle2 size={14} color="#4ade80" style={{ flexShrink: 0, marginTop: 1 }} />
            : <XCircle size={14} color="#f87171" style={{ flexShrink: 0, marginTop: 1 }} />
          }
          <div>
            <div style={{ color: r.ok ? '#4ade80' : '#f87171', fontWeight: 600 }}>{r.label}</div>
            <div style={{ color: '#9ca3af', fontSize: '0.72rem', marginTop: '2px' }}>{r.detail}</div>
          </div>
        </div>
      ))}
    </div>
  )
}
