import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import {
  TrendingUp,
  DollarSign,
  PieChart,
  Calendar,
  Building2,
  Users,
  ArrowUpRight,
  CreditCard,
  Layers,
  ChevronLeft,
  ChevronRight,
  FileSpreadsheet,
} from 'lucide-react';
import { formatCurrency, exportToCsv } from '../utils/formatters';
import { formatDisplayDate, getTodayIso, NEPALI_MONTHS_EN, adToBs } from '../utils/nepaliCalendar';

export const IncomeView: React.FC = () => {
  const { payments, students, institutions, settings, monthlyStats } = useApp();

  const [selectedMonthOffset, setSelectedMonthOffset] = useState<number>(0);

  const activeDate = useMemo(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + selectedMonthOffset);
    return d;
  }, [selectedMonthOffset]);

  const activeMonthIso = useMemo(() => {
    return `${activeDate.getFullYear()}-${String(activeDate.getMonth() + 1).padStart(2, '0')}`;
  }, [activeDate]);

  // Payments in this selected month
  const monthPayments = useMemo(() => {
    return payments.filter(
      (p) => p.periodMonthYear === activeMonthIso || p.paymentDate.startsWith(activeMonthIso)
    );
  }, [payments, activeMonthIso]);

  // Breakdown figures
  const totalCollected = useMemo(() => {
    return monthPayments
      .filter((p) => p.status === 'paid' || p.amountPaid > 0)
      .reduce((sum, p) => sum + p.amountPaid, 0);
  }, [monthPayments]);

  const totalTuitionCollected = useMemo(() => {
    return monthPayments
      .filter((p) => p.type === 'tuition_fee' && p.amountPaid > 0)
      .reduce((sum, p) => sum + p.amountPaid, 0);
  }, [monthPayments]);

  const totalCollegeSalaryCollected = useMemo(() => {
    return monthPayments
      .filter((p) => p.type === 'college_salary' && p.amountPaid > 0)
      .reduce((sum, p) => sum + p.amountPaid, 0);
  }, [monthPayments]);

  const totalPendingForMonth = useMemo(() => {
    return monthPayments.reduce((sum, p) => sum + p.remainingBalance, 0);
  }, [monthPayments]);

  // Breakdown by Student
  const studentBreakdown = useMemo(() => {
    const map: Record<string, { name: string; grade: string; paid: number; due: number }> = {};
    students.forEach((s) => {
      const defaultDue = s.feeStructure === 'hourly'
        ? Math.round(((s.classDurationMinutes || 60) / 60) * s.feeAmount)
        : s.feeAmount;
      map[s.id] = { name: s.name, grade: s.grade, paid: 0, due: defaultDue };
    });

    monthPayments
      .filter((p) => p.type === 'tuition_fee' && p.studentId)
      .forEach((p) => {
        if (map[p.studentId!]) {
          map[p.studentId!].paid += p.amountPaid;
          map[p.studentId!].due = p.amountDue;
        } else {
          map[p.studentId || p.targetName] = {
            name: p.targetName,
            grade: 'Tuition',
            paid: p.amountPaid,
            due: p.amountDue,
          };
        }
      });

    return Object.values(map);
  }, [students, monthPayments]);

  // Breakdown by College
  const collegeBreakdown = useMemo(() => {
    const map: Record<string, { name: string; faculty: string; paid: number; due: number }> = {};
    institutions.forEach((i) => {
      const defaultDue = i.paymentStructure === 'hourly'
        ? Math.round(((i.periodDurationMinutes || 60) / 60) * i.rateAmount)
        : i.rateAmount;
      map[i.id] = { name: i.name, faculty: i.facultyOrGrade, paid: 0, due: defaultDue };
    });

    monthPayments
      .filter((p) => p.type === 'college_salary' && p.institutionId)
      .forEach((p) => {
        if (map[p.institutionId!]) {
          map[p.institutionId!].paid += p.amountPaid;
          map[p.institutionId!].due = p.amountDue;
        } else {
          map[p.institutionId || p.targetName] = {
            name: p.targetName,
            faculty: 'College',
            paid: p.amountPaid,
            due: p.amountDue,
          };
        }
      });

    return Object.values(map);
  }, [institutions, monthPayments]);

  // Tuition percentage vs College
  const tuitionPct = totalCollected > 0 ? Math.round((totalTuitionCollected / totalCollected) * 100) : 50;
  const collegePct = 100 - tuitionPct;

  const handleExportIncomeReport = () => {
    const rows = [
      ...studentBreakdown.map((s) => ({
        Category: 'Home Tuition',
        Target: s.name,
        Detail: s.grade,
        Expected_Due: s.due,
        Collected: s.paid,
        Balance: Math.max(0, s.due - s.paid),
      })),
      ...collegeBreakdown.map((c) => ({
        Category: 'College / Institution',
        Target: c.name,
        Detail: c.faculty,
        Expected_Due: c.due,
        Collected: c.paid,
        Balance: Math.max(0, c.due - c.paid),
      })),
    ];
    exportToCsv(`monthly-income-report-${activeMonthIso}.csv`, rows);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              <DollarSign className="w-5 h-5" />
            </div>
            Monthly Teaching Income & Analytics
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Consolidated earnings, tuition fees vs college salaries, and collection progress.
          </p>
        </div>

        {/* Month Selector */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-1 shadow-xs">
            <button
              onClick={() => setSelectedMonthOffset((prev) => prev - 1)}
              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 text-xs font-bold text-slate-900 dark:text-white">
              {activeDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              {settings.dateSystem === 'BS' && (
                <span className="text-indigo-600 dark:text-indigo-400 ml-1">
                  ({NEPALI_MONTHS_EN[adToBs(activeDate).month - 1]})
                </span>
              )}
            </span>
            <button
              onClick={() => setSelectedMonthOffset((prev) => prev + 1)}
              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={handleExportIncomeReport}
            className="px-3 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition"
          >
            Export Report
          </button>
        </div>
      </div>

      {/* Main Stats Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Earned */}
        <div className="bg-gradient-to-br from-indigo-900 to-slate-900 rounded-2xl p-5 text-white shadow-md relative overflow-hidden">
          <div className="relative z-10">
            <span className="text-xs uppercase tracking-wider text-indigo-300 font-bold">
              Total Realized Income
            </span>
            <p className="text-2xl sm:text-3xl font-black mt-1">
              {formatCurrency(totalCollected, settings.currency)}
            </p>
            <p className="text-xs text-indigo-200/80 mt-2">
              For {activeDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </p>
          </div>
          <div className="absolute right-3 -bottom-4 opacity-10 text-white pointer-events-none">
            <DollarSign className="w-32 h-32" />
          </div>
        </div>

        {/* Tuition Fees */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-teal-600 dark:text-teal-400 flex items-center gap-1.5">
                <Users className="w-4 h-4" />
                Home Tuitions
              </span>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300">
                {tuitionPct}% of income
              </span>
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white mt-2">
              {formatCurrency(totalTuitionCollected, settings.currency)}
            </p>
          </div>
          <p className="text-xs text-slate-500 mt-2">
            From {students.filter((s) => s.status === 'active').length} active students
          </p>
        </div>

        {/* College Salaries */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-purple-600 dark:text-purple-400 flex items-center gap-1.5">
                <Building2 className="w-4 h-4" />
                College Salaries
              </span>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300">
                {collegePct}% of income
              </span>
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white mt-2">
              {formatCurrency(totalCollegeSalaryCollected, settings.currency)}
            </p>
          </div>
          <p className="text-xs text-slate-500 mt-2">
            From {institutions.filter((i) => i.status === 'active').length} college contracts
          </p>
        </div>
      </div>

      {/* Income Distribution Bar */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white">
          Revenue Distribution Ratio
        </h3>

        <div className="w-full h-4 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden flex">
          <div
            className="bg-teal-500 h-full transition-all"
            style={{ width: `${tuitionPct}%` }}
            title={`Home Tuitions: ${tuitionPct}%`}
          />
          <div
            className="bg-purple-600 h-full transition-all"
            style={{ width: `${collegePct}%` }}
            title={`College Salaries: ${collegePct}%`}
          />
        </div>

        <div className="flex items-center justify-between text-xs font-semibold">
          <span className="flex items-center gap-1.5 text-teal-600 dark:text-teal-400">
            <span className="w-2.5 h-2.5 rounded-full bg-teal-500" />
            Home Tuitions ({tuitionPct}%) - {formatCurrency(totalTuitionCollected, settings.currency)}
          </span>
          <span className="flex items-center gap-1.5 text-purple-600 dark:text-purple-400">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-600" />
            College Salaries ({collegePct}%) - {formatCurrency(totalCollegeSalaryCollected, settings.currency)}
          </span>
        </div>
      </div>

      {/* Detailed Breakdowns: Side by Side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Tuition Revenue by Student */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
            <Users className="w-4 h-4 text-teal-600" />
            Home Tuition Fees Status
          </h3>

          <div className="divide-y divide-slate-100 dark:divide-slate-800 mt-2 text-xs">
            {studentBreakdown.map((s, idx) => {
              const isFullyPaid = s.paid >= s.due && s.due > 0;
              return (
                <div key={idx} className="py-2.5 flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white">{s.name}</h4>
                    <span className="text-slate-400 text-[11px]">{s.grade}</span>
                  </div>

                  <div className="text-right">
                    <span className="font-bold text-slate-900 dark:text-white">
                      {formatCurrency(s.paid, settings.currency)}
                    </span>
                    <span className="text-slate-400 text-[11px] block">
                      of {formatCurrency(s.due, settings.currency)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* College Salary Breakdown */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
            <Building2 className="w-4 h-4 text-purple-600" />
            College & Institutional Contracts
          </h3>

          <div className="divide-y divide-slate-100 dark:divide-slate-800 mt-2 text-xs">
            {collegeBreakdown.map((c, idx) => (
              <div key={idx} className="py-2.5 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white">{c.name}</h4>
                  <span className="text-slate-400 text-[11px]">{c.faculty}</span>
                </div>

                <div className="text-right">
                  <span className="font-bold text-slate-900 dark:text-white">
                    {formatCurrency(c.paid, settings.currency)}
                  </span>
                  <span className="text-slate-400 text-[11px] block">
                    Expected: {formatCurrency(c.due, settings.currency)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
