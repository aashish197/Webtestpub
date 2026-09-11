import React from 'react';
import { useApp } from '../context/AppContext';
import {
  X,
  Bell,
  AlertTriangle,
  Clock,
  Award,
  UserCheck,
  CreditCard,
  Trash2,
  ExternalLink,
  CalendarClock,
} from 'lucide-react';
import { formatDualDate } from '../utils/nepaliCalendar';

export const NotificationDrawer: React.FC = () => {
  const {
    isNotificationOpen,
    setIsNotificationOpen,
    notifications,
    markNotificationAsRead,
    clearAllNotifications,
    setActiveTab,
  } = useApp();

  if (!isNotificationOpen) return null;

  const handleAction = (notifId: string, actionLink?: string) => {
    markNotificationAsRead(notifId);
    if (actionLink) {
      setActiveTab(actionLink);
      setIsNotificationOpen(false);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'payment_overdue':
        return <AlertTriangle className="w-4 h-4 text-rose-600" />;
      case 'payment_due_soon':
        return <CalendarClock className="w-4 h-4 text-amber-500" />;
      case 'attendance_pending':
        return <UserCheck className="w-4 h-4 text-amber-600" />;
      case 'performance_alert':
        return <Award className="w-4 h-4 text-indigo-600" />;
      default:
        return <Bell className="w-4 h-4 text-blue-600" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
        onClick={() => setIsNotificationOpen(false)}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-xl flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                  Reminders & Notifications
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {notifications.length} active alerts
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {notifications.length > 0 && (
                <button
                  onClick={clearAllNotifications}
                  className="px-2.5 py-1 text-xs font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
                >
                  Dismiss all
                </button>
              )}
              <button
                onClick={() => setIsNotificationOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {notifications.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-3">
                  <Bell className="w-6 h-6" />
                </div>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                  All caught up!
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs mx-auto">
                  No overdue payments or pending alerts at this moment.
                </p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`p-3.5 rounded-xl border transition ${
                    notif.priority === 'high'
                      ? 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800/60'
                      : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">{getNotificationIcon(notif.type)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {notif.title}
                        </h4>
                        <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500 shrink-0">
                          {notif.date.includes('-') && notif.date.length === 10 ? formatDualDate(notif.date, 'compact') : notif.date}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                        {notif.message}
                      </p>

                      <div className="mt-3 flex items-center justify-between gap-2">
                        {notif.actionLink && (
                          <button
                            onClick={() => handleAction(notif.id, notif.actionLink)}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700"
                          >
                            <span>Open {notif.actionLink}</span>
                            <ExternalLink className="w-3 h-3" />
                          </button>
                        )}
                        <button
                          onClick={() => markNotificationAsRead(notif.id)}
                          className="text-[11px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 ml-auto"
                        >
                          Dismiss
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
