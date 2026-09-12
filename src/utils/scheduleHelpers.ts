import {
  DayOfWeek,
  TeachingClass,
  Institution,
  DayWiseClassSchedule,
  DateSpecificClassSchedule,
  DateSpecificCollegeSchedule,
} from '../types';

export const DAYS_OF_WEEK: DayOfWeek[] = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

export interface ResolvedClassSchedule {
  startTime: string;
  endTime: string;
  durationMinutes: number;
  isScheduled: boolean;
  isDateOverride: boolean;
  note?: string;
  section?: string;
  slotId?: string;
  slotsCount?: number;
}

export interface ResolvedClassSlot {
  slotId: string;
  section?: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  subject?: string;
  room?: string;
  note?: string;
  isDateOverride?: boolean;
}

export interface ResolvedInstitutionSchedule {
  periods: number;
  startTime?: string;
  endTime?: string;
  isScheduled: boolean;
  isDateOverride: boolean;
  note?: string;
}

/**
 * Calculates end time based on start time (HH:MM) and duration in minutes
 */
export function calculateEndTime(startTime: string, durationMinutes: number): string {
  if (!startTime) return '07:00';
  const [h, m] = startTime.split(':').map(Number);
  const totalMins = (h || 0) * 60 + (m || 0) + durationMinutes;
  const endH = Math.floor((totalMins / 60) % 24);
  const endM = Math.floor(totalMins % 60);
  return `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
}

/**
 * Calculates duration in minutes between start time and end time (HH:MM)
 */
export function calculateDurationMinutes(startTime: string, endTime: string): number {
  if (!startTime || !endTime) return 60;
  const [sh, sm] = startTime.split(':').map(Number);
  const [eh, em] = endTime.split(':').map(Number);
  const startMins = (sh || 0) * 60 + (sm || 0);
  let endMins = (eh || 0) * 60 + (em || 0);
  if (endMins < startMins) {
    endMins += 24 * 60; // next day / overnight
  }
  return Math.max(5, endMins - startMins);
}

/**
 * Resolves the active schedule for a TeachingClass on a given day or specific date.
 * Returns the primary/first scheduled slot if multi-period slots exist.
 */
export function resolveClassSchedule(
  cls: TeachingClass,
  day: DayOfWeek,
  dateIso?: string
): ResolvedClassSchedule {
  // 1. Check for specific date override first
  if (dateIso && cls.dateSpecificSchedules && cls.dateSpecificSchedules.length > 0) {
    const override = cls.dateSpecificSchedules.find((s) => s.date === dateIso);
    if (override) {
      return {
        startTime: override.startTime,
        endTime: override.endTime,
        durationMinutes: override.durationMinutes || cls.durationMinutes || 60,
        isScheduled: true,
        isDateOverride: true,
        note: override.note,
        section: cls.section,
        slotId: override.id,
        slotsCount: 1,
      };
    }
  }

  // 2. Check for day-wise schedule
  if (cls.scheduleType === 'day_wise' && cls.dayWiseSchedules && cls.dayWiseSchedules[day]) {
    const dayConfig = cls.dayWiseSchedules[day]!;
    // If explicitly marked inactive, not scheduled
    if (dayConfig.isActive === false) {
      return {
        startTime: dayConfig.startTime || cls.startTime || '07:00',
        endTime: dayConfig.endTime || cls.endTime || '08:00',
        durationMinutes: dayConfig.durationMinutes || cls.durationMinutes || 60,
        isScheduled: false,
        isDateOverride: false,
        note: dayConfig.note,
        section: dayConfig.section || cls.section,
      };
    }

    // Check if slots array is defined with 1 or more sections
    if (dayConfig.slots && dayConfig.slots.length > 0) {
      const firstSlot = dayConfig.slots[0];
      return {
        startTime: firstSlot.startTime,
        endTime: firstSlot.endTime,
        durationMinutes: firstSlot.durationMinutes || calculateDurationMinutes(firstSlot.startTime, firstSlot.endTime),
        isScheduled: true,
        isDateOverride: false,
        note: firstSlot.note || dayConfig.note,
        section: firstSlot.section || dayConfig.section || cls.section,
        slotId: firstSlot.id,
        slotsCount: dayConfig.slots.length,
      };
    }

    // If marked active or in scheduleDays
    if (dayConfig.isActive === true || cls.scheduleDays.includes(day)) {
      return {
        startTime: dayConfig.startTime,
        endTime: dayConfig.endTime,
        durationMinutes: dayConfig.durationMinutes || cls.durationMinutes || 60,
        isScheduled: true,
        isDateOverride: false,
        note: dayConfig.note,
        section: dayConfig.section || cls.section,
        slotsCount: 1,
      };
    }
  }

  // 3. If day is not in scheduleDays, return not scheduled
  if (!cls.scheduleDays.includes(day)) {
    return {
      startTime: cls.startTime || '07:00',
      endTime: cls.endTime || '08:00',
      durationMinutes: cls.durationMinutes || 60,
      isScheduled: false,
      isDateOverride: false,
      section: cls.section,
    };
  }

  // 4. Default uniform schedule
  return {
    startTime: cls.startTime,
    endTime: cls.endTime,
    durationMinutes: cls.durationMinutes || 60,
    isScheduled: true,
    isDateOverride: false,
    note: cls.notes,
    section: cls.section,
    slotsCount: 1,
  };
}

/**
 * Resolves all scheduled section periods for a TeachingClass on a given day or specific date.
 * Returns an array of slots (e.g. Section A at 07:00, Section B at 08:30).
 */
export function resolveClassDaySlots(
  cls: TeachingClass,
  day: DayOfWeek,
  dateIso?: string
): ResolvedClassSlot[] {
  // 1. Check for specific date override first
  if (dateIso && cls.dateSpecificSchedules && cls.dateSpecificSchedules.length > 0) {
    const override = cls.dateSpecificSchedules.find((s) => s.date === dateIso);
    if (override) {
      return [
        {
          slotId: override.id,
          section: cls.section,
          startTime: override.startTime,
          endTime: override.endTime,
          durationMinutes: override.durationMinutes || cls.durationMinutes || 60,
          subject: cls.subject,
          room: cls.location,
          note: override.note,
          isDateOverride: true,
        },
      ];
    }
  }

  // 2. Check for day-wise schedule
  if (cls.scheduleType === 'day_wise' && cls.dayWiseSchedules && cls.dayWiseSchedules[day]) {
    const dayConfig = cls.dayWiseSchedules[day]!;
    if (dayConfig.isActive === false) {
      return [];
    }

    if (dayConfig.slots && dayConfig.slots.length > 0) {
      return dayConfig.slots.map((s, idx) => ({
        slotId: s.id || `slot-${day}-${idx}`,
        section: s.section || dayConfig.section || cls.section,
        startTime: s.startTime,
        endTime: s.endTime,
        durationMinutes: s.durationMinutes || calculateDurationMinutes(s.startTime, s.endTime),
        subject: s.subject || cls.subject,
        room: s.room || dayConfig.location || cls.location,
        note: s.note || dayConfig.note,
        isDateOverride: false,
      }));
    }

    if (dayConfig.isActive === true || cls.scheduleDays.includes(day)) {
      return [
        {
          slotId: `slot-${day}-0`,
          section: dayConfig.section || cls.section,
          startTime: dayConfig.startTime || cls.startTime || '07:00',
          endTime: dayConfig.endTime || cls.endTime || '08:00',
          durationMinutes: dayConfig.durationMinutes || cls.durationMinutes || 60,
          subject: cls.subject,
          room: dayConfig.location || cls.location,
          note: dayConfig.note,
          isDateOverride: false,
        },
      ];
    }

    return [];
  }

  // 3. Uniform schedule
  if (!cls.scheduleDays.includes(day)) {
    return [];
  }

  return [
    {
      slotId: `slot-${day}-0`,
      section: cls.section,
      startTime: cls.startTime || '07:00',
      endTime: cls.endTime || '08:00',
      durationMinutes: cls.durationMinutes || 60,
      subject: cls.subject,
      room: cls.location,
      note: cls.notes,
      isDateOverride: false,
    },
  ];
}

/**
 * Resolves the active period count and timing for an Institution on a given day or specific date
 */
export function resolveInstitutionSchedule(
  inst: Institution,
  day: DayOfWeek,
  dateIso?: string
): ResolvedInstitutionSchedule {
  // 1. Check for specific date override first
  if (dateIso && inst.dateSpecificSchedules && inst.dateSpecificSchedules.length > 0) {
    const override = inst.dateSpecificSchedules.find((s) => s.date === dateIso);
    if (override) {
      return {
        periods: override.periods,
        startTime: override.startTime || inst.startTime,
        endTime: override.endTime || inst.endTime,
        isScheduled: override.periods > 0,
        isDateOverride: true,
        note: override.note,
      };
    }
  }

  // 2. Check for day-wise schedule
  if (inst.scheduleType === 'day_wise' || (!inst.scheduleType && inst.dayWisePeriods && !inst.workingDays?.length)) {
    const periods = inst.dayWisePeriods?.[day] ?? (inst.workingDays?.includes(day) ? inst.numberOfPeriods : 0);
    const daySchedule = inst.dayWiseSchedule?.find((s) => s.day === day);
    return {
      periods,
      startTime: daySchedule?.startTime || inst.startTime,
      endTime: daySchedule?.endTime || inst.endTime,
      isScheduled: periods > 0,
      isDateOverride: false,
      note: daySchedule?.timing,
    };
  }

  // 3. Uniform schedule
  const isWorking = (inst.workingDays || []).includes(day);
  return {
    periods: isWorking ? inst.numberOfPeriods : 0,
    startTime: inst.startTime,
    endTime: inst.endTime,
    isScheduled: isWorking && inst.numberOfPeriods > 0,
    isDateOverride: false,
  };
}
