export interface CalendarEvent {
  id: string;
  userId?: string; // Added for Firebase ownership
  date: string; // Format YYYY-MM-DD
  title: string;
  type: 'holiday' | 'personal';
  color?: string; // Tailwind color class or hex
  description?: string;
}

export interface DayInfo {
  date: Date;
  dateString: string;
  isCurrentMonth: boolean;
  isToday: boolean;
  events: CalendarEvent[];
  holiday?: CalendarEvent;
}

export type ViewMode = 'month' | 'year';

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  isLoading?: boolean;
}