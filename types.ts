export interface CalendarEvent {
  id: string;
  userId?: string;
  startDate: string; // Format YYYY-MM-DD
  endDate: string;   // Format YYYY-MM-DD
  title: string;
  type: 'holiday' | 'personal';
  color?: string;
  description?: string;
  completed?: boolean;
  excludeWeekends?: boolean;
}

export interface WeatherInfo {
  maxTemp: number;
  minTemp: number;
  weatherCode: number;
  icon: string;
}

export interface DayInfo {
  date: Date;
  dateString: string;
  isCurrentMonth: boolean;
  isToday: boolean;
  events: CalendarEvent[];
  holiday?: CalendarEvent;
  weather?: WeatherInfo;
}

export type ViewMode = 'month' | 'year';

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  isLoading?: boolean;
}