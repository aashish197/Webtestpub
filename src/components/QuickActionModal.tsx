import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  X,
  Users,
  CreditCard,
  GraduationCap,
  Building2,
  UserCheck,
  Award,
  Plus,
  CheckCircle,
  Calendar,
  Clock,
  MapPin,
  Phone,
  Mail,
  DollarSign,
  BookOpen,
  CalendarDays,
  Sliders,
  CalendarCheck,
  Trash2,
  Sparkles,
} from 'lucide-react';
import {
  TuitionType,
  FeeStructureType,
  PaymentMethod,
  DayOfWeek,
  AttendanceStatus,
  TestType,
  AssignmentStatus,
  ClassScheduleType,
  CollegeScheduleType,
  DayWiseClassSchedule,
  DateSpecificClassSchedule,
} from '../types';
import { getTodayIso, formatDisplayDate, getDayOfWeek } from '../utils/nepaliCalendar';
import { calculateGrade, formatTime } from '../utils/formatters';
import {
  calculateEndTime,
  calculateDurationMinutes,
  resolveClassSchedule,
} from '../utils/scheduleHelpers';

const DAYS_OF_WEEK: DayOfWeek[] = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

const DEFAULT_DAY_WISE_CLASS_SCHEDULES: Record<DayOfWeek, DayWiseClassSchedule> = {
  Sunday: { day: 'Sunday', isActive: true, startTime: '06:30', endTime: '07:30', durationMinutes: 60 },
  Monday: { day: 'Monday', isActive: true, startTime: '06:30', endTime: '07:30', durationMinutes: 60 },
  Tuesday: { day: 'Tuesday', isActive: true, startTime: '06:30', endTime: '07:30', durationMinutes: 60 },
  Wednesday: { day: 'Wednesday', isActive: true, startTime: '06:30', endTime: '07:30', durationMinutes: 60 },
  Thursday: { day: 'Thursday', isActive: true, startTime: '06:30', endTime: '07:30', durationMinutes: 60 },
  Friday: { day: 'Friday', isActive: true, startTime: '06:30', endTime: '07:30', durationMinutes: 60 },
  Saturday: { day: 'Saturday', isActive: false, startTime: '06:30', endTime: '07:30', durationMinutes: 60 },
};

const DEFAULT_DAY_WISE_COLLEGE_PERIODS: Record<DayOfWeek, number> = {
  Sunday: 2,
  Monday: 2,
  Tuesday: 2,
  Wednesday: 2,
  Thursday: 2,
  Friday: 2,
  Saturday: 0,
};

const COLOR_OPTIONS = [
  '#4F46E5', // Indigo
  '#2563EB', // Blue
  '#0D9488', // Teal
  '#059669', // Emerald
  '#D97706', // Amber
  '#DC2626', // Red
  '#7C3AED', // Violet
  '#DB2777', // Pink
];

export const QuickActionModal: React.FC = () => {
  const {
    isQuickActionOpen,
    quickActionType,
    closeQuickAction,
    students,
    institutions,
    classes,
    addStudent,
    recordPayment,
    addClass,
    addInstitution,
    markAttendance,
    addPerformance,
    settings,
  } = useApp();

  // Active Tab inside modal (defaulting to quickActionType or 'student')
  const [activeType, setActiveType] = useState<string>('student');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (quickActionType) {
      setActiveType(quickActionType);
    } else {
      setActiveType('student');
    }
    setSuccessMessage(null);
  }, [quickActionType, isQuickActionOpen]);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isQuickActionOpen) {
        closeQuickAction();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isQuickActionOpen, closeQuickAction]);

  // 1. Student Form State
  const [studentData, setStudentData] = useState({
    name: '',
    grade: 'Grade 10',
    schoolOrCollege: '',
    contactNumber: '',
    email: '',
    parentName: '',
    parentPhone: '',
    parentContact: '',
    address: '',
    subjects: 'Mathematics',
    tuitionType: 'individual' as TuitionType,
    groupName: '',
    startDate: getTodayIso(),
    classFrequency: '6 days/week',
    classDurationMinutes: 60,
    feeStructure: 'monthly' as FeeStructureType,
    feeAmount: 5000,
    paymentMethod: 'Cash' as PaymentMethod,
    paymentDueDay: 1,
    notes: '',
    status: 'active' as const,
  });

  // 2. Payment Form State
  const [paymentData, setPaymentData] = useState({
    type: 'tuition' as 'tuition' | 'college_salary',
    targetId: '',
    periodMonthYear: '',
    amountDue: 5000,
    amountPaid: 5000,
    paymentDate: getTodayIso(),
    dueDate: getTodayIso(),
    paymentMethod: 'eSewa' as PaymentMethod,
    referenceNote: '',
    receiptNumber: '',
  });

  // 3. Class Form State
  const [classData, setClassData] = useState({
    title: '',
    type: 'home_tuition' as 'home_tuition' | 'college',
    studentId: '',
    institutionId: '',
    subject: 'Mathematics',
    location: '',
    feeStructure: 'monthly' as FeeStructureType,
    feeAmount: 5000,
    durationMinutes: 60,
    scheduleDays: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'] as DayOfWeek[],
    startTime: '06:30',
    endTime: '07:30',
    color: '#4F46E5',
    startDate: getTodayIso(),
    notes: '',
    isActive: true,
    scheduleType: 'uniform' as ClassScheduleType,
    dayWiseSchedules: { ...DEFAULT_DAY_WISE_CLASS_SCHEDULES },
    dateSpecificSchedules: [] as DateSpecificClassSchedule[],
  });

  // State for adding a date-specific override in Class form
  const [showDateOverrides, setShowDateOverrides] = useState(false);
  const [newOverrideDate, setNewOverrideDate] = useState(getTodayIso());
  const [newOverrideStartTime, setNewOverrideStartTime] = useState('07:00');
  const [newOverrideEndTime, setNewOverrideEndTime] = useState('08:30');
  const [newOverrideNote, setNewOverrideNote] = useState('');

  // 4. Institution Form State
  const [institutionData, setInstitutionData] = useState({
    name: '',
    facultyOrGrade: '+2 Science',
    subjects: 'Physics',
    section: 'Sec A',
    numberOfPeriods: 2,
    periodDurationMinutes: 45,
    workingDays: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'] as DayOfWeek[],
    paymentStructure: 'per_period' as FeeStructureType,
    rateAmount: 850,
    extraClassRate: 1000,
    startDate: getTodayIso(),
    contactPerson: '',
    contactNumber: '',
    notes: '',
    status: 'active' as const,
    scheduleType: 'uniform' as CollegeScheduleType,
    dayWisePeriods: { ...DEFAULT_DAY_WISE_COLLEGE_PERIODS },
  });

  // 5. Attendance Form State
  const [attendanceData, setAttendanceData] = useState({
    date: getTodayIso(),
    classId: '',
    status: 'present' as AttendanceStatus,
    topicsCovered: '',
    notes: '',
  });

  // 6. Performance Form State
  const [performanceData, setPerformanceData] = useState({
    studentId: '',
    subject: 'Mathematics',
    date: getTodayIso(),
    testName: 'Unit Test 1',
    testType: 'unit_test' as TestType,
    fullMarks: 50,
    obtainedMarks: 42,
    assignmentStatus: 'completed' as AssignmentStatus,
    teacherRemarks: '',
  });

  if (!isQuickActionOpen) return null;

  const showSuccessFeedback = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => {
      setSuccessMessage(null);
      closeQuickAction();
    }, 1200);
  };

  // Submit Handlers
  const handleStudentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentData.name.trim()) return;

    const subjectsArr = studentData.subjects
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    addStudent({
      name: studentData.name.trim(),
      grade: studentData.grade,
      schoolOrCollege: studentData.schoolOrCollege,
      contactNumber: studentData.contactNumber,
      email: studentData.email,
      parentName: studentData.parentName || 'Parent',
      parentPhone: studentData.parentPhone || studentData.contactNumber,
      parentContact: studentData.parentPhone || studentData.contactNumber,
      address: studentData.address,
      subjects: subjectsArr.length > 0 ? subjectsArr : ['General'],
      tuitionType: studentData.tuitionType,
      groupName: studentData.tuitionType === 'group' ? studentData.groupName : undefined,
      startDate: studentData.startDate || getTodayIso(),
      classFrequency: studentData.classFrequency,
      classDurationMinutes: Number(studentData.classDurationMinutes) || 60,
      feeStructure: studentData.feeStructure,
      feeAmount: Number(studentData.feeAmount) || 0,
      paymentMethod: studentData.paymentMethod,
      paymentDueDay: Number(studentData.paymentDueDay) || 1,
      notes: studentData.notes,
      status: 'active',
    });

    showSuccessFeedback(`Student "${studentData.name}" added successfully!`);
  };

  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let targetName = 'Student Payment';
    let studentId: string | undefined = undefined;
    let institutionId: string | undefined = undefined;

    if (paymentData.type === 'tuition') {
      const selectedStudent = students.find((s) => s.id === paymentData.targetId);
      if (selectedStudent) {
        targetName = selectedStudent.name;
        studentId = selectedStudent.id;
      }
    } else {
      const selectedInst = institutions.find((i) => i.id === paymentData.targetId);
      if (selectedInst) {
        targetName = selectedInst.name;
        institutionId = selectedInst.id;
      }
    }

    recordPayment({
      type: paymentData.type === 'tuition' ? 'tuition' : 'college_salary',
      studentId,
      institutionId,
      targetName,
      periodMonthYear: paymentData.periodMonthYear || formatDisplayDate(paymentData.paymentDate, settings.dateSystem, 'short'),
      amountDue: Number(paymentData.amountDue) || 0,
      amountPaid: Number(paymentData.amountPaid) || 0,
      remainingBalance: Math.max(0, (Number(paymentData.amountDue) || 0) - (Number(paymentData.amountPaid) || 0)),
      paymentDate: paymentData.paymentDate,
      dueDate: paymentData.dueDate || paymentData.paymentDate,
      paymentMethod: paymentData.paymentMethod,
      status: Number(paymentData.amountPaid) >= Number(paymentData.amountDue) ? 'paid' : 'partially_paid',
      referenceNote: paymentData.referenceNote,
      receiptNumber: paymentData.receiptNumber || `REC-${Date.now().toString().slice(-4)}`,
    });

    showSuccessFeedback(`Payment of ${settings.currency} ${paymentData.amountPaid} recorded!`);
  };

  const handleClassSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!classData.title.trim()) return;

    let activeDays = classData.scheduleDays;
    let defStart = classData.startTime;
    let defEnd = classData.endTime;
    let defDur = Number(classData.durationMinutes) || 60;

    if (classData.scheduleType === 'day_wise') {
      activeDays = DAYS_OF_WEEK.filter((d) => classData.dayWiseSchedules[d]?.isActive);
      if (activeDays.length === 0) {
        activeDays = ['Sunday'];
      }
      const firstActiveDay = activeDays[0];
      const activeSched = classData.dayWiseSchedules[firstActiveDay];
      if (activeSched) {
        defStart = activeSched.startTime;
        defEnd = activeSched.endTime;
        defDur = activeSched.durationMinutes;
      }
    }

    addClass({
      title: classData.title.trim(),
      type: classData.type,
      studentId: classData.type === 'home_tuition' ? classData.studentId : undefined,
      institutionId: classData.type === 'college' ? classData.institutionId : undefined,
      subject: classData.subject,
      location: classData.location || (classData.type === 'home_tuition' ? "Student's Home" : 'Campus'),
      feeStructure: classData.feeStructure,
      feeAmount: Number(classData.feeAmount) || 0,
      durationMinutes: defDur,
      scheduleDays: activeDays,
      startTime: defStart,
      endTime: defEnd,
      color: classData.color,
      startDate: classData.startDate,
      notes: classData.notes,
      isActive: true,
      scheduleType: classData.scheduleType,
      dayWiseSchedules: classData.dayWiseSchedules,
      dateSpecificSchedules: classData.dateSpecificSchedules,
    });

    showSuccessFeedback(`Class "${classData.title}" created successfully!`);
  };

  const handleInstitutionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!institutionData.name.trim()) return;

    const subjectsArr = institutionData.subjects
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    let activeWorkingDays = institutionData.workingDays;
    let totalPeriods = Number(institutionData.numberOfPeriods) || 1;

    if (institutionData.scheduleType === 'day_wise') {
      activeWorkingDays = DAYS_OF_WEEK.filter((d) => (institutionData.dayWisePeriods[d] || 0) > 0);
      if (activeWorkingDays.length === 0) {
        activeWorkingDays = ['Sunday'];
      }
      const activeCounts = activeWorkingDays.map((d) => institutionData.dayWisePeriods[d] || 0);
      totalPeriods = Math.max(1, Math.round(activeCounts.reduce((a, b) => a + b, 0) / (activeWorkingDays.length || 1)));
    }

    addInstitution({
      name: institutionData.name.trim(),
      facultyOrGrade: institutionData.facultyOrGrade,
      subjects: subjectsArr.length > 0 ? subjectsArr : ['General'],
      section: institutionData.section,
      numberOfPeriods: totalPeriods,
      periodDurationMinutes: Number(institutionData.periodDurationMinutes) || 45,
      workingDays: activeWorkingDays,
      paymentStructure: institutionData.paymentStructure,
      rateAmount: Number(institutionData.rateAmount) || 0,
      extraClassRate: Number(institutionData.extraClassRate) || 0,
      startDate: institutionData.startDate,
      contactPerson: institutionData.contactPerson,
      contactNumber: institutionData.contactNumber,
      notes: institutionData.notes,
      status: 'active',
      scheduleType: institutionData.scheduleType,
      dayWisePeriods: institutionData.dayWisePeriods,
    });

    showSuccessFeedback(`Institution "${institutionData.name}" added successfully!`);
  };

  const handleAttendanceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const selectedClass = classes.find((c) => c.id === attendanceData.classId);
    if (!selectedClass) return;

    let targetName = selectedClass.title;
    if (selectedClass.type === 'home_tuition') {
      const st = students.find((s) => s.id === selectedClass.studentId);
      if (st) targetName = st.name;
    } else if (selectedClass.type === 'college') {
      const inst = institutions.find((i) => i.id === selectedClass.institutionId);
      if (inst) targetName = inst.name;
    }

    const dayOfWeek = getDayOfWeek(attendanceData.date);
    const resolved = resolveClassSchedule(selectedClass, dayOfWeek, attendanceData.date);

    markAttendance({
      date: attendanceData.date,
      classId: selectedClass.id,
      type: selectedClass.type,
      studentId: selectedClass.studentId,
      institutionId: selectedClass.institutionId,
      targetName,
      subject: selectedClass.subject,
      startTime: resolved.startTime,
      endTime: resolved.endTime,
      durationMinutes: resolved.durationMinutes,
      periodsCount: selectedClass.type === 'college' ? 1 : undefined,
      status: attendanceData.status,
      topicsCovered: attendanceData.topicsCovered,
      notes: attendanceData.notes,
    });

    showSuccessFeedback(`Attendance marked as ${attendanceData.status.toUpperCase()}!`);
  };

  const handlePerformanceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const student = students.find((s) => s.id === performanceData.studentId);
    if (!student) return;

    const fullMarks = Number(performanceData.fullMarks) || 100;
    const obtainedMarks = Number(performanceData.obtainedMarks) || 0;
    const percentage = fullMarks > 0 ? Number(((obtainedMarks / fullMarks) * 100).toFixed(2)) : 0;
    const { grade } = calculateGrade(percentage);

    addPerformance({
      studentId: student.id,
      studentName: student.name,
      subject: performanceData.subject,
      date: performanceData.date,
      testName: performanceData.testName,
      testType: performanceData.testType,
      fullMarks,
      obtainedMarks,
      assignmentStatus: performanceData.assignmentStatus,
      teacherRemarks: performanceData.teacherRemarks,
    });

    showSuccessFeedback(`Test score for "${student.name}" recorded (${percentage}% - Grade ${grade})!`);
  };

  const quickActionTabs = [
    { id: 'student', label: 'Student', icon: Users },
    { id: 'payment', label: 'Payment', icon: CreditCard },
    { id: 'class', label: 'Class / Batch', icon: GraduationCap },
    { id: 'institution', label: 'Institution', icon: Building2 },
    { id: 'attendance', label: 'Attendance', icon: UserCheck },
    { id: 'performance', label: 'Marks / Exam', icon: Award },
  ];

  return (
    <div
      id="quick-action-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto animate-fade-in"
      onClick={closeQuickAction}
    >
      <div
        id="quick-action-modal-card"
        className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-auto max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-600 text-white shadow-xs">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Quick Add & Record</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Instantly create or log entries across your classes
              </p>
            </div>
          </div>
          <button
            id="btn-close-quick-action"
            onClick={closeQuickAction}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-700/50 transition"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="px-5 pt-3 pb-2 border-b border-slate-100 dark:border-slate-800 flex items-center gap-1.5 overflow-x-auto scrollbar-none bg-slate-50/40 dark:bg-slate-900">
          {quickActionTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeType === tab.id;
            return (
              <button
                key={tab.id}
                id={`btn-quick-tab-${tab.id}`}
                onClick={() => {
                  setActiveType(tab.id);
                  setSuccessMessage(null);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Success Alert Banner */}
        {successMessage && (
          <div className="m-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 flex items-center gap-2.5 text-xs font-medium animate-pulse">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Body Forms */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          {/* TAB 1: ADD STUDENT */}
          {activeType === 'student' && (
            <form onSubmit={handleStudentSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Student Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Aarav Sharma"
                    value={studentData.name}
                    onChange={(e) => setStudentData({ ...studentData, name: e.target.value })}
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Grade / Level *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Grade 10, +2 Science, BIM"
                    value={studentData.grade}
                    onChange={(e) => setStudentData({ ...studentData, grade: e.target.value })}
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Subjects (comma separated)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Mathematics, Physics"
                    value={studentData.subjects}
                    onChange={(e) => setStudentData({ ...studentData, subjects: e.target.value })}
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Tuition Batch Type
                  </label>
                  <select
                    value={studentData.tuitionType}
                    onChange={(e) =>
                      setStudentData({ ...studentData, tuitionType: e.target.value as TuitionType })
                    }
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
                  >
                    <option value="individual">1-on-1 Individual Home Tuition</option>
                    <option value="group">Group Batch / Coaching Center</option>
                  </select>
                </div>

                {studentData.tuitionType === 'group' && (
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Group / Batch Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Morning Batch A (KMC)"
                      value={studentData.groupName}
                      onChange={(e) => setStudentData({ ...studentData, groupName: e.target.value })}
                      className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Monthly / Class Fee ({settings.currency})
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 5000"
                    value={studentData.feeAmount}
                    onChange={(e) =>
                      setStudentData({ ...studentData, feeAmount: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Payment Structure
                  </label>
                  <select
                    value={studentData.feeStructure}
                    onChange={(e) =>
                      setStudentData({ ...studentData, feeStructure: e.target.value as FeeStructureType })
                    }
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
                  >
                    <option value="monthly">Monthly Fee</option>
                    <option value="per_class">Per Class Session</option>
                    <option value="hourly">Hourly Rate</option>
                    <option value="custom">Custom Package</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Student / Parent Contact No.
                  </label>
                  <input
                    type="tel"
                    placeholder="e.g. 9841234567"
                    value={studentData.contactNumber}
                    onChange={(e) => setStudentData({ ...studentData, contactNumber: e.target.value })}
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Class Start Date ({settings.dateSystem})
                  </label>
                  <input
                    type="date"
                    value={studentData.startDate}
                    onChange={(e) => setStudentData({ ...studentData, startDate: e.target.value })}
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    School / College
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. St. Xavier's / Budhanilkantha"
                    value={studentData.schoolOrCollege}
                    onChange={(e) =>
                      setStudentData({ ...studentData, schoolOrCollege: e.target.value })
                    }
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Home / Area Address
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Baneshwor, Kathmandu"
                    value={studentData.address}
                    onChange={(e) => setStudentData({ ...studentData, address: e.target.value })}
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={closeQuickAction}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs shadow-indigo-600/30 transition active:scale-95 flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Save Student</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: RECORD PAYMENT */}
          {activeType === 'payment' && (
            <form onSubmit={handlePaymentSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Payment Category
                  </label>
                  <select
                    value={paymentData.type}
                    onChange={(e) =>
                      setPaymentData({
                        ...paymentData,
                        type: e.target.value as any,
                        targetId: '',
                      })
                    }
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
                  >
                    <option value="tuition">Student Tuition Fee</option>
                    <option value="college_salary">College / Institution Salary</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {paymentData.type === 'tuition' ? 'Select Student *' : 'Select Institution *'}
                  </label>
                  {paymentData.type === 'tuition' ? (
                    <select
                      required
                      value={paymentData.targetId}
                      onChange={(e) => {
                        const st = students.find((s) => s.id === e.target.value);
                        const fee = st
                          ? st.feeStructure === 'hourly'
                            ? Math.round(((st.classDurationMinutes || 60) / 60) * st.feeAmount)
                            : st.feeAmount
                          : paymentData.amountDue;
                        setPaymentData({
                          ...paymentData,
                          targetId: e.target.value,
                          amountDue: fee,
                          amountPaid: fee,
                          referenceNote: st && st.feeStructure === 'hourly'
                            ? `Tuition fee (${st.classDurationMinutes || 60}m @ ${st.feeAmount}/hr)`
                            : paymentData.referenceNote,
                        });
                      }}
                      className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
                    >
                      <option value="">-- Choose Student --</option>
                      {students.map((s) => {
                        const sessionFee = s.feeStructure === 'hourly'
                          ? Math.round(((s.classDurationMinutes || 60) / 60) * s.feeAmount)
                          : s.feeAmount;
                        return (
                          <option key={s.id} value={s.id}>
                            {s.name} ({s.grade}) - {settings.currency} {sessionFee}
                            {s.feeStructure === 'hourly' ? ` (${s.classDurationMinutes || 60}m @ ${s.feeAmount}/hr)` : ''}
                          </option>
                        );
                      })}
                    </select>
                  ) : (
                    <select
                      required
                      value={paymentData.targetId}
                      onChange={(e) => {
                        const inst = institutions.find((i) => i.id === e.target.value);
                        const fee = inst
                          ? inst.paymentStructure === 'hourly'
                            ? Math.round(((inst.periodDurationMinutes || 60) / 60) * inst.rateAmount)
                            : inst.rateAmount
                          : paymentData.amountDue;
                        setPaymentData({
                          ...paymentData,
                          targetId: e.target.value,
                          amountDue: fee,
                          amountPaid: fee,
                          referenceNote: inst && inst.paymentStructure === 'hourly'
                            ? `College salary (${inst.periodDurationMinutes || 60}m @ ${inst.rateAmount}/hr)`
                            : paymentData.referenceNote,
                        });
                      }}
                      className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
                    >
                      <option value="">-- Choose Institution --</option>
                      {institutions.map((i) => (
                        <option key={i.id} value={i.id}>
                          {i.name} ({i.facultyOrGrade})
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Amount Received ({settings.currency}) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    placeholder="e.g. 5000"
                    value={paymentData.amountPaid}
                    onChange={(e) =>
                      setPaymentData({ ...paymentData, amountPaid: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none font-bold text-emerald-600 dark:text-emerald-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Total Due / Bill Amount ({settings.currency})
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 5000"
                    value={paymentData.amountDue}
                    onChange={(e) =>
                      setPaymentData({ ...paymentData, amountDue: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Payment Method
                  </label>
                  <select
                    value={paymentData.paymentMethod}
                    onChange={(e) =>
                      setPaymentData({ ...paymentData, paymentMethod: e.target.value as PaymentMethod })
                    }
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
                  >
                    <option value="eSewa">eSewa Wallet</option>
                    <option value="Khalti">Khalti</option>
                    <option value="Bank Transfer">Bank Mobile Transfer</option>
                    <option value="Cash">Cash in Hand</option>
                    <option value="PhonePe/UPI">PhonePe / UPI / QR</option>
                    <option value="Cheque">Cheque</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Payment Date
                  </label>
                  <input
                    type="date"
                    required
                    value={paymentData.paymentDate}
                    onChange={(e) => setPaymentData({ ...paymentData, paymentDate: e.target.value })}
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    For Month / Period Label
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Bhadra 2083 or Aug 2026"
                    value={paymentData.periodMonthYear}
                    onChange={(e) =>
                      setPaymentData({ ...paymentData, periodMonthYear: e.target.value })
                    }
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Receipt / Transaction Ref
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. TXN-94821 or Cash receipt"
                    value={paymentData.referenceNote}
                    onChange={(e) =>
                      setPaymentData({ ...paymentData, referenceNote: e.target.value })
                    }
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={closeQuickAction}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs shadow-emerald-600/30 transition active:scale-95 flex items-center gap-1.5"
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>Record Payment</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: ADD CLASS / BATCH */}
          {activeType === 'class' && (
            <form onSubmit={handleClassSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Class Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Grade 10 Opt Math or KMC Physics"
                    value={classData.title}
                    onChange={(e) => setClassData({ ...classData, title: e.target.value })}
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Class Type
                  </label>
                  <select
                    value={classData.type}
                    onChange={(e) =>
                      setClassData({
                        ...classData,
                        type: e.target.value as any,
                        studentId: '',
                        institutionId: '',
                      })
                    }
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
                  >
                    <option value="home_tuition">Private / Home Tuition</option>
                    <option value="college">College / School Period</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {classData.type === 'home_tuition' ? 'Link to Student' : 'Link to Institution'}
                  </label>
                  {classData.type === 'home_tuition' ? (
                    <select
                      value={classData.studentId}
                      onChange={(e) => {
                        const st = students.find((s) => s.id === e.target.value);
                        setClassData({
                          ...classData,
                          studentId: e.target.value,
                          title: st ? `${st.name} - ${st.subjects[0] || 'Tuition'}` : classData.title,
                          feeAmount: st ? st.feeAmount : classData.feeAmount,
                        });
                      }}
                      className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
                    >
                      <option value="">-- Optional Student Link --</option>
                      {students.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.grade})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <select
                      value={classData.institutionId}
                      onChange={(e) => {
                        const inst = institutions.find((i) => i.id === e.target.value);
                        setClassData({
                          ...classData,
                          institutionId: e.target.value,
                          title: inst ? `${inst.name} - ${inst.subjects[0] || 'Class'}` : classData.title,
                          feeAmount: inst ? inst.rateAmount : classData.feeAmount,
                        });
                      }}
                      className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
                    >
                      <option value="">-- Optional Institution Link --</option>
                      {institutions.map((i) => (
                        <option key={i.id} value={i.id}>
                          {i.name} ({i.facultyOrGrade})
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Subject Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Mathematics"
                    value={classData.subject}
                    onChange={(e) => setClassData({ ...classData, subject: e.target.value })}
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Class Start Date
                  </label>
                  <input
                    type="date"
                    value={classData.startDate}
                    onChange={(e) => setClassData({ ...classData, startDate: e.target.value })}
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>

                {/* Color Picker */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Badge Color
                  </label>
                  <div className="flex items-center gap-2 pt-1.5">
                    {COLOR_OPTIONS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setClassData({ ...classData, color: c })}
                        style={{ backgroundColor: c }}
                        className={`w-6 h-6 rounded-full transition-transform ${
                          classData.color === c ? 'scale-125 ring-2 ring-offset-2 ring-indigo-500' : 'opacity-80'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {/* Schedule Mode Selector */}
                <div className="sm:col-span-2 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/80 space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-indigo-500" />
                      Routine Schedule Mode
                    </span>
                    <div className="flex items-center gap-1 bg-white dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700 text-xs">
                      <button
                        type="button"
                        onClick={() => setClassData({ ...classData, scheduleType: 'uniform' })}
                        className={`px-2.5 py-1 rounded-md font-semibold transition ${
                          classData.scheduleType === 'uniform'
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                        }`}
                      >
                        Same Routine All Week
                      </button>
                      <button
                        type="button"
                        onClick={() => setClassData({ ...classData, scheduleType: 'day_wise' })}
                        className={`px-2.5 py-1 rounded-md font-semibold transition ${
                          classData.scheduleType === 'day_wise'
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                        }`}
                      >
                        Different Times on Days
                      </button>
                    </div>
                  </div>

                  {/* UNIFORM SCHEDULE MODE */}
                  {classData.scheduleType === 'uniform' && (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Routine Days
                        </label>
                        <div className="flex flex-wrap gap-1.5">
                          {DAYS_OF_WEEK.map((day) => {
                            const isSelected = classData.scheduleDays.includes(day);
                            return (
                              <button
                                key={day}
                                type="button"
                                onClick={() => {
                                  const newDays = isSelected
                                    ? classData.scheduleDays.filter((d) => d !== day)
                                    : [...classData.scheduleDays, day];
                                  setClassData({ ...classData, scheduleDays: newDays });
                                }}
                                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                                  isSelected
                                    ? 'bg-indigo-600 text-white shadow-2xs'
                                    : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600 hover:bg-slate-100'
                                }`}
                              >
                                {day.slice(0, 3)}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                            Start Time
                          </label>
                          <input
                            type="time"
                            required
                            value={classData.startTime}
                            onChange={(e) => {
                              const newStart = e.target.value;
                              const newEnd = calculateEndTime(newStart, classData.durationMinutes);
                              setClassData({ ...classData, startTime: newStart, endTime: newEnd });
                            }}
                            className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
                          />
                        </div>

                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                              Duration (Mins)
                            </label>
                            <div className="flex items-center gap-1">
                              {[35, 40, 45, 50, 60, 90].map((d) => (
                                <button
                                  key={d}
                                  type="button"
                                  onClick={() => {
                                    const newEnd = calculateEndTime(classData.startTime, d);
                                    setClassData({ ...classData, durationMinutes: d, endTime: newEnd });
                                  }}
                                  className={`px-1.5 py-0.5 text-[9px] font-medium rounded transition ${
                                    classData.durationMinutes === d
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
                            min="5"
                            step="1"
                            value={classData.durationMinutes}
                            onChange={(e) => {
                              const dur = Number(e.target.value) || 60;
                              const newEnd = calculateEndTime(classData.startTime, dur);
                              setClassData({ ...classData, durationMinutes: dur, endTime: newEnd });
                            }}
                            className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                            End Time
                          </label>
                          <input
                            type="time"
                            required
                            value={classData.endTime}
                            onChange={(e) => {
                              const newEnd = e.target.value;
                              const dur = calculateDurationMinutes(classData.startTime, newEnd);
                              setClassData({ ...classData, endTime: newEnd, durationMinutes: dur });
                            }}
                            className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* DAY-WISE SCHEDULE MODE */}
                  {classData.scheduleType === 'day_wise' && (
                    <div className="space-y-2">
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Specify exact start/end times for each day of the week.
                      </p>
                      <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                        {DAYS_OF_WEEK.map((day) => {
                          const sched = classData.dayWiseSchedules[day] || {
                            day,
                            isActive: false,
                            startTime: '06:30',
                            endTime: '07:30',
                            durationMinutes: 60,
                          };
                          return (
                            <div
                              key={day}
                              className={`p-2 rounded-lg border text-xs flex items-center justify-between gap-2 transition ${
                                sched.isActive
                                  ? 'bg-white dark:bg-slate-800 border-indigo-200 dark:border-indigo-900/60'
                                  : 'bg-slate-100/70 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 opacity-60'
                              }`}
                            >
                              <label className="flex items-center gap-2 cursor-pointer w-24 shrink-0">
                                <input
                                  type="checkbox"
                                  checked={sched.isActive}
                                  onChange={(e) => {
                                    const updated = {
                                      ...classData.dayWiseSchedules,
                                      [day]: { ...sched, isActive: e.target.checked },
                                    };
                                    setClassData({ ...classData, dayWiseSchedules: updated });
                                  }}
                                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                />
                                <span className="font-semibold text-slate-800 dark:text-slate-200">
                                  {day.slice(0, 3)}
                                </span>
                              </label>

                              {sched.isActive ? (
                                <div className="flex items-center gap-2 flex-1">
                                  <input
                                    type="time"
                                    value={sched.startTime}
                                    onChange={(e) => {
                                      const st = e.target.value;
                                      const et = calculateEndTime(st, sched.durationMinutes);
                                      const updated = {
                                        ...classData.dayWiseSchedules,
                                        [day]: { ...sched, startTime: st, endTime: et },
                                      };
                                      setClassData({ ...classData, dayWiseSchedules: updated });
                                    }}
                                    className="px-2 py-1 text-xs rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100"
                                  />
                                  <span className="text-slate-400">to</span>
                                  <input
                                    type="time"
                                    value={sched.endTime}
                                    onChange={(e) => {
                                      const et = e.target.value;
                                      const dur = calculateDurationMinutes(sched.startTime, et);
                                      const updated = {
                                        ...classData.dayWiseSchedules,
                                        [day]: { ...sched, endTime: et, durationMinutes: dur },
                                      };
                                      setClassData({ ...classData, dayWiseSchedules: updated });
                                    }}
                                    className="px-2 py-1 text-xs rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100"
                                  />
                                  <span className="text-[10px] text-slate-500 font-medium whitespace-nowrap ml-auto">
                                    {sched.durationMinutes}m
                                  </span>
                                </div>
                              ) : (
                                <span className="text-[11px] text-slate-400 italic">No class scheduled</span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* DATE-SPECIFIC OVERRIDES COLLAPSIBLE */}
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                    <button
                      type="button"
                      onClick={() => setShowDateOverrides(!showDateOverrides)}
                      className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 flex items-center justify-between w-full hover:underline"
                    >
                      <span className="flex items-center gap-1">
                        <CalendarDays className="w-3.5 h-3.5" />
                        Special Date / Exam Overrides ({classData.dateSpecificSchedules.length})
                      </span>
                      <span>{showDateOverrides ? '▲ Hide' : '▼ Add or View'}</span>
                    </button>

                    {showDateOverrides && (
                      <div className="mt-2.5 space-y-2 bg-white dark:bg-slate-800 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700">
                        <p className="text-[11px] text-slate-500">
                          Set a one-time different timing for a specific date (e.g., Exam, Extra Revision Class, Shifted Time).
                        </p>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          <div>
                            <label className="block text-[10px] font-semibold text-slate-600 dark:text-slate-400 mb-0.5">
                              Date
                            </label>
                            <input
                              type="date"
                              value={newOverrideDate}
                              onChange={(e) => setNewOverrideDate(e.target.value)}
                              className="w-full px-2 py-1 text-xs rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-semibold text-slate-600 dark:text-slate-400 mb-0.5">
                              Start
                            </label>
                            <input
                              type="time"
                              value={newOverrideStartTime}
                              onChange={(e) => setNewOverrideStartTime(e.target.value)}
                              className="w-full px-2 py-1 text-xs rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-semibold text-slate-600 dark:text-slate-400 mb-0.5">
                              End
                            </label>
                            <input
                              type="time"
                              value={newOverrideEndTime}
                              onChange={(e) => setNewOverrideEndTime(e.target.value)}
                              className="w-full px-2 py-1 text-xs rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-semibold text-slate-600 dark:text-slate-400 mb-0.5">
                              Reason / Note
                            </label>
                            <input
                              type="text"
                              placeholder="e.g. Pre-Board Exam"
                              value={newOverrideNote}
                              onChange={(e) => setNewOverrideNote(e.target.value)}
                              className="w-full px-2 py-1 text-xs rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200"
                            />
                          </div>
                        </div>

                        <div className="flex justify-end pt-1">
                          <button
                            type="button"
                            onClick={() => {
                              if (!newOverrideDate) return;
                              const dur = calculateDurationMinutes(newOverrideStartTime, newOverrideEndTime);
                              const newEntry: DateSpecificClassSchedule = {
                                id: `ovr-${Date.now()}`,
                                date: newOverrideDate,
                                startTime: newOverrideStartTime,
                                endTime: newOverrideEndTime,
                                durationMinutes: dur,
                                note: newOverrideNote || 'Custom Schedule',
                              };
                              setClassData({
                                ...classData,
                                dateSpecificSchedules: [...classData.dateSpecificSchedules, newEntry],
                              });
                              setNewOverrideNote('');
                            }}
                            className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-semibold flex items-center gap-1 transition"
                          >
                            <Plus className="w-3 h-3" />
                            <span>Add Override Date</span>
                          </button>
                        </div>

                        {classData.dateSpecificSchedules.length > 0 && (
                          <div className="space-y-1 pt-1.5">
                            {classData.dateSpecificSchedules.map((ovr) => (
                              <div
                                key={ovr.id}
                                className="flex items-center justify-between px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-700 text-xs"
                              >
                                <div>
                                  <span className="font-semibold text-indigo-600 dark:text-indigo-400 mr-2">
                                    {formatDisplayDate(ovr.date, settings.dateSystem, 'short')}
                                  </span>
                                  <span className="text-slate-600 dark:text-slate-300 mr-2">
                                    {formatTime(ovr.startTime)} - {formatTime(ovr.endTime)}
                                  </span>
                                  {ovr.note && (
                                    <span className="text-[11px] text-slate-500 italic">({ovr.note})</span>
                                  )}
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setClassData({
                                      ...classData,
                                      dateSpecificSchedules: classData.dateSpecificSchedules.filter(
                                        (x) => x.id !== ovr.id
                                      ),
                                    });
                                  }}
                                  className="text-red-500 hover:text-red-700 p-1"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={closeQuickAction}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs shadow-indigo-600/30 transition active:scale-95 flex items-center gap-1.5"
                >
                  <GraduationCap className="w-3.5 h-3.5" />
                  <span>Create Class</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 4: ADD INSTITUTION */}
          {activeType === 'institution' && (
            <form onSubmit={handleInstitutionSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Institution / College Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Apex College / KMC"
                    value={institutionData.name}
                    onChange={(e) =>
                      setInstitutionData({ ...institutionData, name: e.target.value })
                    }
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Faculty / Grade / Program
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. +2 Science, BIM, BCA"
                    value={institutionData.facultyOrGrade}
                    onChange={(e) =>
                      setInstitutionData({ ...institutionData, facultyOrGrade: e.target.value })
                    }
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Subjects Taught
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Physics, Numerical Methods"
                    value={institutionData.subjects}
                    onChange={(e) =>
                      setInstitutionData({ ...institutionData, subjects: e.target.value })
                    }
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Pay Structure
                  </label>
                  <select
                    value={institutionData.paymentStructure}
                    onChange={(e) =>
                      setInstitutionData({
                        ...institutionData,
                        paymentStructure: e.target.value as any,
                      })
                    }
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
                  >
                    <option value="per_period">Per Period Rate</option>
                    <option value="hourly">Hourly Rate</option>
                    <option value="monthly">Fixed Monthly Salary</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Pay Rate Amount ({settings.currency})
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 850 or 35000"
                    value={institutionData.rateAmount}
                    onChange={(e) =>
                      setInstitutionData({ ...institutionData, rateAmount: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Contract Start Date
                  </label>
                  <input
                    type="date"
                    value={institutionData.startDate}
                    onChange={(e) =>
                      setInstitutionData({ ...institutionData, startDate: e.target.value })
                    }
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Contact Person / HOD
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Dr. K. Sharma (Coordinator)"
                    value={institutionData.contactPerson}
                    onChange={(e) =>
                      setInstitutionData({ ...institutionData, contactPerson: e.target.value })
                    }
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Contact Phone
                  </label>
                  <input
                    type="tel"
                    placeholder="e.g. 01-4478123"
                    value={institutionData.contactNumber}
                    onChange={(e) =>
                      setInstitutionData({ ...institutionData, contactNumber: e.target.value })
                    }
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>

                {/* College Routine & Period Schedule Configuration */}
                <div className="sm:col-span-2 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/80 space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <Sliders className="w-3.5 h-3.5 text-indigo-500" />
                      Class & Period Schedule
                    </span>
                    <div className="flex items-center gap-1 bg-white dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700 text-xs">
                      <button
                        type="button"
                        onClick={() => setInstitutionData({ ...institutionData, scheduleType: 'uniform' })}
                        className={`px-2.5 py-1 rounded-md font-semibold transition ${
                          institutionData.scheduleType === 'uniform'
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                        }`}
                      >
                        Same Periods Daily
                      </button>
                      <button
                        type="button"
                        onClick={() => setInstitutionData({ ...institutionData, scheduleType: 'day_wise' })}
                        className={`px-2.5 py-1 rounded-md font-semibold transition ${
                          institutionData.scheduleType === 'day_wise'
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                        }`}
                      >
                        Different Periods by Day
                      </button>
                    </div>
                  </div>

                  {institutionData.scheduleType === 'uniform' ? (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Working Days
                        </label>
                        <div className="flex flex-wrap gap-1.5">
                          {DAYS_OF_WEEK.map((day) => {
                            const isSelected = institutionData.workingDays.includes(day);
                            return (
                              <button
                                key={day}
                                type="button"
                                onClick={() => {
                                  const newDays = isSelected
                                    ? institutionData.workingDays.filter((d) => d !== day)
                                    : [...institutionData.workingDays, day];
                                  setInstitutionData({ ...institutionData, workingDays: newDays });
                                }}
                                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                                  isSelected
                                    ? 'bg-indigo-600 text-white shadow-2xs'
                                    : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600 hover:bg-slate-100'
                                }`}
                              >
                                {day.slice(0, 3)}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                            Periods per Day
                          </label>
                          <input
                            type="number"
                            min="1"
                            max="10"
                            value={institutionData.numberOfPeriods}
                            onChange={(e) =>
                              setInstitutionData({
                                ...institutionData,
                                numberOfPeriods: Number(e.target.value),
                              })
                            }
                            className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                            Period Duration (Minutes)
                          </label>
                          <input
                            type="number"
                            min="5"
                            step="1"
                            value={institutionData.periodDurationMinutes}
                            onChange={(e) =>
                              setInstitutionData({
                                ...institutionData,
                                periodDurationMinutes: Number(e.target.value),
                              })
                            }
                            className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                        <span>Enter exact periods scheduled on each day (e.g. 0 on off-days):</span>
                        <div className="flex items-center gap-1.5">
                          <span>Period Length:</span>
                          <input
                            type="number"
                            min="5"
                            step="1"
                            value={institutionData.periodDurationMinutes}
                            onChange={(e) =>
                              setInstitutionData({
                                ...institutionData,
                                periodDurationMinutes: Number(e.target.value),
                              })
                            }
                            className="w-14 px-1.5 py-0.5 text-xs rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                          />
                          <span>min</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {DAYS_OF_WEEK.map((day) => {
                          const count = institutionData.dayWisePeriods[day] || 0;
                          return (
                            <div
                              key={day}
                              className={`p-2 rounded-lg border text-center transition ${
                                count > 0
                                  ? 'bg-white dark:bg-slate-800 border-indigo-200 dark:border-indigo-800 shadow-2xs'
                                  : 'bg-slate-100/60 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 opacity-60'
                              }`}
                            >
                              <div className="text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                                {day.slice(0, 3)}
                              </div>
                              <div className="flex items-center justify-center gap-1.5">
                                <input
                                  type="number"
                                  min="0"
                                  max="10"
                                  value={count}
                                  onChange={(e) => {
                                    const val = Math.max(0, Number(e.target.value) || 0);
                                    setInstitutionData({
                                      ...institutionData,
                                      dayWisePeriods: {
                                        ...institutionData.dayWisePeriods,
                                        [day]: val,
                                      },
                                    });
                                  }}
                                  className="w-12 text-center text-xs font-bold py-1 rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
                                />
                                <span className="text-[10px] text-slate-400">pds</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 bg-indigo-50/50 dark:bg-indigo-950/20 p-2 rounded-lg border border-indigo-100 dark:border-indigo-900/30 flex items-center justify-between">
                        <span>
                          Total Weekly Periods:{' '}
                          <strong className="text-indigo-600 dark:text-indigo-400">
                            {(Object.values(institutionData.dayWisePeriods) as number[]).reduce((a, b) => a + (Number(b) || 0), 0)}
                          </strong>
                        </span>
                        <span>
                          Active Days:{' '}
                          <strong className="text-indigo-600 dark:text-indigo-400">
                            {(Object.values(institutionData.dayWisePeriods) as number[]).filter((v) => Number(v) > 0).length} days
                          </strong>
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={closeQuickAction}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs shadow-indigo-600/30 transition active:scale-95 flex items-center gap-1.5"
                >
                  <Building2 className="w-3.5 h-3.5" />
                  <span>Save Institution</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 5: QUICK ATTENDANCE */}
          {activeType === 'attendance' && (
            <form onSubmit={handleAttendanceSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Select Class / Session *
                  </label>
                  <select
                    required
                    value={attendanceData.classId}
                    onChange={(e) =>
                      setAttendanceData({ ...attendanceData, classId: e.target.value })
                    }
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
                  >
                    <option value="">-- Choose Class --</option>
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.title} ({c.startTime} - {c.endTime})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Attendance Status
                  </label>
                  <select
                    value={attendanceData.status}
                    onChange={(e) =>
                      setAttendanceData({
                        ...attendanceData,
                        status: e.target.value as AttendanceStatus,
                      })
                    }
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
                  >
                    <option value="present">Present / Completed</option>
                    <option value="absent">Student Absent</option>
                    <option value="cancelled">Class Cancelled</option>
                    <option value="rescheduled">Rescheduled</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    required
                    value={attendanceData.date}
                    onChange={(e) =>
                      setAttendanceData({ ...attendanceData, date: e.target.value })
                    }
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Topic Covered / Chapter
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Quadratic Equations Ex 4.2"
                    value={attendanceData.topicsCovered}
                    onChange={(e) =>
                      setAttendanceData({ ...attendanceData, topicsCovered: e.target.value })
                    }
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={closeQuickAction}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!attendanceData.classId}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold shadow-xs shadow-indigo-600/30 transition active:scale-95 flex items-center gap-1.5"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Log Attendance</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 6: MARKS & EXAM */}
          {activeType === 'performance' && (
            <form onSubmit={handlePerformanceSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Select Student *
                  </label>
                  <select
                    required
                    value={performanceData.studentId}
                    onChange={(e) => {
                      const st = students.find((s) => s.id === e.target.value);
                      setPerformanceData({
                        ...performanceData,
                        studentId: e.target.value,
                        subject: st && st.subjects.length > 0 ? st.subjects[0] : performanceData.subject,
                      });
                    }}
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
                  >
                    <option value="">-- Choose Student --</option>
                    {students.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.grade})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Subject Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Mathematics"
                    value={performanceData.subject}
                    onChange={(e) =>
                      setPerformanceData({ ...performanceData, subject: e.target.value })
                    }
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Exam / Test Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Unit Test 1 or First Terminal"
                    value={performanceData.testName}
                    onChange={(e) =>
                      setPerformanceData({ ...performanceData, testName: e.target.value })
                    }
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Test Category
                  </label>
                  <select
                    value={performanceData.testType}
                    onChange={(e) =>
                      setPerformanceData({ ...performanceData, testType: e.target.value as TestType })
                    }
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
                  >
                    <option value="unit_test">Unit Test</option>
                    <option value="weekly_quiz">Weekly Quiz / Pop Test</option>
                    <option value="terminal_exam">Terminal Examination</option>
                    <option value="mock_board">Mock Board Exam (SEE/+2)</option>
                    <option value="custom">Custom Test</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Marks Obtained *
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    placeholder="e.g. 42"
                    value={performanceData.obtainedMarks}
                    onChange={(e) =>
                      setPerformanceData({
                        ...performanceData,
                        obtainedMarks: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none font-bold text-indigo-600 dark:text-indigo-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Total / Full Marks *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    placeholder="e.g. 50 or 100"
                    value={performanceData.fullMarks}
                    onChange={(e) =>
                      setPerformanceData({
                        ...performanceData,
                        fullMarks: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Exam Date
                  </label>
                  <input
                    type="date"
                    required
                    value={performanceData.date}
                    onChange={(e) =>
                      setPerformanceData({ ...performanceData, date: e.target.value })
                    }
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Homework / Assignment Status
                  </label>
                  <select
                    value={performanceData.assignmentStatus}
                    onChange={(e) =>
                      setPerformanceData({
                        ...performanceData,
                        assignmentStatus: e.target.value as AssignmentStatus,
                      })
                    }
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
                  >
                    <option value="completed">Completed Regularly</option>
                    <option value="partial">Partially Done</option>
                    <option value="not_done">Incomplete / Missing</option>
                    <option value="Excellent">Excellent Work</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={closeQuickAction}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!performanceData.studentId}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold shadow-xs shadow-indigo-600/30 transition active:scale-95 flex items-center gap-1.5"
                >
                  <Award className="w-3.5 h-3.5" />
                  <span>Record Test Score</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
