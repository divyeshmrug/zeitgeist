import { createContext, useContext, useState, useCallback } from 'react'
import { X } from 'lucide-react'
import './Toast.css'

const ToastContext = createContext()

const hinglishMessages = [
  "Arre bhai, kal teri ex ne gym join kiya... tu abhi bhi samosa kha raha hai? 😂 Streak update kar!",
  "Bhai protein shake peene se body banegi, thandi coffee se nahi! Uth ja!",
  "Water break le le boss, skin glow karni hai ya registan banani hai?",
  "Gym nahi jayega toh single hi marega... Soch le bhai!",
  "Aaj cheat day nahi hai! Calories count kar warna weight scale rula dega."
]

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const addToast = useCallback((message, type = 'info') => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, message, type }])

    // Auto dismiss after 5 seconds
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 5000)
  }, [])

  const addRandomHinglishToast = useCallback(() => {
    const randomMsg = hinglishMessages[Math.floor(Math.random() * hinglishMessages.length)]
    addToast(randomMsg, 'motivational')
  }, [addToast])

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }

  return (
    <ToastContext.Provider value={{ addToast, addRandomHinglishToast }}>
      {children}
      <div className="toast-container">
        {toasts.map(toast => (
          <div key={toast.id} className={`toast glass-panel animate-slide-in toast-${toast.type}`}>
            <p>{toast.message}</p>
            <button className="toast-close" onClick={() => removeToast(toast.id)}>
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export const useToast = () => useContext(ToastContext)
