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
  const [colorIdx, setColorIdx] = useState(0);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (existingEvent) {
        setTitle(existingEvent.title);
        setDescription(existingEvent.description || '');
        const idx = EVENT_COLORS.findIndex(c => c.value === existingEvent.color);
        setColorIdx(idx >= 0 ? idx : 0);
        setCompleted(existingEvent.completed || false);
      } else {
        setTitle('');
        setDescription('');
        setColorIdx(0);
        setCompleted(false);
      }
    }
  }, [isOpen, existingEvent]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onSave({
      id: existingEvent ? existingEvent.id : Date.now().toString(),
      date: selectedDate,
      title,
      description,
      type: 'personal',
      color: EVENT_COLORS[colorIdx].value,
      completed: completed,
    });
    onClose();
  };

  const handleShareEvent = async () => {
    const statusText = completed ? '[완료]' : '[진행중]';
    const text = `${statusText} 일정 안내\n날짜: ${selectedDate}\n제목: ${title}${description ? `\n설명: ${description}` : ''}\n\n2026 스마트 달력에서 확인하세요!`;
    
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
          <div className="flex justify-between items-end">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">날짜</label>
              <div className="text-slate-900 font-semibold">{selectedDate}</div>
            </div>
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