import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { DayOfWeek, TeachingClass, AttendanceRecord } from '../types';
import {
  Clock,
  DollarSign,
  Coffee,
  BatteryCharging,
  TrendingUp,
  Calendar,
  Layers,
  Sparkles,
  Award,
  Zap,
  Info,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Sliders,
  Building2,
  Users,
} from 'lucide-react';
import { formatCurrency, formatDuration, formatTime } from '../utils/formatters';
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

export const WorkloadEarningsCalculator: React.FC = () => {
  const { classes, attendance, payments, students, institutions, settings } = useApp();

  // Selected Day for daily work/rest inspector
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>(() => {
    const todayIndex = new Date().getDay();
    return DAYS_OF_WEEK[todayIndex];
  });

  const [selectedDateIso, setSelectedDateIso] = useState<string>(getTodayIso());
  const [useActualAttendance, setUseActualAttendance] = useState<boolean>(true);

  // Dynamic Calculator States for "What-If" Earnings Simulator
  const [simHoursPerDay, setSimHoursPerDay] = useState<number>(4);
  const [simDaysPerWeek, setSimDaysPerWeek] = useState<number>(6);
  const [simHourlyRate, setSimHourlyRate] = useState<number>(1000);
  const [simStudentsCount, setSimStudentsCount] = useState<number>(4);
  const [simMonthlyPerStudent, setSimMonthlyPerStudent] = useState<number>(12000);
  const [simCollegeSalary, setSimCollegeSalary] = useState<number>(40000);
  const [calculatorMode, setCalculatorMode] = useState<'hourly' | 'student_college'>('hourly');

  // Per Tuition & Per College Detailed Salary Audit States
  const [salaryFilterMonth, setSalaryFilterMonth] = useState<string>(() => getTodayIso().slice(0, 7));
  const [overrideDeductLeaves, setOverrideDeductLeaves] = useState<Record<string, boolean>>({});
  const [salaryCategoryFilter, setSalaryCategoryFilter] = useState<'all' | 'colleges' | 'tuitions'>('all');

  // --- 1. WORK & REST METRICS FOR SELECTED DAY ---
  const daySchedule = useMemo(() => {
    // Classes scheduled on this day of week
    const scheduled = classes
      .filter((c) => c.isActive && c.scheduleDays.includes(selectedDay))
      .sort((a, b) => a.startTime.localeCompare(b.startTime));

    return scheduled;
  }, [classes, selectedDay]);

  // Actual marked attendance for the selected date if available
  const dateAttendance = useMemo(() => {
    return attendance.filter((a) => a.date === selectedDateIso && a.status === 'present');
  }, [attendance, selectedDateIso]);

  // Compute work hours in minutes for the chosen day
  const dailyWorkStats = useMemo(() => {
    let totalWorkMinutes = 0;
    let classList: Array<{
      id: string;
      title: string;
      startTime: string;
      endTime: string;
      durationMinutes: number;
      type: 'home_tuition' | 'college';
      color: string;
    }> = [];

    if (useActualAttendance && dateAttendance.length > 0) {
      totalWorkMinutes = dateAttendance.reduce((sum, a) => sum + a.durationMinutes, 0);
      classList = dateAttendance.map((a) => {
        const linkedClass = classes.find((c) => c.id === a.classId);
        return {
          id: a.id,
          title: a.title,
          startTime: a.startTime,
          endTime: a.endTime,
          durationMinutes: a.durationMinutes,
          type: a.type,
          color: linkedClass?.color || (a.type === 'college' ? '#8b5cf6' : '#10b981'),
        };
      });
    } else {
      totalWorkMinutes = daySchedule.reduce((sum, c) => sum + c.durationMinutes, 0);
      classList = daySchedule.map((c) => ({
        id: c.id,
        title: c.title,
        startTime: c.startTime,
        endTime: c.endTime,
        durationMinutes: c.durationMinutes,
        type: c.type,
        color: c.color || '#3b82f6',
      }));
    }

    // Sort class list chronologically
    classList.sort((a, b) => a.startTime.localeCompare(b.startTime));

    // Calculate break intervals between consecutive classes during daytime
    let totalDayBreakMinutes = 0;
    const gaps: Array<{ from: string; to: string; minutes: number }> = [];

    for (let i = 0; i < classList.length - 1; i++) {
      const currentEnd = classList[i].endTime;
      const nextStart = classList[i + 1].startTime;

      const [endH, endM] = currentEnd.split(':').map(Number);
      const [startH, startM] = nextStart.split(':').map(Number);

      const endTotalMins = endH * 60 + endM;
      const startTotalMins = startH * 60 + startM;

      if (startTotalMins > endTotalMins) {
        const gapMins = startTotalMins - endTotalMins;
        totalDayBreakMinutes += gapMins;
        gaps.push({
          from: currentEnd,
          to: nextStart,
          minutes: gapMins,
        });
      }
    }

    const totalMinutesInDay = 24 * 60;
    const totalRestMinutes = Math.max(0, totalMinutesInDay - totalWorkMinutes);
    const workHours = +(totalWorkMinutes / 60).toFixed(1);
    const restHours = +(totalRestMinutes / 60).toFixed(1);
    const dayBreakHours = +(totalDayBreakMinutes / 60).toFixed(1);
    const workPercentage = Math.min(100, Math.round((totalWorkMinutes / totalMinutesInDay) * 100));
    const restPercentage = 100 - workPercentage;

    // Workload status categorization
    let workloadStatus: 'light' | 'optimal' | 'heavy' | 'overloaded' = 'optimal';
    let statusLabel = 'Optimal & Balanced';
    let statusColor = 'emerald';
    let statusMessage = 'Great rhythm. You have healthy energy balance and sufficient rest time.';

    if (workHours === 0) {
      workloadStatus = 'light';
      statusLabel = 'Off-Duty / Rest Day';
      statusColor = 'indigo';
      statusMessage = 'Full recovery day. Excellent for lesson preparation and relaxation.';
    } else if (workHours < 3) {
      workloadStatus = 'light';
      statusLabel = 'Light Workload';
      statusColor = 'teal';
      statusMessage = 'Comfortable teaching volume with ample free personal time.';
    } else if (workHours <= 5.5) {
      workloadStatus = 'optimal';
      statusLabel = 'Optimal Daily Load';
      statusColor = 'emerald';
      statusMessage = 'Sustainable routine balancing high teaching output with adequate rest.';
    } else if (workHours <= 7.5) {
      workloadStatus = 'heavy';
      statusLabel = 'Heavy Workload';
      statusColor = 'amber';
      statusMessage = 'Demanding day. Ensure you hydrate during daytime breaks and protect vocal cords.';
    } else {
      workloadStatus = 'overloaded';
      statusLabel = 'Overloaded / High Fatigue';
      statusColor = 'rose';
      statusMessage = 'Intense schedule (> 7.5 hrs). Consider scheduling rest gaps to prevent burnout.';
    }

    return {
      totalWorkMinutes,
      workHours,
      totalRestMinutes,
      restHours,
      totalDayBreakMinutes,
      dayBreakHours,
      workPercentage,
      restPercentage,
      classList,
      gaps,
      workloadStatus,
      statusLabel,
      statusColor,
      statusMessage,
    };
  }, [useActualAttendance, dateAttendance, daySchedule, classes]);

  // --- 2. REALIZED & CONTRACTED EARNINGS (PER MONTH, PER WEEK, PER DAY, PER HOUR) ---
  const earningsMetrics = useMemo(() => {
    const today = new Date();
    const currentMonthIso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;

    // 1. Monthly Contracted / Estimated Earnings
    let tuitionMonthlyTotal = 0;
    students.forEach((s) => {
      if (s.status === 'active') {
        if (s.feeStructure === 'monthly') {
          tuitionMonthlyTotal += s.feeAmount;
        } else if (s.feeStructure === 'hourly') {
          // Approx 6 days * 4.33 weeks * duration
          const weeklyHours = (s.classDurationMinutes / 60) * 5;
          tuitionMonthlyTotal += weeklyHours * 4.33 * s.feeAmount;
        } else if (s.feeStructure === 'per_class') {
          tuitionMonthlyTotal += s.feeAmount * 24; // ~24 classes/mo
        } else {
          tuitionMonthlyTotal += s.feeAmount;
        }
      }
    });

    let collegeMonthlyTotal = 0;
    institutions.forEach((inst) => {
      if (inst.status === 'active') {
        if (inst.paymentStructure === 'semester') {
          const semMonths = inst.semesterDurationMonths || 6;
          collegeMonthlyTotal += Math.round(inst.rateAmount / semMonths);
        } else if (inst.paymentStructure === 'monthly') {
          collegeMonthlyTotal += inst.rateAmount;
        } else if (inst.paymentStructure === 'per_period') {
          const weeklyPeriods: number =
            inst.scheduleType === 'day_wise' && inst.dayWisePeriods
              ? Object.values(inst.dayWisePeriods).reduce<number>((sum, p) => sum + (Number(p) || 0), 0)
              : inst.workingDays.length * inst.numberOfPeriods;
          const monthlyPeriods = weeklyPeriods * 4.33;
          collegeMonthlyTotal += monthlyPeriods * inst.rateAmount;
        } else if (inst.paymentStructure === 'hourly') {
          const weeklyPeriods: number =
            inst.scheduleType === 'day_wise' && inst.dayWisePeriods
              ? Object.values(inst.dayWisePeriods).reduce<number>((sum, p) => sum + (Number(p) || 0), 0)
              : inst.workingDays.length * inst.numberOfPeriods;
          const weeklyMins = weeklyPeriods * inst.periodDurationMinutes;
          const monthlyHours = (weeklyMins / 60) * 4.33;
          collegeMonthlyTotal += monthlyHours * inst.rateAmount;
        } else {
          collegeMonthlyTotal += inst.rateAmount;
        }
      }
    });

    const totalEstimatedMonthly = tuitionMonthlyTotal + collegeMonthlyTotal;

    // Realized payments received this month
    const receivedThisMonth = payments
      .filter((p) => p.paymentDate.startsWith(currentMonthIso) || p.periodMonthYear === currentMonthIso)
      .reduce((sum, p) => sum + p.amountPaid, 0);

    // Total weekly hours across routine
    let totalWeeklyTeachingMinutes = 0;
    classes.forEach((c) => {
      if (c.isActive) {
        totalWeeklyTeachingMinutes += c.durationMinutes * c.scheduleDays.length;
      }
    });
    const weeklyTeachingHours = +(totalWeeklyTeachingMinutes / 60).toFixed(1);
    const monthlyTeachingHours = +(weeklyTeachingHours * 4.33).toFixed(1);

    // Effective Per Period Calculations
    const perMonthEarning = totalEstimatedMonthly;
    const perWeekEarning = +(totalEstimatedMonthly / 4.33).toFixed(0);
    // Calculated across active teaching days (average ~6 days/week or 26 days/mo)
    const perDayEarningTeachingDays = +(totalEstimatedMonthly / 26).toFixed(0);
    const perDayEarningAllDays = +(totalEstimatedMonthly / 30.4).toFixed(0);

    // Per Hour Rate
    const perHourEarning =
      monthlyTeachingHours > 0 ? +(totalEstimatedMonthly / monthlyTeachingHours).toFixed(0) : 0;

    // Day of week breakdown based on active routine
    const dayEarningsBreakdown = DAYS_OF_WEEK.map((day) => {
      const dayClasses = classes.filter((c) => c.isActive && c.scheduleDays.includes(day));
      let dayTuitionEst = 0;
      let dayCollegeEst = 0;
      let dayMins = 0;

      dayClasses.forEach((cls) => {
        dayMins += cls.durationMinutes;

        // Dynamically resolve authoritative fee & structure if student or college exists
        let fee = cls.feeAmount;
        let structure = cls.feeStructure;
        let semMonths = cls.semesterDurationMonths || 6;

        if (cls.type === 'home_tuition' && cls.studentId) {
          const st = students.find((s) => s.id === cls.studentId);
          if (st) {
            fee = st.feeAmount;
            structure = st.feeStructure;
          }
        } else if (cls.type === 'college' && cls.institutionId) {
          const inst = institutions.find((i) => i.id === cls.institutionId);
          if (inst) {
            fee = inst.rateAmount;
            structure = inst.paymentStructure;
            semMonths = inst.semesterDurationMonths || 6;
          }
        }

        if (cls.type === 'home_tuition') {
          if (structure === 'monthly') {
            dayTuitionEst += fee / 24;
          } else if (structure === 'hourly') {
            dayTuitionEst += (cls.durationMinutes / 60) * fee;
          } else {
            dayTuitionEst += fee;
          }
        } else {
          if (structure === 'semester') {
            const monthlyNominal = fee / semMonths;
            dayCollegeEst += monthlyNominal / 26;
          } else if (structure === 'monthly') {
            dayCollegeEst += fee / 24;
          } else if (structure === 'per_period') {
            dayCollegeEst += fee;
          } else if (structure === 'hourly') {
            dayCollegeEst += (cls.durationMinutes / 60) * fee;
          } else {
            dayCollegeEst += fee;
          }
        }
      });

      return {
        day,
        totalDayEst: Math.round(dayTuitionEst + dayCollegeEst),
        dayHours: +(dayMins / 60).toFixed(1),
        classCount: dayClasses.length,
      };
    });

    return {
      perMonthEarning,
      perWeekEarning: Number(perWeekEarning),
      perDayEarningTeachingDays: Number(perDayEarningTeachingDays),
      perDayEarningAllDays: Number(perDayEarningAllDays),
      perHourEarning: Number(perHourEarning),
      tuitionMonthlyTotal,
      collegeMonthlyTotal,
      receivedThisMonth,
      weeklyTeachingHours,
      monthlyTeachingHours,
      dayEarningsBreakdown,
    };
  }, [students, institutions, classes, payments]);

  // --- 2b. DETAILED AUDIT: PER TUITION & PER COLLEGE SALARY CALCULATION ---
  const detailedSalaryBreakdown = useMemo(() => {
    // 1. Process Colleges / Institutions
    const collegeRows = institutions.map((inst) => {
      const instAttendance = attendance.filter(
        (a) => a.institutionId === inst.id && a.date.startsWith(salaryFilterMonth)
      );

      const presentRecords = instAttendance.filter((a) => a.status === 'present');
      const absentRecords = instAttendance.filter((a) => a.status === 'absent');
      const rescheduledRecords = instAttendance.filter((a) => a.status === 'rescheduled');

      const daysTaken = new Set(presentRecords.map((a) => a.date)).size;
      const periodsTaken = presentRecords.reduce((sum, a) => sum + (a.periodsCount || 1), 0);
      const totalMins = presentRecords.reduce(
        (sum, a) => sum + (a.actualDurationMinutes || a.durationMinutes || 0),
        0
      );
      const hoursTaken = Number((totalMins / 60).toFixed(1));
      const leavesCount = absentRecords.length;
      const rescheduledCount = rescheduledRecords.length;

      // User override or institution setting
      const deductLeaves =
        overrideDeductLeaves[inst.id] !== undefined
          ? overrideDeductLeaves[inst.id]
          : (inst.deductLeaveSalary ?? false);

      let nominalMonthlyRate = 0;
      let calculatedSalary = 0;
      let deductionAmount = 0;
      let perDayRate = 0;
      let structureLabel = '';

      if (inst.paymentStructure === 'semester') {
        const semDuration = inst.semesterDurationMonths || 6;
        nominalMonthlyRate = Math.round(inst.rateAmount / semDuration);
        structureLabel = `Semester (${semDuration} Mos Fixed: ${formatCurrency(inst.rateAmount, settings.currency)})`;
        perDayRate = Math.round(nominalMonthlyRate / 26);
        deductionAmount = deductLeaves ? leavesCount * perDayRate : 0;
        calculatedSalary = Math.max(0, nominalMonthlyRate - deductionAmount);
      } else if (inst.paymentStructure === 'monthly') {
        nominalMonthlyRate = inst.rateAmount;
        structureLabel = 'Monthly Fixed Salary';
        perDayRate = Math.round(nominalMonthlyRate / 26);
        deductionAmount = deductLeaves ? leavesCount * perDayRate : 0;
        calculatedSalary = Math.max(0, nominalMonthlyRate - deductionAmount);
      } else if (inst.paymentStructure === 'per_period') {
        structureLabel = `Per Period (${formatCurrency(inst.rateAmount, settings.currency)}/pd)`;
        calculatedSalary = periodsTaken * inst.rateAmount;
      } else if (inst.paymentStructure === 'hourly') {
        structureLabel = `Hourly Rate (${formatCurrency(inst.rateAmount, settings.currency)}/hr)`;
        calculatedSalary = Math.round((totalMins / 60) * inst.rateAmount);
      } else {
        structureLabel = 'Custom Contract';
        calculatedSalary = inst.rateAmount;
      }

      // Payments received for this institution in this month
      const paidThisMonth = payments
        .filter(
          (p) =>
            p.institutionId === inst.id &&
            (p.periodMonthYear === salaryFilterMonth || p.paymentDate.startsWith(salaryFilterMonth))
        )
        .reduce((sum, p) => sum + p.amountPaid, 0);

      const dueAmount = Math.max(0, calculatedSalary - paidThisMonth);

      return {
        id: inst.id,
        type: 'college' as const,
        name: inst.name,
        subtitle: `${inst.facultyOrGrade}${inst.section ? ` • Sec ${inst.section}` : ''}`,
        paymentStructure: inst.paymentStructure,
        structureLabel,
        rateAmount: inst.rateAmount,
        semesterDurationMonths: inst.semesterDurationMonths,
        semesterName: inst.semesterName,
        nominalMonthlyRate,
        daysTaken,
        periodsTaken,
        totalMins,
        hoursTaken,
        leavesCount,
        rescheduledCount,
        deductLeaves,
        perDayRate,
        deductionAmount,
        calculatedSalary,
        paidThisMonth,
        dueAmount,
      };
    });

    // 2. Process Home Tuition Students
    const tuitionRows = students.map((st) => {
      const stAttendance = attendance.filter(
        (a) => a.studentId === st.id && a.date.startsWith(salaryFilterMonth)
      );

      const presentRecords = stAttendance.filter((a) => a.status === 'present');
      const absentRecords = stAttendance.filter((a) => a.status === 'absent');
      const rescheduledRecords = stAttendance.filter((a) => a.status === 'rescheduled');

      const daysTaken = new Set(presentRecords.map((a) => a.date)).size;
      const sessionsTaken = presentRecords.length;
      const totalMins = presentRecords.reduce(
        (sum, a) => sum + (a.actualDurationMinutes || a.durationMinutes || 0),
        0
      );
      const hoursTaken = Number((totalMins / 60).toFixed(1));
      const leavesCount = absentRecords.length;
      const rescheduledCount = rescheduledRecords.length;

      // User override or student setting
      const deductLeaves =
        overrideDeductLeaves[st.id] !== undefined
          ? overrideDeductLeaves[st.id]
          : (st.deductLeaveFee ?? false);

      let calculatedSalary = 0;
      let deductionAmount = 0;
      let perDayRate = 0;
      let structureLabel = '';

      if (st.feeStructure === 'hourly') {
        // Hourly tuition MUST be calculated strictly based on how many hours were conducted!
        structureLabel = `Hourly (${formatCurrency(st.feeAmount, settings.currency)}/hr)`;
        calculatedSalary = Math.round((totalMins / 60) * st.feeAmount);
      } else if (st.feeStructure === 'monthly') {
        structureLabel = `Monthly Tuition (${formatCurrency(st.feeAmount, settings.currency)}/mo)`;
        perDayRate = Math.round(st.feeAmount / 24);
        deductionAmount = deductLeaves ? leavesCount * perDayRate : 0;
        calculatedSalary = Math.max(0, st.feeAmount - deductionAmount);
      } else if (st.feeStructure === 'per_class') {
        structureLabel = `Per Session (${formatCurrency(st.feeAmount, settings.currency)}/session)`;
        calculatedSalary = sessionsTaken * st.feeAmount;
      } else {
        structureLabel = 'Fixed Fee';
        calculatedSalary = st.feeAmount;
      }

      // Payments received for this student in this month
      const paidThisMonth = payments
        .filter(
          (p) =>
            p.studentId === st.id &&
            (p.periodMonthYear === salaryFilterMonth || p.paymentDate.startsWith(salaryFilterMonth))
        )
        .reduce((sum, p) => sum + p.amountPaid, 0);

      const dueAmount = Math.max(0, calculatedSalary - paidThisMonth);

      return {
        id: st.id,
        type: 'tuition' as const,
        name: st.name,
        subtitle: `${st.grade} • ${st.subjects?.join(', ')}`,
        paymentStructure: st.feeStructure,
        structureLabel,
        rateAmount: st.feeAmount,
        daysTaken,
        periodsTaken: sessionsTaken,
        totalMins,
        hoursTaken,
        leavesCount,
        rescheduledCount,
        deductLeaves,
        perDayRate,
        deductionAmount,
        calculatedSalary,
        paidThisMonth,
        dueAmount,
      };
    });

    const allRows = [...collegeRows, ...tuitionRows];
    const totalCalculatedSalary = allRows.reduce((sum, r) => sum + r.calculatedSalary, 0);
    const totalPaid = allRows.reduce((sum, r) => sum + r.paidThisMonth, 0);
    const totalDue = allRows.reduce((sum, r) => sum + r.dueAmount, 0);
    const totalConductedHours = Number(allRows.reduce((sum, r) => sum + r.hoursTaken, 0).toFixed(1));
    const totalPeriodsOrSessions = allRows.reduce((sum, r) => sum + r.periodsTaken, 0);
    const totalLeavesAcross = allRows.reduce((sum, r) => sum + r.leavesCount, 0);

    return {
      collegeRows,
      tuitionRows,
      allRows,
      totalCalculatedSalary,
      totalPaid,
      totalDue,
      totalConductedHours,
      totalPeriodsOrSessions,
      totalLeavesAcross,
    };
  }, [institutions, students, attendance, payments, salaryFilterMonth, overrideDeductLeaves, settings]);

  // --- 3. DYNAMIC SIMULATOR COMPUTATION ---
  const simulatedOutput = useMemo(() => {
    if (calculatorMode === 'hourly') {
      const weeklyHours = simHoursPerDay * simDaysPerWeek;
      const monthlyHours = weeklyHours * 4.33;
      const perDay = simHoursPerDay * simHourlyRate;
      const perWeek = weeklyHours * simHourlyRate;
      const perMonth = monthlyHours * simHourlyRate;
      const perYear = perMonth * 12;

      return {
        hourly: simHourlyRate,
        daily: Math.round(perDay),
        weekly: Math.round(perWeek),
        monthly: Math.round(perMonth),
        yearly: Math.round(perYear),
        workHoursPerDay: simHoursPerDay,
        restHoursPerDay: 24 - simHoursPerDay,
        weeklyHours: Math.round(weeklyHours),
      };
    } else {
      const tuitionMonthly = simStudentsCount * simMonthlyPerStudent;
      const totalMonthly = tuitionMonthly + simCollegeSalary;
      const perYear = totalMonthly * 12;
      const perWeek = Math.round(totalMonthly / 4.33);
      const perDay = Math.round(totalMonthly / 26);
      const estTeachingHoursPerMonth = simStudentsCount * 24 + 40; // ~1h/day per student + college periods
      const hourly =
        estTeachingHoursPerMonth > 0 ? Math.round(totalMonthly / estTeachingHoursPerMonth) : 0;

      return {
        hourly,
        daily: perDay,
        weekly: perWeek,
        monthly: Math.round(totalMonthly),
        yearly: Math.round(perYear),
        workHoursPerDay: +(estTeachingHoursPerMonth / 26).toFixed(1),
        restHoursPerDay: +(24 - estTeachingHoursPerMonth / 26).toFixed(1),
        weeklyHours: +(estTeachingHoursPerMonth / 4.33).toFixed(1),
      };
    }
  }, [
    calculatorMode,
    simHoursPerDay,
    simDaysPerWeek,
    simHourlyRate,
    simStudentsCount,
    simMonthlyPerStudent,
    simCollegeSalary,
  ]);

  // Calculate Tenure & Start Dates for all batches
  const classesWithTenure = useMemo(() => {
    const today = new Date();
    return classes.map((c) => {
      const startDateStr = c.startDate || '2026-04-15';
      const startD = new Date(startDateStr);
      const diffMonths = Math.max(
        0,
        (today.getFullYear() - startD.getFullYear()) * 12 + (today.getMonth() - startD.getMonth())
      );

      let effectiveFeeAmount = c.feeAmount;
      let effectiveFeeStructure = c.feeStructure;
      if (c.type === 'home_tuition' && c.studentId) {
        const st = students.find((s) => s.id === c.studentId);
        if (st) {
          effectiveFeeAmount = st.feeAmount;
          effectiveFeeStructure = st.feeStructure;
        }
      } else if (c.type === 'college' && c.institutionId) {
        const inst = institutions.find((i) => i.id === c.institutionId);
        if (inst) {
          effectiveFeeAmount = inst.rateAmount;
          effectiveFeeStructure = inst.paymentStructure;
        }
      }

      return {
        ...c,
        feeAmount: effectiveFeeAmount,
        feeStructure: effectiveFeeStructure,
        effectiveStartDate: startDateStr,
        tenureMonths: diffMonths,
        tenureText: diffMonths === 0 ? 'Started this month' : `${diffMonths} month${diffMonths > 1 ? 's' : ''} ongoing`,
      };
    });
  }, [classes, students, institutions]);

  return (
    <div className="space-y-8">
      {/* SECTION HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <Sliders className="w-5 h-5" />
            </div>
            Workload, Rest & Earnings Calculator
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Calculate your daily teaching vs rest hours, analyze per-hour/day/week/month earnings, and simulate future schedule changes.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
            Nepali / AD Sync Active
          </span>
        </div>
      </div>

      {/* --- MODULE 1: MULTI-TIER EARNINGS BREAKDOWN (Month, Week, Day, Hour) --- */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-emerald-600" />
            <span>Contracted Earnings & Rate Analytics</span>
          </h2>
          <span className="text-xs text-slate-500">Based on active classes & tuition contracts</span>
        </div>

        {/* 4 Multi-Tier Metric Cards: Month, Week, Day, Hour */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 1. PER MONTH */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Per Month Earnings
              </span>
              <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-black text-slate-900 dark:text-white mt-2">
              {formatCurrency(earningsMetrics.perMonthEarning, settings.currency)}
            </p>
            <div className="mt-2 text-xs text-slate-500 space-y-0.5">
              <div className="flex justify-between">
                <span>Tuitions:</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  {formatCurrency(earningsMetrics.tuitionMonthlyTotal, settings.currency)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Colleges:</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  {formatCurrency(earningsMetrics.collegeMonthlyTotal, settings.currency)}
                </span>
              </div>
            </div>
          </div>

          {/* 2. PER WEEK */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Per Week Earnings
              </span>
              <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
                <Calendar className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-black text-slate-900 dark:text-white mt-2">
              {formatCurrency(earningsMetrics.perWeekEarning, settings.currency)}
            </p>
            <div className="mt-2 text-xs text-slate-500 space-y-0.5">
              <div className="flex justify-between">
                <span>Weekly Workload:</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  {earningsMetrics.weeklyTeachingHours} hrs/week
                </span>
              </div>
              <div className="flex justify-between">
                <span>Annualized:</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  {formatCurrency(earningsMetrics.perMonthEarning * 12, settings.currency)}/yr
                </span>
              </div>
            </div>
          </div>

          {/* 3. PER DAY */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Per Day Earnings
              </span>
              <div className="p-1.5 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
                <Zap className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-black text-slate-900 dark:text-white mt-2">
              {formatCurrency(earningsMetrics.perDayEarningTeachingDays, settings.currency)}
            </p>
            <div className="mt-2 text-xs text-slate-500 space-y-0.5">
              <div className="flex justify-between">
                <span>Teaching Day Avg:</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  {formatCurrency(earningsMetrics.perDayEarningTeachingDays, settings.currency)} (26d/mo)
                </span>
              </div>
              <div className="flex justify-between">
                <span>Calendar Day Avg:</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  {formatCurrency(earningsMetrics.perDayEarningAllDays, settings.currency)} (30.4d)
                </span>
              </div>
            </div>
          </div>

          {/* 4. PER HOUR */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Effective Per Hr Rate
              </span>
              <div className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-black text-slate-900 dark:text-white mt-2">
              {formatCurrency(earningsMetrics.perHourEarning, settings.currency)}{' '}
              <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">/hr</span>
            </p>
            <div className="mt-2 text-xs text-slate-500 space-y-0.5">
              <div className="flex justify-between">
                <span>Monthly Hours:</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  {earningsMetrics.monthlyTeachingHours} teaching hrs
                </span>
              </div>
              <div className="flex justify-between">
                <span>Status:</span>
                <span className="font-semibold text-emerald-600">
                  Competitive Rate
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Day-by-Day Earnings Strip (Sunday to Saturday) */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-3">
            Day-by-Day Teaching Income & Hours Distribution
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
            {earningsMetrics.dayEarningsBreakdown.map((item) => {
              const isToday = DAYS_OF_WEEK[new Date().getDay()] === item.day;
              return (
                <div
                  key={item.day}
                  className={`p-3 rounded-xl border text-center transition ${
                    isToday
                      ? 'bg-indigo-50/70 dark:bg-indigo-950/40 border-indigo-300 dark:border-indigo-800 ring-1 ring-indigo-400'
                      : 'bg-slate-50 dark:bg-slate-800/60 border-slate-100 dark:border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 dark:text-slate-400">
                    <span>{item.day.slice(0, 3)}</span>
                    {isToday && (
                      <span className="px-1.5 py-0.2 rounded-sm bg-indigo-600 text-white text-[9px]">
                        Today
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-extrabold text-slate-900 dark:text-white mt-1">
                    {formatCurrency(item.totalDayEst, settings.currency)}
                  </p>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    {item.dayHours} hrs • {item.classCount} class{item.classCount !== 1 ? 'es' : ''}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* --- MODULE: PER-TUITION & PER-COLLEGE SALARY BREAKDOWN & WORKLOAD AUDIT --- */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
                <Building2 className="w-5 h-5" />
              </div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                Per-Tuition & College Salary Calculation
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Detailed breakdown of days taken, periods/hours conducted, leaves, and optional salary deductions for semester, monthly, and hourly classes.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Month Picker */}
            <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
              <Calendar className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
              <label className="font-semibold text-slate-600 dark:text-slate-300">Month:</label>
              <input
                type="month"
                value={salaryFilterMonth}
                onChange={(e) => setSalaryFilterMonth(e.target.value)}
                className="bg-transparent text-slate-900 dark:text-white font-bold text-xs focus:outline-none cursor-pointer"
              />
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center p-0.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold">
              <button
                onClick={() => setSalaryCategoryFilter('all')}
                className={`px-3 py-1 rounded-lg transition ${
                  salaryCategoryFilter === 'all'
                    ? 'bg-white dark:bg-slate-700 text-purple-700 dark:text-purple-300 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                All ({detailedSalaryBreakdown.allRows.length})
              </button>
              <button
                onClick={() => setSalaryCategoryFilter('colleges')}
                className={`px-3 py-1 rounded-lg transition ${
                  salaryCategoryFilter === 'colleges'
                    ? 'bg-white dark:bg-slate-700 text-purple-700 dark:text-purple-300 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Colleges ({detailedSalaryBreakdown.collegeRows.length})
              </button>
              <button
                onClick={() => setSalaryCategoryFilter('tuitions')}
                className={`px-3 py-1 rounded-lg transition ${
                  salaryCategoryFilter === 'tuitions'
                    ? 'bg-white dark:bg-slate-700 text-purple-700 dark:text-purple-300 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Tuitions ({detailedSalaryBreakdown.tuitionRows.length})
              </button>
            </div>
          </div>
        </div>

        {/* Aggregate Rollup for Selected Month */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="p-3.5 rounded-xl bg-purple-50/70 dark:bg-purple-950/30 border border-purple-200/80 dark:border-purple-900/60">
            <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider block">
              Total Calculated
            </span>
            <p className="text-base sm:text-lg font-black text-purple-950 dark:text-purple-100 mt-0.5">
              {formatCurrency(detailedSalaryBreakdown.totalCalculatedSalary, settings.currency)}
            </p>
            <span className="text-[10px] text-purple-700 dark:text-purple-300 mt-0.5 block">
              Net payable for month
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-900/60">
            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">
              Paid Received
            </span>
            <p className="text-base sm:text-lg font-black text-emerald-900 dark:text-emerald-100 mt-0.5">
              {formatCurrency(detailedSalaryBreakdown.totalPaid, settings.currency)}
            </p>
            <span className="text-[10px] text-emerald-700 dark:text-emerald-300 mt-0.5 block">
              Recorded in payments
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/60">
            <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider block">
              Outstanding Due
            </span>
            <p className="text-base sm:text-lg font-black text-amber-900 dark:text-amber-100 mt-0.5">
              {formatCurrency(detailedSalaryBreakdown.totalDue, settings.currency)}
            </p>
            <span className="text-[10px] text-amber-700 dark:text-amber-300 mt-0.5 block">
              Remaining to collect
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200/80 dark:border-indigo-900/60">
            <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider block">
              Conducted Hours
            </span>
            <p className="text-base sm:text-lg font-black text-indigo-900 dark:text-indigo-100 mt-0.5">
              {detailedSalaryBreakdown.totalConductedHours} hrs
            </p>
            <span className="text-[10px] text-indigo-700 dark:text-indigo-300 mt-0.5 block">
              Exact teaching time
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-900/60">
            <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider block">
              Periods & Sessions
            </span>
            <p className="text-base sm:text-lg font-black text-blue-900 dark:text-blue-100 mt-0.5">
              {detailedSalaryBreakdown.totalPeriodsOrSessions}
            </p>
            <span className="text-[10px] text-blue-700 dark:text-blue-300 mt-0.5 block">
              Total classes delivered
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200/80 dark:border-rose-900/60">
            <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider block">
              Total Leaves Taken
            </span>
            <p className="text-base sm:text-lg font-black text-rose-900 dark:text-rose-100 mt-0.5">
              {detailedSalaryBreakdown.totalLeavesAcross}
            </p>
            <span className="text-[10px] text-rose-700 dark:text-rose-300 mt-0.5 block">
              Absences in month
            </span>
          </div>
        </div>

        {/* Entities Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {(salaryCategoryFilter === 'colleges'
            ? detailedSalaryBreakdown.collegeRows
            : salaryCategoryFilter === 'tuitions'
            ? detailedSalaryBreakdown.tuitionRows
            : detailedSalaryBreakdown.allRows
          ).map((item) => (
            <div
              key={`${item.type}-${item.id}`}
              className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 hover:border-purple-300 dark:hover:border-purple-700 transition flex flex-col justify-between space-y-3"
            >
              <div>
                {/* Header: Type, Title, Badge */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`p-1 rounded-lg text-xs ${
                          item.type === 'college'
                            ? 'bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300'
                            : 'bg-teal-100 dark:bg-teal-900/60 text-teal-700 dark:text-teal-300'
                        }`}
                      >
                        {item.type === 'college' ? (
                          <Building2 className="w-4 h-4" />
                        ) : (
                          <Users className="w-4 h-4" />
                        )}
                      </span>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                        {item.name}
                      </h4>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 ml-6">
                      {item.subtitle}
                    </p>
                  </div>

                  <span
                    className={`px-2.5 py-1 text-[11px] font-bold rounded-lg ${
                      item.paymentStructure === 'semester'
                        ? 'bg-purple-200/70 dark:bg-purple-900/60 text-purple-900 dark:text-purple-200 border border-purple-300 dark:border-purple-700'
                        : item.paymentStructure === 'hourly'
                        ? 'bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-200 border border-amber-200 dark:border-amber-800'
                        : 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-800 dark:text-indigo-200 border border-indigo-200 dark:border-indigo-800'
                    }`}
                  >
                    {item.structureLabel}
                  </span>
                </div>

                {/* Workload Metrics for this Month */}
                <div className="mt-3 grid grid-cols-4 gap-2 text-center p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/80">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">
                      Days Taken
                    </span>
                    <span className="text-xs font-black text-slate-900 dark:text-white">
                      {item.daysTaken} days
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">
                      {item.type === 'college' ? 'Periods' : 'Sessions'}
                    </span>
                    <span className="text-xs font-black text-indigo-600 dark:text-indigo-400">
                      {item.periodsTaken}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">
                      Hours Taken
                    </span>
                    <span className="text-xs font-black text-slate-900 dark:text-white">
                      {item.hoursTaken} hrs
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">
                      Leaves
                    </span>
                    <span
                      className={`text-xs font-black ${
                        item.leavesCount > 0
                          ? 'text-rose-600 dark:text-rose-400'
                          : 'text-emerald-600 dark:text-emerald-400'
                      }`}
                    >
                      {item.leavesCount} days
                    </span>
                  </div>
                </div>

                {/* Rescheduled notes if any */}
                {item.rescheduledCount > 0 && (
                  <div className="mt-2 text-[11px] text-amber-700 dark:text-amber-300 flex items-center gap-1.5 px-2 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-900/60">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    <span>
                      {item.rescheduledCount} class{item.rescheduledCount !== 1 ? 'es' : ''} rescheduled this month.
                    </span>
                  </div>
                )}

                {/* Salary Calculation details & Leave Deduction Switch */}
                <div className="mt-3 p-2.5 rounded-xl bg-slate-100/70 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800 space-y-2">
                  {/* Calculation logic description */}
                  {item.paymentStructure === 'semester' && (
                    <div className="text-[11px] text-purple-900 dark:text-purple-200 space-y-0.5">
                      <div className="flex justify-between">
                        <span>Semester Term: <strong>{item.semesterName || '1st Semester'}</strong> ({item.semesterDurationMonths || 6} months)</span>
                        <span className="font-bold">Total: {formatCurrency(item.rateAmount, settings.currency)}</span>
                      </div>
                      <div className="flex justify-between text-slate-600 dark:text-slate-400">
                        <span>Pro-rated Monthly Allocation:</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {formatCurrency(item.nominalMonthlyRate, settings.currency)}/mo
                        </span>
                      </div>
                    </div>
                  )}

                  {item.paymentStructure === 'hourly' && (
                    <div className="text-[11px] text-amber-900 dark:text-amber-200 flex justify-between items-center">
                      <span>Formula: {item.hoursTaken} hrs conducted × {formatCurrency(item.rateAmount, settings.currency)}/hr</span>
                      <span className="font-black text-xs">
                        = {formatCurrency(item.calculatedSalary, settings.currency)}
                      </span>
                    </div>
                  )}

                  {item.paymentStructure === 'per_period' && (
                    <div className="text-[11px] text-indigo-900 dark:text-indigo-200 flex justify-between items-center">
                      <span>Formula: {item.periodsTaken} periods conducted × {formatCurrency(item.rateAmount, settings.currency)}/pd</span>
                      <span className="font-black text-xs">
                        = {formatCurrency(item.calculatedSalary, settings.currency)}
                      </span>
                    </div>
                  )}

                  {/* Leave Deduction Toggle (for monthly and semester) */}
                  {(item.paymentStructure === 'monthly' || item.paymentStructure === 'semester') && (
                    <div className="pt-1.5 border-t border-slate-200 dark:border-slate-700/80">
                      <div className="flex items-center justify-between">
                        <label
                          htmlFor={`deduct-toggle-${item.type}-${item.id}`}
                          className="flex items-center gap-2 cursor-pointer select-none text-[11px]"
                        >
                          <input
                            type="checkbox"
                            id={`deduct-toggle-${item.type}-${item.id}`}
                            checked={item.deductLeaves}
                            onChange={(e) =>
                              setOverrideDeductLeaves({
                                ...overrideDeductLeaves,
                                [item.id]: e.target.checked,
                              })
                            }
                            className="w-3.5 h-3.5 rounded text-purple-600 focus:ring-purple-500 cursor-pointer"
                          />
                          <span className="text-slate-700 dark:text-slate-300 font-medium">
                            Deduct salary for leave ({item.leavesCount} days)
                          </span>
                        </label>

                        <span className="text-[11px] font-bold">
                          {item.deductLeaves ? (
                            <span className="text-rose-600 dark:text-rose-400">
                              -{formatCurrency(item.deductionAmount, settings.currency)}
                            </span>
                          ) : (
                            <span className="text-emerald-600 dark:text-emerald-400 text-[10px]">
                              No Deduction (Protected)
                            </span>
                          )}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                        {item.deductLeaves
                          ? `Deducting ${item.leavesCount} days at ${formatCurrency(item.perDayRate, settings.currency)}/day`
                          : 'Salary is not deducted for absences unless selected by teacher.'}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom Card Summary: Net Payable vs Paid vs Due */}
              <div className="pt-2.5 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">
                    Net Salary
                  </span>
                  <span className="text-sm sm:text-base font-black text-purple-900 dark:text-purple-200">
                    {formatCurrency(item.calculatedSalary, settings.currency)}
                  </span>
                </div>

                <div className="text-right">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                      Paid: {formatCurrency(item.paidThisMonth, settings.currency)}
                    </span>
                    <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400">
                      Due: {formatCurrency(item.dueAmount, settings.currency)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* --- MODULE 2: TEACHER DAILY WORK VS. REST CALCULATOR --- */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <BatteryCharging className="w-5 h-5 text-indigo-600" />
              <span>Daily Work vs. Rest Calculator</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Inspect exactly how many hours you teach vs your daytime gaps and rest recovery time.
            </p>
          </div>

          {/* Day Selector */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {DAYS_OF_WEEK.map((d) => (
              <button
                key={d}
                onClick={() => setSelectedDay(d)}
                className={`px-2.5 py-1.5 text-xs font-semibold rounded-xl border transition ${
                  selectedDay === d
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                }`}
              >
                {d.slice(0, 3)}
              </button>
            ))}
          </div>
        </div>

        {/* Key Daily Work/Rest Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Work Hours Card */}
          <div className="p-4 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900/50">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-indigo-900 dark:text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-indigo-600" />
                Teaching / Work Time
              </span>
              <span className="px-2 py-0.5 text-xs font-extrabold rounded-md bg-indigo-200 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200">
                {dailyWorkStats.workPercentage}% of Day
              </span>
            </div>
            <p className="text-3xl font-black text-slate-900 dark:text-white mt-2">
              {dailyWorkStats.workHours} <span className="text-lg font-normal text-slate-500">hours</span>
            </p>
            <p className="text-xs text-indigo-700 dark:text-indigo-400 mt-1">
              {dailyWorkStats.totalWorkMinutes} total minutes across {dailyWorkStats.classList.length} class(es)
            </p>
          </div>

          {/* Daytime Breaks Card */}
          <div className="p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-900 dark:text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                <Coffee className="w-4 h-4 text-amber-600" />
                Inter-Class Daytime Breaks
              </span>
              <span className="px-2 py-0.5 text-xs font-extrabold rounded-md bg-amber-200 dark:bg-amber-900 text-amber-800 dark:text-amber-200">
                {dailyWorkStats.gaps.length} break window{dailyWorkStats.gaps.length !== 1 ? 's' : ''}
              </span>
            </div>
            <p className="text-3xl font-black text-slate-900 dark:text-white mt-2">
              {dailyWorkStats.dayBreakHours} <span className="text-lg font-normal text-slate-500">hours</span>
            </p>
            <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">
              {dailyWorkStats.totalDayBreakMinutes} mins downtime between teaching sessions
            </p>
          </div>

          {/* Total Rest / Recovery Card */}
          <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-900 dark:text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
                <BatteryCharging className="w-4 h-4 text-emerald-600" />
                Total Rest & Off-Duty
              </span>
              <span className="px-2 py-0.5 text-xs font-extrabold rounded-md bg-emerald-200 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200">
                {dailyWorkStats.restPercentage}% of Day
              </span>
            </div>
            <p className="text-3xl font-black text-slate-900 dark:text-white mt-2">
              {dailyWorkStats.restHours} <span className="text-lg font-normal text-slate-500">hours</span>
            </p>
            <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-1">
              Sleep, family, preparation & personal recovery
            </p>
          </div>
        </div>

        {/* Workload Status Banner */}
        <div
          className={`p-4 rounded-2xl border flex items-start gap-3 ${
            dailyWorkStats.workloadStatus === 'optimal'
              ? 'bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-300'
              : dailyWorkStats.workloadStatus === 'heavy'
              ? 'bg-amber-50/70 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-300'
              : dailyWorkStats.workloadStatus === 'overloaded'
              ? 'bg-rose-50/70 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-300'
              : 'bg-indigo-50/70 dark:bg-indigo-950/40 border-indigo-300 dark:border-indigo-800 text-indigo-900 dark:text-indigo-300'
          }`}
        >
          <div className="p-1 rounded-lg bg-white/80 dark:bg-slate-900/80 shrink-0">
            {dailyWorkStats.workloadStatus === 'overloaded' ? (
              <AlertTriangle className="w-5 h-5 text-rose-600" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm">{dailyWorkStats.statusLabel}</span>
              <span className="text-xs font-semibold opacity-80">
                ({selectedDay} Summary)
              </span>
            </div>
            <p className="text-xs mt-0.5 opacity-90">{dailyWorkStats.statusMessage}</p>
          </div>
        </div>

        {/* Visual 24-Hour Day Timeline Strip */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
            <span>24-Hour Visual Schedule Timeline ({selectedDay})</span>
            <div className="flex items-center gap-3 text-[11px]">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-xs bg-indigo-600 inline-block" /> Teaching / Class
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-xs bg-amber-400 inline-block" /> Daytime Break
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-xs bg-slate-200 dark:bg-slate-700 inline-block" /> Off-Duty / Rest
              </span>
            </div>
          </div>

          {/* Timeline Bar (00:00 to 24:00) */}
          <div className="relative w-full h-8 bg-slate-100 dark:bg-slate-800 rounded-xl overflow-hidden flex border border-slate-200 dark:border-slate-700">
            {/* Hour tick marks */}
            <div className="absolute inset-0 grid grid-cols-24 pointer-events-none opacity-20">
              {Array.from({ length: 24 }).map((_, i) => (
                <div key={i} className="border-r border-slate-900 dark:border-white h-full" />
              ))}
            </div>

            {/* Teaching Blocks */}
            {dailyWorkStats.classList.map((cls) => {
              const [startH, startM] = cls.startTime.split(':').map(Number);
              const [endH, endM] = cls.endTime.split(':').map(Number);
              const startTotalMins = startH * 60 + startM;
              const durationMins = (endH * 60 + endM) - startTotalMins;

              const leftPercent = (startTotalMins / 1440) * 100;
              const widthPercent = (durationMins / 1440) * 100;

              return (
                <div
                  key={cls.id}
                  className="absolute top-1 bottom-1 rounded-md text-[9px] font-bold text-white flex items-center justify-center overflow-hidden px-1 shadow-xs transition hover:brightness-110 cursor-pointer"
                  style={{
                    left: `${leftPercent}%`,
                    width: `${Math.max(1.5, widthPercent)}%`,
                    backgroundColor: cls.color || '#4f46e5',
                  }}
                  title={`${cls.title}: ${cls.startTime} - ${cls.endTime} (${cls.durationMinutes} mins)`}
                >
                  <span className="truncate">{cls.title}</span>
                </div>
              );
            })}
          </div>

          {/* Time axis labels */}
          <div className="flex justify-between text-[10px] text-slate-400 font-semibold px-1">
            <span>00:00 (Midnight)</span>
            <span>06:00 (Morning)</span>
            <span>12:00 (Noon)</span>
            <span>18:00 (Evening)</span>
            <span>24:00</span>
          </div>
        </div>

        {/* List of Class Sessions & Gaps for Selected Day */}
        <div className="space-y-2 pt-2">
          <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
            Scheduled Sessions & Break Schedule for {selectedDay}
          </h3>

          {dailyWorkStats.classList.length === 0 ? (
            <div className="p-6 text-center rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-slate-500 text-xs">
              No teaching sessions scheduled on {selectedDay}. Entire day is free for rest and preparation!
            </div>
          ) : (
            <div className="space-y-2">
              {dailyWorkStats.classList.map((cls, idx) => {
                // Gap after this class
                const nextClass = dailyWorkStats.classList[idx + 1];
                let gapAfterMinutes = 0;
                if (nextClass) {
                  const [curEndH, curEndM] = cls.endTime.split(':').map(Number);
                  const [nextStartH, nextStartM] = nextClass.startTime.split(':').map(Number);
                  gapAfterMinutes = (nextStartH * 60 + nextStartM) - (curEndH * 60 + curEndM);
                }

                return (
                  <React.Fragment key={cls.id}>
                    <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/50 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-2.5 h-10 rounded-full shrink-0"
                          style={{ backgroundColor: cls.color || '#3b82f6' }}
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-900 dark:text-white">
                              {cls.title}
                            </span>
                            <span
                              className={`px-1.5 py-0.2 text-[10px] font-bold rounded-md ${
                                cls.type === 'college'
                                  ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300'
                                  : 'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300'
                              }`}
                            >
                              {cls.type === 'college' ? 'College' : 'Tuition'}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            {formatTime(cls.startTime, settings.timeFormat)} –{' '}
                            {formatTime(cls.endTime, settings.timeFormat)} ({cls.durationMinutes} mins)
                          </p>
                        </div>
                      </div>

                      <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-700 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-600">
                        {cls.durationMinutes}m teaching
                      </span>
                    </div>

                    {/* Gap Card */}
                    {gapAfterMinutes > 0 && (
                      <div className="mx-6 py-1.5 px-3 rounded-lg bg-amber-50/50 dark:bg-amber-950/20 border border-dashed border-amber-300 dark:border-amber-800/50 text-[11px] text-amber-800 dark:text-amber-300 flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <Coffee className="w-3.5 h-3.5 text-amber-600" />
                          <span>
                            Break / Rest Gap: <strong>{gapAfterMinutes} mins</strong> ({+(gapAfterMinutes / 60).toFixed(1)} hrs)
                          </span>
                        </div>
                        <span className="text-[10px] text-amber-700 dark:text-amber-400">
                          {cls.endTime} → {nextClass.startTime}
                        </span>
                      </div>
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* --- MODULE 3: INTERACTIVE "WHAT-IF" EARNINGS & WORKLOAD SIMULATOR --- */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              <span>Interactive "What-If" Teaching Income Simulator</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Experiment with rates, work hours, or additional students to project your hourly, daily, weekly, monthly, and yearly income.
            </p>
          </div>

          {/* Mode Switcher */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => {
                if (students.length > 0) {
                  const avgFee = students.reduce((sum, s) => sum + s.feeAmount, 0) / students.length;
                  setSimMonthlyPerStudent(Math.round(avgFee));
                  setSimStudentsCount(students.length);
                }
                if (institutions.length > 0) {
                  const avgSalary =
                    institutions.reduce((sum, i) => {
                      if (i.paymentStructure === 'semester') {
                        return sum + Math.round(i.rateAmount / (i.semesterDurationMonths || 6));
                      }
                      return sum + i.rateAmount;
                    }, 0) / institutions.length;
                  setSimCollegeSalary(Math.round(avgSalary));
                }
              }}
              className="px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition"
              title="Populate simulator sliders with real student count, average tuition fees, and college salary"
            >
              Sync Real Rates
            </button>
            <div className="flex items-center rounded-xl bg-slate-100 dark:bg-slate-800 p-1">
              <button
                onClick={() => setCalculatorMode('hourly')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                  calculatorMode === 'hourly'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Hourly Rate Model
              </button>
              <button
                onClick={() => setCalculatorMode('student_college')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                  calculatorMode === 'student_college'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Student + College Model
              </button>
            </div>
          </div>
        </div>

        {/* Simulator Controls & Output Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Controls Column */}
          <div className="lg:col-span-5 space-y-4 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
            <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Simulation Inputs
            </h3>

            {calculatorMode === 'hourly' ? (
              <>
                {/* Hourly Rate Slider */}
                <div>
                  <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    <span>Hourly Rate (Rs.)</span>
                    <span className="text-indigo-600 dark:text-indigo-400 font-bold">
                      {formatCurrency(simHourlyRate, settings.currency)} / hr
                    </span>
                  </div>
                  <input
                    type="range"
                    min={300}
                    max={5000}
                    step={100}
                    value={simHourlyRate ?? 1000}
                    onChange={(e) => setSimHourlyRate(Number(e.target.value))}
                    className="w-full accent-indigo-600"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>Rs. 300</span>
                    <span>Rs. 2,500</span>
                    <span>Rs. 5,000</span>
                  </div>
                </div>

                {/* Teaching Hours / Day Slider */}
                <div>
                  <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    <span>Daily Teaching Hours</span>
                    <span className="text-indigo-600 dark:text-indigo-400 font-bold">
                      {simHoursPerDay} hrs / day
                    </span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={10}
                    step={0.5}
                    value={simHoursPerDay ?? 3}
                    onChange={(e) => setSimHoursPerDay(Number(e.target.value))}
                    className="w-full accent-indigo-600"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>1 hr</span>
                    <span>5 hrs</span>
                    <span>10 hrs</span>
                  </div>
                </div>

                {/* Days Per Week Slider */}
                <div>
                  <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    <span>Teaching Days / Week</span>
                    <span className="text-indigo-600 dark:text-indigo-400 font-bold">
                      {simDaysPerWeek} days / week
                    </span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={7}
                    step={1}
                    value={simDaysPerWeek ?? 6}
                    onChange={(e) => setSimDaysPerWeek(Number(e.target.value))}
                    className="w-full accent-indigo-600"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>1 day</span>
                    <span>5 days</span>
                    <span>7 days</span>
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Students Count */}
                <div>
                  <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    <span>Active Tuition Students</span>
                    <span className="text-teal-600 dark:text-teal-400 font-bold">
                      {simStudentsCount} students
                    </span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={15}
                    step={1}
                    value={simStudentsCount ?? 4}
                    onChange={(e) => setSimStudentsCount(Number(e.target.value))}
                    className="w-full accent-teal-600"
                  />
                </div>

                {/* Fee Per Student */}
                <div>
                  <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    <span>Avg. Monthly Fee per Student</span>
                    <span className="text-teal-600 dark:text-teal-400 font-bold">
                      {formatCurrency(simMonthlyPerStudent, settings.currency)} / mo
                    </span>
                  </div>
                  <input
                    type="range"
                    min={4000}
                    max={30000}
                    step={1000}
                    value={simMonthlyPerStudent ?? 8000}
                    onChange={(e) => setSimMonthlyPerStudent(Number(e.target.value))}
                    className="w-full accent-teal-600"
                  />
                </div>

                {/* College Fixed Salary */}
                <div>
                  <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    <span>Fixed College / Campus Salary</span>
                    <span className="text-purple-600 dark:text-purple-400 font-bold">
                      {formatCurrency(simCollegeSalary, settings.currency)} / mo
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={120000}
                    step={2500}
                    value={simCollegeSalary ?? 35000}
                    onChange={(e) => setSimCollegeSalary(Number(e.target.value))}
                    className="w-full accent-purple-600"
                  />
                </div>
              </>
            )}
          </div>

          {/* Simulated Results Display */}
          <div className="lg:col-span-7 space-y-4">
            <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Projected Earnings & Workload Outputs
            </h3>

            {/* Results Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {/* Monthly */}
              <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60">
                <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 uppercase">
                  Projected Monthly
                </span>
                <p className="text-xl font-black text-slate-900 dark:text-white mt-1">
                  {formatCurrency(simulatedOutput.monthly, settings.currency)}
                </p>
                <span className="text-[10px] text-slate-500">per month</span>
              </div>

              {/* Weekly */}
              <div className="p-3.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60">
                <span className="text-[10px] font-bold text-blue-700 dark:text-blue-300 uppercase">
                  Projected Weekly
                </span>
                <p className="text-xl font-black text-slate-900 dark:text-white mt-1">
                  {formatCurrency(simulatedOutput.weekly, settings.currency)}
                </p>
                <span className="text-[10px] text-slate-500">per week</span>
              </div>

              {/* Daily */}
              <div className="p-3.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/60">
                <span className="text-[10px] font-bold text-purple-700 dark:text-purple-300 uppercase">
                  Projected Daily
                </span>
                <p className="text-xl font-black text-slate-900 dark:text-white mt-1">
                  {formatCurrency(simulatedOutput.daily, settings.currency)}
                </p>
                <span className="text-[10px] text-slate-500">per working day</span>
              </div>

              {/* Hourly */}
              <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60">
                <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300 uppercase">
                  Effective Hourly
                </span>
                <p className="text-xl font-black text-slate-900 dark:text-white mt-1">
                  {formatCurrency(simulatedOutput.hourly, settings.currency)}
                </p>
                <span className="text-[10px] text-slate-500">per active hour</span>
              </div>

              {/* Yearly */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 col-span-2">
                <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase">
                  Annualized Teaching Revenue
                </span>
                <p className="text-xl font-black text-indigo-600 dark:text-indigo-400 mt-1">
                  {formatCurrency(simulatedOutput.yearly, settings.currency)}
                </p>
                <span className="text-[10px] text-slate-500">
                  {simulatedOutput.weeklyHours} hrs/week workload • {simulatedOutput.restHoursPerDay} hrs rest/day
                </span>
              </div>
            </div>

            {/* Quick Insights Box */}
            <div className="p-3.5 rounded-xl bg-slate-100/70 dark:bg-slate-800/60 text-xs text-slate-600 dark:text-slate-300 flex items-start gap-2.5">
              <Info className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-900 dark:text-white">Simulator Insight:</strong> At{' '}
                <strong>{formatCurrency(simulatedOutput.hourly, settings.currency)}/hr</strong>, working{' '}
                <strong>{simulatedOutput.workHoursPerDay} hrs/day</strong> leaves you with{' '}
                <strong>{simulatedOutput.restHoursPerDay} hrs of daily personal/rest time</strong> and generates{' '}
                <strong>{formatCurrency(simulatedOutput.monthly, settings.currency)}/month</strong>.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* --- MODULE 4: CLASS & COLLEGE TENURE / START DATES DIRECTORY --- */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-indigo-600" />
              <span>Teaching Classes & Start Date Tracker</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              When each college or tuition batch was started and duration elapsed since inception.
            </p>
          </div>
          <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
            {classesWithTenure.length} active classes
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {classesWithTenure.map((cls) => {
            const isCollege = cls.type === 'college';
            return (
              <div
                key={cls.id}
                className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: cls.color || '#3b82f6' }}
                    />
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                      {cls.title}
                    </h3>
                  </div>
                  <span
                    className={`px-2 py-0.5 text-[10px] font-bold rounded-md ${
                      isCollege
                        ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300'
                        : 'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300'
                    }`}
                  >
                    {isCollege ? 'College' : 'Tuition'}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Subject:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{cls.subject}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Started On:</span>
                    <span className="font-bold text-indigo-600 dark:text-indigo-400">
                      {formatDisplayDate(cls.effectiveStartDate, settings.calendarMode)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Tenure:</span>
                    <span className="px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-[11px] font-semibold">
                      {cls.tenureText}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-slate-200 dark:border-slate-700 text-[11px]">
                    <span className="text-slate-500">Rate / Fee:</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {formatCurrency(cls.feeAmount, settings.currency)} / {cls.feeStructure.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
