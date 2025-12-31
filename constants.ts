
import { CalendarEvent } from './types';

// Specific 2026 Holidays (Lunar included)
const HOLIDAYS_2026_SPECIFIC: CalendarEvent[] = [
  // Fix: CalendarEvent interface requires startDate and endDate, not date
  { id: 'h2026-02-16', startDate: '2026-02-16', endDate: '2026-02-16', title: '설날 연휴', type: 'holiday', color: 'red' },
  { id: 'h2026-02-17', startDate: '2026-02-17', endDate: '2026-02-17', title: '설날', type: 'holiday', color: 'red' },
  { id: 'h2026-02-18', startDate: '2026-02-18', endDate: '2026-02-18', title: '설날 연휴', type: 'holiday', color: 'red' },
  { id: 'h2026-03-02', startDate: '2026-03-02', endDate: '2026-03-02', title: '대체공휴일(삼일절)', type: 'holiday', color: 'red' },
  { id: 'h2026-05-24', startDate: '2026-05-24', endDate: '2026-05-24', title: '부처님오신날', type: 'holiday', color: 'red' },
  { id: 'h2026-05-25', startDate: '2026-05-25', endDate: '2026-05-25', title: '대체공휴일(부처님오신날)', type: 'holiday', color: 'red' },
  { id: 'h2026-09-24', startDate: '2026-09-24', endDate: '2026-09-24', title: '추석 연휴', type: 'holiday', color: 'red' },
  { id: 'h2026-09-25', startDate: '2026-09-25', endDate: '2026-09-25', title: '추석', type: 'holiday', color: 'red' },
  { id: 'h2026-09-26', startDate: '2026-09-26', endDate: '2026-09-26', title: '추석 연휴', type: 'holiday', color: 'red' },
];

export const getHolidays = (year: number): CalendarEvent[] => {
  // Fixed Solar Holidays
  // Fix: CalendarEvent interface requires startDate and endDate, not date
  const fixedHolidays: CalendarEvent[] = [
    { id: `h${year}-01-01`, startDate: `${year}-01-01`, endDate: `${year}-01-01`, title: '신정', type: 'holiday', color: 'red' },
    { id: `h${year}-03-01`, startDate: `${year}-03-01`, endDate: `${year}-03-01`, title: '삼일절', type: 'holiday', color: 'red' },
    { id: `h${year}-05-05`, startDate: `${year}-05-05`, endDate: `${year}-05-05`, title: '어린이날', type: 'holiday', color: 'red' },
    { id: `h${year}-06-06`, startDate: `${year}-06-06`, endDate: `${year}-06-06`, title: '현충일', type: 'holiday', color: 'red' },
    { id: `h${year}-08-15`, startDate: `${year}-08-15`, endDate: `${year}-08-15`, title: '광복절', type: 'holiday', color: 'red' },
    { id: `h${year}-10-03`, startDate: `${year}-10-03`, endDate: `${year}-10-03`, title: '개천절', type: 'holiday', color: 'red' },
    { id: `h${year}-10-09`, startDate: `${year}-10-09`, endDate: `${year}-10-09`, title: '한글날', type: 'holiday', color: 'red' },
    { id: `h${year}-12-25`, startDate: `${year}-12-25`, endDate: `${year}-12-25`, title: '크리스마스', type: 'holiday', color: 'red' },
  ];

  if (year === 2026) {
    return [...fixedHolidays, ...HOLIDAYS_2026_SPECIFIC];
  }

  // NOTE: Lunar holidays for other years are not calculated here.
  return fixedHolidays;
};

export const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

export const MONTH_NAMES = [
  '1월', '2월', '3월', '4월', '5월', '6월', 
  '7월', '8월', '9월', '10월', '11월', '12월'
];

export const EVENT_COLORS = [
  { name: 'Blue', value: 'bg-blue-100 text-blue-800 border-blue-200' },
  { name: 'Green', value: 'bg-green-100 text-green-800 border-green-200' },
  { name: 'Purple', value: 'bg-purple-100 text-purple-800 border-purple-200' },
  { name: 'Orange', value: 'bg-orange-100 text-orange-800 border-orange-200' },
  { name: 'Pink', value: 'bg-pink-100 text-pink-800 border-pink-200' },
  { name: 'Gray', value: 'bg-gray-100 text-gray-800 border-gray-200' },
];
