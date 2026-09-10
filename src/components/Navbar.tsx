import React from 'react';
import { useApp } from '../context/AppContext';
import { formatDisplayDate, getTodayIso } from '../utils/nepaliCalendar';
import {
  Calendar,
  Bell,
  Plus,
  Search,
  BookOpen,
  Moon,
  Sun,
  Menu,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  LogIn,
} from 'lucide-react';

interface NavbarProps {
  onToggleMobileMenu?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleMobileMenu }) => {
  const {
    settings,
    updateSettings,
    toggleDateSystem,
    searchQuery,
    setSearchQuery,
    openSearchModal,
    openQuickAction,
    openResetModal,
    notifications,
    setIsNotificationOpen,
    activeTab,
    setActiveTab,
    toggleSidebar,
    isSidebarOpen,
    isDarkMode,
    toggleTheme,
    currentUser,
    openAuthModal,
    syncStatus,
    isSyncing,
  } = useApp();

  const handleMenuClick = () => {
    if (onToggleMobileMenu) {
      onToggleMobileMenu();
    } else {
      toggleSidebar();
    }
  };

  const unreadCount = notifications.length;
  const todayIso = getTodayIso();
  const displayDateStr = formatDisplayDate(todayIso, settings.dateSystem, 'long');
  const otherDateStr = formatDisplayDate(todayIso, settings.dateSystem === 'AD' ? 'BS' : 'AD', 'medium');

  return (
    <header className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
        {/* Left: Hamburger Menu & Branding */}
        <div className="flex items-center gap-3">
          <button
            id="btn-mobile-menu"
            onClick={handleMenuClick}
            className="p-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 active:scale-95 transition flex items-center justify-center"
            aria-label="Toggle navigation menu"
            title="Toggle Menu / Navigation Sidebar"
          >
            <Menu className="w-5 h-5 text-slate-800 dark:text-slate-100" />
          </button>

          <button
            onClick={() => setActiveTab('dashboard')}
            className="flex items-center gap-2.5 text-left group transition focus:outline-none"
            title="Go to Dashboard Overview"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-500 flex items-center justify-center text-white shadow-sm shadow-indigo-500/30 group-hover:scale-105 transition-transform">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-slate-900 dark:text-white text-base tracking-tight leading-tight block group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                Teacher<span className="text-indigo-600 dark:text-indigo-400">Desk</span>
              </span>
              <span className="text-xs text-slate-600 dark:text-slate-300 hidden sm:block">
                Class & Tuition Manager
              </span>
            </div>
          </button>
        </div>

        {/* Center: Search Bar Trigger (Desktop) */}
        <div className="hidden md:flex items-center flex-1 max-w-md mx-2">
          <button
            id="btn-navbar-global-search"
            type="button"
            onClick={openSearchModal}
            className="w-full pl-9 pr-3 py-1.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 hover:bg-slate-100/80 dark:bg-slate-800/80 dark:hover:bg-slate-800 text-left text-slate-500 dark:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition relative flex items-center justify-between group cursor-pointer shadow-2xs"
            title="Search anything across TeacherDesk (Ctrl+K)"
          >
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors" />
            <span className="truncate">
              {searchQuery ? `Searching: "${searchQuery}"` : 'Search students, classes, payments, colleges...'}
            </span>
            <kbd className="hidden lg:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono font-semibold text-slate-400 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded">
              ⌘K
            </kbd>
          </button>
        </div>

        {/* Right: Search (Mobile), Date Switcher, Quick Action, Theme, Notifications */}
        <div className="flex items-center gap-1.5 sm:gap-2.5">
          {/* Mobile Search Button */}
          <button
            id="btn-navbar-mobile-search"
            type="button"
            onClick={openSearchModal}
            className="md:hidden p-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition active:scale-95 flex items-center justify-center"
            aria-label="Search all records"
            title="Open Global Search"
          >
            <Search className="w-5 h-5 text-slate-700 dark:text-slate-300" />
          </button>
          {/* AD / BS Dual Date Pill Toggle */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800/90 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              id="btn-date-system-toggle"
              onClick={toggleDateSystem}
              title={`Switch calendar format between AD and BS (Currently: ${settings.dateSystem})`}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-700 shadow-xs transition"
            >
              <Calendar className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span className="font-semibold text-indigo-700 dark:text-indigo-300">
                {settings.dateSystem}
              </span>
              <span className="hidden xl:inline text-slate-600 dark:text-slate-300 font-normal">
                ({displayDateStr})
              </span>
            </button>

            <button
              onClick={toggleDateSystem}
              className={`px-2 py-0.5 text-[11px] font-bold rounded-md transition ${
                settings.dateSystem === 'BS'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              BS
            </button>
            <button
              onClick={toggleDateSystem}
              className={`px-2 py-0.5 text-[11px] font-bold rounded-md transition ${
                settings.dateSystem === 'AD'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              AD
            </button>
          </div>

          {/* Quick Add Button */}
          <button
            id="btn-quick-add"
            onClick={() => openQuickAction('student')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shadow-indigo-600/20 transition active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Quick Add</span>
          </button>

          {/* Google Sign In / Account Profile Button */}
          {currentUser ? (
            <button
              id="btn-navbar-user-profile"
              onClick={openAuthModal}
              className="flex items-center gap-2 p-1 sm:px-2.5 sm:py-1 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700/60 transition group text-left"
              title="Manage Google Account & Cloud Sync"
            >
              <div className="relative">
                {currentUser.photoURL ? (
                  <img
                    src={currentUser.photoURL}
                    alt={currentUser.displayName || 'Teacher'}
                    referrerPolicy="no-referrer"
                    className="w-7 h-7 rounded-full object-cover border border-indigo-500/50"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center">
                    {(currentUser.displayName || currentUser.email || 'T')[0].toUpperCase()}
                  </div>
                )}
                {/* Cloud Sync Status Indicator */}
                <span
                  className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-slate-800 ${
                    syncStatus === 'synced'
                      ? 'bg-emerald-500'
                      : isSyncing || syncStatus === 'syncing'
                      ? 'bg-amber-500 animate-ping'
                      : 'bg-indigo-500'
                  }`}
                  title={syncStatus === 'synced' ? 'Synced with Cloud' : 'Syncing...'}
                />
              </div>
              <div className="hidden md:block max-w-[110px] truncate text-left">
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate leading-tight">
                  {currentUser.displayName?.split(' ')[0] || 'Teacher'}
                </p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                  Cloud Synced
                </p>
              </div>
            </button>
          ) : (
            <button
              id="btn-navbar-auth-login"
              onClick={openAuthModal}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition active:scale-95"
              title="Sign In or Register to sync and backup your data"
            >
              <LogIn className="w-4 h-4 shrink-0" />
              <span>Sign In / Register</span>
            </button>
          )}

          {/* Notifications Trigger */}
          <button
            id="btn-notifications-trigger"
            onClick={() => setIsNotificationOpen(true)}
            className="relative p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            aria-label="View notifications and reminders"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-xs animate-bounce">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Reset Data Trigger */}
          <button
            id="btn-navbar-reset-data"
            onClick={() => openResetModal('all')}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 hover:bg-rose-100 dark:hover:bg-rose-900/40 transition shadow-2xs"
            title="Reset Data (Delete All, Teacher, Students, or Colleges Only)"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>

          {/* Theme Toggle */}
          <button
            id="btn-theme-toggle"
            onClick={toggleTheme}
            className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            title={`Switch to ${isDarkMode ? 'Light' : 'Dark'} Mode`}
            aria-label="Toggle theme"
          >
            {isDarkMode ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-slate-700" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
