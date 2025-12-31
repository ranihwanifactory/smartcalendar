
import React, { useState, useMemo } from 'react';
import { CalendarEvent } from '../types';
import { generateMonthlySummary } from '../services/geminiService';

interface MonthlySummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  year: number;
  month: number;
  monthName: string;
  events: CalendarEvent[];
}

const MonthlySummaryModal: React.FC<MonthlySummaryModalProps> = ({
  isOpen, onClose, year, month, monthName, events
}) => {
  const [aiBriefing, setAiBriefing] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Filter events for current month
  const monthlyEvents = useMemo(() => {
    return events.filter(e => {
      const start = new Date(e.startDate);
      const end = new Date(e.endDate);
      return (start.getFullYear() === year && start.getMonth() === month) ||
             (end.getFullYear() === year && end.getMonth() === month);
    }).sort((a, b) => a.startDate.localeCompare(b.startDate));
  }, [events, year, month]);

  const stats = useMemo(() => {
    const total = monthlyEvents.length;
    const completed = monthlyEvents.filter(e => e.completed).length;
    const pending = total - completed;
    const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, pending, rate };
  }, [monthlyEvents]);

  if (!isOpen) return null;

  const handleGetAIBriefing = async () => {
    setIsGenerating(true);
    const briefing = await generateMonthlySummary(monthlyEvents, `${year}년 ${monthName}`);
    setAiBriefing(briefing);
    setIsGenerating(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 no-print">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in duration-300">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">{year}년 {monthName} 일정 요약</h2>
            <p className="text-sm text-slate-500">한 달간의 기록을 한눈에 확인하세요.</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Side: Stats & AI */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-indigo-600 rounded-2xl p-6 text-white shadow-lg shadow-indigo-100">
              <h3 className="text-indigo-100 text-sm font-medium mb-4">진행률</h3>
              <div className="flex items-end justify-between mb-2">
                <span className="text-4xl font-black">{stats.rate}%</span>
                <span className="text-indigo-200 text-sm">{stats.completed} / {stats.total} 완료</span>
              </div>
              <div className="w-full h-2 bg-indigo-400/30 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-white rounded-full transition-all duration-1000" 
                  style={{ width: `${stats.rate}%` }}
                ></div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <p className="text-slate-500 text-xs font-bold mb-1">진행 중</p>
                <p className="text-2xl font-black text-slate-800">{stats.pending}</p>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <p className="text-slate-500 text-xs font-bold mb-1">전체 일정</p>
                <p className="text-2xl font-black text-slate-800">{stats.total}</p>
              </div>
            </div>

            {/* AI Briefing Card */}
            <div className="bg-purple-50 rounded-2xl p-5 border border-purple-100 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                <svg className="w-12 h-12 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h4 className="text-purple-800 font-bold mb-2 flex items-center gap-2">
                <span>✨</span> AI 스마트 브리핑
              </h4>
              {aiBriefing ? (
                <div className="text-sm text-purple-900 leading-relaxed whitespace-pre-wrap">
                  {aiBriefing}
                </div>
              ) : (
                <button 
                  onClick={handleGetAIBriefing}
                  disabled={isGenerating || stats.total === 0}
                  className="w-full mt-2 py-3 bg-white text-purple-600 font-bold rounded-xl border border-purple-200 hover:bg-purple-600 hover:text-white transition-all disabled:opacity-50"
                >
                  {isGenerating ? '분석 중...' : 'AI 브리핑 생성하기'}
                </button>
              )}
            </div>
          </div>

          {/* Right Side: Event List */}
          <div className="lg:col-span-2 space-y-4">
            <h3 className="text-slate-700 font-bold flex items-center gap-2">
              <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
              이달의 일정 목록
            </h3>
            {monthlyEvents.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                <p className="text-slate-400 font-medium">등록된 일정이 없습니다.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {monthlyEvents.map(event => (
                  <div key={event.id} className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center gap-4 hover:shadow-sm transition-all group">
                    <div className={`w-2 h-10 rounded-full ${event.color?.split(' ')[0] || 'bg-slate-200'}`}></div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded uppercase">
                          {event.startDate.split('-').slice(1).join('/')}
                        </span>
                        {event.completed && (
                          <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded">완료</span>
                        )}
                      </div>
                      <h4 className={`font-bold text-slate-800 truncate ${event.completed ? 'line-through text-slate-400' : ''}`}>
                        {event.title}
                      </h4>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MonthlySummaryModal;
