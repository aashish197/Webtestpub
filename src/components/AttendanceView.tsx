import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { AttendanceRecord, AttendanceStatus, DayOfWeek } from '../types';
import {
  UserCheck,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  Calendar,
  Layers,
  Edit2,
  Trash2,
  Sparkles,
  Building2,
  Users,
  X,
  FileSpreadsheet,
  CalendarClock,
  Check,
  RotateCcw,
  AlertCircle,
  Phone,
} from 'lucide-react';
import { getAttendanceStatusBadge, formatTime, exportToCsv } from '../utils/formatters';
import { formatDisplayDate, getTodayIso, NEPALI_MONTHS_EN, adToBs, getDayOfWeek } from '../utils/nepaliCalendar';
import { resolveClassSchedule, resolveClassDaySlots } from '../utils/scheduleHelpers';
import confetti from 'canvas-confetti';

export const AttendanceView: React.FC = () => {
  const {
    attendance,
    markAttendance,
    updateAttendance,
    deleteAttendance,
    batchMarkAttendanceToday,
    rescheduleTodayClass,
    classes,
    students,
    institutions,
    settings,
    todayClasses,
    todayDayName,
  } = useApp();

  const [dateFilter, setDateFilter] = useState<string>('');
  const [studentOrInstFilter, setStudentOrInstFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [search, setSearch] = useState<string>('');

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingAttendance, setEditingAttendance] = useState<AttendanceRecord | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Reschedule Today's Class Modal State
  const [isRescheduleModalOpen, setIsRescheduleModalOpen] = useState(false);
  const [rescheduleTarget, setRescheduleTarget] = useState<(typeof todayClasses)[0] | null>(null);
  const [rescheduleData, setRescheduleData] = useState({
    toDate: (() => {
      const d = new Date();
      d.setDate(d.getDate() + 1);
      return d.toISOString().split('T')[0];
    })(),
    startTime: '16:00',
    endTime: '17:00',
    durationMinutes: 60,
    reason: 'Student called to reschedule session',
  });

  // Actual Teaching Time Adjuster Modal State
  const [isAdjustTimeModalOpen, setIsAdjustTimeModalOpen] = useState(false);
  const [adjustTimeTarget, setAdjustTimeTarget] = useState<(typeof todayClasses)[0] | null>(null);
  const [adjustTimeData, setAdjustTimeData] = useState({
    actualStartTime: '16:00',
    actualEndTime: '17:30',
    actualDurationMinutes: 90,
    topicsCovered: '',
    notes: '',
  });

  const todayIso = getTodayIso();

  // Form State
  const initialFormState: Omit<AttendanceRecord, 'id' | 'recordedAt'> = {
    date: todayIso,
    classId: classes[0]?.id || '',
    type: 'home_tuition',
    studentId: students[0]?.id || '',
    institutionId: institutions[0]?.id || '',
    targetName: students[0]?.name || 'Student',
    subject: 'Mathematics',
    startTime: '16:00',
    endTime: '17:00',
    durationMinutes: 60,
    periodsCount: 1,
    status: 'present',
    notes: '',
    topicsCovered: '',
  };

  const [formData, setFormData] = useState<Omit<AttendanceRecord, 'id' | 'recordedAt'>>(initialFormState);

  // Filtered Attendance List
  const filteredAttendance = useMemo(() => {
    const q = search.toLowerCase().trim();
    return attendance.filter((a) => {
      const matchSearch =
        !q ||
        a.targetName.toLowerCase().includes(q) ||
        a.subject.toLowerCase().includes(q) ||
        (a.notes && a.notes.toLowerCase().includes(q)) ||
        (a.topicsCovered && a.topicsCovered.toLowerCase().includes(q));

      const matchDate = !dateFilter || a.date === dateFilter;
      const matchTarget =
        studentOrInstFilter === 'ALL' ||
        a.studentId === studentOrInstFilter ||
        a.institutionId === studentOrInstFilter;
      const matchStatus = statusFilter === 'ALL' || a.status === statusFilter;

      return matchSearch && matchDate && matchTarget && matchStatus;
    });
  }, [attendance, search, dateFilter, studentOrInstFilter, statusFilter]);

  // Handle opening add modal
  const handleOpenAdd = () => {
    setEditingAttendance(null);
    setFormData(initialFormState);
    setIsAddModalOpen(true);
  };

  // Handle opening edit modal
  const handleOpenEdit = (rec: AttendanceRecord) => {
    setEditingAttendance(rec);
    setFormData({
      date: rec.date,
      classId: rec.classId,
      type: rec.type,
      studentId: rec.studentId,
      institutionId: rec.institutionId,
      targetName: rec.targetName,
      subject: rec.subject,
      startTime: rec.startTime,
      endTime: rec.endTime,
      durationMinutes: rec.durationMinutes,
      periodsCount: rec.periodsCount,
      status: rec.status,
      notes: rec.notes || '',
      topicsCovered: rec.topicsCovered || '',
    });
    setIsAddModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingAttendance) {
      updateAttendance(editingAttendance.id, formData);
    } else {
      markAttendance(formData);
    }
    setIsAddModalOpen(false);
  };

  // Single-click mark for today's scheduled classes
  const handleMarkClassToday = (
    cls: (typeof todayClasses)[0],
    status: AttendanceStatus
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
      notes: `Marked as ${status}${sec ? ` for ${sec}` : ''}`,
    });

    if (status === 'present') {
      confetti({ particleCount: 20, spread: 40 });
    }
  };

  // Open reschedule dialog for today's class
  const handleOpenReschedule = (cls: (typeof todayClasses)[0]) => {
    setRescheduleTarget(cls);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowIso = tomorrow.toISOString().split('T')[0];

    // Check if there's already an attendance record with reschedule info
    const existingRec = attendance.find(
      (a) => a.classId === cls.id && a.date === todayIso
    );

    setRescheduleData({
      toDate: existingRec?.rescheduledToDate || tomorrowIso,
      startTime: existingRec?.rescheduledToTime || cls.startTime,
      endTime: cls.endTime,
      durationMinutes: cls.durationMinutes,
      reason: existingRec?.rescheduledReason || 'Student requested shift in schedule (flexible tuition)',
    });
    setIsRescheduleModalOpen(true);
  };

  const handleConfirmReschedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rescheduleTarget) return;

    rescheduleTodayClass({
      classId: rescheduleTarget.id,
      fromDate: todayIso,
      toDate: rescheduleData.toDate,
      newStartTime: rescheduleData.startTime,
      newEndTime: rescheduleData.endTime,
      newDurationMinutes: rescheduleData.durationMinutes,
      reason: rescheduleData.reason,
    });

    setIsRescheduleModalOpen(false);
    setRescheduleTarget(null);
  };

  // Open adjust actual teaching time dialog
  const handleOpenAdjustTime = (cls: (typeof todayClasses)[0]) => {
    setAdjustTimeTarget(cls);
    const existingRec = attendance.find(
      (a) => a.classId === cls.id && a.date === todayIso
    );

    setAdjustTimeData({
      actualStartTime: existingRec?.actualStartTime || existingRec?.startTime || cls.startTime,
      actualEndTime: existingRec?.actualEndTime || existingRec?.endTime || cls.endTime,
      actualDurationMinutes:
        existingRec?.actualDurationMinutes || existingRec?.durationMinutes || cls.durationMinutes,
      topicsCovered: existingRec?.topicsCovered || '',
      notes: existingRec?.notes || '',
    });
    setIsAdjustTimeModalOpen(true);
  };

  const handleSaveAdjustTime = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustTimeTarget) return;

    let targetName = adjustTimeTarget.title;
    const sec = (adjustTimeTarget as any).sectionName || adjustTimeTarget.section;
    if (adjustTimeTarget.type === 'home_tuition') {
      const student = students.find((s) => s.id === adjustTimeTarget.studentId);
      if (student) targetName = student.name;
      if (adjustTimeTarget.groupName) targetName = adjustTimeTarget.groupName;
    } else if (adjustTimeTarget.type === 'college') {
      const inst = institutions.find((i) => i.id === adjustTimeTarget.institutionId);
      if (inst) targetName = sec ? `${inst.name} (${sec})` : inst.name;
    }

    markAttendance({
      date: todayIso,
      classId: adjustTimeTarget.id,
      type: adjustTimeTarget.type,
      studentId: adjustTimeTarget.studentId,
      institutionId: adjustTimeTarget.institutionId,
      targetName,
      subject: adjustTimeTarget.subject,
      startTime: adjustTimeData.actualStartTime,
      endTime: adjustTimeData.actualEndTime,
      durationMinutes: adjustTimeData.actualDurationMinutes,
      actualStartTime: adjustTimeData.actualStartTime,
      actualEndTime: adjustTimeData.actualEndTime,
      actualDurationMinutes: adjustTimeData.actualDurationMinutes,
      scheduledStartTime: adjustTimeTarget.startTime,
      scheduledEndTime: adjustTimeTarget.endTime,
      periodsCount: adjustTimeTarget.type === 'college' ? 1 : undefined,
      section: sec,
      sectionSlotId: (adjustTimeTarget as any).sectionSlotId,
      status: 'present',
      topicsCovered: adjustTimeData.topicsCovered,
      notes:
        adjustTimeData.notes ||
        `Actual session conducted: ${adjustTimeData.actualDurationMinutes} mins (${(
          adjustTimeData.actualDurationMinutes / 60
        ).toFixed(1)} hrs)`,
    });

    confetti({ particleCount: 25, spread: 45 });
    setIsAdjustTimeModalOpen(false);
    setAdjustTimeTarget(null);
  };

  const handleExportCsv = () => {
    const rows = attendance.map((a) => ({
      ID: a.id,
      Date_AD: a.date,
      Date_BS: formatDisplayDate(a.date, 'BS', 'short'),
      Type: a.type,
      Target_Name: a.targetName,
      Subject: a.subject,
      Start_Time: a.startTime,
      End_Time: a.endTime,
      Duration_Mins: a.durationMinutes,
      Periods: a.periodsCount || 1,
      Status: a.status,
      Topics_Covered: a.topicsCovered || '',
      Notes: a.notes || '',
    }));
    exportToCsv(`attendance-records-${getTodayIso()}.csv`, rows);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              <UserCheck className="w-5 h-5" />
            </div>
            Class Attendance & Period Logs
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Mark daily attendance, track completed college periods, and record topics covered.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCsv}
            className="px-3 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition"
          >
            Export CSV
          </button>
          <button
            id="btn-add-attendance-main"
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Mark Attendance</span>
          </button>
        </div>
      </div>

      {/* TODAY'S ATTENDANCE CHECKLIST CARD */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-600" />
              Today's Scheduled Classes ({todayDayName},{' '}
              {formatDisplayDate(todayIso, settings.dateSystem, 'medium')})
            </h3>
            <p className="text-xs text-slate-500">
              One-click attendance marking for today's routine.
            </p>
          </div>

          {todayClasses.length > 0 && (
            <button
              onClick={() => batchMarkAttendanceToday('present')}
              className="px-3 py-1.5 text-xs font-bold rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 border border-emerald-200 dark:border-emerald-800 transition"
            >
              ✓ Mark All Today's Classes as Present
            </button>
          )}
        </div>

        <div className="mt-4 space-y-2.5">
          {todayClasses.length === 0 ? (
            <div className="text-center py-6 text-slate-400 text-xs">
              No classes scheduled for {todayDayName}.
            </div>
          ) : (
            todayClasses.map((cls) => {
              const record = attendance.find((a) => a.classId === cls.id && a.date === todayIso);
              const isMarked = !!record;

              return (
                <div
                  key={cls.id}
                  className={`p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition ${
                    isMarked
                      ? 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700'
                      : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-2.5 h-10 rounded-full shrink-0"
                      style={{ backgroundColor: cls.color || '#3b82f6' }}
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                          {formatTime(cls.startTime, settings.timeFormat)} -{' '}
                          {formatTime(cls.endTime, settings.timeFormat)}
                        </span>
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                            cls.type === 'college'
                              ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300'
                              : 'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300'
                          }`}
                        >
                          {cls.type === 'college' ? 'College' : 'Tuition'}
                        </span>
                        {((cls as any).sectionName || cls.section) && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300">
                            {(cls as any).sectionName || cls.section}
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                        {cls.title}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 self-end sm:self-center flex-wrap">
                    {isMarked ? (
                      record.status === 'rescheduled' ? (
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                          <div className="flex items-center gap-1.5">
                            <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border border-amber-300 dark:border-amber-800 flex items-center gap-1">
                              <CalendarClock className="w-3.5 h-3.5" />
                              RESCHEDULED
                            </span>
                            {record.rescheduledToDate && (
                              <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-400">
                                to {formatDisplayDate(record.rescheduledToDate, settings.dateSystem)}{' '}
                                {record.rescheduledToTime ? `at ${formatTime(record.rescheduledToTime, settings.timeFormat)}` : ''}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleOpenReschedule(cls)}
                              className="px-2 py-1 text-[11px] font-semibold text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/50 rounded-md border border-amber-200 dark:border-amber-800"
                            >
                              Edit Reschedule
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMarkClassToday(cls, 'present')}
                              className="px-2 py-1 text-[11px] font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                            >
                              Reset
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`px-3 py-1 text-xs font-bold rounded-lg ${
                              getAttendanceStatusBadge(record.status).badgeClass
                            }`}
                          >
                            {record.status.toUpperCase()}
                          </span>

                          {record.status === 'present' && (
                            <span className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">
                              {record.actualDurationMinutes
                                ? `${(record.actualDurationMinutes / 60).toFixed(1)} hrs conducted`
                                : `${(record.durationMinutes / 60).toFixed(1)} hrs`}
                            </span>
                          )}

                          <button
                            type="button"
                            onClick={() => handleOpenAdjustTime(cls)}
                            className="text-xs text-indigo-600 hover:underline font-semibold flex items-center gap-0.5"
                            title="Adjust actual hours/time taught"
                          >
                            <Clock className="w-3 h-3" />
                            Actual Time
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenReschedule(cls)}
                            className="text-xs text-amber-600 hover:underline font-semibold flex items-center gap-0.5"
                            title="Reschedule to another day"
                          >
                            <CalendarClock className="w-3 h-3" />
                            Reschedule
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              handleMarkClassToday(
                                cls,
                                record.status === 'present' ? 'absent' : 'present'
                              )
                            }
                            className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 underline"
                          >
                            Change
                          </button>
                        </div>
                      )
                    ) : (
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <button
                          type="button"
                          onClick={() => handleMarkClassToday(cls, 'present')}
                          className="px-3 py-1.5 text-xs font-bold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 shadow-xs flex items-center gap-1"
                        >
                          <Check className="w-3.5 h-3.5" />
                          Present
                        </button>

                        <button
                          type="button"
                          onClick={() => handleOpenAdjustTime(cls)}
                          className="px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 flex items-center gap-1"
                          title="Record actual time started/ended and hours conducted (for hourly tuition or schedule variations)"
                        >
                          <Clock className="w-3.5 h-3.5" />
                          Actual Time
                        </button>

                        <button
                          type="button"
                          onClick={() => handleOpenReschedule(cls)}
                          className="px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 hover:bg-amber-100 dark:hover:bg-amber-900/60 flex items-center gap-1"
                          title="Reschedule today's class to another date/time agreed with student"
                        >
                          <CalendarClock className="w-3.5 h-3.5" />
                          Reschedule
                        </button>

                        <button
                          type="button"
                          onClick={() => handleMarkClassToday(cls, 'absent')}
                          className="px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-rose-200 dark:border-rose-800 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                        >
                          Absent
                        </button>

                        <button
                          type="button"
                          onClick={() => handleMarkClassToday(cls, 'cancelled')}
                          className="px-2 py-1.5 text-xs font-medium rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                          Cancelled
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* SEARCH & FILTERS FOR HISTORICAL LOGS */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search target, topics covered..."
              value={search || ''}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
            />
          </div>

          {/* Date Filter */}
          <div>
            <input
              type="date"
              value={dateFilter || ''}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
            />
          </div>

          {/* Student or College Target */}
          <div>
            <select
              value={studentOrInstFilter || 'ALL'}
              onChange={(e) => setStudentOrInstFilter(e.target.value)}
              className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
            >
              <option value="ALL">All Students & Colleges</option>
              <optgroup label="Home Tuition Students">
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Colleges">
                {institutions.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.name}
                  </option>
                ))}
              </optgroup>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter || 'ALL'}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="present">Present</option>
              <option value="absent">Absent</option>
              <option value="cancelled">Cancelled</option>
              <option value="rescheduled">Rescheduled</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100 dark:border-slate-800">
          <span>
            Showing <strong className="text-slate-800 dark:text-slate-200">{filteredAttendance.length}</strong> log entries
          </span>
          {(search || dateFilter || studentOrInstFilter !== 'ALL' || statusFilter !== 'ALL') && (
            <button
              onClick={() => {
                setSearch('');
                setDateFilter('');
                setStudentOrInstFilter('ALL');
                setStatusFilter('ALL');
              }}
              className="text-indigo-600 hover:underline font-semibold"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* HISTORICAL ATTENDANCE TABLE */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-4 py-3 font-semibold">Date ({settings.dateSystem})</th>
                <th className="px-4 py-3 font-semibold">Class / Target</th>
                <th className="px-4 py-3 font-semibold">Subject</th>
                <th className="px-4 py-3 font-semibold">Time & Duration</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Topics Covered / Notes</th>
                <th className="px-4 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredAttendance.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                    No attendance records found matching the filters.
                  </td>
                </tr>
              ) : (
                filteredAttendance.map((rec) => {
                  const { label, badgeClass } = getAttendanceStatusBadge(rec.status);
                  const isCollege = rec.type === 'college';

                  return (
                    <tr
                      key={rec.id}
                      className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition"
                    >
                      <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white whitespace-nowrap">
                        {formatDisplayDate(rec.date, settings.dateSystem, 'medium')}
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              isCollege ? 'bg-purple-500' : 'bg-teal-500'
                            }`}
                          />
                          <span className="font-bold text-slate-900 dark:text-white">
                            {rec.targetName}
                          </span>
                          {rec.section && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300">
                              {rec.section}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="px-4 py-3 text-slate-700 dark:text-slate-300 font-medium">
                        {rec.subject}
                      </td>

                      <td className="px-4 py-3 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <span>
                            {formatTime(rec.startTime, settings.timeFormat)} -{' '}
                            {formatTime(rec.endTime, settings.timeFormat)} ({rec.durationMinutes}m)
                          </span>
                          {isCollege && rec.periodsCount ? (
                            <span className="text-xs font-semibold text-purple-600 dark:text-purple-400">
                              • {rec.periodsCount} pd
                            </span>
                          ) : null}
                        </div>
                        {rec.actualDurationMinutes && rec.actualDurationMinutes !== rec.durationMinutes && (
                          <div className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 mt-0.5">
                            Actual: {rec.actualStartTime ? `${formatTime(rec.actualStartTime, settings.timeFormat)} - ${formatTime(rec.actualEndTime, settings.timeFormat)} ` : ''}
                            ({rec.actualDurationMinutes}m / {(rec.actualDurationMinutes / 60).toFixed(1)}h)
                          </div>
                        )}
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap">
                        {rec.status === 'rescheduled' ? (
                          <div>
                            <span className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                              RESCHEDULED
                            </span>
                            {rec.rescheduledToDate && (
                              <div className="text-[10px] font-semibold text-amber-700 dark:text-amber-400 mt-0.5">
                                Shifted to {formatDisplayDate(rec.rescheduledToDate, settings.dateSystem)}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className={`px-2.5 py-1 text-[11px] font-bold rounded-lg ${badgeClass}`}>
                            {label}
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300 max-w-xs truncate">
                        {rec.topicsCovered || rec.notes || '-'}
                      </td>

                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleOpenEdit(rec)}
                            className="p-1 rounded text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                            title="Edit entry"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(rec.id)}
                            className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                            title="Delete entry"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 max-w-lg w-full p-6 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                {editingAttendance ? 'Edit Attendance Log' : 'Record Class Attendance'}
              </h2>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.date || ''}
                    onChange={(e) => {
                      const newDate = e.target.value;
                      const cls = classes.find((c) => c.id === formData.classId);
                      if (cls) {
                        const dow = getDayOfWeek(newDate);
                        const res = resolveClassSchedule(cls, dow, newDate);
                        setFormData({
                          ...formData,
                          date: newDate,
                          startTime: res.startTime,
                          endTime: res.endTime,
                          durationMinutes: res.durationMinutes,
                        });
                      } else {
                        setFormData({ ...formData, date: newDate });
                      }
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Status *
                  </label>
                  <select
                    value={formData.status || 'present'}
                    onChange={(e) =>
                      setFormData({ ...formData, status: e.target.value as AttendanceStatus })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
                  >
                    <option value="present">Present</option>
                    <option value="absent">Absent</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="rescheduled">Rescheduled</option>
                  </select>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-semibold text-slate-700 dark:text-slate-300">
                    Select Teaching Class / Student *
                  </label>
                  {(() => {
                    const cls = classes.find((c) => c.id === formData.classId);
                    if (!cls) return null;
                    const dow = getDayOfWeek(formData.date);
                    const slots = resolveClassDaySlots(cls, dow, formData.date);
                    const hasOverride = cls.dateSpecificSchedules?.some((s) => s.date === formData.date);
                    return (
                      <span
                        className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
                          hasOverride
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                            : 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300'
                        }`}
                      >
                        {hasOverride ? '★ Date Override: ' : 'Routine: '}
                        {slots.length > 1
                          ? `${slots.length} Sections / Periods`
                          : `${formatTime(slots[0]?.startTime || cls.startTime)} - ${formatTime(slots[0]?.endTime || cls.endTime)}`}
                      </span>
                    );
                  })()}
                </div>
                <select
                  value={formData.classId || ''}
                  onChange={(e) => {
                    const cls = classes.find((c) => c.id === e.target.value);
                    if (cls) {
                      const dow = getDayOfWeek(formData.date);
                      const daySlots = resolveClassDaySlots(cls, dow, formData.date);
                      const firstSlot = daySlots[0];
                      let tName = cls.title;
                      if (cls.type === 'home_tuition') {
                        const st = students.find((s) => s.id === cls.studentId);
                        if (st) tName = st.name;
                      } else {
                        const inObj = institutions.find((i) => i.id === cls.institutionId);
                        if (inObj) tName = firstSlot?.section ? `${inObj.name} (${firstSlot.section})` : inObj.name;
                      }
                      setFormData({
                        ...formData,
                        classId: cls.id,
                        type: cls.type,
                        studentId: cls.studentId,
                        institutionId: cls.institutionId,
                        targetName: tName,
                        subject: firstSlot?.subject || cls.subject,
                        startTime: firstSlot?.startTime || '07:00',
                        endTime: firstSlot?.endTime || '08:00',
                        durationMinutes: firstSlot?.durationMinutes || 60,
                        section: firstSlot?.section,
                        sectionSlotId: firstSlot?.slotId,
                      });
                    }
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
                >
                  {classes.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.title} ({cls.subject})
                    </option>
                  ))}
                </select>
              </div>

              {/* Section / Period Selector when class has multiple slots on this date */}
              {(() => {
                const cls = classes.find((c) => c.id === formData.classId);
                if (!cls) return null;
                const dow = getDayOfWeek(formData.date);
                const slots = resolveClassDaySlots(cls, dow, formData.date);
                if (slots.length <= 1 && !slots[0]?.section) return null;

                return (
                  <div className="p-3 bg-indigo-50/50 dark:bg-indigo-950/30 rounded-xl border border-indigo-200 dark:border-indigo-800/40">
                    <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                      Select Class Section / Period ({slots.length} scheduled today)
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {slots.map((s, idx) => {
                        const isSelected =
                          (formData.sectionSlotId === s.slotId) ||
                          (!formData.sectionSlotId && idx === 0);
                        return (
                          <button
                            key={s.slotId}
                            type="button"
                            onClick={() => {
                              let tName = cls.title;
                              if (cls.type === 'home_tuition') {
                                const st = students.find((st) => st.id === cls.studentId);
                                if (st) tName = st.name;
                              } else {
                                const inObj = institutions.find((i) => i.id === cls.institutionId);
                                if (inObj) tName = s.section ? `${inObj.name} (${s.section})` : inObj.name;
                              }
                              setFormData({
                                ...formData,
                                section: s.section,
                                sectionSlotId: s.slotId,
                                startTime: s.startTime,
                                endTime: s.endTime,
                                durationMinutes: s.durationMinutes,
                                targetName: tName,
                                subject: s.subject || cls.subject,
                              });
                            }}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                              isSelected
                                ? 'bg-indigo-600 text-white shadow-xs'
                                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-indigo-300'
                            }`}
                          >
                            <span>{s.section || `Period ${idx + 1}`}</span>
                            <span className="opacity-80 text-[10px]">
                              ({formatTime(s.startTime)} - {formatTime(s.endTime)})
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Subject
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.subject || ''}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Start Time
                  </label>
                  <input
                    type="time"
                    value={formData.startTime || '06:30'}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-semibold text-slate-700 dark:text-slate-300">
                      Duration (Mins)
                    </label>
                    <div className="flex items-center gap-1">
                      {[35, 40, 45, 50, 60].map((d) => (
                        <button
                          key={d}
                          type="button"
                          onClick={() => setFormData({ ...formData, durationMinutes: d })}
                          className={`px-1.5 py-0.5 text-[10px] font-medium rounded transition ${
                            formData.durationMinutes === d
                              ? 'bg-indigo-600 text-white font-bold'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                          }`}
                        >
                          {d}m
                        </button>
                      ))}
                    </div>
                  </div>
                  <input
                    type="number"
                    min={5}
                    step={1}
                    value={formData.durationMinutes ?? 45}
                    onChange={(e) =>
                      setFormData({ ...formData, durationMinutes: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Topics Covered Today
                </label>
                <input
                  type="text"
                  placeholder="e.g. Cross products, L'Hopital Rule, Compound angles"
                  value={formData.topicsCovered || ''}
                  onChange={(e) => setFormData({ ...formData, topicsCovered: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Private Remarks / Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Completed chapter 3 numerical problems"
                  value={formData.notes || ''}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                >
                  {editingAttendance ? 'Save Changes' : 'Save Attendance'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 max-w-md w-full p-6 shadow-xl text-center">
            <div className="w-12 h-12 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-600 mx-auto flex items-center justify-center mb-3">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Delete Attendance Record?
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs mx-auto">
              This log will be removed from student attendance percentage and history.
            </p>
            <div className="mt-5 flex items-center justify-center gap-3">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  deleteAttendance(deleteConfirmId);
                  setDeleteConfirmId(null);
                }}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-rose-600 text-white hover:bg-rose-700"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reschedule Today's Class Modal */}
      {isRescheduleModalOpen && rescheduleTarget && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 max-w-lg w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400">
                  <CalendarClock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Reschedule Today's Class
                  </h3>
                  <p className="text-xs text-slate-500">
                    Tuition times are flexible — agree with student and move to any day
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsRescheduleModalOpen(false);
                  setRescheduleTarget(null);
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Target Class Info Banner */}
            <div className="p-3.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 dark:text-white text-sm">
                  {rescheduleTarget.title}
                </span>
                <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase rounded bg-amber-200 dark:bg-amber-900 text-amber-800 dark:text-amber-200">
                  {rescheduleTarget.type === 'home_tuition' ? 'Tuition' : 'College'}
                </span>
              </div>
              <div className="text-xs text-amber-900 dark:text-amber-300 mt-1 flex flex-wrap gap-x-3">
                <span>
                  <strong>Originally Scheduled:</strong> Today ({formatDisplayDate(todayIso, settings.dateSystem)})
                </span>
                <span>
                  <strong>Time:</strong> {formatTime(rescheduleTarget.startTime, settings.timeFormat)} - {formatTime(rescheduleTarget.endTime, settings.timeFormat)}
                </span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1.5">
                Today will be marked as <strong className="text-amber-700 dark:text-amber-400">Rescheduled</strong> (not absent), and this class will automatically be placed into your schedule on the new date.
              </p>
            </div>

            <form onSubmit={handleConfirmReschedule} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Reschedule To Date *
                </label>
                <input
                  type="date"
                  required
                  min={todayIso}
                  value={rescheduleData.toDate}
                  onChange={(e) =>
                    setRescheduleData({ ...rescheduleData, toDate: e.target.value })
                  }
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
                />
                <span className="text-[11px] text-slate-500 mt-0.5 block">
                  Target Date in Nepali BS:{' '}
                  <strong className="text-indigo-600 dark:text-indigo-400">
                    {formatDisplayDate(rescheduleData.toDate, 'BS', 'medium')}
                  </strong>
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    New Start Time
                  </label>
                  <input
                    type="time"
                    required
                    value={rescheduleData.startTime}
                    onChange={(e) =>
                      setRescheduleData({ ...rescheduleData, startTime: e.target.value })
                    }
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    New End Time
                  </label>
                  <input
                    type="time"
                    required
                    value={rescheduleData.endTime}
                    onChange={(e) =>
                      setRescheduleData({ ...rescheduleData, endTime: e.target.value })
                    }
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Session Duration (Mins)
                  </label>
                  <div className="flex items-center gap-1">
                    {[45, 60, 90, 120].map((mins) => (
                      <button
                        key={mins}
                        type="button"
                        onClick={() =>
                          setRescheduleData({ ...rescheduleData, durationMinutes: mins })
                        }
                        className={`px-1.5 py-0.5 text-[10px] font-semibold rounded ${
                          rescheduleData.durationMinutes === mins
                            ? 'bg-amber-600 text-white'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                        }`}
                      >
                        {mins}m
                      </button>
                    ))}
                  </div>
                </div>
                <input
                  type="number"
                  min={15}
                  step={5}
                  value={rescheduleData.durationMinutes}
                  onChange={(e) =>
                    setRescheduleData({
                      ...rescheduleData,
                      durationMinutes: Number(e.target.value),
                    })
                  }
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Reason for Rescheduling
                </label>
                <input
                  type="text"
                  placeholder="e.g. Student called asking to move to tomorrow"
                  value={rescheduleData.reason}
                  onChange={(e) =>
                    setRescheduleData({ ...rescheduleData, reason: e.target.value })
                  }
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
                />

                {/* Quick presets */}
                <div className="flex items-center gap-1.5 flex-wrap mt-2">
                  {[
                    'Student called to shift class',
                    'Student exam preparation shift',
                    'Tutor personal emergency',
                    'Holiday / Festival adjustment',
                  ].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setRescheduleData({ ...rescheduleData, reason: preset })}
                      className="px-2 py-0.5 text-[10px] rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-amber-100 dark:hover:bg-amber-950/60"
                    >
                      + {preset}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setIsRescheduleModalOpen(false);
                    setRescheduleTarget(null);
                  }}
                  className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold rounded-xl bg-amber-600 hover:bg-amber-700 text-white shadow-xs flex items-center gap-1.5"
                >
                  <CalendarClock className="w-4 h-4" />
                  Confirm Reschedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Adjust Actual Teaching Time Modal */}
      {isAdjustTimeModalOpen && adjustTimeTarget && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 max-w-lg w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Actual Teaching Time Conducted
                  </h3>
                  <p className="text-xs text-slate-500">
                    Record exact hours and minutes taught today (critical for hourly tuition pay)
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsAdjustTimeModalOpen(false);
                  setAdjustTimeTarget(null);
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Target Class Info */}
            <div className="p-3 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900/50 text-xs">
              <div className="flex items-center justify-between font-bold text-slate-900 dark:text-white">
                <span>{adjustTimeTarget.title}</span>
                <span className="text-indigo-600 dark:text-indigo-400">
                  Scheduled: {formatTime(adjustTimeTarget.startTime, settings.timeFormat)} - {formatTime(adjustTimeTarget.endTime, settings.timeFormat)} ({adjustTimeTarget.durationMinutes}m)
                </span>
              </div>
            </div>

            <form onSubmit={handleSaveAdjustTime} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Actual Start Time
                  </label>
                  <input
                    type="time"
                    required
                    value={adjustTimeData.actualStartTime}
                    onChange={(e) =>
                      setAdjustTimeData({ ...adjustTimeData, actualStartTime: e.target.value })
                    }
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Actual End Time
                  </label>
                  <input
                    type="time"
                    required
                    value={adjustTimeData.actualEndTime}
                    onChange={(e) =>
                      setAdjustTimeData({ ...adjustTimeData, actualEndTime: e.target.value })
                    }
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Actual Duration Conducted (Minutes)
                  </label>
                  <div className="flex items-center gap-1">
                    {[45, 60, 75, 90, 120].map((mins) => (
                      <button
                        key={mins}
                        type="button"
                        onClick={() =>
                          setAdjustTimeData({ ...adjustTimeData, actualDurationMinutes: mins })
                        }
                        className={`px-1.5 py-0.5 text-[10px] font-semibold rounded ${
                          adjustTimeData.actualDurationMinutes === mins
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                        }`}
                      >
                        {mins}m ({(mins / 60).toFixed(1)}h)
                      </button>
                    ))}
                  </div>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    min={10}
                    step={5}
                    required
                    value={adjustTimeData.actualDurationMinutes}
                    onChange={(e) =>
                      setAdjustTimeData({
                        ...adjustTimeData,
                        actualDurationMinutes: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-semibold">
                    = {(adjustTimeData.actualDurationMinutes / 60).toFixed(2)} hours
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Topics Covered
                </label>
                <input
                  type="text"
                  placeholder="e.g. Completed Chapter 4 problem set, practice exam questions"
                  value={adjustTimeData.topicsCovered}
                  onChange={(e) =>
                    setAdjustTimeData({ ...adjustTimeData, topicsCovered: e.target.value })
                  }
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Private Remarks
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Student requested an extra 30 mins to finish calculus derivates"
                  value={adjustTimeData.notes}
                  onChange={(e) =>
                    setAdjustTimeData({ ...adjustTimeData, notes: e.target.value })
                  }
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setIsAdjustTimeModalOpen(false);
                    setAdjustTimeTarget(null);
                  }}
                  className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  Mark Present with Actual Time
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
