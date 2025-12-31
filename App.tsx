import React, { useState, useEffect } from 'react';
import Calendar from './components/Calendar';
import EventModal from './components/EventModal';
import AIAssistant from './components/AIAssistant';
import AuthModal from './components/AuthModal';
import { CalendarEvent } from './types';
import { MONTH_NAMES } from './constants';
import { auth, db } from './firebase';
import { onAuthStateChanged, User, signOut } from 'firebase/auth';
import { collection, query, where, onSnapshot, addDoc, deleteDoc, updateDoc, doc } from 'firebase/firestore';

const App: React.FC = () => {
  // User State
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  // Calendar State
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth());
  const [direction, setDirection] = useState<'left' | 'right' | 'none'>('none');
  
  // Events State
  const [personalEvents, setPersonalEvents] = useState<CalendarEvent[]>([]);
  
  // UI State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isAIOpen, setIsAIOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | undefined>(undefined);

  // Notification State
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');

  // PWA Install State
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Check Notification Permission on Mount
  useEffect(() => {
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  // PWA Install Listener
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  // Fetch Events from Firestore & Check for Notifications
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
      
      // Trigger notification check after events are loaded
      checkAndNotifyUpcomingEvents(eventsData);
    });

    return () => unsubscribe();
  }, [user]);

  // Helper: Request Notification Permission
  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
      alert('이 브라우저는 알림을 지원하지 않습니다.');
      return;
    }

    const permission = await Notification.requestPermission();
    setNotificationPermission(permission);

    if (permission === 'granted') {
      // Test notification
      new Notification('알림이 설정되었습니다.', {
        body: '내일 일정이 있으면 하루 전에 알려드릴게요!',
        icon: 'https://cdn-icons-png.flaticon.com/512/10691/10691802.png'
      });
      // Check immediately after granting
      checkAndNotifyUpcomingEvents(personalEvents);
    }
  };

  // Helper: Check for events tomorrow and notify
  const checkAndNotifyUpcomingEvents = (events: CalendarEvent[]) => {
    if (Notification.permission !== 'granted') return;

    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const y = tomorrow.getFullYear();
    const m = String(tomorrow.getMonth() + 1).padStart(2, '0');
    const d = String(tomorrow.getDate()).padStart(2, '0');
    const tomorrowStr = `${y}-${m}-${d}`;

    // Check if we already notified for this specific date today to avoid spamming on reload
    const storageKey = `notified_for_${tomorrowStr}`;
    const alreadyNotified = localStorage.getItem(storageKey);

    if (alreadyNotified === 'true') {
      return; 
    }

    const upcomingEvents = events.filter(e => e.date === tomorrowStr && e.type === 'personal');

    if (upcomingEvents.length > 0) {
      const title = upcomingEvents.length === 1 
        ? `내일 일정 알림: ${upcomingEvents[0].title}`
        : `내일 ${upcomingEvents.length}개의 일정이 있습니다.`;
      
      const body = upcomingEvents.map(e => `- ${e.title}`).join('\n');

      new Notification(title, {
        body: body,
        icon: 'https://cdn-icons-png.flaticon.com/512/10691/10691802.png',
        tag: 'upcoming-event' // Prevent stacking multiple notifications
      });

      // Mark as notified for this date
      localStorage.setItem(storageKey, 'true');
    }
  };

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    }
    setDeferredPrompt(null);
    setIsInstallable(false);
  };

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

    setDirection(increment > 0 ? 'right' : 'left');
    setMonth(newMonth);
    setYear(newYear);
  };

  const handleDayClick = (dateStr: string) => {
    if (!user) {
      if (confirm('일정을 추가하려면 로그인이 필요합니다. 로그인하시겠습니까?')) {
        setIsAuthModalOpen(true);
      }
      return;
    }
    setSelectedDate(dateStr);
    setEditingEvent(undefined);
    setIsModalOpen(true);
  };

  const handleEventClick = (event: CalendarEvent) => {
    if (!user) return;
    setSelectedDate(event.date);
    setEditingEvent(event);
    setIsModalOpen(true);
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
          date: event.date,
          completed: event.completed ?? false
        });
      } else {
        const { id, ...eventData } = event;
        await addDoc(collection(db, 'events'), {
          ...eventData,
          userId: user.uid,
          completed: eventData.completed ?? false
        });
      }
    } catch (e) {
      console.error("Error saving event: ", e);
      alert("일정 저장 중 오류가 발생했습니다.");
    }
  };

  const deleteEvent = async (id: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'events', id));
    } catch (e) {
      console.error("Error deleting event: ", e);
      alert("일정 삭제 중 오류가 발생했습니다.");
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleShare = async () => {
    const shareData = {
      title: '2026 스마트 달력',
      text: '대한민국 공휴일과 날씨, AI 비서가 함께하는 2026년 스마트 달력을 확인해보세요!',
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.log('Share canceled or failed:', err);
      }
    } else {
      try {
        await navigator.clipboard.writeText(window.location.href);
        alert('주소가 클립보드에 복사되었습니다. 친구들에게 공유해보세요!');
      } catch (err) {
        console.error('Clipboard copy failed:', err);
        alert('공유하기를 지원하지 않는 브라우저입니다.');
      }
    }
  };

  if (isAuthLoading) {
    return <div className="h-screen w-screen flex items-center justify-center bg-slate-50">Loading...</div>;
  }

  return (
    <div className="h-screen w-screen bg-white flex overflow-hidden relative">
      
      {/* Main Content Area */}
      <main 
        className={`flex-1 h-full flex flex-col relative z-10 transition-all duration-300 ease-in-out ${isAIOpen ? 'md:mr-96' : ''}`}
      >
        <Calendar 
          year={year}
          month={month}
          events={personalEvents}
          direction={direction}
          onMonthChange={handleMonthChange}
          onDayClick={handleDayClick}
          onEventClick={handleEventClick}
          headerRightContent={
            <div className="flex items-center gap-2 no-print flex-wrap justify-end whitespace-nowrap">
               {isInstallable && (
                 <button
                   onClick={handleInstallClick}
                   className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors"
                   title="앱 설치"
                 >
                   <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                   </svg>
                   <span className="hidden sm:inline">설치</span>
                 </button>
               )}

               <button
                 onClick={requestNotificationPermission}
                 className={`p-2 rounded-lg transition-colors relative ${
                   notificationPermission === 'granted' 
                     ? 'text-yellow-500 hover:bg-yellow-50' 
                     : 'text-slate-400 hover:bg-slate-100'
                 }`}
                 title={notificationPermission === 'granted' ? '내일 일정 알림 켜짐' : '알림 켜기'}
               >
                 <svg className="w-5 h-5" fill={notificationPermission === 'granted' ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                 </svg>
                 {notificationPermission === 'denied' && (
                   <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                 )}
               </button>

               <button
                onClick={handleShare}
                className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                title="공유하기"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
              </button>

               <button
                onClick={handlePrint}
                className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                title="인쇄하기"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
              </button>

              {!user ? (
                <button
                  onClick={() => setIsAuthModalOpen(true)}
                  className="px-3 py-1.5 md:px-4 md:py-2 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap"
                >
                  로그인
                </button>
              ) : (
                <button
                  onClick={() => signOut(auth)}
                  className="px-3 py-1.5 md:px-4 md:py-2 text-sm font-semibold bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors whitespace-nowrap"
                >
                  로그아웃
                </button>
              )}

              <button 
                onClick={() => setIsAIOpen(!isAIOpen)}
                className={`
                  flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 rounded-lg text-sm font-semibold transition-all whitespace-nowrap
                  ${isAIOpen 
                    ? 'bg-slate-800 text-white shadow-md' 
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'}
                `}
              >
                <span className="text-lg">✨</span>
                <span className="hidden sm:inline">AI 비서</span>
              </button>
            </div>
          }
        />
      </main>

      {/* AI Sidebar */}
      <div className="no-print">
        <AIAssistant 
          currentDateContext={`${year}년 ${MONTH_NAMES[month]}`}
          isOpen={isAIOpen}
          onClose={() => setIsAIOpen(false)}
        />
      </div>

      {/* Modals */}
      <EventModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        selectedDate={selectedDate}
        onSave={saveEvent}
        onDelete={deleteEvent}
        existingEvent={editingEvent}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </div>
  );
};

export default App;