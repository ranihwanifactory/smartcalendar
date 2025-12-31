import React, { useState, useEffect } from 'react';
import { CalendarEvent } from '../types';
import { EVENT_COLORS } from '../constants';

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (event: CalendarEvent) => void;
  onDelete: (id: string) => void;
  selectedDate: string;
  existingEvent?: CalendarEvent;
}

const EventModal: React.FC<EventModalProps> = ({ 
  isOpen, onClose, onSave, onDelete, selectedDate, existingEvent 
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [colorIdx, setColorIdx] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [excludeSaturday, setExcludeSaturday] = useState(false);
  const [excludeSunday, setExcludeSunday] = useState(false);

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
        setExcludeSaturday(existingEvent.excludeSaturday || false);
        setExcludeSunday(existingEvent.excludeSunday || false);
      } else {
        setTitle('');
        setDescription('');
        setStartDate(selectedDate);
        setEndDate(selectedDate);
        setColorIdx(0);
        setCompleted(false);
        setExcludeSaturday(false);
        setExcludeSunday(false);
      }
    }
  }, [isOpen, existingEvent, selectedDate]);

  if (!isOpen) return null;

  const isRange = startDate !== endDate;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    if (new Date(startDate) > new Date(endDate)) {
      alert('종료일은 시작일보다 빠를 수 없습니다.');
      return;
    }

    onSave({
      id: existingEvent ? existingEvent.id : Date.now().toString(),
      startDate,
      endDate,
      title,
      description,
      type: 'personal',
      color: EVENT_COLORS[colorIdx].value,
      completed: completed,
      excludeSaturday: isRange ? excludeSaturday : false,
      excludeSunday: isRange ? excludeSunday : false,
    });
    onClose();
  };

  const handleShareEvent = async () => {
    const statusText = completed ? '[완료]' : '[진행중]';
    let exclusionText = '';
    if (excludeSaturday && excludeSunday) exclusionText = ' (주말 제외)';
    else if (excludeSaturday) exclusionText = ' (토요일 제외)';
    else if (excludeSunday) exclusionText = ' (일요일 제외)';

    const dateRange = startDate === endDate ? startDate : `${startDate} ~ ${endDate}${exclusionText}`;
    const text = `${statusText} 일정 안내\n기간: ${dateRange}\n제목: ${title}${description ? `\n설명: ${description}` : ''}\n\n2026 스마트 달력에서 확인하세요!`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `일정 공유: ${title}`,
          text: text,
          url: window.location.href
        });
      } catch (err) {
        console.log('Error sharing', err);
      }
    } else {
      try {
        await navigator.clipboard.writeText(text);
        alert('일정 내용이 클립보드에 복사되었습니다.');
      } catch (err) {
        alert('공유 기능을 지원하지 않는 브라우저입니다.');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all scale-100">
        <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex justify-between items-center">
          <h3 className="text-lg font-bold text-slate-800">
            {existingEvent ? '일정 수정' : '새 일정 추가'}
          </h3>
          <div className="flex items-center gap-2">
            {existingEvent && (
              <button 
                type="button" 
                onClick={handleShareEvent}
                className="p-2 text-slate-500 hover:text-blue-600 transition-colors"
                title="일정 공유"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
              </button>
            )}
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">시작일</label>
              <input 
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">종료일</label>
              <input 
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          {isRange && (
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-3">
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-slate-700">특정 요일 제외 설정</span>
                <span className="text-xs text-slate-500">선택한 요일은 달력 일정에서 나타나지 않습니다.</span>
              </div>
              <div className="flex gap-4">
                <label className="flex-1 flex items-center justify-between p-2 bg-white rounded-lg border border-slate-200 cursor-pointer hover:border-blue-300 transition-colors">
                  <span className={`text-xs font-bold ${excludeSaturday ? 'text-blue-600' : 'text-slate-400'}`}>토요일 제외</span>
                  <input 
                    type="checkbox" 
                    checked={excludeSaturday}
                    onChange={(e) => setExcludeSaturday(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
                  />
                </label>
                <label className="flex-1 flex items-center justify-between p-2 bg-white rounded-lg border border-slate-200 cursor-pointer hover:border-red-300 transition-colors">
                  <span className={`text-xs font-bold ${excludeSunday ? 'text-red-600' : 'text-slate-400'}`}>일요일 제외</span>
                  <input 
                    type="checkbox" 
                    checked={excludeSunday}
                    onChange={(e) => setExcludeSunday(e.target.checked)}
                    className="w-4 h-4 text-red-600 rounded border-slate-300 focus:ring-red-500 cursor-pointer"
                  />
                </label>
              </div>
            </div>
          )}

          <div className="flex justify-end pt-1">
            {existingEvent && (
              <label className="flex items-center gap-2 cursor-pointer group">
                <div className="relative">
                  <input 
                    type="checkbox" 
                    checked={completed}
                    onChange={(e) => setCompleted(e.target.checked)}
                    className="sr-only"
                  />
                  <div className={`w-10 h-5 rounded-full transition-colors ${completed ? 'bg-green-500' : 'bg-slate-300'}`}></div>
                  <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${completed ? 'translate-x-5' : 'translate-x-0'}`}></div>
                </div>
                <span className={`text-sm font-medium ${completed ? 'text-green-600' : 'text-slate-500'}`}>
                  {completed ? '완료됨' : '진행중'}
                </span>
              </label>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">제목</label>
            <input 
              type="text" 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              placeholder="일정 제목을 입력하세요"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">설명 (선택)</label>
            <textarea 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-none"
              rows={3}
              placeholder="상세 내용을 입력하세요"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">색상 태그</label>
            <div className="flex gap-2 flex-wrap">
              {EVENT_COLORS.map((color, idx) => (
                <button
                  key={color.name}
                  type="button"
                  onClick={() => setColorIdx(idx)}
                  className={`w-8 h-8 rounded-full border-2 transition-all ${color.value.split(' ')[0]} ${
                    colorIdx === idx ? 'border-slate-600 scale-110' : 'border-transparent hover:scale-105'
                  }`}
                  aria-label={color.name}
                />
              ))}
            </div>
          </div>

          <div className="pt-4 flex gap-3">
            {existingEvent && (
              <button 
                type="button"
                onClick={() => { onDelete(existingEvent.id); onClose(); }}
                className="flex-1 px-4 py-2 bg-red-50 text-red-600 font-medium rounded-lg hover:bg-red-100 transition-colors"
              >
                삭제
              </button>
            )}
            <button 
              type="submit"
              className={`flex-1 px-4 py-2 bg-slate-900 text-white font-bold rounded-lg hover:bg-slate-800 transition-all shadow-lg shadow-slate-200 ${!existingEvent ? 'w-full' : ''}`}
            >
              저장
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EventModal;