import React from 'react';
import { useApp } from '../context/AppContext';
import {
  LayoutDashboard,
  Users,
  Building2,
  GraduationCap,
  CalendarDays,
  UserCheck,
  CreditCard,
  Award,
  TrendingUp,
  FileSpreadsheet,
  Settings,
  X,
  Clock,
  AlertCircle,
  Sliders,
  School,
  Sparkles,
  BookOpen,
} from 'lucide-react';

interface SidebarProps {
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isMobileOpen, onCloseMobile }) => {
  const {
    activeTab,
    setActiveTab,
    classesScheduledTodayCount,
    overduePayments,
    activeStudentsCount,
    institutions,
    settings,
    isSidebarOpen,
    closeSidebar,
    currentUser,
    openAuthModal,
    syncStatus,
    isSyncing,
    appMode,
    setAppMode,
    studentProfile,
    studentClasses,
    studentExams,
  } = useApp();

  const isOpen = isMobileOpen !== undefined ? isMobileOpen : isSidebarOpen;
  const handleClose = onCloseMobile || closeSidebar;

  const teacherNavItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    {
      id: 'students',
      label: 'Students',
      icon: Users,
      badge: activeStudentsCount > 0 ? `${activeStudentsCount}` : undefined,
    },
    {
      id: 'institutions',
      label: 'Colleges & Institutions',
      icon: Building2,
      badge: institutions.length > 0 ? `${institutions.length}` : undefined,
    },
    {
      id: 'routine',
      label: 'Classes & Routine',
      icon: CalendarDays,
      badge: classesScheduledTodayCount > 0 ? `${classesScheduledTodayCount} today` : undefined,
      badgeColor: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300',
    },
    { id: 'attendance', label: 'Attendance', icon: UserCheck },
    {
      id: 'payments',
      label: 'Payments & Fees',
      icon: CreditCard,
      badge: overduePayments.length > 0 ? `${overduePayments.length} due` : undefined,
      badgeColor: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300',
    },
    { id: 'performance', label: 'Performance', icon: Award },
    { id: 'income', label: 'Income & Salary', icon: TrendingUp },
    { id: 'calculator', label: 'Work & Earnings Calc', icon: Sliders },
    { id: 'reports', label: 'Reports & Export', icon: FileSpreadsheet },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const studentNavItems = [
    {
      id: 'student_hub',
      label: 'Student Workspace',
      icon: GraduationCap,
      badge: `${studentClasses.length} classes`,
      badgeColor: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
    },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const navItems = appMode === 'student' ? studentNavItems : teacherNavItems;

  const handleSelectTab = (tabId: string) => {
    setActiveTab(tabId);
    handleClose();
  };

  return (
    <>
      {/* Mobile / Tablet Backdrop Overlay */}
      {isOpen && (
        <div
          id="sidebar-backdrop"
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-xs lg:hidden transition-opacity"
          onClick={handleClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        id="app-main-sidebar"
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 sm:w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col transition-transform duration-200 ease-in-out shadow-xl lg:shadow-none lg:static lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Mobile Header with Close & Home */}
        <div className="p-4 flex items-center justify-between border-b border-slate-200 dark:border-slate-800 lg:hidden">
          <button
            onClick={() => handleSelectTab('dashboard')}
            className="flex items-center gap-2 text-left"
          >
            <span className="font-bold text-slate-900 dark:text-white text-base">
              Teacher<span className="text-indigo-600 dark:text-indigo-400">Desk</span>
            </span>
          </button>
          <button
            id="btn-close-sidebar-mobile"
            onClick={handleClose}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            aria-label="Close navigation sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Switcher inside Sidebar */}
        <div className="px-3 pt-3">
          <div className="p-1 rounded-xl bg-slate-100 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 flex items-center gap-1 shadow-2xs">
            <button
              id="sidebar-btn-mode-teacher"
              type="button"
              onClick={() => setAppMode('teacher')}
              className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all active:scale-95 flex items-center justify-center gap-1.5 ${
                appMode === 'teacher'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <School className="w-3.5 h-3.5" />
              <span>Teacher</span>
            </button>
            <button
              id="sidebar-btn-mode-student"
              type="button"
              onClick={() => setAppMode('student')}
              className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all active:scale-95 flex items-center justify-center gap-1.5 ${
                appMode === 'student'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5" />
              <span>Student</span>
            </button>
          </div>
        </div>

        {/* Profile Summary Card in Sidebar (Teacher vs Student) */}
        {(() => {
          if (appMode === 'student') {
            const studentDisplayName = studentProfile?.studentName || 'Student';
            const initials = studentDisplayName
              .split(' ')
              .filter(Boolean)
              .map((n) => n[0])
              .slice(0, 2)
              .join('')
              .toUpperCase() || 'S';

            return (
              <div
                id="sidebar-student-profile"
                className="p-3 m-3 rounded-2xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200/80 dark:border-purple-800/40 transition"
              >
                <div className="flex items-center gap-3">
                  <div className="relative shrink-0">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 text-white font-bold text-sm flex items-center justify-center shadow-xs">
                      {initials}
                    </div>
                    <span
                      className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-purple-500 border-2 border-white dark:border-slate-900 shadow-xs"
                      title="Student Mode Active"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {studentDisplayName}
                      </p>
                      <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300">
                        Class {studentProfile?.grade || '11'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                      {studentProfile?.schoolName || 'School & Tuition Hub'}
                    </p>
                  </div>
                </div>
              </div>
            );
          }

          const teacherDisplayName = currentUser?.displayName || settings.teacherName || 'Teacher';
          const teacherPhoto = currentUser?.photoURL;
          const initials = teacherDisplayName
            .split(' ')
            .filter(Boolean)
            .map((n) => n[0])
            .slice(0, 2)
            .join('')
            .toUpperCase() || 'T';

          return (
            <div
              id="sidebar-teacher-profile"
              onClick={openAuthModal}
              title={currentUser ? 'Click to view Educator Account & Cloud Sync' : 'Click to Sign In or Register'}
              className="p-3 m-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 hover:bg-indigo-50/50 dark:hover:bg-slate-800/90 hover:border-indigo-200 dark:hover:border-indigo-900/60 transition cursor-pointer group"
            >
              <div className="flex items-center gap-3">
                <div className="relative shrink-0">
                  {teacherPhoto ? (
                    <img
                      src={teacherPhoto}
                      alt={teacherDisplayName}
                      referrerPolicy="no-referrer"
                      className="w-10 h-10 rounded-full object-cover border-2 border-indigo-500 shadow-xs group-hover:scale-105 transition"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-indigo-700 text-white font-bold text-sm flex items-center justify-center shadow-xs group-hover:scale-105 transition">
                      {initials}
                    </div>
                  )}
                  {currentUser && (
                    <span
                      className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900 shadow-xs"
                      title="Cloud Synced"
                    />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {teacherDisplayName}
                    </p>
                    {currentUser && (
                      <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300">
                        Synced
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                    {settings.specialization || 'Tutor & Lecturer'}
                  </p>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Navigation Items */}
        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id || (item.id === 'routine' && activeTab === 'classes');
            return (
              <button
                key={item.id}
                id={`nav-item-${item.id}`}
                onClick={() => handleSelectTab(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 font-semibold shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 transition ${
                      isActive
                        ? 'text-indigo-600 dark:text-indigo-400'
                        : 'text-slate-400 dark:text-slate-500'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>

                {item.badge && (
                  <span
                    className={`px-2 py-0.5 text-[11px] font-semibold rounded-full ${
                      item.badgeColor ||
                      'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom Google Account & Cloud Status */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-800">
          {currentUser ? (
            <button
              id="btn-sidebar-user-profile"
              onClick={openAuthModal}
              className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-750 border border-slate-200/80 dark:border-slate-700/60 transition text-left flex items-center gap-2.5 group"
            >
              {currentUser.photoURL ? (
                <img
                  src={currentUser.photoURL}
                  alt={currentUser.displayName || 'Teacher'}
                  referrerPolicy="no-referrer"
                  className="w-8 h-8 rounded-full object-cover border border-indigo-500/50 shrink-0"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                  {(currentUser.displayName || currentUser.email || 'T')[0].toUpperCase()}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                  {currentUser.displayName || 'Teacher'}
                </p>
                <div className="flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Google Cloud Synced</span>
                </div>
              </div>
            </button>
          ) : (
            <button
              id="btn-sidebar-google-signin"
              onClick={openAuthModal}
              className="w-full py-2 px-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 border border-indigo-200/80 dark:border-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-semibold text-xs transition flex items-center justify-center gap-2"
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
          )}

          <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800/80 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
            <span>Date: <strong>{settings.dateSystem}</strong></span>
            <span>Currency: <strong>{settings.currency}</strong></span>
          </div>
        </div>
      </aside>
    </>
  );
};
