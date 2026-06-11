import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './AuthContext'
import dayjs from 'dayjs'

const ActivityContext = createContext()

export function ActivityProvider({ children }) {
  const { user } = useAuth()
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(false)

  const todayStr = dayjs().format('YYYY-MM-DD')

  // ── Load today's activities from Supabase ─────────────────────────────────
  const fetchActivities = useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('activity_logs')
        .select('*')
        .eq('user_id', user.id)
        .eq('log_date', todayStr)
        .order('created_at', { ascending: false })

      if (error) throw error
      if (data) {
        // Map DB rows → local shape
        setActivities(data.map(row => ({
          id: row.id,
          type: row.activity_type,          // 'meal' | 'exercise'
          name: row.name,
          calories: row.calories_intake || 0,
          burned: row.calories_burned || 0,
          category: row.category || '',
          explanation: row.explanation || '',
          added_by_ai: row.added_by_ai || false,
          timestamp: row.created_at,
        })))
      }
    } catch (err) {
      console.error('fetchActivities error:', err.message)
    } finally {
      setLoading(false)
    }
  }, [user, todayStr])

  useEffect(() => {
    fetchActivities()
  }, [fetchActivities])

  // ── Log a new activity & save to Supabase ────────────────────────────────
  const logActivity = async (activityData) => {
    // Optimistic UI update first
    setActivities(prev => [{ ...activityData }, ...prev])

    if (!user) return

    try {
      const row = {
        user_id: user.id,
        log_date: todayStr,
        activity_type: activityData.type,       // 'meal' | 'exercise'
        name: activityData.name,
        calories_intake: activityData.type === 'meal' ? (activityData.calories || 0) : 0,
        calories_burned: activityData.type === 'exercise' ? (activityData.burned || 0) : 0,
        category: activityData.category || null,
        explanation: activityData.explanation || null,
        added_by_ai: activityData.added_by_ai || false,
      }

      const { data: inserted, error } = await supabase
        .from('activity_logs')
        .insert(row)
        .select()
        .single()

      if (error) throw error

      // Replace the optimistic item with the real DB row (has real UUID)
      setActivities(prev =>
        prev.map(a =>
          a.id === activityData.id
            ? { ...activityData, id: inserted.id }
            : a
        )
      )

      // Also sync totals into daily_logs for the calendar
      await syncDailyLog()
    } catch (err) {
      console.error('logActivity error:', err.message)
      // Revert optimistic update on failure
      setActivities(prev => prev.filter(a => a.id !== activityData.id))
    }
  }

  // ── Delete an activity ────────────────────────────────────────────────────
  const deleteActivity = async (id) => {
    setActivities(prev => prev.filter(a => a.id !== id))

    if (!user) return

    try {
      const { error } = await supabase
        .from('activity_logs')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)

      if (error) throw error
      await syncDailyLog()
    } catch (err) {
      console.error('deleteActivity error:', err.message)
      fetchActivities() // re-fetch to restore correct state
    }
  }

  // ── Sync totals into daily_logs (used by Calendar page) ──────────────────
  const syncDailyLog = async () => {
    if (!user) return
    try {
      // Get latest totals from DB
      const { data } = await supabase
        .from('activity_logs')
        .select('activity_type, calories_intake, calories_burned')
        .eq('user_id', user.id)
        .eq('log_date', todayStr)

      if (!data) return

      const totalIntake = data
        .filter(r => r.activity_type === 'meal')
        .reduce((s, r) => s + (r.calories_intake || 0), 0)

      const totalBurned = data
        .filter(r => r.activity_type === 'exercise')
        .reduce((s, r) => s + (r.calories_burned || 0), 0)

      await supabase
        .from('daily_logs')
        .upsert({
          user_id: user.id,
          log_date: todayStr,
          calories_intake: totalIntake,
          calories_burned: totalBurned,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id,log_date' })
    } catch (err) {
      console.error('syncDailyLog error:', err.message)
    }
  }

  return (
    <ActivityContext.Provider value={{ activities, logActivity, deleteActivity, setActivities, loading, refetch: fetchActivities }}>
      {children}
    </ActivityContext.Provider>
  )
}

export const useActivities = () => useContext(ActivityContext)
