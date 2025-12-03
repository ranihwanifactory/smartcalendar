import React, { useState, useMemo, useEffect } from 'react';
import { CalendarEvent, DayInfo, WeatherInfo } from '../types';
import { getHolidays, WEEKDAYS, MONTH_NAMES } from '../constants';
import { getCurrentLocation, fetchWeatherForecast } from '../services/weatherService';

interface CalendarProps {
  year: number;
  month: number; // 0-11
  events: CalendarEvent[];
  onMonthChange: (increment: number) => void;
  onDayClick: (dateStr: string) => void;
  onEventClick: (event: CalendarEvent) => void;
  headerRightContent?: React.ReactNode;
}

const Calendar: React.FC<CalendarProps> = ({ 
  year, month, events, onMonthChange, onDayClick, onEventClick, headerRightContent
}) => {
  const [calendarDays, setCalendarDays] = useState<DayInfo[]>([]);
  const [weatherData, setWeatherData] = useState<Record<string, WeatherInfo>>({});
  const holidays = useMemo(() => getHolidays(year), [year]);

  // Fetch Weather on Mount
  useEffect(() => {
    const initWeather = async () => {
      try {
        const { lat, lon } = await getCurrentLocation();
        const forecast = await fetchWeatherForecast(lat, lon);
        setWeatherData(forecast);
      } catch (e) {
        console.log("Weather location permission denied or error:", e);
      }
    };
    initWeather();
  }, []);

  useEffect(() => {
    const getCalendarDays = (): DayInfo[] => {
      const firstDayOfMonth = new Date(year, month, 1);
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      const startDayOfWeek = firstDayOfMonth.getDay(); // 0(Sun) - 6(Sat)
      
      const days: DayInfo[] = [];

      // Previous month padding
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

      // Current month
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

      // Next month padding to fill 6 rows (42 days total) usually covers all months
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
      const holiday = holidays.find(h => h.date === day.dateString);
      // Find personal events
      const dayEvents = events.filter(e => e.date === day.dateString);
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

  return (
    <div className="w-full h-full flex flex-col bg-white overflow-hidden print-full">
      {/* Header */}
      <div className="px-6 py-4 flex items-center justify-between bg-white border-b border-slate-200 no-print">
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 flex items-baseline gap-3">
          <span>{year}년</span>
          <span className="text-indigo-600">{MONTH_NAMES[month]}</span>
        </h1>
        
        <div className="flex items-center gap-4">
          {headerRightContent && (
            <div className="hidden md:block">
              {headerRightContent}
            </div>
          )}
          
          <div className="flex gap-1 border border-slate-200 rounded-lg p-1 bg-slate-50">
            <button 
              onClick={() => onMonthChange(-1)} 
              className="p-1.5 hover:bg-white hover:shadow-sm rounded-md transition-all text-slate-600"
              aria-label="Previous Month"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button 
              onClick={() => onMonthChange(1)} 
              className="p-1.5 hover:bg-white hover:shadow-sm rounded-md transition-all text-slate-600"
              aria-label="Next Month"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Mobile AI Button (If passed) */}
          {headerRightContent && (
            <div className="md:hidden">
              {headerRightContent}
            </div>
          )}
        </div>
      </div>
      
      {/* Print Header (Only visible when printing) */}
      <div className="hidden print:flex px-4 py-2 justify-center items-center border-b border-slate-300">
        <h1 className="text-3xl font-extrabold text-slate-900">
          {year}년 {MONTH_NAMES[month]}
        </h1>
      </div>

      {/* Weekday Headers */}
      <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50">
        {WEEKDAYS.map((day, idx) => (
          <div 
            key={day} 
            className={`py-3 text-center text-sm font-semibold ${
              idx === 0 ? 'text-red-500' : idx === 6 ? 'text-blue-500' : 'text-slate-500'
            }`}
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 grid-rows-6 flex-1 bg-slate-100/50 print:bg-white">
        {daysWithEvents.map((day, idx) => {
          const isSunday = day.date.getDay() === 0;
          const isSaturday = day.date.getDay() === 6;
          const isRedDay = isSunday || day.holiday;
          
          return (
            <div 
              key={day.dateString + idx}
              onClick={() => onDayClick(day.dateString)}
              className={`
                p-2 border-b border-r border-slate-200 cursor-pointer transition-colors relative group print:border-slate-300
                ${!day.isCurrentMonth ? 'bg-slate-50 text-slate-300 print:bg-transparent' : 'bg-white hover:bg-blue-50/30'}
                ${day.isToday ? 'bg-blue-50/50 print:bg-transparent' : ''}
              `}
            >
              {/* Date Header Row (Number + Holiday + Weather) */}
              <div className="flex justify-between items-start mb-1">
                <span className={`
                  text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full
                  ${day.isToday ? 'bg-blue-600 text-white shadow-md shadow-blue-200 print:bg-transparent print:text-black print:shadow-none print:border print:border-black' : ''}
                  ${!day.isToday && isRedDay ? 'text-red-500' : ''}
                  ${!day.isToday && isSaturday && !day.holiday ? 'text-blue-500' : ''}
                  ${!day.isToday && !isRedDay && !isSaturday ? 'text-slate-700' : ''}
                  ${!day.isCurrentMonth ? 'opacity-50' : ''}
                `}>
                  {day.date.getDate()}
                </span>
                
                <div className="flex flex-col items-end gap-0.5 max-w-[70%]">
                  {/* Holiday Label */}
                  {day.holiday && (
                     <span className="text-[10px] sm:text-xs font-medium text-red-500 truncate text-right bg-red-50 px-1.5 py-0.5 rounded print:bg-transparent print:p-0">
                       {day.holiday.title}
                     </span>
                  )}
                  {/* Weather Info (Only if available) */}
                  {day.weather && (
                    <div className="flex items-center gap-1 text-[10px] sm:text-xs text-slate-600 bg-white/50 rounded px-1" title={`${day.weather.minTemp}°C / ${day.weather.maxTemp}°C`}>
                      <span>{day.weather.icon}</span>
                      <span className="font-medium hidden sm:inline">
                        {Math.round(day.weather.maxTemp)}°
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Events List */}
              <div className="mt-1 space-y-1 overflow-y-auto max-h-[calc(100%-32px)] no-scrollbar print:max-h-none print:overflow-visible">
                {day.events.map(event => (
                  <div 
                    key={event.id}
                    onClick={(e) => { e.stopPropagation(); onEventClick(event); }}
                    className={`
                      text-[10px] sm:text-xs px-2 py-1 rounded-md border truncate font-medium
                      transition-all hover:scale-[1.02] active:scale-95 shadow-sm
                      ${event.color || 'bg-slate-100 text-slate-700 border-slate-200'}
                      print:bg-transparent print:border-0 print:px-0 print:text-black print:shadow-none
                    `}
                  >
                    • {event.title}
                  </div>
                ))}
              </div>
              
              {/* Add Button Indicator on Hover */}
              <div className="hidden md:flex absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity no-print">
                <div className="w-6 h-6 bg-slate-100 rounded-full flex items-center justify-center text-slate-400">
                  +
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Calendar;