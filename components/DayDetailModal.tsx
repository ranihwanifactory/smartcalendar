import React from 'react';
import { CalendarEvent, WeatherInfo, AppTheme } from '../types';
import { WEEKDAYS, ACCENT_COLORS } from '../constants';

interface DayDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  dateString: string;
  events: CalendarEvent[];
  holiday?: CalendarEvent;
  weather?: WeatherInfo;
  theme: AppTheme;
  onAddEvent: () => void;
  onEditEvent: (event: CalendarEvent) => void;
  onToggleComplete: (event: CalendarEvent) => void;
}

const DayDetailModal: React.FC<DayDetailModalProps> = ({
  isOpen, onClose, dateString, events, holiday, weather, theme, onAddEvent, onEditEvent, onToggleComplete,
}) => {
  if (!isOpen) return null;

  const date = new Date(dateString);
  const dayName = WEEKDAYS[date.getDay()];
  const displayDate = `${date.getMonth() + 1}월 ${date.getDate()}일 (${dayName})`;
  const accentColorObj = ACCENT_COLORS.find(c => c.id === theme.accent);
  const accentBg = accentColorObj?.bg || 'bg-indigo-600';
  const accentText = accentColorObj?.text || 'text-indigo-600';

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 no-print">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200 transition-colors">
        <div className={`p-6 text-white relative ${theme.mode === 'dark' ? 'bg-slate-800' : 'bg-slate-900'}`}>
          <button onClick={onClose} className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-full transition-colors">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
          <div className="flex justify-between items-end">
            <div>
              <p className="text-slate-400 text-sm font-medium mb-1">{date.getFullYear()}년</p>
              <h2 className="text-3xl font-bold">{displayDate}</h2>
            </div>
            {weather && (
              <div className="text-right">
                <div className="text-4xl mb-1">{weather.icon}</div>
                <p className="text-sm font-medium">
                  <span className="text-blue-300">{Math.round(weather.minTemp)}°</span>
                  <span className="mx-1 opacity-50">/</span>
                  <span className="text-red-300">{Math.round(weather.maxTemp)}°</span>
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="p-6 max-h-[60vh] overflow-y-auto bg-slate-50 dark:bg-slate-950 transition-colors">
          <div className="space-y-4">
            {holiday && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-2xl p-4 flex items-center gap-3">
                <div className="w-10 h-10 bg-red-500 text-white rounded-xl flex items-center justify-center shadow-sm">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5z" /></svg>
                </div>
                <div>
                  <h4 className="font-bold text-red-700 dark:text-red-400">{holiday.title}</h4>
                  <p className="text-xs text-red-500 dark:text-red-500/80">법정 공휴일</p>
                </div>
              </div>
            )}

            <div className="space-y-3">
              <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 px-1">개인 일정 ({events.length})</h3>
              {events.length === 0 ? (
                <div className="text-center py-8 bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 transition-colors">
                  <p className="text-slate-400 text-sm">일정이 없습니다.</p>
                </div>
              ) : (
                events.map(event => (
                  <div key={event.id} className={`group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex items-center gap-3 hover:shadow-md transition-all ${event.completed ? 'opacity-60' : ''}`}>
                    <button onClick={() => onToggleComplete(event)}
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${event.completed ? 'bg-green-500 border-green-500 text-white' : 'border-slate-300 dark:border-slate-700 hover:border-blue-500'}`}>
                      {event.completed && <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path d="M5 13l4 4L19 7" /></svg>}
                    </button>
                    <div className="flex-1 min-w-0" onClick={() => onEditEvent(event)}>
                      <h4 className={`font-bold text-slate-800 dark:text-slate-200 truncate ${event.completed ? 'line-through text-slate-400 dark:text-slate-600' : ''}`}>{event.title}</h4>
                      {event.description && <p className="text-xs text-slate-500 dark:text-slate-500 truncate mt-0.5">{event.description}</p>}
                    </div>
                    <button onClick={() => onEditEvent(event)} className="opacity-0 group-hover:opacity-100 p-2 text-slate-400 hover:text-blue-600 transition-all">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 transition-colors">
          <button onClick={onAddEvent} className={`w-full ${accentBg} text-white font-bold py-4 rounded-2xl hover:brightness-110 transition-all shadow-lg flex items-center justify-center gap-2`}>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path d="M12 4v16m8-8H4" /></svg>
            새로운 일정 추가
          </button>
        </div>
      </div>
    </div>
  );
};
export default DayDetailModal;