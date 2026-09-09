import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  X,
  ShieldCheck,
  Cloud,
  CheckCircle2,
  AlertCircle,
  LogOut,
  RefreshCw,
  Sparkles,
  Users,
  Calendar,
  CreditCard,
} from 'lucide-react';

export const AuthModal: React.FC = () => {
  const {
    isAuthModalOpen,
    closeAuthModal,
    currentUser,
    isAuthLoading,
    loginWithGoogle,
    logout,
    syncStatus,
    syncDataToCloud,
    isSyncing,
    students,
    classes,
    payments,
  } = useApp();

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSigningIn, setIsSigningIn] = useState<boolean>(false);

  if (!isAuthModalOpen) return null;

  const handleGoogleSignIn = async () => {
    try {
      setErrorMessage(null);
      setIsSigningIn(true);
      await loginWithGoogle();
    } catch (err: any) {
      console.error('Google Sign-In failed:', err);
      if (err?.code === 'auth/popup-blocked') {
        setErrorMessage('The Google Sign-In popup was blocked by your browser. Please allow popups for this site and try again.');
      } else if (err?.code === 'auth/popup-closed-by-user') {
        setErrorMessage('Sign-in cancelled. Please click the button below to sign in with your Google account.');
      } else {
        setErrorMessage(err?.message || 'Failed to sign in with Google. Please try again.');
      }
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleSignOut = async () => {
    try {
      setErrorMessage(null);
      await logout();
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to sign out. Please try again.');
    }
  };

  const handleManualSync = async () => {
    try {
      setErrorMessage(null);
      await syncDataToCloud();
    } catch (err: any) {
      setErrorMessage('Failed to sync with cloud. Please check your internet connection.');
    }
  };

  return (
    <div
      id="modal-google-auth-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) closeAuthModal();
      }}
    >
      <div
        id="modal-google-auth-content"
        className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="relative p-6 pb-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-100 dark:border-indigo-900">
              <Cloud className="w-5 h-5 stroke-[2.2px]" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {currentUser ? 'Teacher Account' : 'Sign in with Google'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {currentUser ? 'Cloud Sync & Profile Settings' : 'Sync your tuition records securely across all devices'}
              </p>
            </div>
          </div>
          <button
            id="btn-close-auth-modal"
            onClick={closeAuthModal}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {errorMessage && (
            <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-xl text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {currentUser ? (
            /* Logged-In View */
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700/60 flex items-center gap-3.5">
                {currentUser.photoURL ? (
                  <img
                    src={currentUser.photoURL}
                    alt={currentUser.displayName || 'User Avatar'}
                    referrerPolicy="no-referrer"
                    className="w-13 h-13 rounded-full border-2 border-indigo-500 shadow-xs object-cover"
                  />
                ) : (
                  <div className="w-13 h-13 rounded-full bg-indigo-600 text-white font-bold text-xl flex items-center justify-center shadow-xs">
                    {(currentUser.displayName || currentUser.email || 'T')[0].toUpperCase()}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                      {currentUser.displayName || 'Teacher'}
                    </h4>
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                      Active
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    {currentUser.email}
                  </p>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 font-mono mt-0.5 truncate">
                    ID: {currentUser.uid.slice(0, 12)}...
                  </p>
                </div>
              </div>

              {/* Cloud Sync Status */}
              <div className="p-3.5 bg-indigo-50/60 dark:bg-indigo-950/30 rounded-xl border border-indigo-100 dark:border-indigo-900/60 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      Cloud Firestore Sync
                      {syncStatus === 'synced' && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      )}
                      {syncStatus === 'syncing' && (
                        <RefreshCw className="w-3.5 h-3.5 text-indigo-500 animate-spin" />
                      )}
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                      {syncStatus === 'synced'
                        ? 'All records up to date in cloud'
                        : syncStatus === 'syncing'
                        ? 'Synchronizing records...'
                        : 'Changes auto-saved'}
                    </span>
                  </div>
                </div>

                <button
                  id="btn-manual-cloud-sync"
                  onClick={handleManualSync}
                  disabled={isSyncing}
                  className="px-2.5 py-1.5 text-xs font-medium rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 transition flex items-center gap-1.5 disabled:opacity-50"
                  title="Manual Force Sync"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                  Sync
                </button>
              </div>

              {/* Database Overview */}
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                  <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center justify-center gap-1 mb-0.5">
                    <Users className="w-3 h-3 text-indigo-500" /> Students
                  </div>
                  <div className="text-sm font-bold text-slate-900 dark:text-white">
                    {students.length}
                  </div>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                  <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center justify-center gap-1 mb-0.5">
                    <Calendar className="w-3 h-3 text-emerald-500" /> Classes
                  </div>
                  <div className="text-sm font-bold text-slate-900 dark:text-white">
                    {classes.length}
                  </div>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                  <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center justify-center gap-1 mb-0.5">
                    <CreditCard className="w-3 h-3 text-amber-500" /> Payments
                  </div>
                  <div className="text-sm font-bold text-slate-900 dark:text-white">
                    {payments.length}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-2 flex items-center gap-2">
                <button
                  id="btn-sign-out-account"
                  onClick={handleSignOut}
                  className="flex-1 py-2.5 px-4 text-xs sm:text-sm font-medium rounded-xl border border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition flex items-center justify-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
                <button
                  id="btn-switch-account"
                  onClick={handleGoogleSignIn}
                  disabled={isSigningIn}
                  className="flex-1 py-2.5 px-4 text-xs sm:text-sm font-medium rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition flex items-center justify-center gap-2"
                >
                  Switch Account
                </button>
              </div>
            </div>
          ) : (
            /* Logged-Out / Sign In View */
            <div className="space-y-5">
              {/* Feature Highlights */}
              <div className="space-y-2.5 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300">
                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <strong className="text-slate-800 dark:text-slate-200 block">
                      Automatic Cloud Backup
                    </strong>
                    All students, classes, attendance, and fee history are saved to Firebase Firestore.
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 mt-0.5">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <strong className="text-slate-800 dark:text-slate-200 block">
                      Multi-Device Access
                    </strong>
                    Open your dashboard on mobile, tablet, or laptop anytime without losing data.
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
                    <ShieldCheck className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <strong className="text-slate-800 dark:text-slate-200 block">
                      End-to-End Privacy
                    </strong>
                    Your student fee records and test marks are isolated under your private Google ID.
                  </div>
                </div>
              </div>

              {/* Google Sign In Button */}
              <button
                id="btn-google-sign-in"
                onClick={handleGoogleSignIn}
                disabled={isSigningIn || isAuthLoading}
                className="w-full py-3 px-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-100 font-semibold text-sm shadow-sm hover:shadow transition flex items-center justify-center gap-3 active:scale-[0.99] disabled:opacity-60"
              >
                {isSigningIn || isAuthLoading ? (
                  <>
                    <RefreshCw className="w-5 h-5 text-indigo-600 dark:text-indigo-400 animate-spin" />
                    <span>Signing in with Google...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                    <span>Continue with Google</span>
                  </>
                )}
              </button>

              <p className="text-[11px] text-center text-slate-400 dark:text-slate-500">
                By continuing, your tuition records will be synced with your Google account in Google Cloud Firestore.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
