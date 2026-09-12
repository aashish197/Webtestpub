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
  Send,
  ExternalLink,
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
    currentUser,
  } = useApp();

  const [copiedPayId, setCopiedPayId] = useState<string | null>(null);
  const [batchSuccessMsg, setBatchSuccessMsg] = useState<string | null>(null);
  const todayIso = getTodayIso();

  // Check today's marked attendance status for each class
  const getTodayAttendanceForClass = (classId: string) => {
    return attendance.find((a) => a.classId === classId && a.date === todayIso);
  };

  // Helper for live class timing status
  const getClassLiveStatus = (startTime: string, endTime: string) => {
    try {
      const now = new Date();
      const currentMins = now.getHours() * 60 + now.getMinutes();
      const [sh, sm] = startTime.split(':').map(Number);
      const [eh, em] = endTime.split(':').map(Number);
      const startMins = sh * 60 + (sm || 0);
      const endMins = eh * 60 + (em || 0);

      if (currentMins >= startMins && currentMins <= endMins) {
        return {
          label: 'Live Now',
          badgeClass: 'bg-emerald-500 text-white font-bold animate-pulse',
        };
      }
      if (currentMins < startMins && startMins - currentMins <= 60) {
        return {
          label: `In ${startMins - currentMins}m`,
          badgeClass: 'bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 font-semibold',
        };
      }
      if (currentMins > endMins) {
        return {
          label: 'Ended',
          badgeClass: 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 font-medium',
        };
      }
    } catch {
      // ignore
    }
    return null;
  };

  const handleQuickMarkAttendance = (
    cls: (typeof todayClasses)[0],
    status: 'present' | 'absent' | 'cancelled'
  ) => {
    let targetName = cls.title;
    const sec = (cls as any).sectionName || cls.section;
    if (cls.type === 'home_tuition') {
      const student = students.find((s) => s.id === cls.studentId);
      if (student) targetName = student.name;
      if (cls.groupName) targetName = cls.groupName;
    } else if (cls.type === 'college') {
      const inst = institutions.find((i) => i.id === cls.institutionId);
      if (inst) targetName = sec ? `${inst.name} (${sec})` : inst.name;
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
      section: sec,
      sectionSlotId: (cls as any).sectionSlotId,
      status,
      notes: `Quick marked from dashboard as ${status}${sec ? ` for ${sec}` : ''}`,
    });

    if (status === 'present') {
      confetti({
        particleCount: 25,
        spread: 45,
        origin: { y: 0.8 },
      });
    }
  };

  // Batch Mark All Unmarked Classes as Present
  const unmarkedTodayClasses = todayClasses.filter(
    (cls) => !getTodayAttendanceForClass(cls.id)
  );

  const handleMarkAllPresent = () => {
    unmarkedTodayClasses.forEach((cls) => {
      let targetName = cls.title;
      const sec = (cls as any).sectionName || cls.section;
      if (cls.type === 'home_tuition') {
        const student = students.find((s) => s.id === cls.studentId);
        if (student) targetName = student.name;
        if (cls.groupName) targetName = cls.groupName;
      } else if (cls.type === 'college') {
        const inst = institutions.find((i) => i.id === cls.institutionId);
        if (inst) targetName = sec ? `${inst.name} (${sec})` : inst.name;
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
        section: sec,
        sectionSlotId: (cls as any).sectionSlotId,
        status: 'present',
        notes: `Batch marked as present from dashboard${sec ? ` for ${sec}` : ''}`,
      });
    });

    confetti({
      particleCount: 50,
      spread: 70,
      origin: { y: 0.7 },
    });

    setBatchSuccessMsg(`All ${unmarkedTodayClasses.length} classes marked as Present!`);
    setTimeout(() => setBatchSuccessMsg(null), 3000);
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

  // WhatsApp link generator for payments
  const getWhatsAppPaymentUrl = (payment: (typeof overduePayments)[0]) => {
    const student = students.find((s) => s.id === payment.studentId);
    const rawPhone = student?.parentPhone || student?.parentContact || student?.contactNumber || '';
    const cleanPhone = rawPhone.replace(/[^0-9]/g, '');
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
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
  };

  // WhatsApp link for student absence notice
  const getWhatsAppAbsenceUrl = (cls: (typeof todayClasses)[0]) => {
    const student = students.find((s) => s.id === cls.studentId);
    const rawPhone = student?.parentPhone || student?.parentContact || student?.contactNumber || '';
    const cleanPhone = rawPhone.replace(/[^0-9]/g, '');
    const studentName = student ? student.name : cls.title;
    const parentName = student?.parentName ? `Dear ${student.parentName}, ` : '';
    const text = `Namaste! ${parentName}This is a quick notice from ${settings.teacherName}. ${studentName} was marked absent for today's ${cls.subject || 'tuition'} session (${formatTime(cls.startTime, settings.timeFormat)}). Please let me know if a makeup class is needed.`;
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 bg-gradient-to-r from-indigo-900 to-slate-900 dark:from-slate-900 dark:to-indigo-950 p-4 sm:p-6 rounded-2xl text-white shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 text-xs font-semibold border border-indigo-400/30">
              {settings.dateSystem === 'BS' ? 'Bikram Sambat' : 'AD Calendar'}
            </span>
            <span className="text-xs text-slate-300">
              {formatDisplayDate(todayIso, settings.dateSystem, 'long')}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold mt-1.5 tracking-tight">
            Welcome back, {((currentUser?.displayName || settings.teacherName).split(' ')[0]) || 'Teacher'} 👋
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
            You have <strong className="text-white">{todayClasses.length} classes</strong> scheduled
            today and <strong className="text-white">{activeStudentsCount} active students</strong>.
          </p>
        </div>

        {/* Quick Action Pills */}
        <div className="grid grid-cols-3 sm:flex sm:flex-wrap items-center gap-1.5 sm:gap-2">
          <button
            id="btn-dash-add-student"
            onClick={() => openQuickAction('student')}
            className="flex items-center justify-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 sm:py-2 text-[11px] sm:text-xs font-semibold rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-white transition active:scale-95 text-center"
          >
            <Plus className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Student</span>
          </button>
          <button
            id="btn-dash-record-payment"
            onClick={() => openQuickAction('payment')}
            className="flex items-center justify-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 sm:py-2 text-[11px] sm:text-xs font-semibold rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/30 text-emerald-200 transition active:scale-95 text-center"
          >
            <CreditCard className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Payment</span>
          </button>
          <button
            id="btn-dash-mark-attendance"
            onClick={() => setActiveTab('attendance')}
            className="flex items-center justify-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 sm:py-2 text-[11px] sm:text-xs font-semibold rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-white transition active:scale-95 text-center"
          >
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Attendance</span>
          </button>
        </div>
      </div>

      {/* Main KPI Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        {/* Card 1: Today's Classes */}
        <div
          onClick={() => setActiveTab('routine')}
          className="p-3 sm:p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-indigo-300 dark:hover:border-indigo-800 transition cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Classes Today
            </span>
            <div className="p-1.5 sm:p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
              <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="mt-1.5 sm:mt-2 flex items-baseline gap-1.5 sm:gap-2">
            <span className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
              {classesScheduledTodayCount}
            </span>
            <span className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400">scheduled</span>
          </div>
          <div className="mt-1.5 sm:mt-2 text-[11px] text-indigo-600 dark:text-indigo-400 font-medium flex items-center gap-1">
            <span>View Timetable</span>
            <ChevronRight className="w-3 h-3" />
          </div>
        </div>

        {/* Card 2: Active Students */}
        <div
          onClick={() => setActiveTab('students')}
          className="p-3 sm:p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-teal-300 dark:hover:border-teal-800 transition cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Active Students
            </span>
            <div className="p-1.5 sm:p-2 rounded-lg bg-teal-50 dark:bg-teal-950/50 text-teal-600 dark:text-teal-400">
              <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="mt-1.5 sm:mt-2 flex items-baseline gap-1.5 sm:gap-2">
            <span className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
              {activeStudentsCount}
            </span>
            <span className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400">home & group</span>
          </div>
          <div className="mt-1.5 sm:mt-2 text-[11px] text-teal-600 dark:text-teal-400 font-medium flex items-center gap-1">
            <span>Manage Profiles</span>
            <ChevronRight className="w-3 h-3" />
          </div>
        </div>

        {/* Card 3: Monthly Tuition Income */}
        <div
          onClick={() => setActiveTab('income')}
          className="p-3 sm:p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-emerald-300 dark:hover:border-emerald-800 transition cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Tuition Received
            </span>
            <div className="p-1.5 sm:p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
              <CreditCard className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="mt-1.5 sm:mt-2">
            <span className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
              {formatCurrency(currentMonthTuitionIncome.received, settings.currency)}
            </span>
          </div>
          <div className="mt-1.5 sm:mt-2 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
            <span>Pending: {formatCurrency(currentMonthTuitionIncome.pending, settings.currency)}</span>
          </div>
        </div>

        {/* Card 4: College Salary & Teaching Hours */}
        <div
          onClick={() => setActiveTab('income')}
          className="p-3 sm:p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-purple-300 dark:hover:border-purple-800 transition cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              College & Hours
            </span>
            <div className="p-1.5 sm:p-2 rounded-lg bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400">
              <Building2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="mt-1.5 sm:mt-2 flex items-baseline gap-1.5 sm:gap-2">
            <span className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
              {totalWorkingHoursThisMonth}h
            </span>
            <span className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400">({totalClassesThisMonth} cls)</span>
          </div>
          <div className="mt-1.5 sm:mt-2 text-[11px] text-purple-600 dark:text-purple-400 font-medium flex items-center gap-1">
            <span>Salary: {formatCurrency(currentMonthCollegeIncome.received, settings.currency)}</span>
            <ChevronRight className="w-3 h-3" />
          </div>
        </div>
      </div>

      {/* Workload, Rest & Multi-Tier Earnings Bar */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-3.5 sm:p-5 text-white shadow-xs border border-indigo-900/40">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 sm:gap-4">
          {/* Work vs Rest Section */}
          <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-3 sm:gap-6">
            <div className="flex items-center gap-2.5 sm:gap-3">
              <div className="p-2 sm:p-2.5 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 shrink-0">
                <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] sm:text-[11px] uppercase tracking-wider text-indigo-300 font-semibold truncate block">
                  Today's Teaching
                </span>
                <p className="text-base sm:text-xl font-bold text-white leading-tight">
                  {todayWorkHours} hrs <span className="text-[10px] sm:text-xs font-normal text-slate-300 hidden sm:inline">({todayWorkMinutes}m)</span>
                </p>
              </div>
            </div>

            <div className="h-8 w-px bg-white/10 hidden sm:block" />

            <div className="flex items-center gap-2.5 sm:gap-3">
              <div className="p-2 sm:p-2.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shrink-0">
                <Coffee className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] sm:text-[11px] uppercase tracking-wider text-emerald-300 font-semibold truncate block">
                  Rest & Recovery
                </span>
                <p className="text-base sm:text-xl font-bold text-white leading-tight">
                  {todayRestHours} hrs <span className="text-[10px] sm:text-xs font-normal text-slate-300 hidden sm:inline">({Math.round((todayRestHours / 24) * 100)}%)</span>
                </p>
              </div>
            </div>
          </div>

          {/* Earnings Per Hr / Day / Week / Month ticker */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-4 bg-white/5 rounded-xl p-2.5 sm:px-4 sm:py-2.5 border border-white/10">
            <div className="grid grid-cols-4 gap-2 text-center sm:text-left sm:flex sm:items-center sm:gap-3">
              <div>
                <span className="text-[9px] sm:text-[10px] text-slate-400 block uppercase font-medium">Per Hr</span>
                <span className="text-xs sm:text-sm font-bold text-amber-300">
                  {formatCurrency(effectiveHourlyRate, settings.currency)}
                </span>
              </div>
              <div>
                <span className="text-[9px] sm:text-[10px] text-slate-400 block uppercase font-medium">Per Day</span>
                <span className="text-xs sm:text-sm font-bold text-teal-300">
                  {formatCurrency(avgDailyIncome, settings.currency)}
                </span>
              </div>
              <div>
                <span className="text-[9px] sm:text-[10px] text-slate-400 block uppercase font-medium">Per Wk</span>
                <span className="text-xs sm:text-sm font-bold text-indigo-300">
                  {formatCurrency(avgWeeklyIncome, settings.currency)}
                </span>
              </div>
              <div>
                <span className="text-[9px] sm:text-[10px] text-slate-400 block uppercase font-medium">Per Mo</span>
                <span className="text-xs sm:text-sm font-bold text-emerald-300">
                  {formatCurrency(projectedMonthlyIncome, settings.currency)}
                </span>
              </div>
            </div>

            <button
              onClick={() => setActiveTab('calculator')}
              className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-xs transition active:scale-95 shrink-0"
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

              <div className="flex items-center gap-2">
                {unmarkedTodayClasses.length > 0 && (
                  <button
                    onClick={handleMarkAllPresent}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs transition active:scale-95"
                    title="Mark all remaining classes today as Present"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Mark All Present ({unmarkedTodayClasses.length})</span>
                  </button>
                )}
                <button
                  onClick={() => setActiveTab('routine')}
                  className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  Full Routine →
                </button>
              </div>
            </div>

            {batchSuccessMsg && (
              <div className="mt-3 p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>{batchSuccessMsg}</span>
              </div>
            )}

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
                  const liveStatus = getClassLiveStatus(cls.startTime, cls.endTime);

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
                            <div className="flex items-center flex-wrap gap-2">
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
                              {((cls as any).sectionName || cls.section) && (
                                <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300">
                                  {(cls as any).sectionName || cls.section}
                                </span>
                              )}
                              {liveStatus && (
                                <span className={`px-2 py-0.5 text-[10px] rounded-md ${liveStatus.badgeClass}`}>
                                  {liveStatus.label}
                                </span>
                              )}
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
                        <div className="flex flex-col sm:items-end gap-1.5 shrink-0 self-end sm:self-center">
                          <div className="flex items-center gap-1.5">
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
                                  className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition active:scale-95"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>Present</span>
                                </button>
                                <button
                                  onClick={() => handleQuickMarkAttendance(cls, 'absent')}
                                  className="px-2 py-1.5 text-xs font-medium rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-800/40 transition active:scale-95"
                                >
                                  Absent
                                </button>
                              </div>
                            )}
                          </div>

                          {/* Instant WhatsApp Absence Alert */}
                          {isMarked && att.status === 'absent' && cls.type === 'home_tuition' && (
                            <a
                              href={getWhatsAppAbsenceUrl(cls)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 hover:underline mt-0.5"
                              title="Send WhatsApp absence notification to parent"
                            >
                              <Send className="w-3 h-3" />
                              <span>Notify Parent on WhatsApp</span>
                            </a>
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

                        {/* Reminder Action Buttons */}
                        <div className="mt-3 flex items-center justify-between gap-1.5 border-t border-slate-200/60 dark:border-slate-700/60 pt-2">
                          <div className="flex items-center gap-1">
                            <button
                              id={`btn-copy-reminder-${payment.id}`}
                              onClick={() => handleCopyReminder(payment)}
                              className="flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 transition"
                              title="Copy friendly SMS/WhatsApp reminder"
                            >
                              {isCopied ? (
                                <>
                                  <Check className="w-3 h-3 text-emerald-600" />
                                  <span>Copied!</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3 h-3" />
                                  <span>Copy</span>
                                </>
                              )}
                            </button>

                            <a
                              href={getWhatsAppPaymentUrl(payment)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition"
                              title="Open WhatsApp chat with reminder message"
                            >
                              <Send className="w-3 h-3" />
                              <span>WhatsApp</span>
                            </a>
                          </div>

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
