import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  FileSpreadsheet,
  Download,
  Calendar,
  Users,
  Building2,
  CreditCard,
  GraduationCap,
  Database,
  CheckCircle,
  Printer,
  ShieldCheck,
} from 'lucide-react';
import { exportToCsv, formatCurrency } from '../utils/formatters';
import { formatDisplayDate, getTodayIso } from '../utils/nepaliCalendar';

export const ReportsView: React.FC = () => {
  const {
    students,
    institutions,
    classes,
    attendance,
    payments,
    performance,
    settings,
    exportDataJson,
  } = useApp();

  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [copiedStatus, setCopiedStatus] = useState<string | null>(null);

  const todayIso = getTodayIso();

  // Export handlers
  const handleExportStudents = () => {
    const rows = students.map((s) => ({
      ID: s.id,
      Name: s.name,
      Grade: s.grade,
      Tuition_Type: s.tuitionType,
      Subjects: (s.subjects || []).join('; '),
      Fee_Structure: s.feeStructure,
      Fee_Amount: s.feeAmount,
      Parent_Name: s.parentName || '',
      Parent_Phone: s.parentPhone || '',
      Address: s.address || '',
      Status: s.status,
      Attendance_Pct: `${s.attendancePercentage || 100}%`,
      Pending_Balance: s.pendingBalance || 0,
    }));
    exportToCsv(`students-report-${todayIso}.csv`, rows);
  };

  const handleExportAttendance = () => {
    let list = attendance;
    if (dateFrom) list = list.filter((a) => a.date >= dateFrom);
    if (dateTo) list = list.filter((a) => a.date <= dateTo);

    const rows = list.map((a) => ({
      ID: a.id,
      Date_AD: a.date,
      Date_BS: formatDisplayDate(a.date, 'BS', 'short'),
      Type: a.type,
      Target: a.targetName,
      Subject: a.subject,
      Start_Time: a.startTime,
      End_Time: a.endTime,
      Duration_Minutes: a.durationMinutes,
      Periods_Count: a.periodsCount || 1,
      Status: a.status,
      Topics_Covered: a.topicsCovered || '',
      Notes: a.notes || '',
    }));
    exportToCsv(`attendance-report-${todayIso}.csv`, rows);
  };

  const handleExportPayments = () => {
    let list = payments;
    if (dateFrom) list = list.filter((p) => p.paymentDate >= dateFrom);
    if (dateTo) list = list.filter((p) => p.paymentDate <= dateTo);

    const rows = list.map((p) => ({
      Receipt_Number: p.receiptNumber || '',
      Type: p.type,
      Target: p.targetName,
      Period: p.periodMonthYear,
      Due_Date: p.dueDate,
      Payment_Date: p.paymentDate,
      Amount_Due: p.amountDue,
      Amount_Paid: p.amountPaid,
      Remaining_Balance: p.remainingBalance,
      Payment_Method: p.paymentMethod,
      Status: p.status,
      Notes: p.referenceNote || '',
    }));
    exportToCsv(`payments-ledger-report-${todayIso}.csv`, rows);
  };

  const handleExportPerformance = () => {
    const rows = performance.map((p) => ({
      ID: p.id,
      Student: p.studentName,
      Test_Name: p.testName,
      Assessment_Type: p.testType,
      Date: p.date,
      Subject: p.subject,
      Total_Marks: p.totalMarks,
      Obtained_Marks: p.obtainedMarks,
      Percentage: `${p.percentage}%`,
      Grade: typeof p.grade === 'object' ? (p.grade as any)?.grade : p.grade,
      Homework_Status: p.assignmentStatus,
      Weak_Areas: p.weakAreas || '',
      Teacher_Remarks: p.teacherRemarks || '',
    }));
    exportToCsv(`student-performance-report-${todayIso}.csv`, rows);
  };

  const handleExportInstitutions = () => {
    const rows = institutions.map((i) => ({
      Name: i.name,
      Faculty: i.facultyOrGrade,
      Section: i.section || '',
      Subjects: (i.subjects || []).join('; '),
      Periods_Per_Day: i.numberOfPeriods,
      Payment_Structure: i.paymentStructure,
      Rate_Amount: i.rateAmount,
      Contact_Person: i.contactPerson || '',
      Phone: i.contactNumber || '',
      Status: i.status,
    }));
    exportToCsv(`institutions-report-${todayIso}.csv`, rows);
  };

  const handleDownloadJsonBackup = () => {
    const jsonStr = exportDataJson();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `teacher-manager-full-backup-${todayIso}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            Reports & Data Export Center
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Export CSV sheets, generate attendance records, download payment ledger, and save full backups.
          </p>
        </div>

        <button
          onClick={() => window.print()}
          className="flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 shadow-xs transition"
        >
          <Printer className="w-4 h-4" />
          <span>Print / Save PDF</span>
        </button>
      </div>

      {/* Date Filter Range for Custom Reports */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Calendar className="w-4 h-4 text-indigo-600" />
          Periodic Filter for Attendance & Payments Export
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              From Date
            </label>
            <input
              type="date"
              value={dateFrom || ''}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              To Date
            </label>
            <input
              type="date"
              value={dateTo || ''}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Export Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Students List */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 w-fit mb-3">
              <Users className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-slate-900 dark:text-white text-base">
              Students Master Directory
            </h4>
            <p className="text-xs text-slate-500 mt-1">
              Export all {students.length} student records, parents' contact details, fee rates, and attendance rates.
            </p>
          </div>
          <button
            onClick={handleExportStudents}
            className="mt-4 w-full py-2 px-3 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center gap-1.5 transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download CSV</span>
          </button>
        </div>

        {/* Attendance Records */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 w-fit mb-3">
              <CheckCircle className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-slate-900 dark:text-white text-base">
              Class Attendance Logs
            </h4>
            <p className="text-xs text-slate-500 mt-1">
              Export {attendance.length} attendance records with dates, class times, durations, and topics covered.
            </p>
          </div>
          <button
            onClick={handleExportAttendance}
            className="mt-4 w-full py-2 px-3 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center gap-1.5 transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download CSV</span>
          </button>
        </div>

        {/* Payments Ledger */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="p-2.5 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 w-fit mb-3">
              <CreditCard className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-slate-900 dark:text-white text-base">
              Fee & Salary Ledger
            </h4>
            <p className="text-xs text-slate-500 mt-1">
              Export {payments.length} payment records including amounts due/paid, receipt numbers, and payment methods.
            </p>
          </div>
          <button
            onClick={handleExportPayments}
            className="mt-4 w-full py-2 px-3 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center gap-1.5 transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download CSV</span>
          </button>
        </div>

        {/* Academic Performance */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 w-fit mb-3">
              <GraduationCap className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-slate-900 dark:text-white text-base">
              Student Academic Scores
            </h4>
            <p className="text-xs text-slate-500 mt-1">
              Export {performance.length} exam evaluations, letter grades, percentage calculations, and weak areas.
            </p>
          </div>
          <button
            onClick={handleExportPerformance}
            className="mt-4 w-full py-2 px-3 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center gap-1.5 transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download CSV</span>
          </button>
        </div>

        {/* Institutions Directory */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 w-fit mb-3">
              <Building2 className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-slate-900 dark:text-white text-base">
              Colleges & Institutions
            </h4>
            <p className="text-xs text-slate-500 mt-1">
              Export {institutions.length} institutional contracts, salary configurations, and period rules.
            </p>
          </div>
          <button
            onClick={handleExportInstitutions}
            className="mt-4 w-full py-2 px-3 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center gap-1.5 transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download CSV</span>
          </button>
        </div>

        {/* Full JSON Backup */}
        <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-2xl border border-slate-800 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="p-2.5 rounded-xl bg-indigo-500/20 text-indigo-300 w-fit mb-3">
              <Database className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-white text-base">
              Full System Backup (.JSON)
            </h4>
            <p className="text-xs text-slate-300 mt-1">
              One-click complete snapshot of all students, routines, attendance, payments, and settings for safekeeping.
            </p>
          </div>
          <button
            onClick={handleDownloadJsonBackup}
            className="mt-4 w-full py-2 px-3 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center gap-1.5 transition shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Full Backup</span>
          </button>
        </div>
      </div>
    </div>
  );
};
