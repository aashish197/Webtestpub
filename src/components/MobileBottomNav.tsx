import React from 'react';
import { useApp } from '../context/AppContext';
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  CreditCard,
  Menu,
  Plus,
  GraduationCap,
  School,
  Settings,
} from 'lucide-react';

export const MobileBottomNav: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    toggleSidebar,
    openQuickAction,
    classesScheduledTodayCount,
    overduePayments,
    appMode,
    setAppMode,
  } = useApp();

  if (appMode === 'student') {
    return (
      <nav
        id="mobile-bottom-navigation-student"
        aria-label="Student Mobile Navigation"
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur border-t border-slate-200 dark:border-slate-800 px-3 py-1.5 shadow-lg flex items-center justify-around"
      >
        <button
          id="btn-bottom-tab-student-hub"
          onClick={() => setActiveTab('student_hub')}
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition ${
            activeTab !== 'settings'
              ? 'text-purple-600 dark:text-purple-400 font-bold'
              : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <GraduationCap className="w-5 h-5 stroke-[2.2px]" />
          <span className="text-[10px] tracking-tight mt-0.5 whitespace-nowrap">Study Hub</span>
        </button>

        <button
          id="btn-bottom-switch-teacher"
          type="button"
          onClick={() => setAppMode('teacher')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-600 text-white font-bold text-xs shadow-md shadow-indigo-600/30 active:scale-95 transition"
          title="Switch to Teacher Mode"
        >
          <School className="w-4 h-4" />
          <span>Teacher Mode</span>
        </button>

        <button
          id="btn-bottom-tab-student-settings"
          onClick={() => setActiveTab('settings')}
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition ${
            activeTab === 'settings'
              ? 'text-purple-600 dark:text-purple-400 font-bold'
              : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <Settings className="w-5 h-5 stroke-[1.8px]" />
          <span className="text-[10px] tracking-tight mt-0.5 whitespace-nowrap">Settings</span>
        </button>

        <button
          id="btn-bottom-student-drawer"
          onClick={toggleSidebar}
          className="flex flex-col items-center justify-center py-1 px-3 rounded-xl text-slate-500 dark:text-slate-400 hover:text-purple-600 transition"
          aria-label="Open sidebar"
        >
          <Menu className="w-5 h-5 stroke-[1.8px]" />
          <span className="text-[10px] tracking-tight mt-0.5 whitespace-nowrap">Menu</span>
        </button>
      </nav>
    );
  }

  return (
    <nav
      id="mobile-bottom-navigation"
      aria-label="Mobile Navigation"
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur border-t border-slate-200 dark:border-slate-800 px-2 py-1.5 shadow-lg flex items-center justify-around"
    >
      {/* 1. Dashboard */}
      <button
        id="btn-bottom-tab-dashboard"
        onClick={() => setActiveTab('dashboard')}
        className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition min-w-[50px] ${
          activeTab === 'dashboard'
            ? 'text-indigo-600 dark:text-indigo-400 font-bold'
            : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
        }`}
      >
        <LayoutDashboard className={`w-5 h-5 transition ${activeTab === 'dashboard' ? 'stroke-[2.5px] scale-105' : 'stroke-[1.8px]'}`} />
        <span className="text-[10px] tracking-tight mt-0.5 whitespace-nowrap">Dashboard</span>
      </button>

      {/* 2. Routine */}
      <button
        id="btn-bottom-tab-routine"
        onClick={() => setActiveTab('routine')}
        className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition relative min-w-[50px] ${
          activeTab === 'routine' || activeTab === 'classes'
            ? 'text-indigo-600 dark:text-indigo-400 font-bold'
            : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
        }`}
      >
        <div className="relative">
          <CalendarDays className={`w-5 h-5 transition ${activeTab === 'routine' || activeTab === 'classes' ? 'stroke-[2.5px] scale-105' : 'stroke-[1.8px]'}`} />
          {classesScheduledTodayCount > 0 && (
            <span className="absolute -top-1 -right-2 px-1 min-w-[15px] h-[15px] rounded-full bg-indigo-600 text-white text-[9px] font-bold flex items-center justify-center">
              {classesScheduledTodayCount}
            </span>
          )}
        </div>
        <span className="text-[10px] tracking-tight mt-0.5 whitespace-nowrap">Routine</span>
      </button>

      {/* 3. Center Quick Add Button */}
      <button
        id="btn-bottom-quick-add"
        onClick={() => openQuickAction('student')}
        className="flex flex-col items-center justify-center -mt-4 p-2.5 rounded-full bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-700 active:scale-95 transition"
        title="Quick Add Student, Payment, Class, etc."
        aria-label="Quick Add"
      >
        <Plus className="w-5 h-5 stroke-[2.5px]" />
      </button>

      {/* 4. Students */}
      <button
        id="btn-bottom-tab-students"
        onClick={() => setActiveTab('students')}
        className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition min-w-[50px] ${
          activeTab === 'students'
            ? 'text-indigo-600 dark:text-indigo-400 font-bold'
            : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
        }`}
      >
        <Users className={`w-5 h-5 transition ${activeTab === 'students' ? 'stroke-[2.5px] scale-105' : 'stroke-[1.8px]'}`} />
        <span className="text-[10px] tracking-tight mt-0.5 whitespace-nowrap">Students</span>
      </button>

      {/* 5. Payments */}
      <button
        id="btn-bottom-tab-payments"
        onClick={() => setActiveTab('payments')}
        className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition relative min-w-[50px] ${
          activeTab === 'payments'
            ? 'text-indigo-600 dark:text-indigo-400 font-bold'
            : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
        }`}
      >
        <div className="relative">
          <CreditCard className={`w-5 h-5 transition ${activeTab === 'payments' ? 'stroke-[2.5px] scale-105' : 'stroke-[1.8px]'}`} />
          {overduePayments.length > 0 && (
            <span className="absolute -top-1 -right-2 px-1 min-w-[15px] h-[15px] rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center">
              {overduePayments.length}
            </span>
          )}
        </div>
        <span className="text-[10px] tracking-tight mt-0.5 whitespace-nowrap">Payments</span>
      </button>

      {/* 6. More Menu Trigger */}
      <button
        id="btn-bottom-menu-drawer"
        onClick={toggleSidebar}
        className="flex flex-col items-center justify-center py-1 px-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition min-w-[50px]"
        aria-label="Open full menu"
      >
        <Menu className="w-5 h-5 stroke-[1.8px]" />
        <span className="text-[10px] tracking-tight mt-0.5 whitespace-nowrap">More</span>
      </button>
    </nav>
  );
};
