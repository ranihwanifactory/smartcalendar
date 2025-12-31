import React, { useState, useEffect, useMemo } from 'react';
import Calendar from './components/Calendar';
import EventModal from './components/EventModal';
import DayDetailModal from './components/DayDetailModal';
import AIAssistant from './components/AIAssistant';
import AuthModal from './components/AuthModal';
import IntroScreen from './components/IntroScreen';
import { CalendarEvent, WeatherInfo } from './types';
import { MONTH_NAMES, getHolidays } from './constants';
import { auth, db } from './firebase';
import { onAuthStateChanged, User, signOut } from 'firebase/auth';
import { collection, query, where, onSnapshot, addDoc, deleteDoc, updateDoc, doc } from 'firebase/firestore';
import { getCurrentLocation, fetchWeatherForecast, DEFAULT_LOCATION } from './services/weatherService';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [showIntro, setShowIntro] = useState(true);
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth());
  const [direction, setDirection] = useState<'left' | 'right' | 'none'>('none');
  const [personalEvents, setPersonalEvents] = useState<CalendarEvent[]>([]);
  const [weatherData, setWeatherData] = useState<Record<string, WeatherInfo>>({});
  
  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isAIOpen, setIsAIOpen] = useState(false);
  
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | undefined>(undefined);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');

  const holidays = useMemo(() => getHolidays(year), [year]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAuthLoading(false);
    });

    // Intro duration logic
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
  }, [user]);

  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) return;
    const permission = await Notification.requestPermission();
    setNotificationPermission(permission);
  };

  const checkAndNotifyUpcomingEvents = (events: CalendarEvent[]) => {
    if (Notification.permission !== 'granted') return;
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    const storageKey = `notified_for_${tomorrowStr}`;
    if (localStorage.getItem(storageKey) === 'true') return;

    const upcomingEvents = events.filter(e => e.startDate === tomorrowStr && e.type === 'personal');
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
    <div className="h-screen w-screen bg-white flex overflow-hidden relative">
      {showIntro && <IntroScreen />}
      
      {(isAuthLoading && !showIntro) ? (
        <div className="h-screen w-screen flex items-center justify-center bg-slate-50 text-slate-400 font-medium">
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
                   <button 
                    onClick={handlePrint}
                    className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
                    title="인쇄"
                   >
                     <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                     </svg>
                   </button>
                   <button onClick={requestNotificationPermission} className={`p-2 rounded-lg transition-colors ${notificationPermission === 'granted' ? 'text-yellow-500 bg-yellow-50' : 'text-slate-400 hover:bg-slate-100'}`}>
                     <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                   </button>
                   {!user ? (
                     <button onClick={() => setIsAuthModalOpen(true)} className="px-4 py-2 text-sm font-bold bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all shadow-md shadow-blue-100">로그인</button>
                   ) : (
                     <button onClick={() => signOut(auth)} className="px-4 py-2 text-sm font-bold bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-all">로그아웃</button>
                   )}
                   <button 
                     onClick={() => setIsAIOpen(!isAIOpen)} 
                     className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${isAIOpen ? 'bg-slate-800 text-white shadow-lg shadow-slate-200' : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'}`}
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