import { FeeStructureType, PaymentMethod, PaymentStatus, Student, AttendanceStatus } from '../types';

/**
 * Format currency amount with symbol (Rs. or NPR)
 */
export function formatCurrency(amount: number | undefined | null, currency = 'Rs.'): string {
  if (amount === undefined || amount === null || isNaN(amount)) {
    return `${currency} 0`;
  }
  return `${currency} ${amount.toLocaleString('en-IN')}`;
}

/**
 * Format time string 'HH:MM' (24-hour) to 12-hour AM/PM or 24-hour based on user preference
 */
export function formatTime(timeStr: string | undefined | null, format: '12h' | '24h' = '12h'): string {
  if (!timeStr) return '';
  if (format === '24h') return timeStr;

  const [hStr, mStr] = timeStr.split(':');
  const hour = parseInt(hStr, 10);
  const minute = mStr || '00';
  
  if (isNaN(hour)) return timeStr;
  
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 === 0 ? 12 : hour % 12;
  
  return `${displayHour}:${minute} ${ampm}`;
}

/**
 * Human-readable label for fee structure
 */
export function getFeeStructureLabel(type: FeeStructureType, amount?: number, currency = 'Rs.'): string {
  const formattedAmount = amount !== undefined ? formatCurrency(amount, currency) : '';
  switch (type) {
    case 'monthly':
      return amount !== undefined ? `${formattedAmount} / month` : 'Monthly Fee';
    case 'per_class':
      return amount !== undefined ? `${formattedAmount} / class` : 'Per Class';
    case 'hourly':
      return amount !== undefined ? `${formattedAmount} / hour` : 'Hourly Rate';
    case 'per_period':
      return amount !== undefined ? `${formattedAmount} / period` : 'Per Period';
    case 'custom':
      return amount !== undefined ? `${formattedAmount} (Custom)` : 'Custom Rate';
    default:
      return type;
  }
}

/**
 * Calculate grade based on percentage (Standard academic scale)
 */
export function calculateGrade(percentage: number): { grade: string; color: string; label: string } {
  if (percentage >= 90) return { grade: 'A+', color: 'text-emerald-700 bg-emerald-50 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800', label: 'Outstanding' };
  if (percentage >= 80) return { grade: 'A', color: 'text-teal-700 bg-teal-50 border-teal-200 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-800', label: 'Excellent' };
  if (percentage >= 70) return { grade: 'B+', color: 'text-blue-700 bg-blue-50 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800', label: 'Very Good' };
  if (percentage >= 60) return { grade: 'B', color: 'text-indigo-700 bg-indigo-50 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800', label: 'Good' };
  if (percentage >= 50) return { grade: 'C+', color: 'text-amber-700 bg-amber-50 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800', label: 'Satisfactory' };
  if (percentage >= 40) return { grade: 'C', color: 'text-orange-700 bg-orange-50 border-orange-200 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-800', label: 'Acceptable' };
  if (percentage >= 35) return { grade: 'D', color: 'text-rose-700 bg-rose-50 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800', label: 'Basic' };
  return { grade: 'E', color: 'text-red-700 bg-red-50 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800', label: 'Needs Improvement' };
}

/**
 * Generate customized Payment Reminder text to copy
 */
export function generatePaymentReminderText(
  param1: string | any,
  param2?: string | any,
  param3?: number | any,
  param4?: string,
  param5?: string,
  param6?: string,
  param7 = 'eSewa / Cash / Bank Transfer'
): string {
  // If called with (paymentRecord, student, settings)
  if (typeof param1 === 'object' && param1 !== null && 'amountDue' in param1) {
    const payment = param1;
    const student = param2;
    const settings = param3;

    const studentName = student?.name || payment.targetName || 'Student';
    const parentName = student?.parentName || '';
    const amountDue = payment.remainingBalance > 0 ? payment.remainingBalance : payment.amountDue;
    const periodMonth = payment.periodMonthYear || 'this month';
    const dueDate = payment.dueDate || 'due date';
    const teacherName = settings?.teacherName || 'Teacher';
    const teacherPhone = settings?.phone || '';
    const paymentMethod = payment.paymentMethod || 'eSewa / Cash / Bank Transfer';

    if (settings?.reminderTemplate) {
      return settings.reminderTemplate
        .replace(/{studentName}/g, studentName)
        .replace(/{month}/g, periodMonth)
        .replace(/{amountDue}/g, `Rs. ${amountDue.toLocaleString('en-IN')}`)
        .replace(/{teacherName}/g, teacherName)
        .replace(/{teacherPhone}/g, teacherPhone);
    }

    const greeting = parentName ? `Namaste ${parentName} ji,` : `Namaste,`;
    return `${greeting}

This is a gentle reminder regarding the tuition fee for ${studentName} for the month of ${periodMonth}.

• Amount Due: Rs. ${amountDue.toLocaleString('en-IN')}
• Due Date: ${dueDate}
• Accepted Modes: ${paymentMethod}

Kindly ignore this message if you have already completed the payment. Thank you!

Regards,
${teacherName}${teacherPhone ? ` (${teacherPhone})` : ''}`;
  }

  // Otherwise classic positional arguments
  const studentName = String(param1);
  const parentName = String(param2 || '');
  const amountDue = Number(param3 || 0);
  const periodMonth = String(param4 || '');
  const dueDate = String(param5 || '');
  const teacherName = String(param6 || 'Teacher');
  const paymentMethod = param7;

  const greeting = parentName ? `Namaste ${parentName} ji,` : `Namaste,`;
  return `${greeting}

This is a gentle reminder regarding the tuition fee for ${studentName} for the month of ${periodMonth}.

• Amount Due: Rs. ${amountDue.toLocaleString('en-IN')}
• Due Date: ${dueDate}
• Accepted Modes: ${paymentMethod}

Kindly ignore this message if you have already completed the payment. Thank you!

Regards,
${teacherName}`;
}

/**
 * Get status badge style
 */
export function getPaymentStatusBadge(status: PaymentStatus): { label: string; badgeClass: string } {
  switch (status) {
    case 'paid':
      return {
        label: 'Paid',
        badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800',
      };
    case 'partially_paid':
      return {
        label: 'Partially Paid',
        badgeClass: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800',
      };
    case 'pending':
      return {
        label: 'Pending',
        badgeClass: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800',
      };
    case 'overdue':
      return {
        label: 'Overdue',
        badgeClass: 'bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-900/30 dark:text-rose-300 dark:border-rose-800 animate-pulse',
      };
    default:
      return { label: status, badgeClass: 'bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700' };
  }
}

/**
 * Get attendance status badge
 */
export function getAttendanceStatusBadge(status: AttendanceStatus): { label: string; badgeClass: string } {
  switch (status) {
    case 'present':
      return {
        label: 'Present',
        badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800',
      };
    case 'absent':
      return {
        label: 'Absent',
        badgeClass: 'bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800',
      };
    case 'cancelled':
      return {
        label: 'Cancelled',
        badgeClass: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
      };
    case 'rescheduled':
      return {
        label: 'Rescheduled',
        badgeClass: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800',
      };
    default:
      return { label: status, badgeClass: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700' };
  }
}

/**
 * Format minutes into "Xh Ym" or "X mins"
 */
export function formatDuration(minutes: number): string {
  if (!minutes || minutes <= 0) return '0 mins';
  const hours = Math.floor(minutes / 60);
  const remainingMins = minutes % 60;
  if (hours === 0) return `${remainingMins} mins`;
  if (remainingMins === 0) return `${hours} hr${hours > 1 ? 's' : ''}`;
  return `${hours}h ${remainingMins}m`;
}

/**
 * CSV download generator helper
 */
export function exportToCsv(filename: string, rows: Record<string, any>[]): void {
  if (!rows || !rows.length) return;
  const headers = Object.keys(rows[0]);
  const csvContent = [
    headers.join(','),
    ...rows.map(row =>
      headers
        .map(header => {
          let val = row[header];
          if (val === null || val === undefined) val = '';
          val = String(val).replace(/"/g, '""');
          if (val.includes(',') || val.includes('\n') || val.includes('"')) {
            val = `"${val}"`;
          }
          return val;
        })
        .join(',')
    ),
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
