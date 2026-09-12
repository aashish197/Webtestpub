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
} from 'lucide-react';
import { getAttendanceStatusBadge, formatTime, exportToCsv } from '../utils/formatters';
import { formatDisplayDate, getTodayIso, NEPALI_MONTHS_EN, adToBs, getDayOfWeek } from '../utils/nepaliCalendar';
import { resolveClassSchedule } from '../utils/scheduleHelpers';
import confetti from 'canvas-confetti';

export const AttendanceView: React.FC = () => {
  const {
    attendance,
    markAttendance,
    updateAttendance,
    deleteAttendance,
    batchMarkAttendanceToday,
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
      notes: `Marked as ${status}`,
    });

    if (status === 'present') {
      confetti({ particleCount: 20, spread: 40 });
    }
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
                      </div>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                        {cls.title}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 self-end sm:self-center">
                    {isMarked ? (
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-3 py-1 text-xs font-bold rounded-lg ${
                            getAttendanceStatusBadge(record.status).badgeClass
                          }`}
                        >
                          {record.status.toUpperCase()}
                        </span>
                        <button
                          onClick={() => handleMarkClassToday(cls, record.status === 'present' ? 'absent' : 'present')}
                          className="text-xs text-indigo-600 hover:underline font-semibold"
                        >
                          Change
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleMarkClassToday(cls, 'present')}
                          className="px-3 py-1.5 text-xs font-bold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 shadow-xs"
                        >
                          Present
                        </button>
                        <button
                          onClick={() => handleMarkClassToday(cls, 'absent')}
                          className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-rose-200 dark:border-rose-800 text-rose-600 hover:bg-rose-50"
                        >
                          Absent
                        </button>
                        <button
                          onClick={() => handleMarkClassToday(cls, 'cancelled')}
                          className="px-2.5 py-1.5 text-xs font-medium rounded-lg text-slate-500 hover:bg-slate-100"
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
                        </div>
                      </td>

                      <td className="px-4 py-3 text-slate-700 dark:text-slate-300 font-medium">
                        {rec.subject}
                      </td>

                      <td className="px-4 py-3 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                        {formatTime(rec.startTime, settings.timeFormat)} -{' '}
                        {formatTime(rec.endTime, settings.timeFormat)} ({rec.durationMinutes}m)
                        {isCollege && rec.periodsCount ? ` • ${rec.periodsCount} pd` : ''}
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`px-2.5 py-1 text-[11px] font-bold rounded-lg ${badgeClass}`}>
                          {label}
                        </span>
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
                    const res = resolveClassSchedule(cls, dow, formData.date);
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
                        {formatTime(res.startTime)} - {formatTime(res.endTime)}
                      </span>
                    );
                  })()}
                </div>
                <select
                  value={formData.classId || ''}
                  onChange={(e) => {
                    const cls = classes.find((c) => c.id === e.target.value);
                    if (cls) {
                      let tName = cls.title;
                      if (cls.type === 'home_tuition') {
                        const st = students.find((s) => s.id === cls.studentId);
                        if (st) tName = st.name;
                      } else {
                        const inObj = institutions.find((i) => i.id === cls.institutionId);
                        if (inObj) tName = inObj.name;
                      }
                      const dow = getDayOfWeek(formData.date);
                      const res = resolveClassSchedule(cls, dow, formData.date);
                      setFormData({
                        ...formData,
                        classId: cls.id,
                        type: cls.type,
                        studentId: cls.studentId,
                        institutionId: cls.institutionId,
                        targetName: tName,
                        subject: cls.subject,
                        startTime: res.startTime,
                        endTime: res.endTime,
                        durationMinutes: res.durationMinutes,
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
    </div>
  );
};
