import React, { useState, useEffect } from 'react';
import { CalendarEvent, AppTheme } from '../types';
import { EVENT_COLORS, ACCENT_COLORS } from '../constants';

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (event: CalendarEvent) => void;
  onDelete: (id: string) => void;
  selectedDate: string;
  theme: AppTheme;
  existingEvent?: CalendarEvent;
}

const EventModal: React.FC<EventModalProps> = ({ 
  isOpen, onClose, onSave, onDelete, selectedDate, theme, existingEvent 
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [colorIdx, setColorIdx] = useState(0);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (existingEvent) {
        setTitle(existingEvent.title);
        setDescription(existingEvent.description || '');
        setStartDate(existingEvent.startDate);
        setEndDate(existingEvent.endDate);
        const idx = EVENT_COLORS.findIndex(c => c.value === existingEvent.color);
        setColorIdx(idx >= 0 ? idx : 0);
        setCompleted(existingEvent.completed || false);
      } else {
        setTitle('');
        setDescription('');
        setStartDate(selectedDate);
        setEndDate(selectedDate);
        setColorIdx(0);
        setCompleted(false);
      }
    }
  }, [isOpen, existingEvent, selectedDate]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    if (new Date(startDate) > new Date(endDate)) {
      alert('종료일은 시작일보다 빠를 수 없습니다.');
      return;
    }
    onSave({ id: existingEvent ? existingEvent.id : Date.now().toString(), startDate, endDate, title, description, type: 'personal', color: EVENT_COLORS[colorIdx].value, completed });
    onClose();
  };

  const accentColorObj = ACCENT_COLORS.find(c => c.id === theme.accent);
  const accentBg = accentColorObj?.bg || 'bg-indigo-600';
  const accentText = accentColorObj?.text || 'text-indigo-600';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 transition-colors">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all scale-100 border border-slate-200 dark:border-slate-800">
        <div className="bg-slate-50 dark:bg-slate-800 px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center transition-colors">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white">{existingEvent ? '일정 수정' : '새 일정 추가'}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">시작일</label>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-colors" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">종료일</label>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-colors" />
            </div>
          </div>

          <div className="flex justify-between items-center pt-2">
            <span className="text-xs text-slate-400">{startDate === endDate ? '하루 일정' : '기간 일정'}</span>
            {existingEvent && (
              <label className="flex items-center gap-2 cursor-pointer group">
                <div className="relative">
                  <input type="checkbox" checked={completed} onChange={(e) => setCompleted(e.target.checked)} className="sr-only" />
                  <div className={`w-10 h-5 rounded-full transition-colors ${completed ? 'bg-green-500' : 'bg-slate-300 dark:bg-slate-700'}`}></div>
                  <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${completed ? 'translate-x-5' : 'translate-x-0'}`}></div>
                </div>
                <span className={`text-sm font-medium ${completed ? 'text-green-600' : 'text-slate-500'}`}>{completed ? '완료' : '진행중'}</span>
              </label>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">제목</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all" placeholder="일정 제목" />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">설명</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none" rows={2} placeholder="상세 내용을 입력하세요" />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">색상</label>
            <div className="flex gap-2 flex-wrap">
              {EVENT_COLORS.map((color, idx) => (
                <button key={color.name} type="button" onClick={() => setColorIdx(idx)}
                  className={`w-8 h-8 rounded-full border-2 transition-all ${color.value.split(' ')[0]} ${colorIdx === idx ? 'border-slate-600 dark:border-white scale-110' : 'border-transparent hover:scale-105'}`} />
              ))}
            </div>
          </div>

          <div className="pt-4 flex gap-3">
            {existingEvent && (
              <button type="button" onClick={() => { onDelete(existingEvent.id); onClose(); }} className="flex-1 px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 font-medium rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors">삭제</button>
            )}
            <button type="submit" className={`flex-1 px-4 py-2 ${accentBg} text-white font-bold rounded-lg hover:brightness-110 transition-all shadow-lg`}>저장</button>
          </div>
        </form>
      </div>
    </div>
  );
};
export default EventModal;