
import React, { useState, useEffect, useMemo } from 'react';
import Calendar from './components/Calendar';
import EventModal from './components/EventModal';
import DayDetailModal from './components/DayDetailModal';
import AIAssistant from './components/AIAssistant';
import AuthModal from './components/AuthModal';
import IntroScreen from './components/IntroScreen';
import MonthlySummaryModal from './components/MonthlySummaryModal';
import NotificationSettingsModal from './components/NotificationSettingsModal';
import { CalendarEvent, WeatherInfo, NotificationSettings } from './types';
import { MONTH_NAMES, getHolidays } from './constants';
import { auth, db } from './firebase';
import { onAuthStateChanged, User, signOut } from 'firebase/auth';
import { collection, query, where, onSnapshot, addDoc, deleteDoc, updateDoc, doc, setDoc, getDoc } from 'firebase/firestore';
import { getCurrentLocation, fetchWeatherForecast, DEFAULT_LOCATION } from './services/weatherService';

const DEFAULT_NOTIF_SETTINGS: NotificationSettings = {
  advanceDays: 1,
  notifyHolidays: true,
  notifyPersonal: true,
  enabled: true
};

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [showIntro, setShowIntro] = useState(true);
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth());
  const [direction, setDirection] = useState<'left' | 'right' | 'none'>('none');
  const [personalEvents, setPersonalEvents] = useState<CalendarEvent[]>([]);
  const [weatherData, setWeatherData] = useState<Record<string, WeatherInfo>>({});
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });
  
  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isAIOpen, setIsAIOpen] = useState(false);
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);
  const [isNotifSettingsOpen, setIsNotifSettingsOpen] = useState(false);
  
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | undefined>(undefined);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');
  const [notifSettings, setNotifSettings] = useState<NotificationSettings>(DEFAULT_NOTIF_SETTINGS);

  const holidays = useMemo(() => getHolidays(year), [year]);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setIsAuthLoading(false);
      
      if (currentUser) {
        // Fetch personalized settings
        const settingsRef = doc(db, 'settings', currentUser.uid);
        const settingsSnap = await getDoc(settingsRef);
        if (settingsSnap.exists()) {
          setNotifSettings(settingsSnap.data() as NotificationSettings);
        } else {
          await setDoc(settingsRef, DEFAULT_NOTIF_SETTINGS);
        }
      }
    });

    const timer = setTimeout(() => {
      setShowIntro(false);
    }, 3200);

    return () => {
      unsubscribe();
      clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
    }
    
    const initWeather = async () => {
      let location = DEFAULT_LOCATION;
      try {
        location = await getCurrentLocation();
      } catch (e) {
        console.warn("Geolocation denied or failed, using default location (Seoul):", e);
      }
      
      try {
        const forecast = await fetchWeatherForecast(location.lat, location.lon);
        setWeatherData(forecast);
      } catch (e) {
        console.error("Weather fetch failed entirely:", e);
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
  }, [user, notifSettings]);

  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) return;
    const permission = await Notification.requestPermission();
    setNotificationPermission(permission);
    if (permission === 'granted') {
      setIsNotifSettingsOpen(true);
    }
  };

  const handleToggleNotifButton = () => {
    if (notificationPermission !== 'granted') {
      requestNotificationPermission();
    } else {
      setIsNotifSettingsOpen(true);
    }
  };

  const checkAndNotifyUpcomingEvents = (events: CalendarEvent[]) => {
    if (Notification.permission !== 'granted' || !notifSettings.enabled) return;
    
    const today = new Date();
    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() + notifSettings.advanceDays);
    const targetDateStr = targetDate.toISOString().split('T')[0];

    const storageKey = `notified_for_${targetDateStr}_adv${notifSettings.advanceDays}`;
    if (localStorage.getItem(storageKey) === 'true') return;

    let itemsToNotify: string[] = [];

    if (notifSettings.notifyPersonal) {
      const personalToNotify = events.filter(e => e.startDate === targetDateStr && e.type === 'personal' && !e.completed);
      itemsToNotify.push(...personalToNotify.map(e => `📅 ${e.title}`));
    }

    if (notifSettings.notifyHolidays) {
      const holidaysToNotify = holidays.filter(h => h.startDate === targetDateStr);
      itemsToNotify.push(...holidaysToNotify.map(h => `🚩 ${h.title}`));
    }

    if (itemsToNotify.length > 0) {
      const title = notifSettings.advanceDays === 0 ? '오늘의 일정 안내' : `${notifSettings.advanceDays}일 후 일정 안내`;
      new Notification(title, {
        body: itemsToNotify.join('\n'),
        icon: 'https://cdn-icons-png.flaticon.com/512/10691/10691802.png',
      });
      localStorage.setItem(storageKey, 'true');
    }
  };

  const saveNotifSettings = async (newSettings: NotificationSettings) => {
    setNotifSettings(newSettings);
    if (user) {
      const settingsRef = doc(db, 'settings', user.uid);
      await setDoc(settingsRef, newSettings);
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
    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }
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

  const handlePrint = () => {
    window.print();
  };

  const saveEvent = async (event: CalendarEvent) => {
    if (!user) return;
    try {
      if (editingEvent) {
        const eventRef = doc(db, 'events', event.id);
        await updateDoc(eventRef, {
          title: event.title,
          description: event.description,
          color: event.color,
          startDate: event.startDate,
          endDate: event.endDate,
          completed: event.completed ?? false,
          excludeSaturday: event.excludeSaturday ?? false,
          excludeSunday: event.excludeSunday ?? false
        });
      } else {
        const { id, ...eventData } = event;
        await addDoc(collection(db, 'events'), {
          ...eventData,
          userId: user.uid,
          completed: eventData.completed ?? false,
          excludeSaturday: eventData.excludeSaturday ?? false,
          excludeSunday: eventData.excludeSunday ?? false
        });
      }
    } catch (e) {
      console.error("Save error:", e);
    }
  };

  const dayEvents = useMemo(() => {
    return personalEvents.filter(e => {
      const withinRange = selectedDate >= e.startDate && selectedDate <= e.endDate;
      if (!withinRange) return false;
      
      const d = new Date(selectedDate).getDay();
      if (e.excludeSaturday && d === 6) return false;
      if (e.excludeSunday && d === 0) return false;
      
      return true;
    });
  }, [personalEvents, selectedDate]);

  const dayHoliday = useMemo(() => {
    return holidays.find(h => h.startDate === selectedDate);
  }, [holidays, selectedDate]);

  return (
    <div className={`h-screen w-screen bg-white dark:bg-slate-950 flex transition-colors duration-300 overflow-hidden relative`}>
      {showIntro && <IntroScreen />}
      
      {(isAuthLoading && !showIntro) ? (
        <div className="h-screen w-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 text-slate-400 font-medium">
          달력을 불러오는 중...
        </div>
      ) : (
        <>
          <main className={`flex-1 h-full flex flex-col relative z-10 transition-all duration-300 ${isAIOpen ? 'md:mr-96' : ''}`}>
            <Calendar 
              year={year} 
              month={month} 
              events={personalEvents} 
              weatherData={weatherData}
              direction={direction}
              onMonthChange={handleMonthChange}
              onDayClick={handleDayClick}
              onEventClick={handleEditEvent}
              headerRightContent={
                <div className="flex items-center gap-2 no-print">
                   {/* Dark Mode Toggle */}
                   <button 
                     onClick={() => setIsDarkMode(!isDarkMode)}
                     className="p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all"
                     title={isDarkMode ? '라이트 모드' : '다크 모드'}
                   >
                     {isDarkMode ? (
                       <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" /></svg>
                     ) : (
                       <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" /></svg>
                     )}
                   </button>

                   <button 
                    onClick={handlePrint}
                    className="p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                    title="인쇄"
                   >
                     <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                     </svg>
                   </button>
                   <button 
                    onClick={handleToggleNotifButton} 
                    className={`p-2 rounded-lg transition-colors ${notificationPermission === 'granted' && notifSettings.enabled ? 'text-yellow-500 bg-yellow-50 dark:bg-yellow-900/20' : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                    title="알림 설정"
                   >
                     <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                       <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                     </svg>
                   </button>
                   
                   {!user ? (
                     <button onClick={() => setIsAuthModalOpen(true)} className="px-4 py-2 text-sm font-bold bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all shadow-md shadow-blue-100 dark:shadow-none">로그인</button>
                   ) : (
                     <button onClick={() => signOut(auth)} className="px-4 py-2 text-sm font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all">로그아웃</button>
                   )}

                   <div className="h-8 w-[1px] bg-slate-200 dark:bg-slate-800 mx-1"></div>

                   <button 
                     onClick={() => setIsSummaryOpen(true)}
                     className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-sm"
                   >
                     <svg className="w-4 h-4 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                     </svg>
                     <span>요약</span>
                   </button>

                   <button 
                     onClick={() => setIsAIOpen(!isAIOpen)} 
                     className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${isAIOpen ? 'bg-slate-800 dark:bg-indigo-600 text-white shadow-lg shadow-slate-200 dark:shadow-none' : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
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
            onClose={() => setIsAIOpen(false)} 
          />

          <MonthlySummaryModal 
            isOpen={isSummaryOpen}
            onClose={() => setIsSummaryOpen(false)}
            year={year}
            month={month}
            monthName={MONTH_NAMES[month]}
            events={personalEvents}
          />

          <NotificationSettingsModal
            isOpen={isNotifSettingsOpen}
            onClose={() => setIsNotifSettingsOpen(false)}
            settings={notifSettings}
            onSave={saveNotifSettings}
            permissionStatus={notificationPermission}
          />

          <DayDetailModal 
            isOpen={isDetailModalOpen}
            onClose={() => setIsDetailModalOpen(false)}
            dateString={selectedDate}
            events={dayEvents}
            holiday={dayHoliday}
            weather={weatherData[selectedDate]}
            onAddEvent={handleAddEventInDetail}
            onEditEvent={handleEditEvent}
            onToggleComplete={async (event) => {
              const eventRef = doc(db, 'events', event.id);
              await updateDoc(eventRef, { completed: !event.completed });
            }}
          />

          <EventModal 
            isOpen={isModalOpen} 
            onClose={() => setIsModalOpen(false)} 
            selectedDate={selectedDate} 
            onSave={saveEvent} 
            onDelete={(id) => deleteDoc(doc(db, 'events', id))} 
            existingEvent={editingEvent} 
          />

          <AuthModal 
            isOpen={isAuthModalOpen} 
            onClose={() => setIsAuthModalOpen(false)} 
          />
        </>
      )}
    </div>
  );
};

export default App;
