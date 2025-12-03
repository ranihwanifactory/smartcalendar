import React, { useState, useEffect } from 'react';
import Calendar from './components/Calendar';
import EventModal from './components/EventModal';
import AIAssistant from './components/AIAssistant';
import { CalendarEvent } from './types';
import { MONTH_NAMES } from './constants';

const App: React.FC = () => {
  // State for Calendar Navigation (Default to Jan 2026)
  const [year, setYear] = useState(2026);
  const [month, setMonth] = useState(0); // Jan is 0
  
  // State for Events
  const [personalEvents, setPersonalEvents] = useState<CalendarEvent[]>([]);
  
  // State for UI
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAIOpen, setIsAIOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | undefined>(undefined);

  // Load events from LocalStorage
  useEffect(() => {
    const saved = localStorage.getItem('calendar_events_2026');
    if (saved) {
      try {
        setPersonalEvents(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load events", e);
      }
    }
  }, []);

  // Save events to LocalStorage
  useEffect(() => {
    localStorage.setItem('calendar_events_2026', JSON.stringify(personalEvents));
  }, [personalEvents]);

  const handleMonthChange = (increment: number) => {
    let newMonth = month + increment;
    let newYear = year;

    if (newMonth > 11) {
      newMonth = 0;
      newYear += 1;
    } else if (newMonth < 0) {
      newMonth = 11;
      newYear -= 1;
    }

    setMonth(newMonth);
    setYear(newYear);
  };

  const handleDayClick = (dateStr: string) => {
    setSelectedDate(dateStr);
    setEditingEvent(undefined);
    setIsModalOpen(true);
  };

  const handleEventClick = (event: CalendarEvent) => {
    setSelectedDate(event.date);
    setEditingEvent(event);
    setIsModalOpen(true);
  };

  const saveEvent = (event: CalendarEvent) => {
    setPersonalEvents(prev => {
      const others = prev.filter(e => e.id !== event.id);
      return [...others, event];
    });
  };

  const deleteEvent = (id: string) => {
    setPersonalEvents(prev => prev.filter(e => e.id !== id));
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row text-slate-900 font-sans">
      
      {/* Main Content Area */}
      <main className="flex-1 p-4 md:p-8 h-screen overflow-hidden flex flex-col relative z-10 transition-all duration-300 ease-in-out" style={{ marginRight: isAIOpen ? '384px' : '0' }}>
        
        {/* Top Bar */}
        <div className="flex justify-between items-center mb-6">
           <div>
             <h2 className="text-xl font-medium text-slate-500">Welcome back</h2>
             <p className="text-sm text-slate-400">2026년 일정을 계획해보세요</p>
           </div>
           
           <button 
             onClick={() => setIsAIOpen(!isAIOpen)}
             className={`
               flex items-center gap-2 px-5 py-2.5 rounded-full font-semibold shadow-lg transition-all
               ${isAIOpen 
                 ? 'bg-slate-800 text-white ring-2 ring-indigo-500 ring-offset-2' 
                 : 'bg-white text-slate-700 hover:bg-slate-50 ring-1 ring-slate-200'}
             `}
           >
             <span className="text-xl">✨</span>
             <span>AI 비서 {isAIOpen ? '닫기' : '열기'}</span>
           </button>
        </div>

        {/* Calendar Container */}
        <div className="flex-1 overflow-hidden relative">
          <Calendar 
            year={year}
            month={month}
            events={personalEvents}
            onMonthChange={handleMonthChange}
            onDayClick={handleDayClick}
            onEventClick={handleEventClick}
          />
        </div>
      </main>

      {/* AI Sidebar */}
      <AIAssistant 
        currentDateContext={`${year}년 ${MONTH_NAMES[month]}`}
        isOpen={isAIOpen}
        onClose={() => setIsAIOpen(false)}
      />

      {/* Event Modal */}
      <EventModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        selectedDate={selectedDate}
        onSave={saveEvent}
        onDelete={deleteEvent}
        existingEvent={editingEvent}
      />
    </div>
  );
};

export default App;