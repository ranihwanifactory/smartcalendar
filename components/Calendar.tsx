import React, { useState, useMemo, useEffect } from 'react';
import { CalendarEvent, DayInfo, WeatherInfo, AppTheme } from '../types';
import { getHolidays, WEEKDAYS, MONTH_NAMES, ACCENT_COLORS } from '../constants';
import { getCurrentLocation, fetchWeatherForecast } from '../services/weatherService';

interface CalendarProps {
  year: number;
  month: number;
  events: CalendarEvent[];
  direction?: 'left' | 'right' | 'none';
  theme: AppTheme;
  onMonthChange: (increment: number) => void;
  onDayClick: (dateStr: string) => void;
  onEventClick: (event: CalendarEvent) => void;
  headerRightContent?: React.ReactNode;
}

const Calendar: React.FC<CalendarProps> = ({ 
  year, month, events, direction = 'none', theme, onMonthChange, onDayClick, onEventClick, headerRightContent
}) => {
  const [calendarDays, setCalendarDays] = useState<DayInfo[]>([]);
  const [weatherData, setWeatherData] = useState<Record<string, WeatherInfo>>({});
  const holidays = useMemo(() => getHolidays(year), [year]);

  useEffect(() => {
    const initWeather = async () => {
      try {
        const { lat, lon } = await getCurrentLocation();
        const forecast = await fetchWeatherForecast(lat, lon);
        setWeatherData(forecast);
      } catch (e) { console.log("Weather error:", e); }
    };
    initWeather();
  }, []);

  useEffect(() => {
    const getCalendarDays = (): DayInfo[] => {
      const firstDayOfMonth = new Date(year, month, 1);
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      const startDayOfWeek = firstDayOfMonth.getDay();
      const days: DayInfo[] = [];
      const prevMonthLastDate = new Date(year, month, 0).getDate();
      
      for (let i = startDayOfWeek - 1; i >= 0; i--) {
        const date = new Date(year, month - 1, prevMonthLastDate - i);
        days.push({ date, dateString: formatDate(date), isCurrentMonth: false, isToday: isSameDate(new Date(), date), events: [] });
      }
      for (let i = 1; i <= daysInMonth; i++) {
        const date = new Date(year, month, i);
        days.push({ date, dateString: formatDate(date), isCurrentMonth: true, isToday: isSameDate(new Date(), date), events: [] });
      }
      const remainingSlots = 42 - days.length;
      for (let i = 1; i <= remainingSlots; i++) {
        const date = new Date(year, month + 1, i);
        days.push({ date, dateString: formatDate(date), isCurrentMonth: false, isToday: isSameDate(new Date(), date), events: [] });
      }
      return days;
    };
    setCalendarDays(getCalendarDays());
  }, [year, month]);

  const formatDate = (date: Date): string => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

  const isSameDate = (d1: Date, d2: Date) => d1.toDateString() === d2.toDateString();

  const daysWithEvents = useMemo(() => {
    return calendarDays.map(day => {
      const holiday = holidays.find(h => h.startDate === day.dateString);
      const dayEvents = events.filter(e => day.dateString >= e.startDate && day.dateString <= e.endDate);
      const weather = weatherData[day.dateString];
      return { ...day, holiday, weather, events: dayEvents };
    });
  }, [calendarDays, events, holidays, weatherData]);

  const accentColorObj = ACCENT_COLORS.find(c => c.id === theme.accent);
  const accentText = accentColorObj?.text || 'text-indigo-600';
  const accentBg = accentColorObj?.bg || 'bg-indigo-600';

  const animationClass = direction === 'right' ? 'animate-slideInRight' : direction === 'left' ? 'animate-slideInLeft' : '';

  return (
    <div className="w-full h-full flex flex-col bg-white dark:bg-slate-950 overflow-hidden print-full transition-colors duration-300">
      <style>{`
        @keyframes slideInRight { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes slideInLeft { from { opacity: 0; transform: translateX(-20px); } to { opacity: 1; transform: translateX(0); } }
        .animate-slideInRight { animation: slideInRight 0.3s ease-out forwards; }
        .animate-slideInLeft { animation: slideInLeft 0.3s ease-out forwards; }
      `}</style>

      <div className="px-4 py-3 md:px-6 md:py-4 flex flex-col md:flex-row items-center justify-between bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 no-print gap-3 z-20 shadow-sm transition-colors">
        <div className="flex items-center justify-between w-full md:w-auto md:gap-6">
          <div key={`${year}-${month}`} className={animationClass}>
            <h1 className="text-xl md:text-3xl font-extrabold text-slate-900 dark:text-white flex items-baseline gap-2 md:gap-3 whitespace-nowrap">
              <span>{year}년</span>
              <span className={accentText}>{MONTH_NAMES[month]}</span>
            </h1>
          </div>
          <div className="flex gap-1 border border-slate-200 dark:border-slate-800 rounded-lg p-1 bg-slate-50 dark:bg-slate-900">
            <button onClick={() => onMonthChange(-1)} className="p-1.5 md:p-2 hover:bg-white dark:hover:bg-slate-800 rounded-md transition-all text-slate-600 dark:text-slate-400">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </button>
            <button onClick={() => onMonthChange(1)} className="p-1.5 md:p-2 hover:bg-white dark:hover:bg-slate-800 rounded-md transition-all text-slate-600 dark:text-slate-400">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>
        </div>
        <div className="w-full md:w-auto flex justify-end">{headerRightContent}</div>
      </div>
      
      <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 z-10 transition-colors">
        {WEEKDAYS.map((day, idx) => (
          <div key={day} className={`py-2 md:py-3 text-center text-xs md:text-sm font-semibold ${idx === 0 ? 'text-red-500' : idx === 6 ? 'text-blue-500' : 'text-slate-500 dark:text-slate-400'}`}>{day}</div>
        ))}
      </div>

      <div key={`${year}-${month}`} className={`flex-1 bg-slate-100/50 dark:bg-slate-900/20 overflow-hidden ${animationClass}`}>
        <div className="grid grid-cols-7 grid-rows-6 h-full">
          {daysWithEvents.map((day, idx) => {
            const isRedDay = day.date.getDay() === 0 || day.holiday;
            return (
              <div 
                key={day.dateString + idx}
                onClick={() => onDayClick(day.dateString)}
                className={`p-1 md:p-2 border-b border-r border-slate-200 dark:border-slate-800 cursor-pointer transition-colors relative group
                  ${!day.isCurrentMonth ? 'bg-slate-50 dark:bg-slate-950/50 text-slate-300 dark:text-slate-700' : 'bg-white dark:bg-slate-950 hover:bg-blue-50/30 dark:hover:bg-slate-900'}
                  ${day.isToday ? 'bg-blue-50/50 dark:bg-slate-900/50' : ''}`}
              >
                <div className="flex flex-col sm:flex-row justify-between items-start mb-1 gap-0.5">
                  <span className={`text-xs md:text-sm font-medium w-6 h-6 md:w-7 md:h-7 flex items-center justify-center rounded-full transition-all
                    ${day.isToday ? `${accentBg} text-white shadow-md` : ''}
                    ${!day.isToday && isRedDay ? 'text-red-500' : ''}
                    ${!day.isToday && day.date.getDay() === 6 && !day.holiday ? 'text-blue-500' : ''}
                    ${!day.isToday && !isRedDay && day.date.getDay() !== 6 ? 'text-slate-700 dark:text-slate-300' : ''}
                  `}>{day.date.getDate()}</span>
                  
                  <div className="flex flex-col items-start sm:items-end w-full sm:w-auto gap-0.5 overflow-hidden">
                    {day.holiday && <span className="text-[9px] sm:text-xs font-medium text-red-500 truncate bg-red-50 dark:bg-red-900/20 px-1 rounded leading-tight">{day.holiday.title}</span>}
                    {day.weather && <div className="flex items-center gap-0.5 text-[9px] text-slate-500"><span>{day.weather.icon}</span><span className="hidden md:inline">{Math.round(day.weather.maxTemp)}°</span></div>}
                  </div>
                </div>

                <div className="space-y-0.5 md:space-y-1 overflow-y-auto max-h-[calc(100%-28px)] no-scrollbar">
                  {day.events.map(event => {
                    const isRange = event.startDate !== event.endDate;
                    const isStart = day.dateString === event.startDate;
                    const isEnd = day.dateString === event.endDate;
                    return (
                      <div key={event.id} onClick={(e) => { e.stopPropagation(); onEventClick(event); }}
                        className={`text-[9px] md:text-[10px] lg:text-xs px-1 md:px-2 py-0.5 md:py-1 rounded-md border truncate font-medium flex items-center gap-1 transition-all hover:brightness-95
                          ${event.completed ? 'opacity-40 line-through' : ''}
                          ${event.color || 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'}
                          ${isRange ? 'rounded-none border-x-0' : ''}
                          ${isStart ? 'rounded-l-md border-l' : ''}
                          ${isEnd ? 'rounded-r-md border-r' : ''}`}>
                        {isStart && (event.completed ? '✓' : '•')}
                        <span>{isStart || day.date.getDay() === 0 ? event.title : ''}</span>
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