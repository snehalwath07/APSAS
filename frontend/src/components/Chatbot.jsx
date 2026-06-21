import React, { useState, useRef, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';

const Chatbot = () => {
  const { user } = useContext(AuthContext);
  const [messages, setMessages] = useState([
    {
      sender: 'bot',
      text: "Hello! I am your APSAS Assistant. You can ask me how to report incidents, trigger SOS distress signals, check fire evacuation guidelines, or ask about local Safety Scores. How can I help you today?"
    }
  ]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || sending) return;

    const userMessage = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { sender: 'user', text: userMessage }]);
    setSending(true);

    try {
      const res = await axios.post('/chat', { 
        message: userMessage,
        role: user?.role || 'citizen'
      });
      setMessages((prev) => [...prev, { sender: 'bot', text: res.data.reply }]);
    } catch (err) {
      console.error('Chat error:', err);
      setMessages((prev) => [
        ...prev,
        { sender: 'bot', text: 'Sorry, I am having trouble connecting to the safety network. Please try again shortly.' }
      ]);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="bg-card border border-border rounded-2xl flex flex-col h-[400px] shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-slate-900/40 p-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan animate-pulse"></span>
          <h3 className="text-sm font-bold text-text">APSAS Dynamic Safety Guide</h3>
        </div>
        <span className="text-[10px] text-text-faint font-mono uppercase">Local FAQ AI Engine</span>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 p-4 overflow-y-auto space-y-3 scroll-smooth">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-xl px-4 py-2.5 text-xs leading-relaxed whitespace-pre-line ${
                msg.sender === 'user'
                  ? 'bg-indigo text-white rounded-tr-none'
                  : 'bg-slate-800/60 border border-border text-text-dim rounded-tl-none'
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}
        {sending && (
          <div className="flex justify-start">
            <div className="bg-slate-800/60 border border-border rounded-xl rounded-tl-none px-4 py-2.5 text-xs text-text-faint flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-text-dim rounded-full animate-bounce"></span>
              <span className="w-1.5 h-1.5 bg-text-dim rounded-full animate-bounce [animation-delay:0.2s]"></span>
              <span className="w-1.5 h-1.5 bg-text-dim rounded-full animate-bounce [animation-delay:0.4s]"></span>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="p-3 border-t border-border bg-slate-950/20 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about safety alerts, first aid, report steps..."
          className="flex-1 bg-slate-800/40 border border-border rounded-xl px-3 py-2 text-xs text-text outline-none focus:border-indigo"
        />
        <button
          type="submit"
          disabled={sending}
          className="bg-indigo hover:bg-indigo-600 disabled:bg-indigo/40 text-white px-4 py-2 rounded-xl text-xs font-bold transition"
        >
          Send
        </button>
      </form>
    </div>
  );
};

export default Chatbot;
