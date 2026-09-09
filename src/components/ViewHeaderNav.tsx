import React from 'react';
import { useApp } from '../context/AppContext';
import {
  ArrowLeft,
  LayoutDashboard,
  Users,
  Building2,
  GraduationCap,
  CalendarDays,
  UserCheck,
  CreditCard,
  Award,
  TrendingUp,
  Sliders,
  FileSpreadsheet,
  Settings,
  ChevronRight,
  Menu,
} from 'lucide-react';

const TAB_CONFIG: Record<
  string,
  { label: string; icon: React.ComponentType<{ className?: string }>; description: string }
> = {
  dashboard: {
    label: 'Dashboard',
    icon: LayoutDashboard,
    description: 'Overview & daily teaching schedule',
  },
  students: {
    label: 'Students',
    icon: Users,
    description: 'Manage tuition students, fee rates & milestones',
  },
  institutions: {
    label: 'Colleges & Institutions',
    icon: Building2,
    description: 'Colleges, campuses, contract rates & period timings',
  },
  classes: {
    label: 'Classes & Batches',
    icon: GraduationCap,
    description: 'All active classes, subjects, timings & start dates',
  },
  routine: {
    label: 'Routine & Timetable',
    icon: CalendarDays,
    description: 'Weekly schedule & hourly teaching calendar',
  },
  attendance: {
    label: 'Attendance',
    icon: UserCheck,
    description: 'Mark daily attendance, college periods & logs',
  },
  payments: {
    label: 'Payments & Fees',
    icon: CreditCard,
    description: 'Tuition fees, dues, college salary & reminders',
  },
  performance: {
    label: 'Performance',
    icon: Award,
    description: 'Exam marks, tests, percentage & progress grades',
  },
  income: {
    label: 'Income & Salary',
    icon: TrendingUp,
    description: 'Monthly earnings, college payouts & financial trends',
  },
  calculator: {
    label: 'Work & Earnings Calc',
    icon: Sliders,
    description: 'Daily workload, rest hours & income rate calculator',
  },
  reports: {
    label: 'Reports & Export',
    icon: FileSpreadsheet,
    description: 'CSV export, summaries & data backup/restore',
  },
  settings: {
    label: 'Settings',
    icon: Settings,
    description: 'Profile, AD/BS calendar, reminders & preferences',
  },
};

export const ViewHeaderNav: React.FC = () => {
  const { activeTab, setActiveTab, toggleSidebar } = useApp();

  const currentConfig = TAB_CONFIG[activeTab] || TAB_CONFIG.dashboard;
  const Icon = currentConfig.icon;

  return (
    <div className="mb-6 space-y-3">
      {/* Top Breadcrumb Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-2.5 sm:px-4 sm:py-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-2 flex-wrap">
          {/* If not on dashboard, show Back to Dashboard button */}
          {activeTab !== 'dashboard' ? (
            <button
              id="btn-back-to-dashboard"
              onClick={() => setActiveTab('dashboard')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 text-xs font-bold transition shadow-2xs group"
              title="Return to main dashboard overview"
            >
              <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
              <span>Back to Dashboard</span>
            </button>
          ) : (
            <button
              onClick={toggleSidebar}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 text-xs font-bold transition shadow-2xs hover:bg-indigo-100"
              title="Open Navigation Menu"
            >
              <Menu className="w-3.5 h-3.5" />
              <span>All Tabs Menu</span>
            </button>
          )}

          <ChevronRight className="w-3.5 h-3.5 text-slate-400 hidden sm:inline" />

          {/* Current Page Badge */}
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50/70 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 text-xs font-semibold">
            <Icon className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>{currentConfig.label}</span>
          </div>
        </div>

        {/* Quick Tab Switcher Shortcuts */}
        <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-1 sm:pb-0 scrollbar-none">
          <span className="text-[11px] text-slate-600 dark:text-slate-300 font-semibold uppercase hidden md:inline mr-1">
            Jump to:
          </span>
          {[
            { id: 'dashboard', label: 'Dashboard' },
            { id: 'students', label: 'Students' },
            { id: 'routine', label: 'Routine' },
            { id: 'attendance', label: 'Attendance' },
            { id: 'payments', label: 'Payments' },
            { id: 'calculator', label: 'Calculator' },
            { id: 'income', label: 'Income' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition whitespace-nowrap ${
                activeTab === item.id
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
