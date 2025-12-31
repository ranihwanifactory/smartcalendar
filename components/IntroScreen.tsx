import React, { useEffect, useState } from 'react';

const IntroScreen: React.FC = () => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 2800); // Wait for animations to play out
    return () => clearTimeout(timer);
  }, []);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-slate-950 overflow-hidden animate-fadeOut">
      <style>{`
        @keyframes revealUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.8); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes fadeOut {
          0% { opacity: 1; }
          80% { opacity: 1; }
          100% { opacity: 0; pointer-events: none; }
        }
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .animate-revealUp { animation: revealUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-scaleIn { animation: scaleIn 1s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-fadeOut { animation: fadeOut 3s forwards; }
        
        .shimmer-text {
          background: linear-gradient(90deg, #6366f1, #a855f7, #6366f1);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: shimmer 3s linear infinite;
        }
      `}</style>

      {/* Background decoration */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/10 blur-[120px] rounded-full"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/10 blur-[120px] rounded-full"></div>

      <div className="relative flex flex-col items-center">
        {/* Logo/Icon Area */}
        <div className="w-24 h-24 mb-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-[2rem] flex items-center justify-center shadow-2xl shadow-indigo-500/20 animate-scaleIn">
          <svg className="w-12 h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 00-2 2z" />
          </svg>
        </div>

        {/* Title Area */}
        <div className="text-center space-y-2 opacity-0 animate-revealUp" style={{ animationDelay: '0.4s' }}>
          <span className="text-indigo-400 font-bold tracking-[0.3em] text-xs uppercase">Premium Calendar</span>
          <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight">
            2026 <span className="shimmer-text">스마트 달력</span>
          </h1>
        </div>

        {/* Loading Indicator */}
        <div className="mt-12 w-48 h-1 bg-slate-800 rounded-full overflow-hidden opacity-0 animate-revealUp" style={{ animationDelay: '0.6s' }}>
          <div className="h-full bg-indigo-500 rounded-full w-0 animate-[loading_2.5s_ease-in-out_forwards]"></div>
        </div>
        
        <p className="mt-4 text-slate-500 text-sm font-medium opacity-0 animate-revealUp" style={{ animationDelay: '0.8s' }}>
          일정을 최적화하는 중...
        </p>
      </div>

      <style>{`
        @keyframes loading {
          0% { width: 0; }
          100% { width: 100%; }
        }
      `}</style>
    </div>
  );
};

export default IntroScreen;