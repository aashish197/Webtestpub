import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import {
  TeachingClass,
  DayOfWeek,
  FeeStructureType,
  ClassScheduleType,
  DayWiseClassSchedule,
  DateSpecificClassSchedule,
} from '../types';
import {
  CalendarDays,
  Plus,
  Clock,
  MapPin,
  Calendar,
  Layers,
  Edit2,
  Trash2,
  CheckCircle2,
  Filter,
  UserCheck,
  Building2,
  Users,
  ChevronLeft,
  ChevronRight,
  X,
  Sparkles,
  AlertCircle,
  Sliders,
} from 'lucide-react';
import { formatCurrency, formatTime } from '../utils/formatters';
import { formatDisplayDate, getTodayIso, NEPALI_MONTHS_EN, adToBs } from '../utils/nepaliCalendar';
import { resolveClassSchedule, calculateEndTime, calculateDurationMinutes, DAYS_OF_WEEK } from '../utils/scheduleHelpers';

const PRESET_COLORS = [
  '#3b82f6', // blue
  '#8b5cf6', // purple
  '#10b981', // emerald
  '#06b6d4', // cyan
  '#f59e0b', // amber
  '#ec4899', // pink
  '#6366f1', // indigo
  '#14b8a6', // teal
];

const DEFAULT_DAY_WISE_TIMES: Record<DayOfWeek, DayWiseClassSchedule> = {
  Sunday: { startTime: '07:00', endTime: '08:30', durationMinutes: 90 },
  Monday: { startTime: '16:00', endTime: '17:00', durationMinutes: 60 },
  Tuesday: { startTime: '16:00', endTime: '17:00', durationMinutes: 60 },
  Wednesday: { startTime: '16:00', endTime: '17:00', durationMinutes: 60 },
  Thursday: { startTime: '16:00', endTime: '17:00', durationMinutes: 60 },
  Friday: { startTime: '16:00', endTime: '17:00', durationMinutes: 60 },
  Saturday: { startTime: '09:00', endTime: '11:00', durationMinutes: 120 },
};

export const ClassesRoutineView: React.FC = () => {
  const {
    classes,
    addClass,
    updateClass,
    deleteClass,
    students,
    institutions,
    settings,
    attendance,
    markAttendance,
    payments,
  } = useApp();

  const [routineViewMode, setRoutineViewMode] = useState<'weekly' | 'daily' | 'monthly' | 'all'>('weekly');
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>(() => {
    const days: DayOfWeek[] = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[new Date().getDay()];
  });
  const [selectedMonthOffset, setSelectedMonthOffset] = useState<number>(0);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<TeachingClass | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Specific Date Exception Temp Inputs
  const [newDateInput, setNewDateInput] = useState<string>(getTodayIso());
  const [newDateStartTime, setNewDateStartTime] = useState<string>('08:00');
  const [newDateEndTime, setNewDateEndTime] = useState<string>('09:30');
  const [newDateNote, setNewDateNote] = useState<string>('');

  const [newOverrideDate, setNewOverrideDate] = useState<string>(getTodayIso());
  const [newOverrideStartTime, setNewOverrideStartTime] = useState<string>('08:00');
  const [newOverrideEndTime, setNewOverrideEndTime] = useState<string>('09:30');
  const [newOverrideNote, setNewOverrideNote] = useState<string>('');

  // Form State
  const initialFormState: Omit<TeachingClass, 'id'> = {
    title: '',
    type: 'home_tuition',
    studentId: students[0]?.id || '',
    institutionId: institutions[0]?.id || '',
    subject: 'Mathematics',
    location: "Student's Residence",
    feeStructure: 'monthly',
    feeAmount: 10000,
    durationMinutes: settings.defaultClassDuration || 60,
    scheduleType: 'uniform',
    scheduleDays: ['Sunday', 'Tuesday', 'Thursday'],
    startTime: '16:00',
    endTime: '17:00',
    dayWiseSchedules: { ...DEFAULT_DAY_WISE_TIMES },
    dateSpecificSchedules: [],
    color: '#3b82f6',
    startDate: getTodayIso(),
    notes: '',
    isActive: true,
  };

  const [formData, setFormData] = useState<Omit<TeachingClass, 'id'>>(initialFormState);

  const handleOpenAdd = () => {
    setEditingClass(null);
    setFormData({
      ...initialFormState,
      studentId: students[0]?.id || '',
      institutionId: institutions[0]?.id || '',
      dayWiseSchedules: { ...DEFAULT_DAY_WISE_TIMES },
      dateSpecificSchedules: [],
    });
    setNewDateInput(getTodayIso());
    setNewDateNote('');
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (cls: TeachingClass) => {
    setEditingClass(cls);

    const dayWise: Partial<Record<DayOfWeek, DayWiseClassSchedule>> = { ...DEFAULT_DAY_WISE_TIMES };
    if (cls.dayWiseSchedules) {
      Object.assign(dayWise, cls.dayWiseSchedules);
    } else {
      cls.scheduleDays.forEach((d) => {
        dayWise[d] = {
          startTime: cls.startTime,
          endTime: cls.endTime,
          durationMinutes: cls.durationMinutes,
        };
      });
    }

    setFormData({
      title: cls.title,
      type: cls.type,
      studentId: cls.studentId || '',
      studentIds: cls.studentIds,
      groupName: cls.groupName,
      institutionId: cls.institutionId || '',
      subject: cls.subject,
      location: cls.location,
      feeStructure: cls.feeStructure,
      feeAmount: cls.feeAmount,
      durationMinutes: cls.durationMinutes,
      scheduleType: cls.scheduleType || (cls.dayWiseSchedules ? 'day_wise' : 'uniform'),
      scheduleDays: [...cls.scheduleDays],
      startTime: cls.startTime,
      endTime: cls.endTime,
      dayWiseSchedules: dayWise,
      dateSpecificSchedules: cls.dateSpecificSchedules ? [...cls.dateSpecificSchedules] : [],
      color: cls.color,
      startDate: cls.startDate || getTodayIso(),
      notes: cls.notes || '',
      isActive: cls.isActive,
    });
    setNewDateInput(getTodayIso());
    setNewDateNote('');
    setIsAddModalOpen(true);
  };

  const handleUpdateDaySchedule = (day: DayOfWeek, updates: Partial<DayWiseClassSchedule>) => {
    const current = formData.dayWiseSchedules?.[day] || {
      startTime: formData.startTime || '16:00',
      endTime: formData.endTime || '17:00',
      durationMinutes: formData.durationMinutes || 60,
    };
    const updated = { ...current, ...updates };

    if (updates.startTime || updates.endTime) {
      const s = updates.startTime || updated.startTime;
      const e = updates.endTime || updated.endTime;
      const [sh, sm] = s.split(':').map(Number);
      const [eh, em] = e.split(':').map(Number);
      const diff = (eh * 60 + em) - (sh * 60 + sm);
      if (diff > 0) {
        updated.durationMinutes = diff;
      }
    }

    setFormData({
      ...formData,
      dayWiseSchedules: {
        ...formData.dayWiseSchedules,
        [day]: updated,
      },
    });
  };

  const handleAddDateSchedule = () => {
    if (!newDateInput) return;
    const [sh, sm] = newDateStartTime.split(':').map(Number);
    const [eh, em] = newDateEndTime.split(':').map(Number);
    const diff = (eh * 60 + em) - (sh * 60 + sm);
    const dur = diff > 0 ? diff : 60;

    const newEntry: DateSpecificClassSchedule = {
      id: `ds-${Date.now()}`,
      date: newDateInput,
      startTime: newDateStartTime,
      endTime: newDateEndTime,
      durationMinutes: dur,
      note: newDateNote.trim() || undefined,
    };

    setFormData({
      ...formData,
      dateSpecificSchedules: [...(formData.dateSpecificSchedules || []), newEntry],
    });
    setNewDateNote('');
  };

  const handleRemoveDateSchedule = (id: string) => {
    setFormData({
      ...formData,
      dateSpecificSchedules: (formData.dateSpecificSchedules || []).filter((s) => s.id !== id),
    });
  };

  const handleDayWiseScheduleChange = (day: DayOfWeek, updates: Partial<DayWiseClassSchedule>) => {
    handleUpdateDaySchedule(day, updates);
  };

  const handleAddDateOverride = () => {
    if (!newOverrideDate) return;
    const dur = calculateDurationMinutes(newOverrideStartTime, newOverrideEndTime);
    const newEntry: DateSpecificClassSchedule = {
      id: `ovr-${Date.now()}`,
      date: newOverrideDate,
      startTime: newOverrideStartTime,
      endTime: newOverrideEndTime,
      durationMinutes: dur,
      note: newOverrideNote.trim() || undefined,
    };
    setFormData({
      ...formData,
      dateSpecificSchedules: [...(formData.dateSpecificSchedules || []), newEntry],
    });
    setNewOverrideNote('');
  };

  const handleRemoveDateOverride = (dateOrId: string) => {
    setFormData({
      ...formData,
      dateSpecificSchedules: (formData.dateSpecificSchedules || []).filter(
        (s) => s.id !== dateOrId && s.date !== dateOrId
      ),
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let finalTitle = formData.title.trim();
    if (!finalTitle) {
      if (formData.type === 'home_tuition') {
        const student = students.find((s) => s.id === formData.studentId);
        finalTitle = student ? `${student.name} - ${formData.subject}` : `${formData.subject} Tuition`;
      } else {
        const inst = institutions.find((i) => i.id === formData.institutionId);
        finalTitle = inst ? `${inst.name} - ${formData.subject}` : `${formData.subject} Class`;
      }
    }

    // Determine fallback startTime/endTime from first active day if day-wise
    let fallbackStartTime = formData.startTime;
    let fallbackEndTime = formData.endTime;
    let fallbackDuration = formData.durationMinutes;

    if (formData.scheduleType === 'day_wise' && formData.scheduleDays.length > 0) {
      const firstDay = formData.scheduleDays[0];
      const firstDayConfig = formData.dayWiseSchedules?.[firstDay];
      if (firstDayConfig) {
        fallbackStartTime = firstDayConfig.startTime;
        fallbackEndTime = firstDayConfig.endTime;
        fallbackDuration = firstDayConfig.durationMinutes || fallbackDuration;
      }
    }

    const payload = {
      ...formData,
      title: finalTitle,
      startTime: fallbackStartTime,
      endTime: fallbackEndTime,
      durationMinutes: fallbackDuration,
    };

    if (editingClass) {
      updateClass(editingClass.id, payload);
    } else {
      addClass(payload);
    }
    setIsAddModalOpen(false);
  };

  const handleToggleScheduleDay = (day: DayOfWeek) => {
    if (formData.scheduleDays.includes(day)) {
      setFormData({
        ...formData,
        scheduleDays: formData.scheduleDays.filter((d) => d !== day),
      });
    } else {
      setFormData({
        ...formData,
        scheduleDays: [...formData.scheduleDays, day],
      });
    }
  };

  // Group classes by day for weekly matrix with resolved day-wise timings
  const weeklyGridData = useMemo(() => {
    const map: Record<DayOfWeek, { cls: TeachingClass; resolved: ReturnType<typeof resolveClassSchedule> }[]> = {
      Sunday: [],
      Monday: [],
      Tuesday: [],
      Wednesday: [],
      Thursday: [],
      Friday: [],
      Saturday: [],
    };

    classes
      .filter((c) => c.isActive)
      .forEach((cls) => {
        cls.scheduleDays.forEach((day) => {
          if (map[day]) {
            const resolved = resolveClassSchedule(cls, day);
            map[day].push({ cls, resolved });
          }
        });
      });

    // Sort each day by startTime
    Object.keys(map).forEach((d) => {
      map[d as DayOfWeek].sort((a, b) => a.resolved.startTime.localeCompare(b.resolved.startTime));
    });

    return map;
  }, [classes]);

  // Calendar view calculation (Monthly)
  const currentCalendarMonthDate = useMemo(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + selectedMonthOffset);
    return d;
  }, [selectedMonthOffset]);

  const daysInMonthArray = useMemo(() => {
    const year = currentCalendarMonthDate.getFullYear();
    const month = currentCalendarMonthDate.getMonth();
    const firstDayIndex = new Date(year, month, 1).getDay(); // 0 = Sunday
    const totalDays = new Date(year, month + 1, 0).getDate();

    const days: { dateIso: string; dayNum: number; dayOfWeek: DayOfWeek; isCurrentMonth: boolean }[] = [];

    for (let i = 0; i < firstDayIndex; i++) {
      days.push({ dateIso: '', dayNum: 0, dayOfWeek: DAYS_OF_WEEK[i], isCurrentMonth: false });
    }

    for (let d = 1; d <= totalDays; d++) {
      const monthStr = String(month + 1).padStart(2, '0');
      const dayStr = String(d).padStart(2, '0');
      const dateIso = `${year}-${monthStr}-${dayStr}`;
      const dayOfWeek = DAYS_OF_WEEK[new Date(year, month, d).getDay()];
      days.push({ dateIso, dayNum: d, dayOfWeek, isCurrentMonth: true });
    }

    return days;
  }, [currentCalendarMonthDate]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <CalendarDays className="w-5 h-5" />
            </div>
            Routine & Timetable Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Weekly schedules, daily routine timeline, and monthly calendar for tuitions and college lectures.
          </p>
        </div>

        {/* View Mode Switcher & Add Button */}
        <div className="flex items-center gap-2">
          <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-xl flex items-center">
            <button
              onClick={() => setRoutineViewMode('weekly')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                routineViewMode === 'weekly'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Weekly Grid
            </button>
            <button
              onClick={() => setRoutineViewMode('daily')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                routineViewMode === 'daily'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Daily Routine
            </button>
            <button
              onClick={() => setRoutineViewMode('monthly')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                routineViewMode === 'monthly'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Calendar
            </button>
            <button
              onClick={() => setRoutineViewMode('all')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                routineViewMode === 'all'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              All Classes ({classes.length})
            </button>
          </div>

          <button
            id="btn-add-class-main"
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Add Class</span>
          </button>
        </div>
      </div>

      {/* VIEW 1: WEEKLY TIMETABLE MATRIX */}
      {routineViewMode === 'weekly' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-indigo-600" />
              Weekly Teaching Timetable (Sunday to Saturday)
            </h3>
            <span className="text-xs text-slate-500">
              Total active slots: {classes.filter((c) => c.isActive).length} classes
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
            {DAYS_OF_WEEK.map((day) => {
              const dayClasses = weeklyGridData[day] || [];
              const isToday =
                DAYS_OF_WEEK[new Date().getDay()] === day;

              return (
                <div
                  key={day}
                  className={`rounded-xl p-3 border flex flex-col min-h-[300px] transition ${
                    isToday
                      ? 'bg-indigo-50/40 dark:bg-indigo-950/20 border-indigo-200 dark:border-indigo-800/60'
                      : 'bg-slate-50/70 dark:bg-slate-800/40 border-slate-200/80 dark:border-slate-700/80'
                  }`}
                >
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200/60 dark:border-slate-700/60 mb-2">
                    <span
                      className={`text-xs font-bold ${
                        isToday
                          ? 'text-indigo-600 dark:text-indigo-400'
                          : 'text-slate-800 dark:text-slate-200'
                      }`}
                    >
                      {day.slice(0, 3)}
                      {isToday && ' (Today)'}
                    </span>
                    <span className="text-[10px] font-semibold text-slate-400 bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded-full border border-slate-200 dark:border-slate-700">
                      {dayClasses.length}
                    </span>
                  </div>

                  <div className="space-y-2 flex-1">
                    {dayClasses.length === 0 ? (
                      <div className="h-full flex items-center justify-center text-center p-2 text-slate-400 text-[11px]">
                        No class
                      </div>
                    ) : (
                      dayClasses.map(({ cls, resolved }) => {
                        const isCollege = cls.type === 'college';
                        return (
                          <div
                            key={cls.id}
                            className="p-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs hover:border-indigo-400 transition cursor-pointer group"
                            onClick={() => handleOpenEdit(cls)}
                          >
                            <div className="flex items-center justify-between gap-1">
                              <span className="text-[10px] font-bold text-slate-900 dark:text-white flex items-center gap-1 truncate">
                                <span
                                  className="w-2 h-2 rounded-full shrink-0"
                                  style={{ backgroundColor: cls.color || '#3b82f6' }}
                                />
                                {formatTime(resolved.startTime, settings.timeFormat)}
                              </span>
                              <span
                                className={`text-[9px] font-bold px-1 rounded ${
                                  isCollege
                                    ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300'
                                    : 'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300'
                                }`}
                              >
                                {isCollege ? 'College' : 'Tuition'}
                              </span>
                            </div>

                            <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 mt-1 truncate">
                              {cls.title}
                            </p>
                            <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                              <span className="truncate">{cls.subject}</span>
                              <span className="shrink-0">{resolved.durationMinutes}m</span>
                            </div>
                            {cls.scheduleType === 'day_wise' && (
                              <div className="mt-1 text-[9px] font-medium text-indigo-600 dark:text-indigo-400">
                                Day-wise time
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW 2: DAILY ROUTINE TIMELINE */}
      {routineViewMode === 'daily' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
          {/* Day Selector Pills */}
          <div className="flex items-center justify-between flex-wrap gap-2 pb-4 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Daily Class Schedule for {selectedDay}
            </h3>

            <div className="flex flex-wrap gap-1">
              {DAYS_OF_WEEK.map((d) => (
                <button
                  key={d}
                  onClick={() => setSelectedDay(d)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-xl border transition ${
                    selectedDay === d
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          {/* Daily Timeline */}
          <div className="space-y-3">
            {weeklyGridData[selectedDay].length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <Clock className="w-8 h-8 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                <p className="text-sm font-semibold">No classes scheduled for {selectedDay}</p>
                <p className="text-xs mt-0.5">Click "+ Add Class" to assign classes on this day.</p>
              </div>
            ) : (
              weeklyGridData[selectedDay].map(({ cls, resolved }, idx) => (
                <div
                  key={cls.id}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-3.5">
                    <div
                      className="w-3 h-14 rounded-full shrink-0"
                      style={{ backgroundColor: cls.color || '#3b82f6' }}
                    />
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                          {formatTime(resolved.startTime, settings.timeFormat)} -{' '}
                          {formatTime(resolved.endTime, settings.timeFormat)} ({resolved.durationMinutes} mins)
                        </span>
                        <span
                          className={`px-2 py-0.5 text-[10px] font-bold rounded-md ${
                            cls.type === 'college'
                              ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300'
                              : 'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300'
                          }`}
                        >
                          {cls.type === 'college' ? 'College' : 'Home Tuition'}
                        </span>
                        {cls.scheduleType === 'day_wise' && (
                          <span className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300">
                            Day-Wise Time
                          </span>
                        )}
                        {cls.dateSpecificSchedules && cls.dateSpecificSchedules.length > 0 && (
                          <span className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                            {cls.dateSpecificSchedules.length} Date Exception{cls.dateSpecificSchedules.length > 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-1">
                        {cls.title}
                      </h4>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        <span>
                          Subject: <strong className="text-slate-700 dark:text-slate-300">{cls.subject}</strong>
                        </span>
                        <span>•</span>
                        <span>Location: {cls.location}</span>
                        {cls.startDate && (
                          <>
                            <span>•</span>
                            <span className="text-indigo-600 dark:text-indigo-400 font-medium">
                              Started: {formatDisplayDate(cls.startDate, settings.calendarMode)}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <button
                      onClick={() => handleOpenEdit(cls)}
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50"
                    >
                      Edit Class
                    </button>
                    <button
                      onClick={() => setDeleteConfirmId(cls.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* VIEW 3: MONTHLY CALENDAR VIEW */}
      {routineViewMode === 'monthly' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {currentCalendarMonthDate.toLocaleDateString('en-US', {
                  month: 'long',
                  year: 'numeric',
                })}
              </h3>
              {settings.dateSystem === 'BS' && (
                <span className="px-2 py-0.5 text-xs font-semibold rounded-md bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                  BS: {NEPALI_MONTHS_EN[adToBs(currentCalendarMonthDate).month - 1]}{' '}
                  {adToBs(currentCalendarMonthDate).year}
                </span>
              )}
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setSelectedMonthOffset((prev) => prev - 1)}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setSelectedMonthOffset(0)}
                className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Today
              </button>
              <button
                onClick={() => setSelectedMonthOffset((prev) => prev + 1)}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-2">
            {DAYS_OF_WEEK.map((d) => (
              <div
                key={d}
                className="text-center font-bold text-xs text-slate-500 py-1 border-b border-slate-100 dark:border-slate-800"
              >
                {d.slice(0, 3)}
              </div>
            ))}

            {daysInMonthArray.map((dayObj, idx) => {
              if (!dayObj.isCurrentMonth) {
                return (
                  <div
                    key={idx}
                    className="min-h-[85px] p-1.5 rounded-xl bg-slate-50/30 dark:bg-slate-900/20 border border-transparent"
                  />
                );
              }

              const isToday = dayObj.dateIso === getTodayIso();
              
              // Resolve active classes for this specific calendar date
              const dayClassesForDate = classes
                .filter((c) => c.isActive)
                .map((c) => ({
                  cls: c,
                  resolved: resolveClassSchedule(c, dayObj.dayOfWeek, dayObj.dateIso),
                }))
                .filter((item) => item.resolved.isActive);

              const dayPayments = payments.filter((p) => p.dueDate === dayObj.dateIso);

              return (
                <div
                  key={idx}
                  className={`min-h-[85px] p-2 rounded-xl border transition flex flex-col justify-between ${
                    isToday
                      ? 'bg-indigo-50/50 dark:bg-indigo-950/30 border-indigo-300 dark:border-indigo-700'
                      : 'bg-white dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/60'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-bold ${
                        isToday
                          ? 'w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center'
                          : 'text-slate-800 dark:text-slate-200'
                      }`}
                    >
                      {dayObj.dayNum}
                    </span>
                    {settings.dateSystem === 'BS' && (
                      <span className="text-[10px] text-slate-400">
                        {adToBs(dayObj.dateIso).day}
                      </span>
                    )}
                  </div>

                  <div className="space-y-1 my-1">
                    {dayClassesForDate.slice(0, 2).map(({ cls, resolved }) => (
                      <div
                        key={cls.id}
                        className="text-[9px] font-semibold px-1.5 py-0.5 rounded truncate text-white flex items-center gap-1"
                        style={{ backgroundColor: cls.color || '#3b82f6' }}
                        title={`${cls.title} (${resolved.startTime} - ${resolved.endTime})${resolved.isDateOverride ? ` [Special: ${resolved.note || 'Override'}]` : ''}`}
                      >
                        {resolved.isDateOverride && <Sparkles className="w-2.5 h-2.5 shrink-0 text-amber-200" />}
                        <span className="truncate">
                          {formatTime(resolved.startTime, settings.timeFormat)} {cls.subject}
                        </span>
                      </div>
                    ))}
                    {dayClassesForDate.length > 2 && (
                      <span className="text-[9px] text-slate-400 font-bold block">
                        +{dayClassesForDate.length - 2} more
                      </span>
                    )}

                    {dayPayments.map((p) => (
                      <div
                        key={p.id}
                        className="text-[9px] font-bold px-1 py-0.5 rounded bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-300 truncate"
                        title={`Due: ${p.targetName}`}
                      >
                        Due: {p.targetName.slice(0, 10)}..
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW 4: ALL CLASSES LIST VIEW */}
      {routineViewMode === 'all' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {classes.map((cls) => {
              const isCollege = cls.type === 'college';
              const isDayWise = cls.scheduleType === 'day_wise';
              const dateExceptionsCount = cls.dateSpecificSchedules?.length || 0;

              return (
                <div
                  key={cls.id}
                  className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs flex flex-col justify-between hover:border-indigo-400 transition"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span
                        className={`text-xs font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
                          isCollege
                            ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300'
                            : 'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300'
                        }`}
                      >
                        {isCollege ? <Building2 className="w-3 h-3" /> : <Users className="w-3 h-3" />}
                        {isCollege ? 'College Class' : 'Tuition Class'}
                      </span>

                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          cls.isActive
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                            : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-400'
                        }`}
                      >
                        {cls.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: cls.color || '#3b82f6' }}
                      />
                      <h4 className="text-base font-bold text-slate-900 dark:text-white truncate">
                        {cls.title}
                      </h4>
                    </div>

                    <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mt-1">
                      Subject: {cls.subject}
                    </p>

                    {/* Schedule Details */}
                    <div className="mt-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-xs space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Schedule Type:</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          {isDayWise ? 'Day-Wise Variable' : 'Uniform Timing'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Active Days:</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {(cls.scheduleDays || []).map((d) => d.slice(0, 3)).join(', ') || 'None'}
                        </span>
                      </div>

                      {!isDayWise ? (
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">Timing:</span>
                          <span className="font-semibold text-slate-800 dark:text-slate-200">
                            {formatTime(cls.startTime, settings.timeFormat)} - {formatTime(cls.endTime, settings.timeFormat)} ({cls.durationMinutes}m)
                          </span>
                        </div>
                      ) : (
                        <div className="pt-1 border-t border-slate-200/50 dark:border-slate-700/50 space-y-1">
                          <span className="text-[11px] font-semibold text-slate-500 block">Day Breakdown:</span>
                          <div className="grid grid-cols-2 gap-1 text-[11px]">
                            {cls.scheduleDays.map((d) => {
                              const daySch = cls.dayWiseSchedules?.[d];
                              return (
                                <div key={d} className="flex justify-between bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                                  <span className="font-medium text-slate-600 dark:text-slate-400">{d.slice(0, 3)}:</span>
                                  <span className="font-bold text-slate-800 dark:text-slate-200">
                                    {daySch ? formatTime(daySch.startTime, settings.timeFormat) : formatTime(cls.startTime, settings.timeFormat)}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {dateExceptionsCount > 0 && (
                        <div className="pt-1 text-[11px] text-amber-700 dark:text-amber-300 font-medium flex items-center gap-1">
                          <Sparkles className="w-3 h-3" />
                          <span>{dateExceptionsCount} date exception{dateExceptionsCount > 1 ? 's' : ''} configured</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                    <button
                      onClick={() => handleOpenEdit(cls)}
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 transition"
                    >
                      Edit Schedule
                    </button>
                    <button
                      onClick={() => setDeleteConfirmId(cls.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Add / Edit Class Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 max-w-2xl w-full p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                {editingClass ? 'Edit Class / Routine Slot' : 'Create Class / Schedule Slot'}
              </h2>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs">
              {/* Type Selection: Home Tuition vs College */}
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Teaching Engagement Type *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, type: 'home_tuition' })}
                    className={`p-3 rounded-xl border flex items-center gap-2.5 font-bold transition ${
                      formData.type === 'home_tuition'
                        ? 'bg-teal-50 dark:bg-teal-950/50 border-teal-500 text-teal-700 dark:text-teal-300 shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <Users className="w-4 h-4" />
                    <span>Home Tuition Class</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, type: 'college' })}
                    className={`p-3 rounded-xl border flex items-center gap-2.5 font-bold transition ${
                      formData.type === 'college'
                        ? 'bg-purple-50 dark:bg-purple-950/50 border-purple-500 text-purple-700 dark:text-purple-300 shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <Building2 className="w-4 h-4" />
                    <span>College / Campus Class</span>
                  </button>
                </div>
              </div>

              {/* Link Target: Student or Institution */}
              {formData.type === 'home_tuition' ? (
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Select Student *
                  </label>
                  <select
                    value={formData.studentId}
                    onChange={(e) => {
                      const st = students.find((s) => s.id === e.target.value);
                      setFormData({
                        ...formData,
                        studentId: e.target.value,
                        subject: st?.subjects[0] || formData.subject,
                        feeAmount: st?.feeAmount || formData.feeAmount,
                        feeStructure: st?.feeStructure || formData.feeStructure,
                      });
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
                  >
                    {students.map((st) => (
                      <option key={st.id} value={st.id}>
                        {st.name} ({st.grade} - {st.tuitionType})
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Select College / Institution *
                  </label>
                  <select
                    value={formData.institutionId}
                    onChange={(e) => {
                      const inst = institutions.find((i) => i.id === e.target.value);
                      setFormData({
                        ...formData,
                        institutionId: e.target.value,
                        subject: inst?.subjects[0] || formData.subject,
                        feeAmount: inst?.rateAmount || formData.feeAmount,
                        feeStructure: inst?.paymentStructure || formData.feeStructure,
                      });
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
                  >
                    {institutions.map((inst) => (
                      <option key={inst.id} value={inst.id}>
                        {inst.name} ({inst.facultyOrGrade})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Class Title & Subject */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Class Title (Optional Custom Name)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Aarav Sharma - Opt Math"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Subject *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Optional Mathematics"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>
              </div>

              {/* Schedule Type Selection */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Weekly Schedule Structure
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, scheduleType: 'uniform' })}
                    className={`p-3 rounded-xl border text-left transition flex items-start gap-2.5 ${
                      formData.scheduleType === 'uniform'
                        ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/30 ring-1 ring-indigo-500'
                        : 'border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full border mt-0.5 flex items-center justify-center ${
                      formData.scheduleType === 'uniform' ? 'border-indigo-600 bg-indigo-600' : 'border-slate-400'
                    }`}>
                      {formData.scheduleType === 'uniform' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-900 dark:text-white block">
                        Same Schedule All Week
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">
                        Class starts and ends at the same time on all selected days.
                      </span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, scheduleType: 'day_wise' })}
                    className={`p-3 rounded-xl border text-left transition flex items-start gap-2.5 ${
                      formData.scheduleType === 'day_wise'
                        ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/30 ring-1 ring-indigo-500'
                        : 'border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full border mt-0.5 flex items-center justify-center ${
                      formData.scheduleType === 'day_wise' ? 'border-indigo-600 bg-indigo-600' : 'border-slate-400'
                    }`}>
                      {formData.scheduleType === 'day_wise' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-900 dark:text-white block">
                        Different Times on Different Days
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">
                        Set individual start & end times for each active day of the week.
                      </span>
                    </div>
                  </button>
                </div>

                {/* UNIFORM SCHEDULE CONTROLS */}
                {formData.scheduleType === 'uniform' && (
                  <div className="space-y-3 pt-2">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        Active Days of the Week *
                      </label>
                      <div className="flex flex-wrap gap-1.5">
                        {DAYS_OF_WEEK.map((day) => {
                          const isSelected = formData.scheduleDays.includes(day);
                          return (
                            <button
                              key={day}
                              type="button"
                              onClick={() => handleToggleScheduleDay(day)}
                              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
                                isSelected
                                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                              }`}
                            >
                              {day.slice(0, 3)}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Start Time *
                        </label>
                        <input
                          type="time"
                          required
                          value={formData.startTime}
                          onChange={(e) => {
                            const newStart = e.target.value;
                            const newEnd = calculateEndTime(newStart, formData.durationMinutes);
                            setFormData({ ...formData, startTime: newStart, endTime: newEnd });
                          }}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none text-xs"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          End Time *
                        </label>
                        <input
                          type="time"
                          required
                          value={formData.endTime}
                          onChange={(e) => {
                            const newEnd = e.target.value;
                            const diff = calculateDurationMinutes(formData.startTime, newEnd);
                            setFormData({
                              ...formData,
                              endTime: newEnd,
                              durationMinutes: diff > 0 ? diff : formData.durationMinutes,
                            });
                          }}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none text-xs"
                        />
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                            Duration (Minutes)
                          </label>
                          <div className="flex items-center gap-1">
                            {[35, 40, 45, 50, 60, 90].map((d) => (
                              <button
                                key={d}
                                type="button"
                                onClick={() => {
                                  const newEnd = calculateEndTime(formData.startTime, d);
                                  setFormData({ ...formData, durationMinutes: d, endTime: newEnd });
                                }}
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
                          value={formData.durationMinutes}
                          onChange={(e) => {
                            const dur = Number(e.target.value);
                            const newEnd = calculateEndTime(formData.startTime, dur);
                            setFormData({ ...formData, durationMinutes: dur, endTime: newEnd });
                          }}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none text-xs"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* DAY-WISE VARIABLE SCHEDULE CONTROLS */}
                {formData.scheduleType === 'day_wise' && (
                  <div className="space-y-2 pt-2">
                    <p className="text-xs text-slate-500">
                      Enable or disable class on each day, and set custom times for each day:
                    </p>
                    <div className="space-y-2">
                      {DAYS_OF_WEEK.map((day) => {
                        const sched = formData.dayWiseSchedules[day] || {
                          day,
                          isActive: false,
                          startTime: '07:00',
                          endTime: '08:00',
                          durationMinutes: 60,
                        };

                        return (
                          <div
                            key={day}
                            className={`p-2.5 rounded-xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 ${
                              sched.isActive
                                ? 'bg-white dark:bg-slate-800 border-indigo-200 dark:border-indigo-800/60 shadow-xs'
                                : 'bg-slate-100/60 dark:bg-slate-900/30 border-slate-200 dark:border-slate-800 opacity-70'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                id={`day-active-${day}`}
                                checked={sched.isActive}
                                onChange={(e) =>
                                  handleDayWiseScheduleChange(day, { isActive: e.target.checked })
                                }
                                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                              />
                              <label
                                htmlFor={`day-active-${day}`}
                                className="text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer min-w-[70px]"
                              >
                                {day}
                              </label>
                            </div>

                            {sched.isActive ? (
                              <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap text-xs">
                                <div className="flex items-center gap-1">
                                  <span className="text-[11px] text-slate-500">Start:</span>
                                  <input
                                    type="time"
                                    value={sched.startTime}
                                    onChange={(e) => {
                                      const newStart = e.target.value;
                                      const newEnd = calculateEndTime(newStart, sched.durationMinutes);
                                      handleDayWiseScheduleChange(day, {
                                        startTime: newStart,
                                        endTime: newEnd,
                                      });
                                    }}
                                    className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
                                  />
                                </div>

                                <div className="flex items-center gap-1">
                                  <span className="text-[11px] text-slate-500">End:</span>
                                  <input
                                    type="time"
                                    value={sched.endTime}
                                    onChange={(e) => {
                                      const newEnd = e.target.value;
                                      const diff = calculateDurationMinutes(sched.startTime, newEnd);
                                      handleDayWiseScheduleChange(day, {
                                        endTime: newEnd,
                                        durationMinutes: diff > 0 ? diff : sched.durationMinutes,
                                      });
                                    }}
                                    className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
                                  />
                                </div>

                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 shrink-0">
                                  {sched.durationMinutes}m
                                </span>
                              </div>
                            ) : (
                              <span className="text-xs text-slate-400 italic">No class scheduled</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* DATE-SPECIFIC OVERRIDES & SPECIAL SESSIONS */}
              <div className="p-3.5 rounded-xl bg-amber-50/40 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-800/40 space-y-3">
                <div>
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      Different Schedule on Specific Dates (Date Overrides / Special Classes)
                    </label>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Add special timings for exams, revision marathons, or one-off schedule shifts on specific calendar dates.
                  </p>
                </div>

                {/* Add Specific Date Row */}
                <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-amber-200 dark:border-slate-700 space-y-2">
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-0.5">
                        Date *
                      </label>
                      <input
                        type="date"
                        value={newOverrideDate}
                        onChange={(e) => setNewOverrideDate(e.target.value)}
                        className="w-full px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-0.5">
                        Start Time
                      </label>
                      <input
                        type="time"
                        value={newOverrideStartTime}
                        onChange={(e) => setNewOverrideStartTime(e.target.value)}
                        className="w-full px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-0.5">
                        End Time
                      </label>
                      <input
                        type="time"
                        value={newOverrideEndTime}
                        onChange={(e) => setNewOverrideEndTime(e.target.value)}
                        className="w-full px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-0.5">
                        Reason / Note
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Model exam revision"
                        value={newOverrideNote}
                        onChange={(e) => setNewOverrideNote(e.target.value)}
                        className="w-full px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-1">
                    <button
                      type="button"
                      onClick={handleAddDateOverride}
                      disabled={!newOverrideDate}
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-amber-600 hover:bg-amber-700 text-white disabled:opacity-50 transition"
                    >
                      + Add Date Override
                    </button>
                  </div>
                </div>

                {/* List of Configured Date-Specific Overrides */}
                {formData.dateSpecificSchedules.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block">
                      Configured Date Overrides ({formData.dateSpecificSchedules.length}):
                    </span>
                    <div className="space-y-1">
                      {formData.dateSpecificSchedules.map((ovr) => (
                        <div
                          key={ovr.date}
                          className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                        >
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-slate-900 dark:text-white">
                              {formatDisplayDate(ovr.date, settings.calendarMode)}
                            </span>
                            <span className="text-slate-500">•</span>
                            <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                              {formatTime(ovr.startTime, settings.timeFormat)} - {formatTime(ovr.endTime, settings.timeFormat)} ({ovr.durationMinutes}m)
                            </span>
                            {ovr.note && (
                              <span className="text-[11px] text-slate-500 italic bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded">
                                {ovr.note}
                              </span>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveDateOverride(ovr.date)}
                            className="p-1 text-slate-400 hover:text-rose-600"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Location, Start Date & Color */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Location / Room
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Student Residence, Baneshwor or Room 302"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Batch / Class Start Date
                  </label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Calendar Tag Color
                  </label>
                  <div className="flex items-center gap-2 mt-1">
                    {PRESET_COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setFormData({ ...formData, color: c })}
                        className={`w-6 h-6 rounded-full transition ${
                          formData.color === c ? 'ring-2 ring-indigo-500 scale-110' : ''
                        }`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
                >
                  {editingClass ? 'Save Changes' : 'Create Class'}
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
              Delete Class Slot?
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs mx-auto">
              This will remove this class from your weekly routine and calendar.
            </p>
            <div className="mt-5 flex items-center justify-center gap-3">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  deleteClass(deleteConfirmId);
                  setDeleteConfirmId(null);
                }}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-rose-600 hover:bg-rose-700 text-white shadow-sm"
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
