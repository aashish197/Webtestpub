import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Institution, FeeStructureType, DayOfWeek, CollegeScheduleType } from '../types';
import {
  Building2,
  Plus,
  Search,
  Phone,
  Calendar,
  Clock,
  BookOpen,
  DollarSign,
  Edit2,
  Trash2,
  CheckCircle,
  X,
  CreditCard,
  Layers,
  CalendarDays,
  Info,
  Sliders,
  Check,
  CalendarCheck,
} from 'lucide-react';
import { formatCurrency, exportToCsv } from '../utils/formatters';
import { formatDisplayDate, getTodayIso } from '../utils/nepaliCalendar';

const DAYS_OF_WEEK: DayOfWeek[] = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

const DEFAULT_DAY_WISE_PERIODS: Record<DayOfWeek, number> = {
  Sunday: 2,
  Monday: 2,
  Tuesday: 2,
  Wednesday: 2,
  Thursday: 2,
  Friday: 2,
  Saturday: 0,
};

export const InstitutionsView: React.FC = () => {
  const {
    institutions,
    addInstitution,
    updateInstitution,
    deleteInstitution,
    settings,
    attendance,
    payments,
    recordPayment,
    openQuickAction,
    openResetModal,
    classes,
  } = useApp();

  const [search, setSearch] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingInst, setEditingInst] = useState<Institution | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Form State
  const initialFormState: Omit<Institution, 'id' | 'createdAt'> = {
    name: '',
    facultyOrGrade: '+2 Science (Grade 12)',
    subjects: ['Physics'],
    section: 'Section A',
    numberOfPeriods: 3,
    periodDurationMinutes: 45,
    workingDays: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    paymentStructure: 'monthly',
    rateAmount: 35000,
    extraClassRate: 900,
    startDate: getTodayIso(),
    contactPerson: '',
    contactNumber: '',
    notes: '',
    status: 'active',
    scheduleType: 'uniform',
    dayWisePeriods: {
      Sunday: 3,
      Monday: 3,
      Tuesday: 3,
      Wednesday: 3,
      Thursday: 3,
      Friday: 3,
      Saturday: 0,
    },
    dayWiseSchedule: [],
  };

  const [formData, setFormData] = useState<Omit<Institution, 'id' | 'createdAt'>>(initialFormState);
  const [subjectInput, setSubjectInput] = useState('');

  // Filtered
  const filteredInstitutions = useMemo(() => {
    const q = search.toLowerCase().trim();
    return institutions.filter((i) => {
      return (
        !q ||
        i.name.toLowerCase().includes(q) ||
        i.facultyOrGrade.toLowerCase().includes(q) ||
        i.subjects.some((sub) => sub.toLowerCase().includes(q)) ||
        (i.contactPerson && i.contactPerson.toLowerCase().includes(q))
      );
    });
  }, [institutions, search]);

  const handleOpenAdd = () => {
    setEditingInst(null);
    setFormData(initialFormState);
    setSubjectInput('');
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (inst: Institution) => {
    setEditingInst(inst);

    const isDayWise = inst.scheduleType === 'day_wise';

    // Reconstruct or fallback dayWisePeriods
    const dayWise: Record<DayOfWeek, number> = {
      Sunday: 0,
      Monday: 0,
      Tuesday: 0,
      Wednesday: 0,
      Thursday: 0,
      Friday: 0,
      Saturday: 0,
    };

    if (isDayWise && inst.dayWisePeriods) {
      DAYS_OF_WEEK.forEach((d) => {
        dayWise[d] = inst.dayWisePeriods?.[d] ?? 0;
      });
    } else {
      // Uniform: synchronize strictly from workingDays and numberOfPeriods
      DAYS_OF_WEEK.forEach((d) => {
        dayWise[d] = (inst.workingDays || []).includes(d) ? inst.numberOfPeriods : 0;
      });
    }

    setFormData({
      name: inst.name,
      facultyOrGrade: inst.facultyOrGrade,
      subjects: [...inst.subjects],
      section: inst.section || '',
      numberOfPeriods: inst.numberOfPeriods,
      periodDurationMinutes: inst.periodDurationMinutes,
      workingDays: [...(inst.workingDays || [])],
      paymentStructure: inst.paymentStructure,
      rateAmount: inst.rateAmount,
      extraClassRate: inst.extraClassRate || 0,
      startDate: inst.startDate,
      endDate: inst.endDate || '',
      contactPerson: inst.contactPerson || '',
      contactNumber: inst.contactNumber || '',
      notes: inst.notes || '',
      status: inst.status,
      scheduleType: isDayWise ? 'day_wise' : 'uniform',
      dayWisePeriods: dayWise,
      dayWiseSchedule: inst.dayWiseSchedule ? [...inst.dayWiseSchedule] : [],
    });
    setSubjectInput('');
    setIsAddModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    let finalWorkingDays = [...formData.workingDays];
    let finalNumberOfPeriods = formData.numberOfPeriods;
    let finalDayWisePeriods: Record<DayOfWeek, number>;

    if (formData.scheduleType === 'day_wise' && formData.dayWisePeriods) {
      finalWorkingDays = DAYS_OF_WEEK.filter((d) => (formData.dayWisePeriods?.[d] ?? 0) > 0);
      const totalWeekly = DAYS_OF_WEEK.reduce((sum, d) => sum + (formData.dayWisePeriods?.[d] ?? 0), 0);
      finalNumberOfPeriods = finalWorkingDays.length > 0 ? Math.round(totalWeekly / finalWorkingDays.length) || 1 : 1;
      finalDayWisePeriods = {
        Sunday: formData.dayWisePeriods.Sunday ?? 0,
        Monday: formData.dayWisePeriods.Monday ?? 0,
        Tuesday: formData.dayWisePeriods.Tuesday ?? 0,
        Wednesday: formData.dayWisePeriods.Wednesday ?? 0,
        Thursday: formData.dayWisePeriods.Thursday ?? 0,
        Friday: formData.dayWisePeriods.Friday ?? 0,
        Saturday: formData.dayWisePeriods.Saturday ?? 0,
      };
    } else {
      // Uniform: calculate synchronized dayWisePeriods so breakdown matches workingDays and numberOfPeriods
      finalDayWisePeriods = {
        Sunday: finalWorkingDays.includes('Sunday') ? finalNumberOfPeriods : 0,
        Monday: finalWorkingDays.includes('Monday') ? finalNumberOfPeriods : 0,
        Tuesday: finalWorkingDays.includes('Tuesday') ? finalNumberOfPeriods : 0,
        Wednesday: finalWorkingDays.includes('Wednesday') ? finalNumberOfPeriods : 0,
        Thursday: finalWorkingDays.includes('Thursday') ? finalNumberOfPeriods : 0,
        Friday: finalWorkingDays.includes('Friday') ? finalNumberOfPeriods : 0,
        Saturday: finalWorkingDays.includes('Saturday') ? finalNumberOfPeriods : 0,
      };
    }

    const payload = {
      ...formData,
      scheduleType: formData.scheduleType,
      workingDays: finalWorkingDays,
      numberOfPeriods: finalNumberOfPeriods,
      dayWisePeriods: finalDayWisePeriods,
    };

    if (editingInst) {
      updateInstitution(editingInst.id, payload);
    } else {
      addInstitution(payload);
    }
    setIsAddModalOpen(false);
  };

  const handleToggleDay = (day: DayOfWeek) => {
    const updatedDays = formData.workingDays.includes(day)
      ? formData.workingDays.filter((d) => d !== day)
      : [...formData.workingDays, day];

    // Keep dayWisePeriods in sync for uniform mode
    const updatedDayWise: Record<DayOfWeek, number> = {
      ...(formData.dayWisePeriods || DEFAULT_DAY_WISE_PERIODS),
    };
    DAYS_OF_WEEK.forEach((d) => {
      updatedDayWise[d] = updatedDays.includes(d) ? formData.numberOfPeriods : 0;
    });

    setFormData({
      ...formData,
      workingDays: updatedDays,
      dayWisePeriods: updatedDayWise,
    });
  };

  const handleUpdateDayPeriods = (day: DayOfWeek, periods: number) => {
    const updated = {
      ...(formData.dayWisePeriods || DEFAULT_DAY_WISE_PERIODS),
      [day]: Math.max(0, periods),
    };
    const newWorkingDays = DAYS_OF_WEEK.filter((d) => (updated[d] ?? 0) > 0);
    const totalPeriods = DAYS_OF_WEEK.reduce((sum, d) => sum + (updated[d] ?? 0), 0);
    const avg = newWorkingDays.length > 0 ? Math.round(totalPeriods / newWorkingDays.length) || 1 : 1;

    setFormData({
      ...formData,
      dayWisePeriods: updated,
      workingDays: newWorkingDays,
      numberOfPeriods: avg,
    });
  };

  const handleAddSubject = () => {
    if (subjectInput.trim() && !formData.subjects.includes(subjectInput.trim())) {
      setFormData({
        ...formData,
        subjects: [...formData.subjects, subjectInput.trim()],
      });
      setSubjectInput('');
    }
  };

  const handleRemoveSubject = (sub: string) => {
    setFormData({
      ...formData,
      subjects: formData.subjects.filter((s) => s !== sub),
    });
  };

  // Quick record salary for this college
  const handleQuickPaySalary = (inst: Institution, calculatedAmount: number) => {
    const today = new Date();
    const currentMonthIso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;

    recordPayment({
      type: 'college_salary',
      institutionId: inst.id,
      targetName: `${inst.name} (${inst.facultyOrGrade})`,
      periodMonthYear: currentMonthIso,
      amountDue: calculatedAmount > 0 ? calculatedAmount : inst.rateAmount,
      amountPaid: calculatedAmount > 0 ? calculatedAmount : inst.rateAmount,
      remainingBalance: 0,
      paymentDate: getTodayIso(),
      dueDate: getTodayIso(),
      paymentMethod: 'Bank Transfer',
      status: 'paid',
      referenceNote: `Salary settled for ${inst.name} - ${currentMonthIso}`,
      receiptNumber: `SAL-${today.getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
    });
  };

  const handleExportCsv = () => {
    const rows = institutions.map((i) => ({
      ID: i.id,
      Name: i.name,
      Faculty: i.facultyOrGrade,
      Section: i.section || '',
      Subjects: (i.subjects || []).join('; '),
      Periods_Per_Day: i.numberOfPeriods,
      Period_Duration_Mins: i.periodDurationMinutes,
      Working_Days: (i.workingDays || []).join(', '),
      Payment_Structure: i.paymentStructure,
      Rate_Amount: i.rateAmount,
      Extra_Class_Rate: i.extraClassRate || 0,
      Contact_Person: i.contactPerson || '',
      Contact_Number: i.contactNumber || '',
      Status: i.status,
    }));
    exportToCsv(`institutions-list-${getTodayIso()}.csv`, rows);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
              <Building2 className="w-5 h-5" />
            </div>
            Colleges & Institutions
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Track college teaching contracts, period rates, monthly salaries, and faculty routines.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {institutions.length > 0 && (
            <button
              id="btn-delete-colleges-view-header"
              onClick={() => openResetModal('colleges')}
              className="px-3 py-2 text-xs font-semibold rounded-xl text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/40 border border-rose-200 dark:border-rose-900/60 transition flex items-center gap-1.5"
              title="Delete all college records & routines"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Delete College Data</span>
              <span className="sm:hidden">Delete</span>
            </button>
          )}
          <button
            onClick={handleExportCsv}
            className="px-3 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition"
          >
            Export CSV
          </button>
          <button
            id="btn-add-institution-main"
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shadow-indigo-600/20 transition active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Add Institution</span>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by college name, faculty, subjects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>
      </div>

      {/* Helpful Explanatory Guide for Variable / Day-Wise Schedules */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-50/90 via-indigo-50/50 to-blue-50/50 dark:from-purple-950/30 dark:via-indigo-950/20 dark:to-blue-950/20 border border-purple-200/70 dark:border-purple-800/50 flex items-start gap-3.5 shadow-2xs">
        <div className="p-2.5 rounded-xl bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-300 shrink-0 mt-0.5">
          <CalendarDays className="w-5 h-5" />
        </div>
        <div className="text-xs space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="font-bold text-slate-900 dark:text-white text-sm">
              Different classes or variable periods on different dates?
            </h4>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300">
              Flexible Period Scheduling Supported
            </span>
          </div>
          <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-xs">
            Colleges frequently have varying period counts on different days (e.g., 3 periods on Sunday, 2 on Monday, 4 on Tuesday, lab sessions on Wednesday). When adding or editing any college, choose <strong>"Variable Day-Wise Schedule"</strong> to set custom periods for Sunday through Saturday. On any specific date, your attendance log also allows you to record custom or extra periods without friction!
          </p>
        </div>
      </div>

      {/* Institutions Grid */}
      {filteredInstitutions.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center">
          <Building2 className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
            No institutions added yet
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
            Add the colleges, campuses, or educational institutions where you teach.
          </p>
          <button
            onClick={handleOpenAdd}
            className="mt-4 px-4 py-2 text-xs font-semibold rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition"
          >
            + Add First Institution
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredInstitutions.map((inst) => {
            const today = new Date();
            const currentMonthIso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;

            // Calculate attendance periods this month
            const instAttendance = attendance.filter(
              (a) => a.institutionId === inst.id && a.date.startsWith(currentMonthIso) && a.status === 'present'
            );
            const totalPeriodsTakenThisMonth = instAttendance.reduce(
              (sum, a) => sum + (a.periodsCount || 1),
              0
            );

            // Calculate estimated salary earned
            let calculatedEarnings = 0;
            if (inst.paymentStructure === 'monthly') {
              calculatedEarnings = inst.rateAmount;
            } else if (inst.paymentStructure === 'per_period') {
              calculatedEarnings = totalPeriodsTakenThisMonth * inst.rateAmount;
            } else if (inst.paymentStructure === 'hourly') {
              const totalMins = instAttendance.reduce((sum, a) => sum + a.durationMinutes, 0);
              calculatedEarnings = Math.round((totalMins / 60) * inst.rateAmount);
            }

            // Total salary already paid this month
            const paidThisMonth = payments
              .filter(
                (p) =>
                  p.institutionId === inst.id &&
                  (p.periodMonthYear === currentMonthIso || p.paymentDate.startsWith(currentMonthIso))
              )
              .reduce((sum, p) => sum + p.amountPaid, 0);

            return (
              <div
                key={inst.id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs hover:border-purple-300 dark:hover:border-purple-800/80 transition flex flex-col justify-between"
              >
                <div>
                  {/* Top Bar */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-slate-900 dark:text-white">
                          {inst.name}
                        </h3>
                        <span
                          className={`w-2 h-2 rounded-full ${
                            inst.status === 'active' ? 'bg-emerald-500' : 'bg-slate-400'
                          }`}
                        />
                      </div>
                      <p className="text-xs text-purple-600 dark:text-purple-400 font-semibold mt-0.5">
                        {inst.facultyOrGrade} {inst.section ? `• ${inst.section}` : ''}
                      </p>
                    </div>

                    <span className="px-2.5 py-1 text-xs font-extrabold rounded-lg bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300">
                      {formatCurrency(inst.rateAmount, settings.currency)} /{' '}
                      {inst.paymentStructure.replace('_', ' ')}
                    </span>
                  </div>

                  {/* Subjects */}
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {inst.subjects.map((sub) => (
                      <span
                        key={sub}
                        className="px-2.5 py-0.5 text-xs font-medium rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                      >
                        {sub}
                      </span>
                    ))}
                  </div>

                  {/* Working Days & Schedule specs */}
                  <div className="mt-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Contract Started:</span>
                      <span className="font-bold text-purple-600 dark:text-purple-400">
                        {formatDisplayDate(inst.startDate, settings.calendarMode)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Routine Type:</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {inst.scheduleType === 'day_wise'
                          ? 'Variable Day-Wise Schedule'
                          : 'Same Periods Daily'}
                      </span>
                    </div>

                    {/* Weekly Periods Breakdown Pills */}
                    <div className="pt-1.5 pb-1 border-t border-slate-200/60 dark:border-slate-700/60">
                      <div className="flex items-center justify-between text-[11px] mb-1.5">
                        <span className="font-semibold text-purple-700 dark:text-purple-300 flex items-center gap-1">
                          <CalendarDays className="w-3.5 h-3.5" />
                          Weekly Periods Breakdown:
                        </span>
                        <span className="font-bold text-slate-700 dark:text-slate-300">
                          {inst.scheduleType === 'day_wise' && inst.dayWisePeriods
                            ? `${DAYS_OF_WEEK.reduce((sum, d) => sum + (inst.dayWisePeriods?.[d] ?? 0), 0)} periods / wk`
                            : `${(inst.workingDays || []).length * inst.numberOfPeriods} periods / wk (${(inst.workingDays || []).length} days × ${inst.numberOfPeriods}p)`}
                        </span>
                      </div>
                      <div className="grid grid-cols-7 gap-1 text-center">
                        {DAYS_OF_WEEK.map((d) => {
                          const count =
                            inst.scheduleType === 'day_wise' && inst.dayWisePeriods
                              ? inst.dayWisePeriods?.[d] ?? 0
                              : (inst.workingDays || []).includes(d)
                              ? inst.numberOfPeriods
                              : 0;
                          const isActive = count > 0;
                          return (
                            <div
                              key={d}
                              className={`py-1 px-0.5 rounded-lg text-[10px] ${
                                isActive
                                  ? 'bg-purple-100 dark:bg-purple-900/60 text-purple-800 dark:text-purple-200 font-bold'
                                  : 'bg-slate-200/50 dark:bg-slate-800/40 text-slate-400 font-normal'
                              }`}
                              title={`${d}: ${count > 0 ? `${count} period(s)` : 'No Class'}`}
                            >
                              <div className="text-[9px] uppercase tracking-tighter text-slate-500 dark:text-slate-400">
                                {d.slice(0, 3)}
                              </div>
                              <div className="mt-0.5">{count > 0 ? `${count}p` : '—'}</div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Period Duration:</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {inst.periodDurationMinutes} mins / period
                        {inst.scheduleType === 'day_wise' && ` (avg. ~${inst.numberOfPeriods}p/day)`}
                      </span>
                    </div>

                    {inst.extraClassRate && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Extra Class Rate:</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {formatCurrency(inst.extraClassRate, settings.currency)} / period
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Current Month Earnings & Periods Summary */}
                  <div className="mt-4 grid grid-cols-2 gap-3 p-3 rounded-xl bg-purple-50/60 dark:bg-purple-950/20 border border-purple-200/60 dark:border-purple-800/40 text-xs">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-purple-700 dark:text-purple-300">
                        Periods This Month
                      </span>
                      <p className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
                        {totalPeriodsTakenThisMonth} periods
                      </p>
                      <span className="text-[10px] text-slate-500">
                        {instAttendance.length} working days
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] uppercase font-bold text-purple-700 dark:text-purple-300">
                        Earned vs Paid
                      </span>
                      <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                        {formatCurrency(calculatedEarnings, settings.currency)}
                      </p>
                      <span className="text-[10px] text-slate-500">
                        Received: {formatCurrency(paidThisMonth, settings.currency)}
                      </span>
                    </div>
                  </div>

                  {/* Contact Person */}
                  {(inst.contactPerson || inst.contactNumber) && (
                    <div className="mt-3 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 truncate">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>
                        {inst.contactPerson} {inst.contactNumber ? `• ${inst.contactNumber}` : ''}
                      </span>
                    </div>
                  )}
                </div>

                {/* Bottom Actions */}
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                  <button
                    onClick={() => handleQuickPaySalary(inst, calculatedEarnings)}
                    className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1 shadow-xs transition"
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>Record Salary Paid</span>
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(inst)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                      title="Edit institution"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeleteConfirmId(inst.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                      title="Delete institution"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Institution Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 max-w-2xl w-full p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                {editingInst ? 'Edit College / Institution' : 'Add College / Institution'}
              </h2>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Institution / College Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Kathmandu Model College (KMC)"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Faculty / Grade / Program *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. +2 Science (Grade 12) or B.Sc. CSIT"
                    value={formData.facultyOrGrade}
                    onChange={(e) =>
                      setFormData({ ...formData, facultyOrGrade: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Section / Batch
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Section B (Morning)"
                    value={formData.section}
                    onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Institution Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({ ...formData, status: e.target.value as any })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
                  >
                    <option value="active">Active Teaching Engagement</option>
                    <option value="inactive">Inactive / Completed</option>
                  </select>
                </div>
              </div>

              {/* Subjects */}
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Subjects Taught
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    placeholder="Type subject (e.g. Calculus, Modern Physics) and press Add"
                    value={subjectInput}
                    onChange={(e) => setSubjectInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddSubject();
                      }
                    }}
                    className="flex-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddSubject}
                    className="px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {formData.subjects.map((sub) => (
                    <span
                      key={sub}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-medium"
                    >
                      <span>{sub}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveSubject(sub)}
                        className="text-purple-400 hover:text-purple-700"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Schedule Type Selection */}
              <div className="space-y-2">
                <label className="block font-semibold text-slate-700 dark:text-slate-300">
                  College Routine & Period Schedule *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      const synced: Record<DayOfWeek, number> = {
                        Sunday: formData.workingDays.includes('Sunday') ? formData.numberOfPeriods : 0,
                        Monday: formData.workingDays.includes('Monday') ? formData.numberOfPeriods : 0,
                        Tuesday: formData.workingDays.includes('Tuesday') ? formData.numberOfPeriods : 0,
                        Wednesday: formData.workingDays.includes('Wednesday') ? formData.numberOfPeriods : 0,
                        Thursday: formData.workingDays.includes('Thursday') ? formData.numberOfPeriods : 0,
                        Friday: formData.workingDays.includes('Friday') ? formData.numberOfPeriods : 0,
                        Saturday: formData.workingDays.includes('Saturday') ? formData.numberOfPeriods : 0,
                      };
                      setFormData({ ...formData, scheduleType: 'uniform', dayWisePeriods: synced });
                    }}
                    className={`p-3 rounded-xl border text-left transition flex items-start gap-2.5 ${
                      formData.scheduleType === 'uniform'
                        ? 'border-purple-500 bg-purple-50/70 dark:bg-purple-950/30 ring-2 ring-purple-500/20'
                        : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span
                      className={`p-1.5 rounded-lg shrink-0 ${
                        formData.scheduleType === 'uniform'
                          ? 'bg-purple-600 text-white'
                          : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <Clock className="w-4 h-4" />
                    </span>
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white text-xs">
                        Same Periods Daily
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        Fixed period count on all working days (e.g. 3 periods every day)
                      </p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const synced: Record<DayOfWeek, number> = {
                        Sunday: formData.workingDays.includes('Sunday') ? (formData.dayWisePeriods?.Sunday || formData.numberOfPeriods) : 0,
                        Monday: formData.workingDays.includes('Monday') ? (formData.dayWisePeriods?.Monday || formData.numberOfPeriods) : 0,
                        Tuesday: formData.workingDays.includes('Tuesday') ? (formData.dayWisePeriods?.Tuesday || formData.numberOfPeriods) : 0,
                        Wednesday: formData.workingDays.includes('Wednesday') ? (formData.dayWisePeriods?.Wednesday || formData.numberOfPeriods) : 0,
                        Thursday: formData.workingDays.includes('Thursday') ? (formData.dayWisePeriods?.Thursday || formData.numberOfPeriods) : 0,
                        Friday: formData.workingDays.includes('Friday') ? (formData.dayWisePeriods?.Friday || formData.numberOfPeriods) : 0,
                        Saturday: formData.workingDays.includes('Saturday') ? (formData.dayWisePeriods?.Saturday || formData.numberOfPeriods) : 0,
                      };
                      setFormData({ ...formData, scheduleType: 'day_wise', dayWisePeriods: synced });
                    }}
                    className={`p-3 rounded-xl border text-left transition flex items-start gap-2.5 ${
                      formData.scheduleType === 'day_wise'
                        ? 'border-purple-500 bg-purple-50/70 dark:bg-purple-950/30 ring-2 ring-purple-500/20'
                        : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span
                      className={`p-1.5 rounded-lg shrink-0 ${
                        formData.scheduleType === 'day_wise'
                          ? 'bg-purple-600 text-white'
                          : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <CalendarDays className="w-4 h-4" />
                    </span>
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white text-xs">
                        Variable Day-Wise Schedule
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        Periods vary by day (e.g. 3 on Sun, 2 on Mon, 4 on Tue, etc.)
                      </p>
                    </div>
                  </button>
                </div>
              </div>

              {/* UNIFORM SCHEDULE FORM */}
              {formData.scheduleType === 'uniform' && (
                <div className="space-y-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5 text-xs">
                      Scheduled Working Days
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {DAYS_OF_WEEK.map((day) => {
                        const isSelected = formData.workingDays.includes(day);
                        return (
                          <button
                            key={day}
                            type="button"
                            onClick={() => handleToggleDay(day)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
                              isSelected
                                ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                            }`}
                          >
                            {day.slice(0, 3)}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* VARIABLE DAY-WISE SCHEDULE FORM */}
              {formData.scheduleType === 'day_wise' && (
                <div className="p-3.5 rounded-xl bg-purple-50/40 dark:bg-purple-950/20 border border-purple-200/80 dark:border-purple-800/50 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <div>
                      <span className="font-bold text-slate-900 dark:text-white text-xs">
                        Set Number of Periods for Each Day
                      </span>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Adjust period count for each day. Days with 0 periods are marked as Off.
                      </p>
                    </div>
                    <span className="px-2.5 py-1 rounded-lg bg-purple-100 dark:bg-purple-900/60 text-purple-800 dark:text-purple-200 font-bold text-xs self-start sm:self-auto">
                      Total: {DAYS_OF_WEEK.reduce((sum, d) => sum + (formData.dayWisePeriods?.[d] ?? 0), 0)} periods / week
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
                    {DAYS_OF_WEEK.map((day) => {
                      const count = formData.dayWisePeriods?.[day] ?? 0;
                      const isActive = count > 0;
                      return (
                        <div
                          key={day}
                          className={`p-2 rounded-xl border transition flex flex-col justify-between ${
                            isActive
                              ? 'bg-white dark:bg-slate-800 border-purple-300 dark:border-purple-700 shadow-2xs'
                              : 'bg-slate-100/60 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 opacity-70'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                              {day.slice(0, 3)}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                handleUpdateDayPeriods(day, isActive ? 0 : 2)
                              }
                              className={`text-[9px] font-semibold px-1.5 py-0.5 rounded ${
                                isActive
                                  ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300'
                                  : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-400'
                              }`}
                            >
                              {isActive ? 'Active' : 'Off'}
                            </button>
                          </div>

                          <div className="flex items-center justify-between gap-1 my-1">
                            <button
                              type="button"
                              disabled={count <= 0}
                              onClick={() => handleUpdateDayPeriods(day, Math.max(0, count - 1))}
                              className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold flex items-center justify-center hover:bg-slate-200 disabled:opacity-30 active:scale-95"
                            >
                              -
                            </button>
                            <span className="font-mono font-bold text-sm text-slate-900 dark:text-white">
                              {count} <span className="text-[10px] font-normal text-slate-500">p</span>
                            </span>
                            <button
                              type="button"
                              disabled={count >= 10}
                              onClick={() => handleUpdateDayPeriods(day, Math.min(10, count + 1))}
                              className="w-6 h-6 rounded-lg bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 font-bold flex items-center justify-center hover:bg-purple-200 disabled:opacity-30 active:scale-95"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-1.5 border-t border-purple-100 dark:border-purple-900/40 gap-2">
                    <span>
                      Working days:{' '}
                      <strong className="text-slate-800 dark:text-slate-200">
                        {DAYS_OF_WEEK.filter((d) => (formData.dayWisePeriods?.[d] ?? 0) > 0).length} days
                      </strong>
                    </span>
                    <span>
                      Average load:{' '}
                      <strong className="text-slate-800 dark:text-slate-200">
                        {DAYS_OF_WEEK.filter((d) => (formData.dayWisePeriods?.[d] ?? 0) > 0).length > 0
                          ? (
                              DAYS_OF_WEEK.reduce((sum, d) => sum + (formData.dayWisePeriods?.[d] ?? 0), 0) /
                              DAYS_OF_WEEK.filter((d) => (formData.dayWisePeriods?.[d] ?? 0) > 0).length
                            ).toFixed(1)
                          : 0}{' '}
                        periods/day
                      </strong>
                    </span>
                    <span>
                      Monthly estimate:{' '}
                      <strong className="text-purple-700 dark:text-purple-300">
                        ~{Math.round(DAYS_OF_WEEK.reduce((sum, d) => sum + (formData.dayWisePeriods?.[d] ?? 0), 0) * 4.33)} periods
                      </strong>
                    </span>
                  </div>
                </div>
              )}

              {/* Informative Guidance on Variable Dates & Classes */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200">
                  <Info className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                  <span>How Variable Periods & Different Dates Work:</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  • The schedule above sets your <strong>regular weekly baseline</strong>.<br />
                  • When recording attendance on <strong>any specific date</strong>, the day's scheduled periods pre-fill automatically, and you can edit them if you took extra periods, lab sessions, or half-days.<br />
                  • For separate classes with specific timings, you can also add them in <strong>Classes & Routine</strong>.
                </p>
              </div>

              {/* Period Specs & Salary Structure */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
                <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <DollarSign className="w-4 h-4 text-purple-600" />
                  Salary & Period Structure
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Payment Structure
                    </label>
                    <select
                      value={formData.paymentStructure}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          paymentStructure: e.target.value as FeeStructureType,
                        })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
                    >
                      <option value="monthly">Monthly Fixed Salary</option>
                      <option value="per_period">Per Period Rate</option>
                      <option value="hourly">Hourly Rate</option>
                      <option value="custom">Custom Arrangement</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Rate / Salary ({settings.currency}) *
                    </label>
                    <input
                      type="number"
                      required
                      min={0}
                      value={formData.rateAmount}
                      onChange={(e) =>
                        setFormData({ ...formData, rateAmount: Number(e.target.value) })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      {formData.scheduleType === 'day_wise' ? 'Avg. Periods / Day' : 'Periods Per Day'}
                    </label>
                    {formData.scheduleType === 'day_wise' ? (
                      <div className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100/80 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center justify-between">
                        <span>~{formData.numberOfPeriods} periods</span>
                        <span className="text-[10px] text-purple-600 dark:text-purple-400 font-bold">Auto</span>
                      </div>
                    ) : (
                      <input
                        type="number"
                        min={1}
                        max={10}
                        value={formData.numberOfPeriods}
                        onChange={(e) => {
                          const val = Math.max(1, Number(e.target.value));
                          const synced: Record<DayOfWeek, number> = {
                            Sunday: formData.workingDays.includes('Sunday') ? val : 0,
                            Monday: formData.workingDays.includes('Monday') ? val : 0,
                            Tuesday: formData.workingDays.includes('Tuesday') ? val : 0,
                            Wednesday: formData.workingDays.includes('Wednesday') ? val : 0,
                            Thursday: formData.workingDays.includes('Thursday') ? val : 0,
                            Friday: formData.workingDays.includes('Friday') ? val : 0,
                            Saturday: formData.workingDays.includes('Saturday') ? val : 0,
                          };
                          setFormData({
                            ...formData,
                            numberOfPeriods: val,
                            dayWisePeriods: synced,
                          });
                        }}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
                      />
                    )}
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block font-semibold text-slate-700 dark:text-slate-300">
                        Period Length (Mins)
                      </label>
                      <div className="flex items-center gap-1">
                        {[35, 40, 45, 50, 60].map((d) => (
                          <button
                            key={d}
                            type="button"
                            onClick={() => setFormData({ ...formData, periodDurationMinutes: d })}
                            className={`px-1.5 py-0.5 text-[10px] font-medium rounded transition ${
                              formData.periodDurationMinutes === d
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
                      value={formData.periodDurationMinutes}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          periodDurationMinutes: Number(e.target.value),
                        })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Extra Class Rate (Rs./period)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={formData.extraClassRate}
                      onChange={(e) =>
                        setFormData({ ...formData, extraClassRate: Number(e.target.value) })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Contract Start Date
                    </label>
                    <input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Contacts */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Contact Person / Principal / HOD
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Dr. Ramesh (Principal)"
                    value={formData.contactPerson}
                    onChange={(e) =>
                      setFormData({ ...formData, contactPerson: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Phone / Office Extension
                  </label>
                  <input
                    type="text"
                    placeholder="+977 1 4..."
                    value={formData.contactNumber}
                    onChange={(e) =>
                      setFormData({ ...formData, contactNumber: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold rounded-xl bg-purple-600 hover:bg-purple-700 text-white shadow-sm transition active:scale-95"
                >
                  {editingInst ? 'Save Changes' : 'Save Institution'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 max-w-md w-full p-6 shadow-xl text-center">
            <div className="w-12 h-12 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-600 mx-auto flex items-center justify-center mb-3">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Delete Institution Record?
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs mx-auto">
              This will remove this college profile and unbind linked timetable classes.
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
                  deleteInstitution(deleteConfirmId);
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
