/**
 * Nepali Bikram Sambat (BS) and Gregorian (AD) Date Utility
 * Bikram Sambat is the official calendar of Nepal, approximately 56 years and 8.5 months ahead of AD.
 */

export interface BSDate {
  year: number;
  month: number; // 1 - 12
  day: number; // 1 - 32
}

export const NEPALI_MONTHS_EN = [
  'Baisakh',
  'Jestha',
  'Ashadh',
  'Shrawan',
  'Bhadra',
  'Ashwin',
  'Kartik',
  'Mangsir',
  'Poush',
  'Magh',
  'Falgun',
  'Chaitra',
];

export const NEPALI_MONTHS_NP = [
  'बैशाख',
  'जेठ',
  'असार',
  'साउन',
  'भदौ',
  'असोज',
  'कात्तिक',
  'मंसिर',
  'पुस',
  'माघ',
  'फागुन',
  'चैत',
];

export const NEPALI_DAYS_EN = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

export const NEPALI_DAYS_NP = [
  'आइतबार',
  'सोमबार',
  'मंगलबार',
  'बुधबार',
  'बिहीबार',
  'शुक्रबार',
  'शनिबार',
];

// Reference table for BS months length from 2075 to 2090 BS
// Format: [year, [month days from Baisakh(1) to Chaitra(12)]]
// Reference point: 2080 Baisakh 1 = April 14, 2023
const BS_MONTH_DAYS: Record<number, number[]> = {
  2075: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2076: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 30],
  2077: [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
  2078: [31, 31, 31, 32, 31, 31, 30, 29, 30, 29, 30, 30],
  2079: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2080: [31, 31, 31, 32, 31, 31, 30, 29, 30, 29, 30, 30], // 2080 Baisakh 1 = 2023-04-14
  2081: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 30], // 2081 Baisakh 1 = 2024-04-13
  2082: [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31], // 2082 Baisakh 1 = 2025-04-14
  2083: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30], // 2083 Baisakh 1 = 2026-04-14
  2084: [31, 31, 32, 31, 31, 30, 30, 30, 29, 30, 30, 30], // 2084 Baisakh 1 = 2027-04-14
  2085: [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
  2086: [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
  2087: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2088: [31, 31, 32, 32, 31, 30, 30, 29, 30, 29, 30, 30],
  2089: [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
  2090: [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
};

// Base mapping: 2080-01-01 BS = 2023-04-14 AD
const REF_BS_YEAR = 2080;
const REF_AD_DATE = new Date(2023, 3, 14); // Month is 0-indexed in JS (3 = April)

/**
 * Convert Gregorian (AD) date to Nepali (BS) date
 */
export function adToBs(dateInput: string | Date): BSDate {
  const adDate = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  
  // Normalize both dates to midnight UTC to avoid timezone drift
  const targetUtc = Date.UTC(adDate.getFullYear(), adDate.getMonth(), adDate.getDate());
  const refUtc = Date.UTC(REF_AD_DATE.getFullYear(), REF_AD_DATE.getMonth(), REF_AD_DATE.getDate());
  
  let diffDays = Math.floor((targetUtc - refUtc) / (1000 * 60 * 60 * 24));
  
  let bsYear = REF_BS_YEAR;
  let bsMonth = 1;
  let bsDay = 1;
  
  if (diffDays >= 0) {
    while (diffDays > 0) {
      const monthDays = (BS_MONTH_DAYS[bsYear] || [31, 31, 31, 31, 31, 31, 30, 30, 30, 30, 30, 30])[bsMonth - 1];
      const remainingDaysInMonth = monthDays - bsDay;
      
      if (diffDays <= remainingDaysInMonth) {
        bsDay += diffDays;
        diffDays = 0;
      } else {
        diffDays -= (remainingDaysInMonth + 1);
        bsDay = 1;
        bsMonth += 1;
        if (bsMonth > 12) {
          bsMonth = 1;
          bsYear += 1;
        }
      }
    }
  } else {
    // Past dates before 2080 Baisakh 1
    while (diffDays < 0) {
      bsMonth -= 1;
      if (bsMonth < 1) {
        bsMonth = 12;
        bsYear -= 1;
      }
      const monthDays = (BS_MONTH_DAYS[bsYear] || [31, 31, 31, 31, 31, 31, 30, 30, 30, 30, 30, 30])[bsMonth - 1];
      if (Math.abs(diffDays) < monthDays) {
        bsDay = monthDays + diffDays + 1;
        diffDays = 0;
      } else {
        diffDays += monthDays;
      }
    }
  }

  return { year: bsYear, month: bsMonth, day: bsDay };
}

/**
 * Convert Nepali (BS) date to Gregorian (AD) date
 */
export function bsToAd(bsDate: BSDate): Date {
  let totalDays = 0;
  
  if (bsDate.year >= REF_BS_YEAR) {
    for (let y = REF_BS_YEAR; y < bsDate.year; y++) {
      const daysInYear = (BS_MONTH_DAYS[y] || [31, 31, 31, 31, 31, 31, 30, 30, 30, 30, 30, 30]).reduce((a, b) => a + b, 0);
      totalDays += daysInYear;
    }
    const currentYearMonths = BS_MONTH_DAYS[bsDate.year] || [31, 31, 31, 31, 31, 31, 30, 30, 30, 30, 30, 30];
    for (let m = 1; m < bsDate.month; m++) {
      totalDays += currentYearMonths[m - 1];
    }
    totalDays += (bsDate.day - 1);
  } else {
    for (let y = REF_BS_YEAR - 1; y >= bsDate.year; y--) {
      const daysInYear = (BS_MONTH_DAYS[y] || [31, 31, 31, 31, 31, 31, 30, 30, 30, 30, 30, 30]).reduce((a, b) => a + b, 0);
      totalDays -= daysInYear;
    }
    const currentYearMonths = BS_MONTH_DAYS[bsDate.year] || [31, 31, 31, 31, 31, 31, 30, 30, 30, 30, 30, 30];
    for (let m = 1; m < bsDate.month; m++) {
      totalDays += currentYearMonths[m - 1];
    }
    totalDays += (bsDate.day - 1);
  }

  const result = new Date(REF_AD_DATE);
  result.setDate(result.getDate() + totalDays);
  return result;
}

/**
 * Format date string or Date object based on chosen system (AD / BS)
 */
export function formatDisplayDate(
  dateInput: string | Date | null | undefined,
  system: 'AD' | 'BS' = 'AD',
  style: 'short' | 'medium' | 'long' = 'medium'
): string {
  if (!dateInput) return '-';
  
  const adDate = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(adDate.getTime())) return String(dateInput);

  if (system === 'BS') {
    const bs = adToBs(adDate);
    const monthName = NEPALI_MONTHS_EN[bs.month - 1] || `Month ${bs.month}`;
    const dayStr = String(bs.day).padStart(2, '0');
    const monthStr = String(bs.month).padStart(2, '0');
    
    if (style === 'short') {
      return `${bs.year}-${monthStr}-${dayStr}`;
    }
    if (style === 'long') {
      const dayOfWeek = NEPALI_DAYS_EN[adDate.getDay()];
      return `${dayOfWeek}, ${bs.day} ${monthName} ${bs.year}`;
    }
    return `${bs.day} ${monthName} ${bs.year}`;
  }

  // AD Formatting
  if (style === 'short') {
    return adDate.toISOString().split('T')[0];
  }
  
  const options: Intl.DateTimeFormatOptions = style === 'long'
    ? { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' }
    : { year: 'numeric', month: 'short', day: 'numeric' };

  return adDate.toLocaleDateString('en-US', options);
}

/**
 * Format a month-year string like '2026-08' according to AD / BS
 */
export function formatDisplayMonth(
  periodMonthYear: string,
  system: 'AD' | 'BS' = 'AD'
): string {
  if (!periodMonthYear) return '-';
  // If in 'YYYY-MM' format
  const parts = periodMonthYear.split('-');
  if (parts.length >= 2) {
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    if (system === 'BS') {
      // Approximate BS month for the 15th of that AD month
      const midMonthDate = new Date(year, month - 1, 15);
      const bs = adToBs(midMonthDate);
      return `${NEPALI_MONTHS_EN[bs.month - 1]} ${bs.year}`;
    }
    const date = new Date(year, month - 1, 1);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }
  return periodMonthYear;
}

/**
 * Get current date ISO string in YYYY-MM-DD
 */
export function getTodayIso(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

import { DayOfWeek } from '../types';

/**
 * Returns day of week (Sunday - Saturday) for a date string (YYYY-MM-DD) or Date object
 */
export function getDayOfWeek(dateStrOrObj: string | Date): DayOfWeek {
  const d = typeof dateStrOrObj === 'string' ? new Date(dateStrOrObj + 'T12:00:00') : dateStrOrObj;
  const days: DayOfWeek[] = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayIdx = isNaN(d.getDay()) ? 0 : d.getDay();
  return days[dayIdx];
}

/**
 * Safely parse date from ISO string YYYY-MM-DD or Date object without timezone drift
 */
export function parseDateSafe(dateInput: string | Date | null | undefined): Date | null {
  if (!dateInput) return null;
  if (dateInput instanceof Date) return isNaN(dateInput.getTime()) ? null : dateInput;
  if (typeof dateInput === 'string') {
    const trimmed = dateInput.trim();
    if (!trimmed) return null;
    const parts = trimmed.split('T')[0].split('-');
    if (parts.length === 3) {
      const y = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1;
      const d = parseInt(parts[2], 10);
      if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
        return new Date(y, m, d, 12, 0, 0);
      }
    }
    const dt = new Date(trimmed);
    return isNaN(dt.getTime()) ? null : dt;
  }
  return null;
}

/**
 * Formats date showing BOTH Gregorian (AD) and Bikram Sambat (BS) simultaneously
 * e.g. "Sep 10, 2026 AD (25 Bhadra 2083 BS)" or "2026-09-10 AD (2083-05-25 BS)"
 */
export function formatDualDate(
  dateInput: string | Date | null | undefined,
  style: 'standard' | 'short' | 'compact' = 'standard'
): string {
  if (!dateInput) return '-';
  const adDate = parseDateSafe(dateInput);
  if (!adDate) return String(dateInput);

  const bs = adToBs(adDate);
  const bsMonthName = NEPALI_MONTHS_EN[bs.month - 1] || `Month ${bs.month}`;
  const bsMonthStr = String(bs.month).padStart(2, '0');
  const bsDayStr = String(bs.day).padStart(2, '0');

  if (style === 'compact' || style === 'short') {
    const y = adDate.getFullYear();
    const m = String(adDate.getMonth() + 1).padStart(2, '0');
    const d = String(adDate.getDate()).padStart(2, '0');
    return `${y}-${m}-${d} AD (${bs.year}-${bsMonthStr}-${bsDayStr} BS)`;
  }

  const adFormatted = adDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  return `${adFormatted} AD (${bs.day} ${bsMonthName} ${bs.year} BS)`;
}

export interface CalculatedPaymentSchedule {
  receivingDateIso: string;
  dueDateIso: string;
  receivingDateDual: string;
  dueDateDual: string;
  daysUntilDue: number;
  isOverdue: boolean;
  isDueToday: boolean;
  isDueSoon: boolean;
  cycleMonthLabel: string;
}

/**
 * Calculate payment receiving date and due date from receiving day and due days (grace period)
 * @param receivingDay 1 to 31 for AD, 1 to 32 for BS
 * @param dueDays Days allowed after receiving day until payment is due
 * @param calendarSystem 'AD' or 'BS'
 * @param referenceDate Optional reference date (defaults to today)
 */
export function calculatePaymentSchedule(
  receivingDay: number = 1,
  dueDays: number = 0,
  calendarSystem: 'AD' | 'BS' = 'BS',
  referenceDate?: string | Date
): CalculatedPaymentSchedule {
  const refDate = parseDateSafe(referenceDate) || new Date();
  let receivingDate: Date;
  let cycleMonthLabel = '';

  const safeDueDays = Math.max(0, Number(dueDays) || 0);

  if (calendarSystem === 'BS') {
    const currentBs = adToBs(refDate);
    const year = currentBs.year;
    const month = currentBs.month;
    const monthDaysList = BS_MONTH_DAYS[year] || [31, 31, 31, 31, 31, 31, 30, 30, 30, 30, 30, 30];
    const maxDays = monthDaysList[month - 1] || 32;
    const clampedDay = Math.max(1, Math.min(receivingDay || 1, maxDays));

    receivingDate = bsToAd({ year, month, day: clampedDay });
    cycleMonthLabel = `${NEPALI_MONTHS_EN[month - 1]} ${year} BS`;
  } else {
    // AD
    const year = refDate.getFullYear();
    const month = refDate.getMonth();
    const maxDays = new Date(year, month + 1, 0).getDate();
    const clampedDay = Math.max(1, Math.min(receivingDay || 1, maxDays));

    receivingDate = new Date(year, month, clampedDay, 12, 0, 0);
    cycleMonthLabel = receivingDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }

  const dueDate = new Date(receivingDate);
  dueDate.setDate(dueDate.getDate() + safeDueDays);

  const pad = (n: number) => String(n).padStart(2, '0');
  const receivingDateIso = `${receivingDate.getFullYear()}-${pad(receivingDate.getMonth() + 1)}-${pad(receivingDate.getDate())}`;
  const dueDateIso = `${dueDate.getFullYear()}-${pad(dueDate.getMonth() + 1)}-${pad(dueDate.getDate())}`;

  // Difference in whole calendar days from today
  const today = new Date();
  const todayMid = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 12, 0, 0);
  const dueMid = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate(), 12, 0, 0);
  const diffTime = dueMid.getTime() - todayMid.getTime();
  const daysUntilDue = Math.round(diffTime / (1000 * 60 * 60 * 24));

  return {
    receivingDateIso,
    dueDateIso,
    receivingDateDual: formatDualDate(receivingDateIso),
    dueDateDual: formatDualDate(dueDateIso),
    daysUntilDue,
    isOverdue: daysUntilDue < 0,
    isDueToday: daysUntilDue === 0,
    isDueSoon: daysUntilDue > 0 && daysUntilDue <= 3,
    cycleMonthLabel,
  };
}


