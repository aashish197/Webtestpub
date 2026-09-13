import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const ToastNotification: React.FC = () => {
  const { toast, dismissToast } = useApp();

  if (!toast) return null;

  return (
    <div
      id="global-toast-notification"
      role="status"
      aria-live="polite"
      className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-[9999] max-w-sm w-full transition-all duration-300 transform translate-y-0"
    >
      <div
        className={`flex items-start gap-3 p-3.5 sm:p-4 rounded-xl shadow-xl border backdrop-blur-md transition-all ${
          toast.type === 'success'
            ? 'bg-white/95 dark:bg-slate-900/95 border-emerald-500/40 text-slate-800 dark:text-slate-100 shadow-emerald-500/10'
            : toast.type === 'error'
            ? 'bg-white/95 dark:bg-slate-900/95 border-rose-500/40 text-slate-800 dark:text-slate-100 shadow-rose-500/10'
            : 'bg-white/95 dark:bg-slate-900/95 border-indigo-500/40 text-slate-800 dark:text-slate-100 shadow-indigo-500/10'
        }`}
      >
        <div className="shrink-0 mt-0.5">
          {toast.type === 'success' && (
            <div className="p-1 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          )}
          {toast.type === 'error' && (
            <div className="p-1 rounded-lg bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400">
              <AlertCircle className="w-4 h-4" />
            </div>
          )}
          {toast.type === 'info' && (
            <div className="p-1 rounded-lg bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <Info className="w-4 h-4" />
            </div>
          )}
        </div>

        <div className="flex-1 pr-1">
          <p className="text-xs sm:text-sm font-semibold leading-snug">
            {toast.message}
          </p>
          {toast.subtitle && (
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-tight">
              {toast.subtitle}
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={dismissToast}
          className="shrink-0 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-md transition"
          aria-label="Dismiss notification"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
