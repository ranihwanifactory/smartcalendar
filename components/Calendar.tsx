import React, { useState, useMemo, useEffect } from 'react';
import { CalendarEvent, DayInfo, WeatherInfo } from '../types';
import { getHolidays, WEEKDAYS, MONTH_NAMES } from '../constants';

interface CalendarProps {
  year: number;
  month: number; // 0-11
  events: CalendarEvent[];
  weatherData: Record<string, WeatherInfo>;
  direction?: 'left' | 'right' | 'none'; 
  onMonthChange: (increment: number) => void;
  onDayClick: (dateStr: string) => void;
  onEventClick: (event: CalendarEvent) => void;
  headerRightContent?: React.ReactNode;
}

const Calendar: React.FC<CalendarProps> = ({ 
  year, month, events, weatherData, direction = 'none', onMonthChange, onDayClick, onEventClick, headerRightContent
}) => {
  const [calendarDays, setCalendarDays] = useState<DayInfo[]>([]);
  const holidays = useMemo(() => getHolidays(year), [year]);

  useEffect(() => {
    const getCalendarDays = (): DayInfo[] => {
      const firstDayOfMonth = new Date(year, month, 1);
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      const startDayOfWeek = firstDayOfMonth.getDay();
      
      const days: DayInfo[] = [];
      const prevMonthLastDate = new Date(year, month, 0).getDate();
      for (let i = startDayOfWeek - 1; i >= 0; i--) {
        const date = new Date(year, month - 1, prevMonthLastDate - i);
        days.push({
          date: date,
          dateString: formatDate(date),
          isCurrentMonth: false,
          isToday: isSameDate(new Date(), date),
          events: [],
        });
      }

      for (let i = 1; i <= daysInMonth; i++) {
        const date = new Date(year, month, i);
        days.push({
          date: date,
          dateString: formatDate(date),
          isCurrentMonth: true,
          isToday: isSameDate(new Date(), date),
          events: [],
        });
      }

      const remainingSlots = 42 - days.length;
      for (let i = 1; i <= remainingSlots; i++) {
        const date = new Date(year, month + 1, i);
        days.push({
          date: date,
          dateString: formatDate(date),
          isCurrentMonth: false,
          isToday: isSameDate(new Date(), date),
          events: [],
        });
      }

      return days;
    };

    setCalendarDays(getCalendarDays());
  }, [year, month]);

  const formatDate = (date: Date): string => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const isSameDate = (d1: Date, d2: Date) => {
    return d1.getFullYear() === d2.getFullYear() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getDate() === d2.getDate();
  };

  const daysWithEvents = useMemo(() => {
    return calendarDays.map(day => {
      // Find holiday
      const holiday = holidays.find(h => h.startDate === day.dateString);
      
      // Find personal events that occur on this day
      const dayEvents = events.filter(e => {
        const withinRange = day.dateString >= e.startDate && day.dateString <= e.endDate;
        if (!withinRange) return false;
        
        // If excludeWeekends is true, hide on SAT(6) and SUN(0)
        if (e.excludeWeekends) {
          const dayOfWeek = day.date.getDay();
          return dayOfWeek !== 0 && dayOfWeek !== 6;
        }
        
        return true;
      });
      
      // Find weather
      const weather = weatherData[day.dateString];
      
      return {
        ...day,
        holiday,
        weather,
        events: dayEvents
      };
    });
  }, [calendarDays, events, holidays, weatherData]);

  const animationClass = 
    direction === 'right' ? 'animate-slideInRight' :
    direction === 'left' ? 'animate-slideInLeft' : '';

  return (
    <div className="w-full h-full flex flex-col bg-white overflow-hidden print-full">
      <style>{`
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes slideInLeft {
          from { opacity: 0; transform: translateX(-20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        .animate-slideInRight {
          animation: slideInRight 0.3s ease-out forwards;
        }
        .animate-slideInLeft {
          animation: slideInLeft 0.3s ease-out forwards;
        }
        @media print {
          .print-title {
            display: block !important;
          }
        }
      `}</style>

      {/* Print-only Title Header */}
      <div className="hidden print-title w-full text-center py-6 border-b-2 border-slate-300 mb-2">
        <h1 className="text-4xl font-black text-black tracking-tight">
          {year}년 {MONTH_NAMES[month]}
        </h1>
      </div>

      {/* Screen Header (Hidden on Print) */}
      <div className="px-4 py-3 md:px-6 md:py-4 flex flex-col md:flex-row items-center justify-between bg-white border-b border-slate-200 no-print gap-3 md:gap-0 z-20 shadow-sm">
        <div className="flex items-center justify-between w-full md:w-auto md:gap-6">
          <div key={`${year}-${month}`} className={animationClass}>
            <h1 className="text-xl md:text-3xl font-extrabold text-slate-900 flex items-baseline gap-2 md:gap-3 whitespace-nowrap">
              <span>{year}년</span>
              <span className="text-indigo-600">{MONTH_NAMES[month]}</span>
            </h1>
          </div>

          <div className="flex gap-1 border border-slate-200 rounded-lg p-1 bg-slate-50">
            <button onClick={() => onMonthChange(-1)} className="p-1.5 md:p-2 hover:bg-white hover:shadow-sm rounded-md transition-all text-slate-600">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button onClick={() => onMonthChange(1)} className="p-1.5 md:p-2 hover:bg-white hover:shadow-sm rounded-md transition-all text-slate-600">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
        
        <div className="w-full md:w-auto flex justify-end">
          {headerRightContent}
        </div>
      </div>
      
      {/* Weekday Headers */}
      <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50 z-10">
        {WEEKDAYS.map((day, idx) => (
          <div key={day} className={`py-2 md:py-3 text-center text-xs md:text-sm font-semibold ${idx === 0 ? 'text-red-500' : idx === 6 ? 'text-blue-500' : 'text-slate-500'}`}>
            {day}
          </div>
        ))}
      </div>

      {/* Grid */}
      <div key={`${year}-${month}`} className={`flex-1 bg-slate-100/50 overflow-hidden ${animationClass}`}>
        <div className="grid grid-cols-7 grid-rows-6 h-full">
          {daysWithEvents.map((day, idx) => {
            const isRedDay = day.date.getDay() === 0 || day.holiday;
            
            return (
              <div 
                key={day.dateString + idx}
                onClick={() => onDayClick(day.dateString)}
                className={`p-1 md:p-2 border-b border-r border-slate-200 cursor-pointer transition-colors relative group
                  ${!day.isCurrentMonth ? 'bg-slate-50 text-slate-300' : 'bg-white hover:bg-blue-50/30'}
                  ${day.isToday ? 'bg-blue-50/50' : ''}`}
              >
                <div className="flex flex-col sm:flex-row justify-between items-start mb-1 gap-0.5">
                  <span className={`text-xs md:text-sm font-medium w-6 h-6 md:w-7 md:h-7 flex items-center justify-center rounded-full flex-shrink-0
                    ${day.isToday ? 'bg-blue-600 text-white shadow-md' : ''}
                    ${!day.isToday && isRedDay ? 'text-red-500' : ''}
                    ${!day.isToday && day.date.getDay() === 6 && !day.holiday ? 'text-blue-500' : ''}
                    ${!day.isToday && !isRedDay && day.date.getDay() !== 6 ? 'text-slate-700' : ''}
                  `}>
                    {day.date.getDate()}
                  </span>
                  
                  <div className="flex flex-col items-start sm:items-end w-full sm:w-auto gap-0.5 overflow-hidden">
                    {day.holiday && (
                       <span className="text-[10px] sm:text-xs font-medium text-red-500 truncate bg-red-50 px-1 rounded leading-tight">
                         {day.holiday.title}
                       </span>
                    )}
                    {day.weather && (
                      <div className="flex items-center gap-0.5 text-[10px] text-slate-600">
                        <span>{day.weather.icon}</span>
                        <span className="font-medium hidden md:inline">{Math.round(day.weather.maxTemp)}°</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-0.5 md:space-y-1 overflow-y-auto max-h-[calc(100%-28px)] no-scrollbar">
                  {day.events.map(event => {
                    const isRange = event.startDate !== event.endDate;
                    const isStart = day.dateString === event.startDate;
                    const isEnd = day.dateString === event.endDate;
                    
                    return (
                      <div 
                        key={`${day.dateString}-${event.id}`}
                        onClick={(e) => { e.stopPropagation(); onEventClick(event); }}
                        className={`text-[9px] md:text-[10px] lg:text-xs px-1 md:px-2 py-0.5 md:py-1 rounded-md border truncate font-medium flex items-center gap-1 transition-all hover:scale-[1.02] shadow-sm
                          ${event.completed ? 'opacity-60 grayscale-[0.5]' : ''}
                          ${event.color || 'bg-slate-100 text-slate-700 border-slate-200'}
                          ${isRange ? 'rounded-none border-x-0' : ''}
                          ${isStart ? 'rounded-l-md border-l' : ''}
                          ${isEnd ? 'rounded-r-md border-r' : ''}
                        `}
                      >
                        {isStart && (event.completed ? '✓' : '•')}
                        <span className={event.completed ? 'line-through' : ''}>
                          {event.title}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Calendar;