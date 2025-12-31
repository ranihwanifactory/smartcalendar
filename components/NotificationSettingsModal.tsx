import React from 'react';
import { NotificationSettings } from '../types';

interface NotificationSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: NotificationSettings;
  onSave: (settings: NotificationSettings) => void;
  permissionStatus: NotificationPermission;
}

const NotificationSettingsModal: React.FC<NotificationSettingsModalProps> = ({
  isOpen, onClose, settings, onSave, permissionStatus
}) => {
  if (!isOpen) return null;

  const handleChange = (key: keyof NotificationSettings, value: any) => {
    onSave({ ...settings, [key]: value });
  };

  const advanceOptions = [
    { label: '당일', value: 0 },
    { label: '1일 전', value: 1 },
    { label: '3일 전', value: 3 },
    { label: '7일 전', value: 7 },
  ];

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 no-print">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <svg className="w-6 h-6 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            알림 개인 설정
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-6">
          {permissionStatus !== 'granted' && (
            <div className="bg-amber-50 border border-amber-100 p-3 rounded-xl text-xs text-amber-700 font-medium">
              브라우저 알림 권한이 비활성화되어 있습니다. 알림을 받으려면 브라우저 설정에서 권한을 허용해주세요.
            </div>
          )}

          <div className="space-y-3">
            <label className="text-sm font-bold text-slate-700">언제 알림을 받을까요?</label>
            <div className="grid grid-cols-4 gap-2">
              {advanceOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => handleChange('advanceDays', opt.value)}
                  className={`py-2 text-xs font-bold rounded-xl transition-all ${
                    settings.advanceDays === opt.value
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100'
                      : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-slate-400">
              {settings.advanceDays === 0 
                ? '일정 당일 오전에 알림을 보냅니다.' 
                : `일정 시작 ${settings.advanceDays}일 전 오전에 알림을 보냅니다.`}
            </p>
          </div>

          <div className="space-y-4 pt-2 border-t border-slate-50">
            <label className="text-sm font-bold text-slate-700">알림 대상 선택</label>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">개인 일정</span>
              <button
                onClick={() => handleChange('notifyPersonal', !settings.notifyPersonal)}
                className={`w-11 h-6 rounded-full transition-colors relative ${settings.notifyPersonal ? 'bg-indigo-600' : 'bg-slate-200'}`}
              >
                <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${settings.notifyPersonal ? 'translate-x-5' : ''}`}></div>
              </button>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">공휴일 및 기념일</span>
              <button
                onClick={() => handleChange('notifyHolidays', !settings.notifyHolidays)}
                className={`w-11 h-6 rounded-full transition-colors relative ${settings.notifyHolidays ? 'bg-indigo-600' : 'bg-slate-200'}`}
              >
                <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${settings.notifyHolidays ? 'translate-x-5' : ''}`}></div>
              </button>
            </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-2xl flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-slate-800">알림 전체 활성화</p>
              <p className="text-[10px] text-slate-500">모든 앱 알림을 일시 중단할 수 있습니다.</p>
            </div>
            <button
              onClick={() => handleChange('enabled', !settings.enabled)}
              className={`w-11 h-6 rounded-full transition-colors relative ${settings.enabled ? 'bg-green-500' : 'bg-slate-300'}`}
            >
              <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${settings.enabled ? 'translate-x-5' : ''}`}></div>
            </button>
          </div>
        </div>

        <div className="p-6 bg-slate-50">
          <button
            onClick={onClose}
            className="w-full bg-slate-900 text-white font-bold py-3 rounded-xl hover:bg-slate-800 transition-colors shadow-lg shadow-slate-200"
          >
            확인
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotificationSettingsModal;