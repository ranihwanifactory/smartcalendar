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
    <div className="h-screen w-screen bg-white flex overflow-hidden relative">
      
      {/* Main Content Area - Full Screen */}
      <main 
        className="flex-1 h-full flex flex-col relative z-10 transition-all duration-300 ease-in-out" 
        style={{ marginRight: isAIOpen ? '384px' : '0' }}
      >
        <Calendar 
          year={year}
          month={month}
          events={personalEvents}
          onMonthChange={handleMonthChange}
          onDayClick={handleDayClick}
          onEventClick={handleEventClick}
          headerRightContent={
            <button 
             onClick={() => setIsAIOpen(!isAIOpen)}
             className={`
               flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 rounded-lg text-sm font-semibold transition-all
               ${isAIOpen 
                 ? 'bg-slate-800 text-white shadow-md' 
                 : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'}
             `}
           >
             <span className="text-lg">✨</span>
             <span className="hidden sm:inline">AI 비서</span>
           </button>
          }
        />
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