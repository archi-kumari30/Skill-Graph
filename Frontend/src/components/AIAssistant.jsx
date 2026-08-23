import React, { useState, useRef, useEffect } from 'react';
import api from '../services/api';
import { MessageSquare, X, Send, Sparkles, AlertTriangle, ShieldAlert } from 'lucide-react';

const AIAssistant = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [configError, setConfigError] = useState(false);
  const [checkingConfig, setCheckingConfig] = useState(true);

  const chatEndRef = useRef(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  // Check configuration on mount
  useEffect(() => {
    const checkConfig = async () => {
      try {
        setCheckingConfig(true);
        const res = await api.get('/ai/status');
        if (res.data?.configured) {
          setConfigError(false);
          setMessages([
            {
              sender: 'ai',
              text: 'Hello! I am SkillGraph AI, your Career Assistant. Ask me anything about your skills profile, target role gaps, matched opportunities, or dynamic learning recommendations.'
            }
          ]);
        } else {
          setConfigError(true);
          setMessages([
            {
              sender: 'ai',
              text: 'SkillGraph AI is currently unavailable because the AI provider has not been configured.'
            }
          ]);
        }
      } catch (err) {
        // Fallback if endpoint is protected but not logged in yet (or other errors)
        setConfigError(true);
        setMessages([
          {
            sender: 'ai',
            text: 'SkillGraph AI is currently unavailable because the AI provider has not been configured.'
          }
        ]);
      } finally {
        setCheckingConfig(false);
      }
    };

    checkConfig();
  }, []);

  const handleClear = () => {
    setMessages([
      {
        sender: 'ai',
        text: 'Hello! I am SkillGraph AI, your Career Assistant. Ask me anything about your skills profile, target role gaps, matched opportunities, or dynamic learning recommendations.'
      }
    ]);
  };

  const handleSend = async (textToSend) => {
    const query = textToSend || input;
    if (!query.trim()) return;

    if (!textToSend) {
      setInput('');
    }

    // Capture current list of messages before appending the new user query to avoid race conditions
    const currentHistory = [...messages];

    // Append user message
    setMessages(prev => [...prev, { sender: 'user', text: query }]);
    setLoading(true);

    try {
      const res = await api.post('/ai/career-assistant', { 
        question: query,
        history: currentHistory.map(m => ({ sender: m.sender, text: m.text }))
      });
      setMessages(prev => [...prev, { sender: 'ai', text: res.data?.response || '' }]);
    } catch (err) {
      setMessages(prev => [
        ...prev,
        { 
          sender: 'ai', 
          text: "SkillGraph AI couldn't reach the AI service right now. Please try again.", 
          isError: true, 
          retryText: query 
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const templates = [
    'Why am I not ready for my target role?',
    'Which jobs match my current profile?',
    'What should I focus on learning first?',
    'Create a 30-day learning plan.'
  ];

  return (
    <>
      {/* Floating Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-40 bg-indigo-650 hover:bg-indigo-750 text-white rounded-full p-4 shadow-xl hover:scale-105 transition-all flex items-center justify-center cursor-pointer"
        title="Ask SkillGraph AI"
      >
        {isOpen ? <X className="w-6 h-6" /> : <MessageSquare className="w-6 h-6" />}
      </button>

      {/* Slide-out Chat Drawer */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-96 max-w-[calc(100vw-3rem)] h-[500px] bg-white border border-slate-200 shadow-2xl rounded-3xl z-40 flex flex-col overflow-hidden animate-in slide-in-from-bottom-6 duration-200">
          
          {/* Header */}
          <div className="bg-slate-900 text-white px-5 py-4 flex justify-between items-center shrink-0 border-b border-slate-800">
            <div className="flex items-center space-x-2.5">
              <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div className="flex flex-col text-left">
                <span className="text-xs font-black tracking-wide uppercase">SkillGraph AI</span>
                <span className="text-[10px] opacity-75 font-semibold leading-none">Career Assistant</span>
              </div>
            </div>
            <div className="flex items-center space-x-2.5">
              {messages.length > 1 && (
                <button
                  onClick={handleClear}
                  className="text-[10px] font-black uppercase tracking-wider text-slate-400 hover:text-white bg-slate-800 px-2 py-1 rounded transition-colors cursor-pointer"
                  title="Clear Conversation"
                >
                  Clear
                </button>
              )}
              <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white transition-colors cursor-pointer">
                <X className="w-4.5 h-4.5" />
              </button>
            </div>
          </div>

          {/* Messages Panel */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs font-semibold leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-indigo-650 text-white rounded-tr-none'
                      : msg.text.includes('unavailable') || msg.isError
                        ? 'bg-rose-50 text-rose-850 border border-rose-100 rounded-tl-none shadow-sm'
                        : 'bg-white text-slate-800 border border-slate-200/50 rounded-tl-none shadow-sm'
                  } whitespace-pre-line`}
                >
                  <div>{msg.text}</div>
                  {msg.isError && (
                    <button
                      type="button"
                      onClick={() => handleSend(msg.retryText)}
                      className="mt-2 px-2.5 py-1 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg text-[9.5px] font-black text-rose-700 uppercase tracking-wider transition-colors cursor-pointer"
                    >
                      Try Again
                    </button>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-white border border-slate-200/50 rounded-2xl rounded-tl-none px-4 py-2.5 text-xs font-bold text-slate-450 animate-pulse">
                  SkillGraph AI is calculating...
                </div>
              </div>
            )}

            {/* Config Error Card */}
            {configError && (
              <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4 text-center space-y-2.5">
                <ShieldAlert className="w-8 h-8 text-rose-500 mx-auto animate-bounce" />
                <h4 className="font-extrabold text-xs text-rose-800 uppercase">Configuration Required</h4>
                <p className="text-[10.5px] text-rose-655 leading-normal">
                  The AI Assistant is not configured. Please set the <strong>GEMINI_API_KEY</strong> environment variable in your backend <strong>.env</strong> file.
                </p>
              </div>
            )}

            {/* Quick Templates Buttons */}
            {messages.length === 1 && !loading && !configError && (
              <div className="space-y-2 pt-2">
                <span className="text-[9px] uppercase font-bold text-slate-400 block tracking-wider">Quick prompts</span>
                <div className="grid grid-cols-1 gap-2">
                  {templates.map((tpl, i) => (
                    <button
                      key={i}
                      onClick={() => handleSend(tpl)}
                      className="text-left w-full px-3 py-2 bg-white hover:bg-slate-100 border border-slate-200/50 rounded-xl text-[10.5px] font-bold text-slate-655 transition-colors shadow-sm cursor-pointer"
                    >
                      {tpl}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* Form Input */}
          <form
            onSubmit={(e) => { e.preventDefault(); handleSend(); }}
            className="p-3 border-t border-slate-150 bg-white flex items-center space-x-2 shrink-0"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask career guidance..."
              disabled={loading || configError || checkingConfig}
              className="flex-1 px-4 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-indigo-500 disabled:bg-slate-100 disabled:text-slate-400"
            />
            <button
              type="submit"
              disabled={loading || configError || checkingConfig || !input.trim()}
              className="p-2 bg-indigo-650 hover:bg-indigo-750 text-white rounded-xl disabled:bg-slate-100 disabled:text-slate-400 transition-colors flex items-center justify-center shrink-0 cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

        </div>
      )}
    </>
  );
};

export default AIAssistant;
