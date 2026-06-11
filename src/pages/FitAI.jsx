import React, { useState, useEffect } from 'react';
import { Brain, Search, Plus, MessageSquare, Trash2, Send, Activity, Sparkles, ChevronRight } from 'lucide-react';
import { askFitAIAssistant } from '../lib/ai';
import { supabase } from '../lib/supabase';
import './FitAI.css';

export default function FitAI() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [userProfile, setUserProfile] = useState({});

  useEffect(() => {
    async function fetchProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        if (data) setUserProfile(data);
      }
    }
    fetchProfile();
  }, []);

  const suggestions = [
    { text: "What should I focus on today?", icon: <Activity size={16} /> },
    { text: "How much protein do I still need?", icon: <Sparkles size={16} /> },
    { text: "Review my recovery score.", icon: <Brain size={16} /> }
  ];

  const handleSend = async (text) => {
    if (!text.trim()) return;
    
    const newMsg = { role: 'user', content: text };
    const updatedMessages = [...messages, newMsg];
    setMessages(updatedMessages);
    setInput('');
    setIsTyping(true);

    try {
      const aiResponse = await askFitAIAssistant(
        updatedMessages.filter(m => m.role === 'user' || m.role === 'assistant').map(m => ({
          role: m.role === 'ai' ? 'assistant' : m.role,
          content: m.content || JSON.stringify(m) 
        })),
        userProfile // Now passing the real user profile fetched from Supabase
      );

      setMessages(prev => [...prev, {
        role: 'ai',
        summary: aiResponse.summary,
        confidence: aiResponse.confidence,
        reasoning: aiResponse.reasoning,
        recommendation: aiResponse.recommendation,
        nextAction: aiResponse.nextAction
      }]);
    } catch (error) {
      setMessages(prev => [...prev, {
        role: 'ai',
        summary: "Error connecting to AI.",
        confidence: "0%",
        reasoning: "The connection to Groq API failed.",
        recommendation: "Please check your API key.",
        nextAction: "Try again later."
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="fitai-container animate-fade-in">
      <div className="ai-glow-green" />
      <div className="ai-glow-cyan" />
      
      {/* Sidebar */}
      <aside className="fitai-sidebar">
        <div className="sidebar-header">
          <button className="btn btn-aurora" style={{ width: '100%', padding: '12px', display: 'flex', gap: '8px' }} onClick={() => setMessages([])}>
            <Plus size={18} /> New Chat
          </button>
        </div>
        <div className="sidebar-content">
          <div className="chat-search" style={{ position: 'relative', marginBottom: '16px' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
            <input type="text" placeholder="Search chats..." className="input-field" style={{ paddingLeft: '36px', fontSize: '0.85rem' }} />
          </div>
          <p style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '8px', letterSpacing: '1px' }}>Recent</p>
          <div className="chat-history-item active">
            <MessageSquare size={16} />
            <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Morning Recovery Plan</span>
          </div>
          <div className="chat-history-item">
            <MessageSquare size={16} />
            <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Weekly Review - June</span>
          </div>
        </div>
      </aside>
      
      {/* Main Chat Area */}
      <main className="fitai-main">
        <header className="chat-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '12px', background: 'rgba(118,185,0,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(118,185,0,0.3)' }}>
              <Brain size={20} color="var(--primary-color)" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem' }}>FitAI Elite</h3>
              <span style={{ fontSize: '0.75rem', color: '#4ade80', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: '6px', height: '6px', background: '#4ade80', borderRadius: '50%' }}></span> Online
              </span>
            </div>
          </div>
        </header>

        {messages.length === 0 ? (
          /* Hero State */
          <div className="fitai-hero">
            <div className="hero-stats-card">
              <div>
                <h2 style={{ fontSize: '1.5rem', marginBottom: '8px' }}>Today's Focus</h2>
                <p className="text-secondary">Hydration and Protein Intake</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Recovery</span>
                <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--primary-color)', lineHeight: 1 }}>87<span style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>/100</span></div>
              </div>
            </div>

            <div style={{ width: '100%', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>Dynamic Suggestions</h3>
              <button style={{ background: 'none', border: 'none', color: 'var(--primary-color)', cursor: 'pointer', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Sparkles size={14} /> Generate More
              </button>
            </div>

            <div className="quick-actions-scroll">
              {suggestions.map((s, i) => (
                <div key={i} className="quick-action-card" onClick={() => handleSend(s.text)}>
                  <div style={{ color: 'var(--primary-color)' }}>{s.icon}</div>
                  <p style={{ fontSize: '0.95rem', fontWeight: 500 }}>{s.text}</p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* Chat Messages */
          <div className="chat-scroll-area">
            {messages.map((msg, i) => (
              <div key={i} className={`message-bubble ${msg.role === 'user' ? 'message-user' : 'message-ai'}`}>
                {msg.role === 'user' ? (
                  <p style={{ margin: 0 }}>{msg.content}</p>
                ) : (
                  <div className="ai-structured-response">
                    <div className="summary-section">
                      <Sparkles size={16} color="var(--primary-color)" style={{ display: 'inline', marginRight: '8px', verticalAlign: 'text-bottom' }} />
                      {msg.summary}
                    </div>
                    <div className="details-section">
                      <div>
                        <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '4px' }}>Reasoning</span>
                        <span style={{ fontSize: '0.85rem' }}>{msg.reasoning}</span>
                      </div>
                      <div>
                        <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '4px' }}>Confidence</span>
                        <span style={{ fontSize: '1.2rem', fontWeight: 700, color: '#4ade80' }}>{msg.confidence}</span>
                      </div>
                    </div>
                    <div className="recommendation-section">
                      <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '4px' }}>Recommendation</span>
                      <span style={{ fontSize: '0.95rem', color: '#fff' }}>{msg.recommendation}</span>
                    </div>
                    <div style={{ background: 'rgba(118,185,0,0.1)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(118,185,0,0.2)', display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
                      <ChevronRight size={16} color="var(--primary-color)" />
                      <span style={{ fontSize: '0.9rem', color: '#fff', fontWeight: 500 }}>{msg.nextAction}</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
            {isTyping && (
              <div className="message-bubble message-ai typing-indicator">
                <div className="typing-dot"></div>
                <div className="typing-dot"></div>
                <div className="typing-dot"></div>
              </div>
            )}
          </div>
        )}

        <div className="chat-input-area">
          <div className="chat-input-container">
            <input 
              type="text" 
              className="chat-input" 
              placeholder="Ask anything about your health, recovery, or fitness..." 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend(input)}
            />
            <button className="send-btn" onClick={() => handleSend(input)} disabled={!input.trim()}>
              <Send size={18} />
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
