import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Users,
  GraduationCap,
  Calendar,
  CreditCard,
  TrendingUp,
  Clock,
  Award,
  AlertCircle,
  Plus,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Copy,
  Check,
  ChevronRight,
  Sparkles,
  DollarSign,
  Building2,
  BookOpen,
  Coffee,
  Sliders,
} from 'lucide-react';
import { formatCurrency, formatTime, generatePaymentReminderText, calculateGrade } from '../utils/formatters';
import { formatDisplayDate, getTodayIso } from '../utils/nepaliCalendar';
import confetti from 'canvas-confetti';

export const Dashboard: React.FC = () => {
  const {
    settings,
    todayClasses,
    todayDayName,
    activeStudentsCount,
    classesScheduledTodayCount,
    pendingPayments,
    overduePayments,
    currentMonthTuitionIncome,
    currentMonthCollegeIncome,
    totalWorkingHoursThisMonth,
    totalClassesThisMonth,
    attendance,
    markAttendance,
    performance,
    setActiveTab,
    openQuickAction,
    students,
    institutions,
  } = useApp();

  const [copiedPayId, setCopiedPayId] = useState<string | null>(null);
  const todayIso = getTodayIso();

  // Check today's marked attendance status for each class
  const getTodayAttendanceForClass = (classId: string) => {
    return attendance.find((a) => a.classId === classId && a.date === todayIso);
  };

  const handleQuickMarkAttendance = (
    cls: (typeof todayClasses)[0],
    status: 'present' | 'absent' | 'cancelled'
  ) => {
    let targetName = cls.title;
    if (cls.type === 'home_tuition') {
      const student = students.find((s) => s.id === cls.studentId);
      if (student) targetName = student.name;
      if (cls.groupName) targetName = cls.groupName;
    } else if (cls.type === 'college') {
      const inst = institutions.find((i) => i.id === cls.institutionId);
      if (inst) targetName = inst.name;
    }

    markAttendance({
      date: todayIso,
      classId: cls.id,
      type: cls.type,
      studentId: cls.studentId,
      institutionId: cls.institutionId,
      targetName,
      subject: cls.subject,
      startTime: cls.startTime,
      endTime: cls.endTime,
      durationMinutes: cls.durationMinutes,
      periodsCount: cls.type === 'college' ? 1 : undefined,
      status,
      notes: `Quick marked from dashboard as ${status}`,
    });

    if (status === 'present') {
      confetti({
        particleCount: 25,
        spread: 45,
        origin: { y: 0.8 },
      });
    }
  };

  const handleCopyReminder = (payment: (typeof overduePayments)[0]) => {
    const student = students.find((s) => s.id === payment.studentId);
    const parentName = student ? student.parentName : '';
    const text = generatePaymentReminderText(
      payment.targetName,
      parentName,
      payment.remainingBalance,
      payment.periodMonthYear,
      payment.dueDate || 'due date',
      settings.teacherName,
      student?.paymentMethod || 'eSewa / Cash'
    );

    navigator.clipboard.writeText(text);
    setCopiedPayId(payment.id);
    setTimeout(() => setCopiedPayId(null), 2500);
  };

  // Today Work vs Rest
  const todayWorkMinutes = todayClasses.reduce((acc, c) => acc + (c.durationMinutes || 60), 0);
  const todayWorkHours = Math.round((todayWorkMinutes / 60) * 10) / 10;
  const todayRestHours = Math.max(0, Math.round((24 - todayWorkHours) * 10) / 10);

  // Quick Monthly / Weekly / Daily / Hourly Earnings
  const projectedMonthlyIncome = (currentMonthTuitionIncome.received + currentMonthTuitionIncome.pending) +
    (currentMonthCollegeIncome.received + currentMonthCollegeIncome.pending);
  const avgWeeklyIncome = Math.round(projectedMonthlyIncome / 4.33);
  const avgDailyIncome = Math.round(projectedMonthlyIncome / 26);
  const effectiveHourlyRate = totalWorkingHoursThisMonth > 0
    ? Math.round(projectedMonthlyIncome / totalWorkingHoursThisMonth)
    : 0;

  // Recent 4 performance records
  const recentPerformances = [...performance]
    .sort((a, b) => (b.date > a.date ? 1 : -1))
    .slice(0, 4);

  return (
    <div className="space-y-6 pb-10">
      {/* Welcome & Quick Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-gradient-to-r from-indigo-900 to-slate-900 dark:from-slate-900 dark:to-indigo-950 p-5 sm:p-6 rounded-2xl text-white shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 text-xs font-semibold border border-indigo-400/30">
              {settings.dateSystem === 'BS' ? 'Bikram Sambat' : 'AD Calendar'}
            </span>
            <span className="text-xs text-slate-300">
              {todayDayName}, {formatDisplayDate(todayIso, settings.dateSystem, 'long')}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold mt-1.5 tracking-tight">
            Welcome back, {settings.teacherName.split(' ')[0] || 'Teacher'} 👋
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
            You have <strong className="text-white">{todayClasses.length} classes</strong> scheduled
            today and <strong className="text-white">{activeStudentsCount} active students</strong>.
          </p>
        </div>

        {/* Quick Action Pills */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            id="btn-dash-add-student"
            onClick={() => openQuickAction('student')}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-white transition active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Student</span>
          </button>
          <button
            id="btn-dash-record-payment"
            onClick={() => openQuickAction('payment')}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/30 text-emerald-200 transition active:scale-95"
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Record Payment</span>
          </button>
          <button
            id="btn-dash-mark-attendance"
            onClick={() => setActiveTab('attendance')}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-white transition active:scale-95"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Mark Attendance</span>
          </button>
        </div>
      </div>

      {/* Main KPI Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: Today's Classes */}
        <div
          onClick={() => setActiveTab('routine')}
          className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-indigo-300 dark:hover:border-indigo-800 transition cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Classes Today
            </span>
            <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 dark:text-white">
              {classesScheduledTodayCount}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">scheduled</span>
          </div>
          <div className="mt-2 text-[11px] text-indigo-600 dark:text-indigo-400 font-medium flex items-center gap-1">
            <span>View Timetable</span>
            <ChevronRight className="w-3 h-3" />
          </div>
        </div>

        {/* Card 2: Active Students */}
        <div
          onClick={() => setActiveTab('students')}
          className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-teal-300 dark:hover:border-teal-800 transition cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Active Students
            </span>
            <div className="p-2 rounded-lg bg-teal-50 dark:bg-teal-950/50 text-teal-600 dark:text-teal-400">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 dark:text-white">
              {activeStudentsCount}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">home & group</span>
          </div>
          <div className="mt-2 text-[11px] text-teal-600 dark:text-teal-400 font-medium flex items-center gap-1">
            <span>Manage Profiles</span>
            <ChevronRight className="w-3 h-3" />
          </div>
        </div>

        {/* Card 3: Monthly Tuition Income */}
        <div
          onClick={() => setActiveTab('income')}
          className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-emerald-300 dark:hover:border-emerald-800 transition cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Tuition Received
            </span>
            <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold text-slate-900 dark:text-white">
              {formatCurrency(currentMonthTuitionIncome.received, settings.currency)}
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
            <span>Pending: {formatCurrency(currentMonthTuitionIncome.pending, settings.currency)}</span>
          </div>
        </div>

        {/* Card 4: College Salary & Teaching Hours */}
        <div
          onClick={() => setActiveTab('income')}
          className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-purple-300 dark:hover:border-purple-800 transition cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              College & Total Hours
            </span>
            <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 dark:text-white">
              {totalWorkingHoursThisMonth}h
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">({totalClassesThisMonth} classes)</span>
          </div>
          <div className="mt-2 text-[11px] text-purple-600 dark:text-purple-400 font-medium flex items-center gap-1">
            <span>Salary: {formatCurrency(currentMonthCollegeIncome.received, settings.currency)}</span>
            <ChevronRight className="w-3 h-3" />
          </div>
        </div>
      </div>

      {/* Workload, Rest & Multi-Tier Earnings Bar */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-4 sm:p-5 text-white shadow-xs border border-indigo-900/40">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Work vs Rest Section */}
          <div className="flex flex-wrap items-center gap-4 sm:gap-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] uppercase tracking-wider text-indigo-300 font-semibold">
                  Today's Teaching Load
                </span>
                <p className="text-xl font-bold text-white">
                  {todayWorkHours} hrs <span className="text-xs font-normal text-slate-300">({todayWorkMinutes} mins)</span>
                </p>
              </div>
            </div>

            <div className="h-8 w-px bg-white/10 hidden sm:block" />

            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                <Coffee className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] uppercase tracking-wider text-emerald-300 font-semibold">
                  Daily Rest & Recovery
                </span>
                <p className="text-xl font-bold text-white">
                  {todayRestHours} hrs <span className="text-xs font-normal text-slate-300">({Math.round((todayRestHours / 24) * 100)}% of day)</span>
                </p>
              </div>
            </div>
          </div>

          {/* Earnings Per Hr / Day / Week / Month mini ticker */}
          <div className="flex flex-wrap items-center gap-3 sm:gap-4 bg-white/5 rounded-xl p-2.5 sm:px-4 sm:py-2.5 border border-white/10">
            <div>
              <span className="text-[10px] text-slate-400 block uppercase font-medium">Per Hour</span>
              <span className="text-xs sm:text-sm font-bold text-amber-300">
                {formatCurrency(effectiveHourlyRate, settings.currency)}/hr
              </span>
            </div>
            <span className="text-slate-600">•</span>
            <div>
              <span className="text-[10px] text-slate-400 block uppercase font-medium">Per Day</span>
              <span className="text-xs sm:text-sm font-bold text-teal-300">
                {formatCurrency(avgDailyIncome, settings.currency)}/day
              </span>
            </div>
            <span className="text-slate-600">•</span>
            <div>
              <span className="text-[10px] text-slate-400 block uppercase font-medium">Per Week</span>
              <span className="text-xs sm:text-sm font-bold text-indigo-300">
                {formatCurrency(avgWeeklyIncome, settings.currency)}/wk
              </span>
            </div>
            <span className="text-slate-600">•</span>
            <div>
              <span className="text-[10px] text-slate-400 block uppercase font-medium">Per Month</span>
              <span className="text-xs sm:text-sm font-bold text-emerald-300">
                {formatCurrency(projectedMonthlyIncome, settings.currency)}/mo
              </span>
            </div>

            <button
              onClick={() => setActiveTab('calculator')}
              className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-xs transition active:scale-95"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Full Calculator</span>
            </button>
          </div>
        </div>
      </div>

      {/* Two-Column Section: Today's Schedule & Attendance vs Payment Reminders */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Today's Routine & One-Click Attendance */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Clock className="w-4 h-4 text-indigo-600" />
                  Today's Teaching Schedule
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {todayClasses.length === 0
                    ? 'No classes scheduled for today'
                    : 'Mark attendance with one tap as you finish each class'}
                </p>
              </div>

              <button
                onClick={() => setActiveTab('routine')}
                className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                Full Routine →
              </button>
            </div>

            <div className="mt-4 space-y-3">
              {todayClasses.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    No classes scheduled for {todayDayName}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Enjoy your day or schedule an extra class.
                  </p>
                  <button
                    onClick={() => openQuickAction('class')}
                    className="mt-3 px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100"
                  >
                    + Schedule a Class
                  </button>
                </div>
              ) : (
                todayClasses.map((cls) => {
                  const att = getTodayAttendanceForClass(cls.id);
                  const isMarked = !!att;
                  const isCollege = cls.type === 'college';

                  return (
                    <div
                      key={cls.id}
                      className={`p-3.5 rounded-xl border transition-all ${
                        isMarked
                          ? att.status === 'present'
                            ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/50'
                            : att.status === 'absent'
                            ? 'bg-rose-50/40 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800/50'
                            : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700'
                          : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        {/* Time & Class Details */}
                        <div className="flex items-start gap-3">
                          <div
                            className="w-2.5 h-12 rounded-full shrink-0"
                            style={{ backgroundColor: cls.color || '#3b82f6' }}
                          />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-slate-900 dark:text-white">
                                {formatTime(cls.startTime, settings.timeFormat)} -{' '}
                                {formatTime(cls.endTime, settings.timeFormat)}
                              </span>
                              <span
                                className={`px-2 py-0.5 text-[10px] font-bold rounded-md ${
                                  isCollege
                                    ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300'
                                    : 'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300'
                                }`}
                              >
                                {isCollege ? 'College' : 'Home Tuition'}
                              </span>
                              {cls.dateSpecificSchedules?.some((s) => s.date === todayIso) && (
                                <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                                  ★ Date Override
                                </span>
                              )}
                            </div>
                            <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                              {cls.title}
                            </h4>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              Subject: <strong className="text-slate-700 dark:text-slate-300">{cls.subject}</strong> • {cls.location}
                            </p>
                          </div>
                        </div>

                        {/* Quick Attendance Action Buttons */}
                        <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                          {isMarked ? (
                            <div className="flex items-center gap-2">
                              <span
                                className={`px-2.5 py-1 text-xs font-bold rounded-lg ${
                                  att.status === 'present'
                                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
                                    : att.status === 'absent'
                                    ? 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300'
                                    : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                                }`}
                              >
                                ✓ {att.status.toUpperCase()}
                              </span>
                              <button
                                onClick={() => handleQuickMarkAttendance(cls, att.status === 'present' ? 'absent' : 'present')}
                                title="Change status"
                                className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleQuickMarkAttendance(cls, 'present')}
                                className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Present</span>
                              </button>
                              <button
                                onClick={() => handleQuickMarkAttendance(cls, 'absent')}
                                className="px-2 py-1.5 text-xs font-medium rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-800/40 transition"
                              >
                                Absent
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Recent Student Academic Updates */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Award className="w-4 h-4 text-indigo-600" />
                Recent Student Academic Performance
              </h3>
              <button
                onClick={() => setActiveTab('performance')}
                className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                All Tests →
              </button>
            </div>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {recentPerformances.map((perf) => {
                const { grade, color } = calculateGrade(perf.percentage);
                return (
                  <div
                    key={perf.id}
                    className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {perf.studentName}
                        </h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          {perf.subject} • {perf.examName}
                        </p>
                      </div>
                      <span className={`px-2 py-0.5 text-xs font-extrabold rounded-md border ${color}`}>
                        {grade} ({perf.percentage}%)
                      </span>
                    </div>

                    <div className="mt-2 text-xs text-slate-600 dark:text-slate-300 flex items-center justify-between border-t border-slate-200/60 dark:border-slate-700/60 pt-2">
                      <span>Score: {perf.obtainedMarks}/{perf.fullMarks}</span>
                      <span className="text-[11px] text-slate-400">
                        {formatDisplayDate(perf.date, settings.dateSystem, 'short')}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Col: Overdue & Upcoming Payment Reminders */}
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600" />
                Payment Reminders
              </h3>
              <button
                onClick={() => setActiveTab('payments')}
                className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                View Ledger →
              </button>
            </div>

            <div className="mt-4 space-y-3">
              {overduePayments.length === 0 && pendingPayments.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">
                    All tuition fees up to date!
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    No overdue payments or pending reminders.
                  </p>
                </div>
              ) : (
                [...overduePayments, ...pendingPayments.filter((p) => !overduePayments.includes(p))]
                  .slice(0, 4)
                  .map((payment) => {
                    const isOverdue = payment.status === 'overdue' || (payment.dueDate && payment.dueDate < todayIso);
                    const isCopied = copiedPayId === payment.id;

                    return (
                      <div
                        key={payment.id}
                        className={`p-3 rounded-xl border ${
                          isOverdue
                            ? 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800/60'
                            : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span
                              className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                isOverdue
                                  ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300'
                                  : 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300'
                              }`}
                            >
                              {isOverdue ? 'OVERDUE' : 'PENDING'}
                            </span>
                            <h4 className="text-xs font-bold text-slate-900 dark:text-white mt-1">
                              {payment.targetName}
                            </h4>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              Due: {formatDisplayDate(payment.dueDate, settings.dateSystem, 'medium')}
                            </p>
                          </div>

                          <div className="text-right">
                            <span className="text-sm font-bold text-slate-900 dark:text-white block">
                              {formatCurrency(payment.remainingBalance, settings.currency)}
                            </span>
                            <span className="text-[10px] text-slate-400">balance</span>
                          </div>
                        </div>

                        {/* Copy Reminder Message button */}
                        <div className="mt-3 flex items-center justify-between gap-2 border-t border-slate-200/60 dark:border-slate-700/60 pt-2">
                          <button
                            id={`btn-copy-reminder-${payment.id}`}
                            onClick={() => handleCopyReminder(payment)}
                            className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 transition"
                          >
                            {isCopied ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-600" />
                                <span>Copied!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" />
                                <span>Copy Reminder</span>
                              </>
                            )}
                          </button>

                          <button
                            onClick={() => openQuickAction('payment')}
                            className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
                          >
                            Pay Now
                          </button>
                        </div>
                      </div>
                    );
                  })
              )}
            </div>
          </div>

          {/* Quick Action Navigation Shortcuts */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3">
              Teacher Shortcuts
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => openQuickAction('performance')}
                className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-slate-700 dark:text-slate-200 hover:text-indigo-600 text-xs font-semibold flex items-center gap-2 border border-slate-200/60 dark:border-slate-700/60 transition"
              >
                <Award className="w-4 h-4 text-indigo-500" />
                <span>+ Add Marks</span>
              </button>
              <button
                onClick={() => openQuickAction('class')}
                className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-slate-700 dark:text-slate-200 hover:text-indigo-600 text-xs font-semibold flex items-center gap-2 border border-slate-200/60 dark:border-slate-700/60 transition"
              >
                <GraduationCap className="w-4 h-4 text-purple-500" />
                <span>+ Add Class</span>
              </button>
              <button
                onClick={() => openQuickAction('institution')}
                className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-slate-700 dark:text-slate-200 hover:text-indigo-600 text-xs font-semibold flex items-center gap-2 border border-slate-200/60 dark:border-slate-700/60 transition"
              >
                <Building2 className="w-4 h-4 text-blue-500" />
                <span>+ College</span>
              </button>
              <button
                onClick={() => setActiveTab('reports')}
                className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-slate-700 dark:text-slate-200 hover:text-indigo-600 text-xs font-semibold flex items-center gap-2 border border-slate-200/60 dark:border-slate-700/60 transition"
              >
                <BookOpen className="w-4 h-4 text-teal-500" />
                <span>View Reports</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
