export type DateSystem = 'AD' | 'BS';
export type TimeFormat = '12h' | '24h';
export type TuitionType = 'individual' | 'group';
export type FeeStructureType = 'monthly' | 'per_class' | 'hourly' | 'per_period' | 'custom';
export type PaymentMethod = 'Cash' | 'eSewa' | 'Khalti' | 'Bank Transfer' | 'PhonePe/UPI' | 'Cheque' | 'Other';
export type PaymentStatus = 'paid' | 'partially_paid' | 'partial' | 'pending' | 'overdue';
export type PaymentType = 'tuition' | 'tuition_fee' | 'college_salary';
export type AttendanceStatus = 'present' | 'absent' | 'cancelled' | 'rescheduled';
export type DayOfWeek = 'Sunday' | 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday';
export type CurrencyCode = 'NPR' | 'Rs.' | 'USD' | 'INR' | 'EUR' | 'GBP';
export type TestType = 'unit_test' | 'weekly_quiz' | 'terminal_exam' | 'mock_board' | 'custom';
export type AssignmentStatus = 'completed' | 'partial' | 'not_done' | 'Completed' | 'Partially Completed' | 'Incomplete' | 'Excellent';

export interface Student {
  id: string;
  name: string;
  grade: string; // e.g. Grade 10, Grade 11, +2 Science, Class 9, A-Levels
  schoolOrCollege: string;
  contactNumber: string;
  email?: string;
  parentName: string;
  parentPhone?: string;
  parentContact: string;
  address: string;
  subjects: string[]; // e.g. ['Mathematics', 'Physics']
  tuitionType: TuitionType;
  groupName?: string;
  startDate: string; // ISO date string (YYYY-MM-DD)
  classFrequency: string; // e.g. '6 days/week', '3 days/week (Sun, Tue, Thu)', 'Daily'
  classDurationMinutes: number; // e.g. 60, 90
  feeStructure: FeeStructureType;
  feeAmount: number; // in NPR
  paymentMethod: PaymentMethod;
  paymentDueDay: number; // Day of month (1-31)
  paymentCalendarSystem?: 'AD' | 'BS'; // Calendar used for payment schedule
  paymentReceivingDay?: number; // Day number of month when payment is received (1-31 for AD, 1-32 for BS)
  dueDays?: number; // Days allowed after receiving day until payment is due
  attendancePercentage?: number;
  pendingBalance?: number;
  notes?: string;
  status: 'active' | 'inactive';
  createdAt: string;
}

export type CollegeScheduleType = 'uniform' | 'day_wise' | 'date_specific';

export interface DayWisePeriodConfig {
  day: DayOfWeek;
  periods: number; // 0 if off/no class on that day
  timing?: string; // e.g. '07:00 - 08:30' or 'Morning 2 periods'
  startTime?: string;
  endTime?: string;
  subject?: string; // e.g. 'Physics' or 'Lab'
}

export interface DateSpecificCollegeSchedule {
  id: string;
  date: string; // ISO 'YYYY-MM-DD'
  periods: number;
  startTime?: string;
  endTime?: string;
  note?: string; // e.g. 'Lab exam', 'Revision lecture'
}

export interface Institution {
  id: string;
  name: string; // e.g. Apex College, Kathmandu Model College, St. Xavier's
  facultyOrGrade: string; // e.g. +2 Science, BIM, BCA, Grade 12
  subjects: string[];
  section?: string; // e.g. Section A, Section B
  numberOfPeriods: number; // e.g. 2 periods per day (uniform or average)
  periodDurationMinutes: number; // e.g. 45
  workingDays: DayOfWeek[];
  paymentStructure: FeeStructureType; // 'monthly' | 'per_period' | 'hourly' | 'custom'
  rateAmount: number; // e.g. 35000 / month or 850 / period
  extraClassRate?: number; // e.g. 1000 / period
  startDate: string;
  endDate?: string;
  paymentCalendarSystem?: 'AD' | 'BS';
  paymentReceivingDay?: number; // 1-31 (AD) or 1-32 (BS)
  dueDays?: number; // Days allowed after receiving day until payment is due
  paymentDueDay?: number;
  contactPerson?: string;
  contactNumber?: string;
  notes?: string;
  status: 'active' | 'inactive';
  createdAt: string;

  // Flexible / Variable Day-Wise & Date-Specific Scheduling
  scheduleType?: CollegeScheduleType; // 'uniform' (same periods every day) | 'day_wise' (varying periods per day) | 'date_specific'
  startTime?: string; // e.g. '06:30' (uniform daily start)
  endTime?: string; // e.g. '08:00' (uniform daily end)
  dayWisePeriods?: Partial<Record<DayOfWeek, number>>; // e.g. { Sunday: 3, Monday: 2, Tuesday: 4, Wednesday: 1, Thursday: 2, Friday: 3, Saturday: 0 }
  dayWiseSchedule?: DayWisePeriodConfig[];
  dateSpecificSchedules?: DateSpecificCollegeSchedule[];
}

export type ClassScheduleType = 'uniform' | 'day_wise' | 'date_specific';

export interface DayWiseClassSchedule {
  day?: DayOfWeek;
  isActive?: boolean;
  startTime: string; // 'HH:MM'
  endTime: string; // 'HH:MM'
  durationMinutes?: number;
  location?: string;
  note?: string;
}

export interface DateSpecificClassSchedule {
  id: string;
  date: string; // ISO date 'YYYY-MM-DD'
  startTime: string;
  endTime: string;
  durationMinutes?: number;
  note?: string; // e.g. 'SEE Mock Test', 'Special Revision'
}

export interface TeachingClass {
  id: string;
  title: string; // e.g. "Grade 10 Opt Math" or "Apex College - Physics Sec A"
  type: 'home_tuition' | 'college';
  studentId?: string; // For individual home tuition
  studentIds?: string[]; // For group home tuition
  groupName?: string;
  institutionId?: string; // For college class
  subject: string;
  location: string; // e.g. "Student's Home (Baneshwor)", "Teacher's Home", "Apex College Room 302"
  feeStructure: FeeStructureType;
  feeAmount: number;
  durationMinutes: number;
  scheduleDays: DayOfWeek[];
  startTime: string; // default / fallback 'HH:MM' (24-hour internal)
  endTime: string; // default / fallback 'HH:MM'
  color: string; // Hex color for calendar/routine
  startDate?: string; // ISO date 'YYYY-MM-DD' when class batch started
  endDate?: string;
  notes?: string;
  isActive: boolean;

  // Flexible / Variable Scheduling
  scheduleType?: ClassScheduleType; // 'uniform' (same time each active day) | 'day_wise' (different times by day) | 'date_specific'
  dayWiseSchedules?: Partial<Record<DayOfWeek, DayWiseClassSchedule>>;
  dateSpecificSchedules?: DateSpecificClassSchedule[];
}

export interface RoutineItem {
  id: string;
  classId: string;
  day: DayOfWeek;
  startTime: string;
  endTime: string;
  subject: string;
  title: string;
  type: 'home_tuition' | 'college';
  targetName: string; // Student name or Institution name
  location: string;
  durationMinutes: number;
  color: string;
}

export interface AttendanceRecord {
  id: string;
  date: string; // ISO date 'YYYY-MM-DD'
  classId: string;
  type: 'home_tuition' | 'college';
  studentId?: string; // for home tuition
  institutionId?: string; // for college
  targetName: string;
  subject: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  periodsCount?: number; // for college classes
  status: AttendanceStatus;
  notes?: string;
  topicsCovered?: string;
  recordedAt: string;
}

export interface PaymentRecord {
  id: string;
  type: 'tuition' | 'tuition_fee' | 'college_salary';
  studentId?: string;
  institutionId?: string;
  targetName: string; // Student name or Institution name
  periodMonthYear: string; // e.g. '2026-08' or 'Bhadra 2083'
  amountDue: number;
  amountPaid: number;
  remainingBalance: number;
  paymentDate: string; // ISO date 'YYYY-MM-DD'
  dueDate: string; // ISO date 'YYYY-MM-DD'
  paymentMethod: PaymentMethod;
  status: PaymentStatus;
  referenceNote?: string;
  receiptNumber?: string;
  recordedAt?: string;
  createdAt?: string;
}

export interface PerformanceRecord {
  id: string;
  studentId: string;
  studentName: string;
  subject: string;
  date: string; // ISO date 'YYYY-MM-DD'
  testName?: string; // e.g. 'Unit Test 1', 'Term 1 Exam', 'Weekly Math Quiz'
  examName?: string;
  totalMarks?: number;
  fullMarks?: number;
  obtainedMarks: number;
  percentage: number;
  grade: string; // 'A+', 'A', 'B+', 'B', 'C+', 'C', 'D', 'E'
  testType?: TestType;
  topicsCovered?: string;
  weakAreas?: string;
  weakTopics?: string[];
  strongTopics?: string[];
  assignmentStatus?: AssignmentStatus;
  homeworkStatus?: AssignmentStatus;
  classParticipationScore?: number; // 1 to 5
  teacherRemarks?: string;
  recordedAt: string;
}

export interface TeacherSettings {
  teacherName: string;
  email: string;
  phone: string;
  qualification: string;
  specialization: string;
  currency: string; // 'NPR' or 'Rs.'
  dateSystem: DateSystem; // 'AD' | 'BS'
  timeFormat: TimeFormat; // '12h' | '24h'
  defaultClassDuration: number; // minutes, e.g. 60
  reminderDaysBeforeDue: number; // e.g. 3 days before
  theme: 'light' | 'dark' | 'system';
  address?: string;
  bio?: string;
  reminderTemplate?: string;
}

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

export interface NotificationItem {
  id: string;
  type: 'payment_overdue' | 'payment_due_soon' | 'upcoming_class' | 'attendance_pending' | 'performance_alert';
  title: string;
  message: string;
  date: string;
  priority: 'low' | 'medium' | 'high';
  actionLink?: string;
  isRead: boolean;
}

export type AppMode = 'teacher' | 'student';

export interface StudentClassItem {
  id: string;
  type: 'school' | 'tuition';
  subject: string;
  teacherOrInstitute: string; // e.g. "St. Xavier's School" or "Prof. Ramesh (Math Tuition)"
  scheduleDays: DayOfWeek[];
  startTime: string; // 'HH:MM'
  endTime: string; // 'HH:MM'
  durationMinutes: number;
  location?: string;
  color?: string;
  notes?: string;
  isActive: boolean;
}

export interface StudentExamMark {
  id: string;
  examType: 'terminal_exam' | 'unit_test' | 'pre_board' | 'quiz';
  termName: string; // e.g. 'First Terminal Examination', 'Unit Test 1', 'Second Term'
  subject: string;
  date: string; // 'YYYY-MM-DD'
  fullMarks: number;
  passMarks: number;
  obtainedMarks: number;
  percentage: number;
  grade: string;
  weakTopics?: string[];
  strongTopics?: string[];
  remarks?: string;
  aiFeedback?: string;
  createdAt: string;
}

export interface StudentRoutineSettings {
  studentName: string;
  grade: string;
  schoolName: string;
  targetWakeUpTime: string; // e.g. '06:00'
  targetBedTime: string; // e.g. '22:30'
  targetDailySelfStudyHours: number; // e.g. 3 hours
  examGoals?: string; // e.g. "Score > 85% in SEE / +2 Board"
}

export interface StudentAISuggestion {
  id: string;
  type: 'free_time' | 'exam_feedback' | 'routine_balance' | 'study_tip';
  title: string;
  message: string;
  actionText?: string;
  tags?: string[];
  createdAt: string;
}
