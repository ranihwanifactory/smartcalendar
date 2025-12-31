import React, { useState, useEffect, useMemo, useRef } from 'react';
import Calendar from './components/Calendar';
import EventModal from './components/EventModal';
import DayDetailModal from './components/DayDetailModal';
import AIAssistant from './components/AIAssistant';
import AuthModal from './components/AuthModal';
import { CalendarEvent, WeatherInfo, AppTheme, ThemeMode, AccentColor } from './types';
import { MONTH_NAMES, getHolidays, ACCENT_COLORS } from './constants';
import { auth, db } from './firebase';
import { onAuthStateChanged, User, signOut } from 'firebase/auth';
import { collection, query, where, onSnapshot, addDoc, deleteDoc, updateDoc, doc } from 'firebase/firestore';
import { getCurrentLocation, fetchWeatherForecast } from './services/weatherService';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth());
  const [direction, setDirection] = useState<'left' | 'right' | 'none'>('none');
  const [personalEvents, setPersonalEvents] = useState<CalendarEvent[]>([]);
  const [weatherData, setWeatherData] = useState<Record<string, WeatherInfo>>({});
  
  // Theme State
  const [theme, setTheme] = useState<AppTheme>(() => {
    const saved = localStorage.getItem('app-theme');
    return saved ? JSON.parse(saved) : { mode: 'light', accent: 'indigo' };
  });
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false);
  const themeMenuRef = useRef<HTMLDivElement>(null);

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isAIOpen, setIsAIOpen] = useState(false);
  
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | undefined>(undefined);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');

  const holidays = useMemo(() => getHolidays(year), [year]);

  // Handle Theme Persistence and Application
  useEffect(() => {
    localStorage.setItem('app-theme', JSON.stringify(theme));
    if (theme.mode === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    // Update body background to match theme
    document.body.className = theme.mode === 'dark' ? 'bg-slate-950' : 'bg-slate-50';
  }, [theme]);

  // Click outside theme menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (themeMenuRef.current && !themeMenuRef.current.contains(event.target as Node)) {
        setIsThemeMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
    }
    const initWeather = async () => {
      try {
        const { lat, lon } = await getCurrentLocation();
        const forecast = await fetchWeatherForecast(lat, lon);
        setWeatherData(forecast);
      } catch (e) {
        console.log("Weather error:", e);
      }
    };
    initWeather();
  }, []);

  useEffect(() => {
    if (!user) {
      setPersonalEvents([]);
      return;
    }
    const q = query(collection(db, 'events'), where('userId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const eventsData: CalendarEvent[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as CalendarEvent));
      setPersonalEvents(eventsData);
      checkAndNotifyUpcomingEvents(eventsData);
    });
    return () => unsubscribe();
  }, [user]);

  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) return;
    const permission = await Notification.requestPermission();
    setNotificationPermission(permission);
  };

  const checkAndNotifyUpcomingEvents = (events: CalendarEvent[]) => {
    if (Notification.permission !== 'granted') return;
    const tomorrowStr = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    const storageKey = `notified_for_${tomorrowStr}`;
    if (localStorage.getItem(storageKey) === 'true') return;
    const upcomingEvents = events.filter(e => e.startDate === tomorrowStr);
    if (upcomingEvents.length > 0) {
      new Notification('내일 시작되는 일정 알림', {
        body: upcomingEvents.map(e => `- ${e.title}`).join('\n'),
        icon: 'https://cdn-icons-png.flaticon.com/512/10691/10691802.png',
      });
      localStorage.setItem(storageKey, 'true');
    }
  };

  const handleMonthChange = (increment: number) => {
    let newMonth = month + increment;
    let newYear = year;
    if (newMonth > 11) { newMonth = 0; newYear += 1; }
    else if (newMonth < 0) { newMonth = 11; newYear -= 1; }
    setDirection(increment > 0 ? 'right' : 'left');
    setMonth(newMonth);
    setYear(newYear);
  };

  const handleDayClick = (dateStr: string) => {
    if (!user) { setIsAuthModalOpen(true); return; }
    setSelectedDate(dateStr);
    setIsDetailModalOpen(true);
  };

  const handleEditEvent = (event: CalendarEvent) => {
    setEditingEvent(event);
    setSelectedDate(event.startDate);
    setIsDetailModalOpen(false);
    setIsModalOpen(true);
  };

  const handleAddEventInDetail = () => {
    setEditingEvent(undefined);
    setIsDetailModalOpen(false);
    setIsModalOpen(true);
  };

  const saveEvent = async (event: CalendarEvent) => {
    if (!user) return;
    try {
      if (editingEvent) {
        await updateDoc(doc(db, 'events', event.id), { ...event });
      } else {
        const { id, ...eventData } = event;
        await addDoc(collection(db, 'events'), { ...eventData, userId: user.uid });
      }
    } catch (e) { console.error("Save error:", e); }
  };

  const dayEvents = useMemo(() => personalEvents.filter(e => selectedDate >= e.startDate && selectedDate <= e.endDate), [personalEvents, selectedDate]);
  const dayHoliday = useMemo(() => holidays.find(h => h.startDate === selectedDate), [holidays, selectedDate]);

  const toggleThemeMode = () => {
    setTheme(prev => ({ ...prev, mode: prev.mode === 'light' ? 'dark' : 'light' }));
  };

  const changeAccent = (accent: AccentColor) => {
    setTheme(prev => ({ ...prev, accent }));
  };

  // Dynamic classes based on accent
  const accentBg = ACCENT_COLORS.find(c => c.id === theme.accent)?.bg || 'bg-indigo-600';
  const accentText = ACCENT_COLORS.find(c => c.id === theme.accent)?.text || 'text-indigo-600';
  const accentBorder = ACCENT_COLORS.find(c => c.id === theme.accent)?.border || 'border-indigo-600';

  if (isAuthLoading) return <div className="h-screen w-screen flex items-center justify-center bg-white dark:bg-slate-950 text-slate-400 font-medium">달력을 불러오는 중...</div>;

  return (
    <div className={`h-screen w-screen flex overflow-hidden relative transition-colors duration-300 ${theme.mode === 'dark' ? 'dark' : ''}`}>
      <main className={`flex-1 h-full flex flex-col relative z-10 transition-all duration-300 ${isAIOpen ? 'md:mr-96' : ''}`}>
        <Calendar 
          year={year} 
          month={month} 
          events={personalEvents} 
          direction={direction}
          theme={theme}
          onMonthChange={handleMonthChange}
          onDayClick={handleDayClick}
          onEventClick={handleEditEvent}
          headerRightContent={
            <div className="flex items-center gap-2 no-print">
               {/* Theme Settings */}
               <div className="relative" ref={themeMenuRef}>
                 <button 
                   onClick={() => setIsThemeMenuOpen(!isThemeMenuOpen)}
                   className="p-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                   title="테마 설정"
                 >
                   <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                   </svg>
                 </button>

                 {isThemeMenuOpen && (
                   <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl z-50 p-4 animate-in fade-in zoom-in duration-150">
                     <div className="mb-4">
                       <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">모드</p>
                       <button 
                         onClick={toggleThemeMode}
                         className="w-full flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                       >
                         <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                           {theme.mode === 'light' ? '라이트 모드' : '다크 모드'}
                         </span>
                         {theme.mode === 'light' ? (
                           <svg className="w-5 h-5 text-amber-500" fill="currentColor" viewBox="0 0 20 20"><path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 100 2h1z" /></svg>
                         ) : (
                           <svg className="w-5 h-5 text-indigo-400" fill="currentColor" viewBox="0 0 20 20"><path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" /></svg>
                         )}
                       </button>
                     </div>
                     <div>
                       <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">포인트 색상</p>
                       <div className="grid grid-cols-5 gap-2">
                         {ACCENT_COLORS.map(color => (
                           <button
                             key={color.id}
                             onClick={() => changeAccent(color.id)}
                             className={`w-8 h-8 rounded-full ${color.bg} border-2 transition-all ${theme.accent === color.id ? 'border-slate-800 dark:border-white scale-110 shadow-lg' : 'border-transparent hover:scale-105'}`}
                             title={color.label}
                           />
                         ))}
                       </div>
                     </div>
                   </div>
                 )}
               </div>

               <button onClick={requestNotificationPermission} className={`p-2 rounded-lg transition-colors ${notificationPermission === 'granted' ? 'text-yellow-500 bg-yellow-50 dark:bg-yellow-900/20' : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
                 <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
               </button>

               {!user ? (
                 <button onClick={() => setIsAuthModalOpen(true)} className={`px-4 py-2 text-sm font-bold ${accentBg} text-white rounded-xl hover:brightness-110 transition-all shadow-lg`}>로그인</button>
               ) : (
                 <button onClick={() => signOut(auth)} className="px-4 py-2 text-sm font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all">로그아웃</button>
               )}

               <button 
                 onClick={() => setIsAIOpen(!isAIOpen)} 
                 className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${isAIOpen ? 'bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900 shadow-lg' : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
               >
                 <span>✨</span>
                 <span className="hidden sm:inline">AI 비서</span>
               </button>
            </div>
          }
        />
      </main>

      <AIAssistant 
        currentDateContext={`${year}년 ${MONTH_NAMES[month]}`} 
        isOpen={isAIOpen} 
        theme={theme}
        onClose={() => setIsAIOpen(false)} 
      />

      <DayDetailModal 
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        dateString={selectedDate}
        events={dayEvents}
        holiday={dayHoliday}
        weather={weatherData[selectedDate]}
        theme={theme}
        onAddEvent={handleAddEventInDetail}
        onEditEvent={handleEditEvent}
        onToggleComplete={(ev) => updateDoc(doc(db, 'events', ev.id), { completed: !ev.completed })}
      />

      <EventModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        selectedDate={selectedDate} 
        theme={theme}
        onSave={saveEvent} 
        onDelete={(id) => deleteDoc(doc(db, 'events', id))}
        existingEvent={editingEvent} 
      />

      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </div>
  );
};

export default App;