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
  Mail,
  Lock,
  User as UserIcon,
  Eye,
  EyeOff,
  ArrowRight,
  KeyRound,
  Check,
} from 'lucide-react';

export const AuthModal: React.FC = () => {
  const {
    isAuthModalOpen,
    closeAuthModal,
    currentUser,
    isAuthLoading,
    loginWithGoogle,
    loginWithEmail,
    signupWithEmail,
    sendPasswordReset,
    logout,
    syncStatus,
    syncDataToCloud,
    isSyncing,
    students,
    classes,
    payments,
  } = useApp();

  // Auth Modes: 'login' | 'register' | 'forgot'
  const [authMode, setAuthMode] = useState<'login' | 'register' | 'forgot'>('login');

  // Form Fields
  const [displayName, setDisplayName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);

  // States
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!isAuthModalOpen) return null;

  const resetFormState = () => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setPassword('');
    setConfirmPassword('');
  };

  const switchMode = (mode: 'login' | 'register' | 'forgot') => {
    resetFormState();
    setAuthMode(mode);
  };

  // Human-friendly Firebase error message translator
  const formatAuthError = (err: any): string => {
    const code = err?.code || '';
    switch (code) {
      case 'auth/email-already-in-use':
        return 'An account with this email already exists. Please sign in instead.';
      case 'auth/invalid-email':
        return 'Please enter a valid email address.';
      case 'auth/weak-password':
        return 'Password is too weak. Please use at least 6 characters.';
      case 'auth/wrong-password':
      case 'auth/invalid-credential':
      case 'auth/user-not-found':
        return 'Incorrect email or password. Please verify your credentials or sign up.';
      case 'auth/too-many-requests':
        return 'Access to this account has been temporarily disabled due to many failed attempts. Try resetting your password or wait a few minutes.';
      case 'auth/popup-blocked':
        return 'The Google Sign-In popup was blocked by your browser. Please allow popups and try again.';
      case 'auth/popup-closed-by-user':
        return 'Sign-in cancelled. Please try again.';
      case 'auth/unauthorized-domain':
        return 'Unauthorized Domain: Your Netlify domain must be added to the Authorized Domains in Firebase Console. (You can also use Email & Password sign-in directly).';
      default:
        return err?.message || 'Authentication failed. Please try again.';
    }
  };

  // Submit Handler for Email/Password Forms
  const handleEmailAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setErrorMessage('Please enter your email address.');
      return;
    }

    if (authMode === 'forgot') {
      try {
        setIsSubmitting(true);
        await sendPasswordReset(trimmedEmail);
        setSuccessMessage(`A password reset link has been sent to ${trimmedEmail}. Please check your inbox.`);
      } catch (err: any) {
        setErrorMessage(formatAuthError(err));
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    if (!password) {
      setErrorMessage('Please enter your password.');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters.');
      return;
    }

    if (authMode === 'register') {
      if (!displayName.trim()) {
        setErrorMessage('Please enter your full name.');
        return;
      }
      if (password !== confirmPassword) {
        setErrorMessage('Passwords do not match. Please re-check.');
        return;
      }

      try {
        setIsSubmitting(true);
        await signupWithEmail(trimmedEmail, password, displayName.trim());
      } catch (err: any) {
        setErrorMessage(formatAuthError(err));
      } finally {
        setIsSubmitting(false);
      }
    } else if (authMode === 'login') {
      try {
        setIsSubmitting(true);
        await loginWithEmail(trimmedEmail, password);
      } catch (err: any) {
        setErrorMessage(formatAuthError(err));
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  // Google Sign-In Handler
  const handleGoogleSignIn = async () => {
    try {
      setErrorMessage(null);
      setSuccessMessage(null);
      setIsSubmitting(true);
      await loginWithGoogle();
    } catch (err: any) {
      console.error('Google Sign-In failed:', err);
      setErrorMessage(formatAuthError(err));
    } finally {
      setIsSubmitting(false);
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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) closeAuthModal();
      }}
    >
      <div
        id="modal-google-auth-content"
        className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 my-8"
      >
        {/* Header */}
        <div className="relative p-6 pb-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-100 dark:border-indigo-900 shadow-2xs">
              <Cloud className="w-5 h-5 stroke-[2.2px]" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                {currentUser
                  ? 'Educator Account'
                  : authMode === 'register'
                  ? 'Create New Account'
                  : authMode === 'forgot'
                  ? 'Reset Password'
                  : 'Teacher Login'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {currentUser
                  ? 'Cloud Sync & Storage Management'
                  : authMode === 'register'
                  ? 'Register to save & backup your tuition records'
                  : authMode === 'forgot'
                  ? 'Enter your email to receive recovery instructions'
                  : 'Sign in to access your synchronized teaching data'}
              </p>
            </div>
          </div>
          <button
            id="btn-close-auth-modal"
            onClick={closeAuthModal}
            className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {/* Error Notice */}
          {errorMessage && (
            <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-2xl text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <span className="leading-relaxed">{errorMessage}</span>
            </div>
          )}

          {/* Success Notice */}
          {successMessage && (
            <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl text-xs text-emerald-700 dark:text-emerald-300 flex items-start gap-2.5 animate-in fade-in">
              <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <span className="leading-relaxed">{successMessage}</span>
            </div>
          )}

          {currentUser ? (
            /* Logged-In User Profile & Sync Dashboard */
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 flex items-center gap-3.5">
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
                      {currentUser.displayName || 'Educator'}
                    </h4>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                      Logged In
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                    {currentUser.email}
                  </p>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 font-mono mt-0.5 truncate">
                    Account ID: {currentUser.uid.slice(0, 14)}...
                  </p>
                </div>
              </div>

              {/* Cloud Sync Status */}
              <div className="p-3.5 bg-indigo-50/60 dark:bg-indigo-950/30 rounded-2xl border border-indigo-100 dark:border-indigo-900/60 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
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
                        : 'Automatic cloud backup active'}
                    </span>
                  </div>
                </div>

                <button
                  id="btn-manual-cloud-sync"
                  onClick={handleManualSync}
                  disabled={isSyncing}
                  className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 transition flex items-center gap-1.5 disabled:opacity-50 shadow-2xs"
                  title="Manual Force Sync"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                  Sync
                </button>
              </div>

              {/* Database Overview */}
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                  <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center justify-center gap-1 mb-0.5">
                    <Users className="w-3 h-3 text-indigo-500" /> Students
                  </div>
                  <div className="text-sm font-bold text-slate-900 dark:text-white">
                    {students.length}
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                  <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center justify-center gap-1 mb-0.5">
                    <Calendar className="w-3 h-3 text-emerald-500" /> Classes
                  </div>
                  <div className="text-sm font-bold text-slate-900 dark:text-white">
                    {classes.length}
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
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
                  className="w-full py-2.5 px-4 text-xs sm:text-sm font-semibold rounded-xl border border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition flex items-center justify-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            </div>
          ) : (
            /* Logged-Out Authentication Forms (Login / Register / Forgot Password) */
            <div className="space-y-4">
              {/* Mode Toggle Tabs (Login vs Register) */}
              {authMode !== 'forgot' ? (
                <div className="grid grid-cols-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => switchMode('login')}
                    className={`py-2 rounded-xl transition ${
                      authMode === 'login'
                        ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    Sign In
                  </button>
                  <button
                    type="button"
                    onClick={() => switchMode('register')}
                    className={`py-2 rounded-xl transition ${
                      authMode === 'register'
                        ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    Register / Sign Up
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between pb-1">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Reset Password
                  </span>
                  <button
                    type="button"
                    onClick={() => switchMode('login')}
                    className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                  >
                    ← Back to Sign In
                  </button>
                </div>
              )}

              {/* Form Element */}
              <form onSubmit={handleEmailAuthSubmit} className="space-y-3">
                {/* Full Name (Only on Registration) */}
                {authMode === 'register' && (
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Full Name
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <UserIcon className="w-4 h-4" />
                      </div>
                      <input
                        type="text"
                        required
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder="e.g. Aashish Kumar"
                        className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                      />
                    </div>
                  </div>
                )}

                {/* Email Address */}
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="teacher@example.com"
                      className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                    />
                  </div>
                </div>

                {/* Password (for Login & Register) */}
                {authMode !== 'forgot' && (
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                        Password
                      </label>
                      {authMode === 'login' && (
                        <button
                          type="button"
                          onClick={() => switchMode('forgot')}
                          className="text-[11px] font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
                        >
                          Forgot password?
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <Lock className="w-4 h-4" />
                      </div>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        minLength={6}
                        className="w-full pl-9 pr-10 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                        title={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                )}

                {/* Confirm Password (Only on Registration) */}
                {authMode === 'register' && (
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <KeyRound className="w-4 h-4" />
                      </div>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        minLength={6}
                        className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                      />
                    </div>
                  </div>
                )}

                {/* Submit Button */}
                <button
                  id="btn-auth-submit"
                  type="submit"
                  disabled={isSubmitting || isAuthLoading}
                  className="w-full mt-2 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-xs hover:shadow transition flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-60"
                >
                  {isSubmitting || isAuthLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Processing...</span>
                    </>
                  ) : authMode === 'register' ? (
                    <>
                      <span>Create Account</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  ) : authMode === 'forgot' ? (
                    <>
                      <span>Send Password Reset Email</span>
                      <Mail className="w-4 h-4" />
                    </>
                  ) : (
                    <>
                      <span>Sign In</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              {/* Or Divider */}
              <div className="relative py-1">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200 dark:border-slate-800" />
                </div>
                <div className="relative flex justify-center text-[11px] uppercase tracking-wider">
                  <span className="bg-white dark:bg-slate-900 px-3 text-slate-400 dark:text-slate-500 font-semibold">
                    or continue with
                  </span>
                </div>
              </div>

              {/* Google Sign In Button */}
              <button
                id="btn-google-sign-in"
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isSubmitting || isAuthLoading}
                className="w-full py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 font-semibold text-xs sm:text-sm shadow-2xs hover:shadow-xs transition flex items-center justify-center gap-2.5 active:scale-[0.99] disabled:opacity-60"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
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
                <span>Sign in with Google</span>
              </button>

              {/* Bottom Footer Information */}
              <div className="pt-2 text-center">
                {authMode === 'login' ? (
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Don't have an account yet?{' '}
                    <button
                      type="button"
                      onClick={() => switchMode('register')}
                      className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                    >
                      Register here
                    </button>
                  </p>
                ) : (
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Already have an account?{' '}
                    <button
                      type="button"
                      onClick={() => switchMode('login')}
                      className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                    >
                      Sign In here
                    </button>
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
