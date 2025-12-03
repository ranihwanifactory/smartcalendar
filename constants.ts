import { CalendarEvent } from './types';

// 2026 South Korean Holidays (including likely substitute holidays)
export const HOLIDAYS_2026: CalendarEvent[] = [
  { id: 'h1', date: '2026-01-01', title: '신정', type: 'holiday', color: 'red' },
  { id: 'h2', date: '2026-02-16', title: '설날 연휴', type: 'holiday', color: 'red' },
  { id: 'h3', date: '2026-02-17', title: '설날', type: 'holiday', color: 'red' },
  { id: 'h4', date: '2026-02-18', title: '설날 연휴', type: 'holiday', color: 'red' },
  { id: 'h5', date: '2026-03-01', title: '삼일절', type: 'holiday', color: 'red' },
  { id: 'h6', date: '2026-03-02', title: '대체공휴일(삼일절)', type: 'holiday', color: 'red' },
  { id: 'h7', date: '2026-05-05', title: '어린이날', type: 'holiday', color: 'red' },
  { id: 'h8', date: '2026-05-24', title: '부처님오신날', type: 'holiday', color: 'red' },
  { id: 'h9', date: '2026-05-25', title: '대체공휴일(부처님오신날)', type: 'holiday', color: 'red' },
  { id: 'h10', date: '2026-06-06', title: '현충일', type: 'holiday', color: 'red' },
  { id: 'h11', date: '2026-08-15', title: '광복절', type: 'holiday', color: 'red' },
  { id: 'h12', date: '2026-09-24', title: '추석 연휴', type: 'holiday', color: 'red' },
  { id: 'h13', date: '2026-09-25', title: '추석', type: 'holiday', color: 'red' },
  { id: 'h14', date: '2026-09-26', title: '추석 연휴', type: 'holiday', color: 'red' },
  { id: 'h15', date: '2026-10-03', title: '개천절', type: 'holiday', color: 'red' },
  { id: 'h16', date: '2026-10-09', title: '한글날', type: 'holiday', color: 'red' },
  { id: 'h17', date: '2026-12-25', title: '기독탄신일(크리스마스)', type: 'holiday', color: 'red' },
];

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