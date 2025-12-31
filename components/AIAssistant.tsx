import React, { useState, useRef, useEffect } from 'react';
import { generatePlan } from '../services/geminiService';
import { ChatMessage, AppTheme } from '../types';
import { ACCENT_COLORS } from '../constants';

interface AIAssistantProps {
  currentDateContext: string;
  isOpen: boolean;
  theme: AppTheme;
  onClose: () => void;
}

const AIAssistant: React.FC<AIAssistantProps> = ({ currentDateContext, isOpen, theme, onClose }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'model', text: `안녕하세요! 2026년 ${currentDateContext}에 대해 무엇을 도와드릴까요? 휴일 계획이나 일정 추천을 물어보세요.` }
  ]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); };
  useEffect(() => { scrollToBottom(); }, [messages, isOpen]);

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMsg: ChatMessage = { role: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setMessages(prev => [...prev, { role: 'model', text: '', isLoading: true }]);
    const responseText = await generatePlan(userMsg.text, currentDateContext);
    setMessages(prev => {
      const newHistory = prev.filter(msg => !msg.isLoading);
      return [...newHistory, { role: 'model', text: responseText }];
    });
  };

  const accentColorObj = ACCENT_COLORS.find(c => c.id === theme.accent);
  const accentBg = accentColorObj?.bg || 'bg-indigo-600';

  return (
    <div className={`fixed inset-y-0 right-0 w-full sm:w-96 bg-white dark:bg-slate-900 shadow-2xl transform transition-transform duration-300 ease-in-out z-40 flex flex-col border-l border-slate-200 dark:border-slate-800 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
      <div className={`${accentBg} p-4 text-white flex justify-between items-center shadow-md transition-colors duration-300`}>
        <div className="flex items-center gap-2">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
          <h2 className="font-bold text-lg">AI 비서</h2>
        </div>
        <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-full transition-colors"><svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M6 18L18 6M6 6l12 12" /></svg></button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${msg.role === 'user' ? 'bg-slate-800 dark:bg-slate-700 text-white rounded-br-none' : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 rounded-bl-none shadow-sm'}`}>
              {msg.isLoading ? <div className="flex gap-1 items-center h-5"><span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></span><span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span><span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span></div> : msg.text}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 transition-colors">
        <div className="relative">
          <textarea value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }} placeholder="메시지를 입력하세요..."
            className="w-full pl-4 pr-12 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none resize-none h-14 text-slate-900 dark:text-white" />
          <button onClick={handleSend} disabled={!input.trim()} className={`absolute right-2 top-2 p-2 ${accentBg} text-white rounded-lg hover:brightness-110 disabled:opacity-50 transition-all shadow-md`}>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
          </button>
        </div>
      </div>
    </div>
  );
};
export default AIAssistant;