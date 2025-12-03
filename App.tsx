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
  
  // Events State
  const [personalEvents, setPersonalEvents] = useState<CalendarEvent[]>([]);
  
  // UI State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isAIOpen, setIsAIOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | undefined>(undefined);

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

  // PWA Install Listener
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    
    // Show the install prompt
    deferredPrompt.prompt();
    
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    } else {
      console.log('User dismissed the install prompt');
    }
    
    // We've used the prompt, and can't use it again, throw it away
    setDeferredPrompt(null);
    setIsInstallable(false);
  };

  // Fetch Events from Firestore
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
    });

    return () => unsubscribe();
  }, [user]);

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
        // Update
        const eventRef = doc(db, 'events', event.id);
        await updateDoc(eventRef, {
          title: event.title,
          description: event.description,
          color: event.color,
          date: event.date
        });
      } else {
        // Create
        // Remove ID from object before saving, let Firestore generate it
        const { id, ...eventData } = event;
        await addDoc(collection(db, 'events'), {
          ...eventData,
          userId: user.uid
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