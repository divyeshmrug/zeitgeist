import { useState, useRef, useEffect } from 'react'
import { Bell, CheckCircle2, Droplets, Moon, Dumbbell, Sparkles, Activity, Utensils, X, Flame } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'

dayjs.extend(relativeTime)

const getIconForType = (type) => {
  switch(type?.toLowerCase()) {
    case 'hydration': return <Droplets size={16} color="#38bdf8" />
    case 'workout': return <Dumbbell size={16} color="#fb923c" />
    case 'sleep': return <Moon size={16} color="#a78bfa" />
    case 'recovery': return <Activity size={16} color="#ef4444" />
    case 'nutrition': return <Utensils size={16} color="#4ade80" />
    case 'streak': return <Flame size={16} color="#f59e0b" />
    default: return <Sparkles size={16} color="var(--primary-color)" />
  }
}

export default function NotificationCenter() {
  const { user } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [activeFilter, setActiveFilter] = useState('All')
  const drawerRef = useRef(null)
  
  const [notifications, setNotifications] = useState([])

  useEffect(() => {
    if (!user) return
    fetchNotifications()

    // Realtime subscription
    const channel = supabase.channel('notifications_changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` }, payload => {
        setNotifications(prev => [payload.new, ...prev])
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` }, payload => {
        setNotifications(prev => prev.map(n => n.id === payload.new.id ? payload.new : n))
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [user])

  const fetchNotifications = async () => {
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('sent_at', { ascending: false })
      .limit(50)
    
    if (data) setNotifications(data)
  }

  const unreadCount = notifications.filter(n => !n.read).length
  const filters = ['All', 'Hydration', 'Workout', 'Recovery', 'AI Insight', 'Sleep', 'Streak']

  const filteredNotifs = activeFilter === 'All' 
    ? notifications 
    : notifications.filter(n => n.type?.toLowerCase() === activeFilter.toLowerCase() || (activeFilter === 'AI Insight' && n.type === 'ai_insight'))

  // Close drawer on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (drawerRef.current && !drawerRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    if (isOpen) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  const markAllRead = async () => {
    if (!user) return
    // Optimistic UI update
    setNotifications(notifications.map(n => ({ ...n, read: true })))
    await supabase.from('notifications').update({ read: true }).eq('user_id', user.id).eq('read', false)
  }

  const markRead = async (id, currentReadStatus) => {
    if (currentReadStatus) return // already read
    // Optimistic UI update
    setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n))
    await supabase.from('notifications').update({ read: true }).eq('id', id)
  }

  return (
    <div style={{ position: 'relative' }} ref={drawerRef}>
      <button 
        className="btn btn-secondary" 
        style={{ padding: '10px', borderRadius: '50%', position: 'relative', border: 'none', background: isOpen ? 'rgba(255,255,255,0.1)' : 'transparent' }}
        onClick={() => setIsOpen(!isOpen)}
      >
        <Bell size={20} color={unreadCount > 0 ? '#fff' : 'var(--text-secondary)'} />
        {unreadCount > 0 && (
          <span style={{ position: 'absolute', top: '2px', right: '4px', width: '10px', height: '10px', background: '#ef4444', borderRadius: '50%', border: '2px solid var(--bg-color)' }} />
        )}
      </button>

      {isOpen && (
        <div className="glass-panel animate-slide-up" style={{ 
          position: 'absolute', top: '120%', right: '-50px', width: '380px', 
          zIndex: 100, padding: 0, overflow: 'hidden',
          boxShadow: '0 20px 50px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)'
        }}>
          {/* Header */}
          <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.2)' }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>Notifications</h3>
            {unreadCount > 0 && (
              <button onClick={markAllRead} style={{ background: 'none', border: 'none', color: 'var(--primary-color)', fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <CheckCircle2 size={14} /> Mark all read
              </button>
            )}
          </div>

          {/* Filters */}
          <div style={{ display: 'flex', gap: '8px', padding: '12px 24px', overflowX: 'auto', borderBottom: '1px solid rgba(255,255,255,0.05)', scrollbarWidth: 'none' }}>
            {filters.map(f => (
              <button 
                key={f}
                onClick={() => setActiveFilter(f)}
                style={{ 
                  whiteSpace: 'nowrap',
                  padding: '6px 12px', 
                  borderRadius: '16px', 
                  fontSize: '0.8rem',
                  border: '1px solid',
                  borderColor: activeFilter === f ? 'var(--primary-color)' : 'rgba(255,255,255,0.1)',
                  background: activeFilter === f ? 'rgba(118,185,0,0.1)' : 'transparent',
                  color: activeFilter === f ? '#fff' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                {f}
              </button>
            ))}
          </div>

          {/* List */}
          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            {filteredNotifs.length === 0 ? (
              <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                <Bell size={32} style={{ opacity: 0.2, marginBottom: '12px' }} />
                <p>No notifications here.</p>
              </div>
            ) : (
              filteredNotifs.map(n => (
                <div 
                  key={n.id}
                  onClick={() => markRead(n.id, n.read)}
                  style={{ 
                    padding: '16px 24px', 
                    borderBottom: '1px solid rgba(255,255,255,0.03)',
                    background: n.read ? 'transparent' : 'rgba(255,255,255,0.02)',
                    display: 'flex',
                    gap: '16px',
                    cursor: 'pointer',
                    transition: 'background 0.2s'
                  }}
                >
                  <div style={{ 
                    width: '36px', height: '36px', borderRadius: '50%', 
                    background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.05)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    {getIconForType(n.type)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                      <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: n.read ? 500 : 700, color: n.read ? 'var(--text-secondary)' : '#fff' }}>{n.title}</h4>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{dayjs(n.sent_at).fromNow()}</span>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: n.read ? 'var(--text-secondary)' : 'rgba(255,255,255,0.9)', lineHeight: 1.4 }}>
                      {n.message}
                    </p>
                  </div>
                  {!n.read && (
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--primary-color)', alignSelf: 'center', flexShrink: 0 }} />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
