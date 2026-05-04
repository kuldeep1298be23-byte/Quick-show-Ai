import React, { useState, useRef, useEffect } from 'react'
import { MessageCircle, X, Send, Bot, Sparkles, ChevronDown } from 'lucide-react'
import { useAppContext } from '../context/AppContext'

const SUGGESTIONS = [
  "What movies are showing now?",
  "Recommend a thriller for tonight",
  "Which movie has the best rating?",
  "Tell me about action movies",
]

const WELCOME = "Hey! I'm your QuickShow AI assistant. Ask me anything about movies, showtimes, or what to watch tonight!"

const MovieChatbot = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([
    { role: 'assistant', content: WELCOME },
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [unread, setUnread] = useState(0)
  const [isMinimized, setIsMinimized] = useState(false)

  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)
  const { shows, axios, apiBaseUrl, isSignedIn, getToken } = useAppContext()

  useEffect(() => {
    if (isOpen && !isMinimized) messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isOpen, isMinimized])

  useEffect(() => {
    if (isOpen && !isMinimized) setTimeout(() => inputRef.current?.focus(), 300)
  }, [isOpen, isMinimized])

  const buildMovieContext = () => {
    if (!shows || shows.length === 0) return 'No shows currently available.'
    const list = shows.slice(0, 15).map((m) =>
      `- ${m.title || 'Untitled movie'} (${m.release_date?.split('-')[0] || 'N/A'}) | Rating: ${Number(m.vote_average || 0).toFixed(1)} | Genres: ${m.genres?.map((g) => g.name).join(', ') || 'N/A'}`
    ).join('\n')
    return `Currently showing movies on QuickShow:\n${list}`
  }

  const sendMessage = async (text) => {
    const userText = (text || input).trim()
    if (!userText || isLoading) return

    const userMsg = { role: 'user', content: userText }
    const updatedMessages = [...messages, userMsg]
    setMessages(updatedMessages)
    setInput('')

    if (!isSignedIn) {
      setMessages((prev) => [...prev, {
        role: 'assistant',
        content: 'Please login first to use QuickShow AI.'
      }])
      return
    }

    setIsLoading(true)

    try {
      // Only send actual conversation (skip the static welcome message)
      const conversationToSend = updatedMessages
        .filter(m => !(m.role === 'assistant' && m.content === WELCOME))
        .map(m => ({ role: m.role, content: m.content }))

      const { data } = await axios.post('/api/chat/message',
        {
          messages: conversationToSend,
          movieContext: buildMovieContext(),
        },
        {
          headers: { Authorization: `Bearer ${await getToken()}` },
        }
      )

      const reply = data?.success
        ? data.reply
        : `Error: ${data?.message || "Couldn't get a response. Please try again!"}`

      setMessages((prev) => [...prev, { role: 'assistant', content: reply }])
      if (!isOpen || isMinimized) setUnread((n) => n + 1)
    } catch (err) {
      console.error('Chat error:', err)
      const isLocalApi = apiBaseUrl?.includes('localhost')
      const message = isLocalApi
        ? "Oops! Make sure the local server is running on port 3000 and try again."
        : "Oops! I couldn't reach the QuickShow API. Please check the deployed backend URL in VITE_BASE_URL."

      setMessages((prev) => [...prev, {
        role: 'assistant',
        content: message
      }])
    } finally {
      setIsLoading(false)
    }
  }

  const handleOpen = () => { setIsOpen(true); setIsMinimized(false); setUnread(0) }
  const handleKeyDown = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }
  const showSuggestions = messages.length === 1

  const S = {
    bubble: { position:'fixed', bottom:'28px', right:'28px', zIndex:9999, width:'60px', height:'60px', borderRadius:'50%', background:'linear-gradient(135deg,#F84565 0%,#c0325a 100%)', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 8px 32px rgba(248,69,101,0.45),0 2px 8px rgba(0,0,0,0.4)', animation:'qs-pulse 2.5s infinite', transition:'transform 0.2s' },
    window: { position:'fixed', bottom:'28px', right:'28px', zIndex:9999, width:'370px', maxWidth:'calc(100vw - 32px)', borderRadius:'20px', background:'#111114', border:'1px solid rgba(248,69,101,0.2)', boxShadow:'0 24px 80px rgba(0,0,0,0.7)', fontFamily:'"Outfit",sans-serif', overflow:'hidden', display:'flex', flexDirection:'column', animation:'qs-slideup 0.3s cubic-bezier(0.34,1.56,0.64,1)' },
    header: { background:'linear-gradient(135deg,#1a0a0e 0%,#1c0d12 100%)', borderBottom:'1px solid rgba(248,69,101,0.15)', padding:'16px 18px', display:'flex', alignItems:'center', gap:'12px', flexShrink:0 },
    avatar: { width:'40px', height:'40px', borderRadius:'50%', background:'linear-gradient(135deg,#F84565,#c0325a)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, boxShadow:'0 0 16px rgba(248,69,101,0.4)' },
    dot: { width:'7px', height:'7px', borderRadius:'50%', background:'#22c55e', display:'inline-block', boxShadow:'0 0 6px #22c55e' },
    iconBtn: { width:'28px', height:'28px', borderRadius:'8px', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.08)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' },
    messages: { flex:1, overflowY:'auto', padding:'16px', display:'flex', flexDirection:'column', gap:'12px', maxHeight:'360px', minHeight:'200px', scrollbarWidth:'thin', scrollbarColor:'#333 transparent' },
    inputArea: { padding:'12px 14px', borderTop:'1px solid rgba(255,255,255,0.06)', background:'#0d0d10', display:'flex', gap:'10px', alignItems:'center', flexShrink:0 },
  }

  return (
    <>
      {!isOpen && (
        <button onClick={handleOpen} aria-label="Open movie chatbot" style={S.bubble}
          onMouseEnter={(e) => (e.currentTarget.style.transform='scale(1.1)')}
          onMouseLeave={(e) => (e.currentTarget.style.transform='scale(1)')}
        >
          <MessageCircle size={26} color="white" fill="white" fillOpacity={0.3} />
          {unread > 0 && (
            <span style={{ position:'absolute', top:'4px', right:'4px', background:'#fff', color:'#F84565', borderRadius:'50%', fontSize:'11px', fontWeight:700, width:'18px', height:'18px', display:'flex', alignItems:'center', justifyContent:'center' }}>
              {unread}
            </span>
          )}
        </button>
      )}

      {isOpen && (
        <div style={S.window}>
          {/* Header */}
          <div style={S.header}>
            <div style={S.avatar}><Bot size={20} color="white" /></div>
            <div style={{ flex:1 }}>
              <div style={{ display:'flex', alignItems:'center', gap:'6px' }}>
                <span style={{ color:'#fff', fontWeight:600, fontSize:'15px' }}>QuickShow AI</span>
                <Sparkles size={13} color="#F84565" />
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:'5px', marginTop:'2px' }}>
                <span style={S.dot} />
                <span style={{ color:'#9ca3af', fontSize:'12px' }}>Online - Movie Expert</span>
              </div>
            </div>
            <div style={{ display:'flex', gap:'4px' }}>
              <button onClick={() => setIsMinimized(v => !v)} style={S.iconBtn}>
                <ChevronDown size={16} color="#9ca3af" style={{ transform:isMinimized?'rotate(180deg)':'none', transition:'0.2s' }} />
              </button>
              <button onClick={() => setIsOpen(false)} style={S.iconBtn}>
                <X size={16} color="#9ca3af" />
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Messages */}
              <div style={S.messages}>
                {messages.map((msg, i) => (
                  <div key={i} style={{ display:'flex', justifyContent:msg.role==='user'?'flex-end':'flex-start', alignItems:'flex-end', gap:'8px', animation:'qs-fadein 0.25s ease' }}>
                    {msg.role === 'assistant' && (
                      <div style={{ width:'28px', height:'28px', borderRadius:'50%', background:'linear-gradient(135deg,#F84565,#c0325a)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                        <Bot size={14} color="white" />
                      </div>
                    )}
                    <div style={{ maxWidth:'80%', padding:'10px 14px', borderRadius:msg.role==='user'?'18px 18px 4px 18px':'18px 18px 18px 4px', background:msg.role==='user'?'linear-gradient(135deg,#F84565,#c0325a)':'rgba(255,255,255,0.06)', border:msg.role==='user'?'none':'1px solid rgba(255,255,255,0.08)', color:'#fff', fontSize:'13.5px', lineHeight:'1.6', whiteSpace:'pre-wrap', wordBreak:'break-word' }}>
                      {msg.content}
                    </div>
                  </div>
                ))}

                {/* Typing indicator */}
                {isLoading && (
                  <div style={{ display:'flex', alignItems:'flex-end', gap:'8px' }}>
                    <div style={{ width:'28px', height:'28px', borderRadius:'50%', background:'linear-gradient(135deg,#F84565,#c0325a)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                      <Bot size={14} color="white" />
                    </div>
                    <div style={{ padding:'12px 16px', borderRadius:'18px 18px 18px 4px', background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.08)', display:'flex', gap:'5px', alignItems:'center' }}>
                      {[0,1,2].map(i => (
                        <span key={i} style={{ width:'7px', height:'7px', borderRadius:'50%', background:'#F84565', display:'block', animation:`qs-bounce 1s ${i*0.2}s infinite` }} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Suggestion chips */}
                {showSuggestions && !isLoading && (
                  <div style={{ display:'flex', flexDirection:'column', gap:'6px', marginTop:'4px' }}>
                    <span style={{ color:'#6b7280', fontSize:'11.5px', paddingLeft:'4px' }}>Try asking:</span>
                    <div style={{ display:'flex', flexWrap:'wrap', gap:'6px' }}>
                      {SUGGESTIONS.map(s => (
                        <button key={s} onClick={() => sendMessage(s)}
                          style={{ padding:'6px 12px', borderRadius:'20px', background:'rgba(248,69,101,0.1)', border:'1px solid rgba(248,69,101,0.25)', color:'#F84565', fontSize:'12px', cursor:'pointer', fontFamily:'"Outfit",sans-serif' }}
                          onMouseEnter={e => e.currentTarget.style.background='rgba(248,69,101,0.2)'}
                          onMouseLeave={e => e.currentTarget.style.background='rgba(248,69,101,0.1)'}
                        >{s}</button>
                      ))}
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div style={S.inputArea}>
                <input ref={inputRef} value={input} onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown} placeholder="Ask about any movie..." disabled={isLoading}
                  style={{ flex:1, background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'12px', padding:'10px 14px', color:'#fff', fontSize:'13.5px', outline:'none', fontFamily:'"Outfit",sans-serif', transition:'border-color 0.2s' }}
                  onFocus={e => e.target.style.borderColor='rgba(248,69,101,0.5)'}
                  onBlur={e => e.target.style.borderColor='rgba(255,255,255,0.1)'}
                />
                <button onClick={() => sendMessage()} disabled={!input.trim() || isLoading}
                  style={{ width:'40px', height:'40px', borderRadius:'12px', background:input.trim()&&!isLoading?'linear-gradient(135deg,#F84565,#c0325a)':'rgba(255,255,255,0.07)', border:'none', cursor:input.trim()&&!isLoading?'pointer':'not-allowed', display:'flex', alignItems:'center', justifyContent:'center', transition:'all 0.2s', flexShrink:0 }}>
                  <Send size={16} color={input.trim()&&!isLoading?'white':'#555'} />
                </button>
              </div>

              <div style={{ padding:'6px 14px 10px', background:'#0d0d10', textAlign:'center' }}>
                <span style={{ color:'#374151', fontSize:'10.5px' }}>Powered by Gemini AI - QuickShow</span>
              </div>
            </>
          )}
        </div>
      )}

      <style>{`
        @keyframes qs-pulse { 0%,100%{box-shadow:0 8px 32px rgba(248,69,101,0.45),0 2px 8px rgba(0,0,0,0.4)}50%{box-shadow:0 8px 40px rgba(248,69,101,0.7),0 2px 16px rgba(0,0,0,0.5)} }
        @keyframes qs-slideup { from{opacity:0;transform:translateY(24px) scale(0.96)}to{opacity:1;transform:translateY(0) scale(1)} }
        @keyframes qs-fadein { from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)} }
        @keyframes qs-bounce { 0%,80%,100%{transform:scale(0.8);opacity:0.5}40%{transform:scale(1.2);opacity:1} }
      `}</style>
    </>
  )
}

export default MovieChatbot

