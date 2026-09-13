import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode, useRef } from 'react';
import {
  Student,
  Institution,
  TeachingClass,
  AttendanceRecord,
  PaymentRecord,
  PerformanceRecord,
  TeacherSettings,
  NotificationItem,
  DayOfWeek,
  DateSystem,
  AttendanceStatus,
  AuthUser,
  AppMode,
  StudentClassItem,
  StudentExamMark,
  StudentRoutineSettings,
} from '../types';
import {
  INITIAL_SETTINGS,
  INITIAL_STUDENTS,
  INITIAL_INSTITUTIONS,
  INITIAL_CLASSES,
  INITIAL_ATTENDANCE,
  INITIAL_PAYMENTS,
  INITIAL_PERFORMANCE,
  INITIAL_STUDENT_PROFILE,
  INITIAL_STUDENT_CLASSES,
  INITIAL_STUDENT_EXAMS,
} from '../utils/sampleData';
import { getTodayIso, adToBs, formatDualDate, calculatePaymentSchedule } from '../utils/nepaliCalendar';
import { calculateGrade } from '../utils/formatters';
import { resolveClassSchedule, resolveClassDaySlots, DAYS_OF_WEEK } from '../utils/scheduleHelpers';
import {
  auth,
  db,
  signInWithGoogle,
  signUpWithEmail,
  signInWithEmail,
  resetPassword,
  signOutUser,
  onAuthStateChanged,
  User as FirebaseUser,
  cleanForFirestore,
} from '../lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export interface ToastItem {
  id: number;
  message: string;
  subtitle?: string;
  type: 'success' | 'error' | 'info';
}

interface AppContextType {
  // Navigation & UI state
  activeTab: string;
  setActiveTab: (tab: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  closeSidebar: () => void;
  isQuickActionOpen: boolean;
  setIsQuickActionOpen: (open: boolean) => void;
  quickActionType: string | null;
  openQuickAction: (type: string) => void;
  closeQuickAction: () => void;
  isNotificationOpen: boolean;
  setIsNotificationOpen: (open: boolean) => void;
  isSearchModalOpen: boolean;
  setIsSearchModalOpen: (open: boolean) => void;
  openSearchModal: () => void;
  closeSearchModal: () => void;
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  openAuthModal: () => void;
  closeAuthModal: () => void;

  // Reset Modal & Operations
  isResetModalOpen: boolean;
  setIsResetModalOpen: (open: boolean) => void;
  resetModalInitialType: 'all' | 'teacher' | 'students' | 'colleges';
  openResetModal: (type?: 'all' | 'teacher' | 'students' | 'colleges') => void;
  closeResetModal: () => void;
  resetAllData: () => Promise<void>;
  resetTeacherDataOnly: () => Promise<void>;
  resetStudentsDataOnly: () => Promise<void>;
  resetCollegesDataOnly: () => Promise<void>;

  // Authentication & Cloud Sync
  currentUser: AuthUser | null;
  isAuthLoading: boolean;
  isSyncing: boolean;
  syncStatus: 'idle' | 'syncing' | 'synced' | 'error';
  lastSyncedAt: Date | null;
  loginWithGoogle: () => Promise<void>;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  signupWithEmail: (email: string, password: string, displayName?: string) => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  syncDataToCloud: (overrideData?: any) => Promise<boolean>;
  triggerManualSync: () => Promise<boolean>;

  // Toast feedback
  toast: ToastItem | null;
  showToast: (message: string, type?: 'success' | 'error' | 'info', subtitle?: string) => void;
  dismissToast: () => void;

  // State Entities
  settings: TeacherSettings;
  updateSettings: (newSettings: Partial<TeacherSettings>) => void;
  toggleDateSystem: () => void;
  isDarkMode: boolean;
  toggleTheme: () => void;

  students: Student[];
  addStudent: (student: Omit<Student, 'id' | 'createdAt'>) => Student;
  updateStudent: (id: string, data: Partial<Student>) => void;
  deleteStudent: (id: string) => void;

  institutions: Institution[];
  addInstitution: (inst: Omit<Institution, 'id' | 'createdAt'>) => Institution;
  updateInstitution: (id: string, data: Partial<Institution>) => void;
  deleteInstitution: (id: string) => void;

  classes: TeachingClass[];
  addClass: (cls: Omit<TeachingClass, 'id'>) => TeachingClass;
  updateClass: (id: string, data: Partial<TeachingClass>) => void;
  deleteClass: (id: string) => void;

  attendance: AttendanceRecord[];
  markAttendance: (record: Omit<AttendanceRecord, 'id' | 'recordedAt'>) => void;
  updateAttendance: (id: string, data: Partial<AttendanceRecord>) => void;
  deleteAttendance: (id: string) => void;
  batchMarkAttendanceToday: (status: AttendanceStatus) => void;
  rescheduleTodayClass: (params: {
    classId: string;
    fromDate: string;
    toDate: string;
    newStartTime: string;
    newEndTime: string;
    newDurationMinutes: number;
    reason?: string;
  }) => void;

  payments: PaymentRecord[];
  recordPayment: (payment: Omit<PaymentRecord, 'id' | 'recordedAt'>) => void;
  updatePayment: (id: string, data: Partial<PaymentRecord>) => void;
  deletePayment: (id: string) => void;

  performance: PerformanceRecord[];
  addPerformance: (record: Omit<PerformanceRecord, 'id' | 'recordedAt' | 'percentage' | 'grade'>) => void;
  updatePerformance: (id: string, data: Partial<PerformanceRecord>) => void;
  deletePerformance: (id: string) => void;
  addPerformanceRecord: (record: any) => void;
  updatePerformanceRecord: (id: string, data: any) => void;
  deletePerformanceRecord: (id: string) => void;

  notifications: NotificationItem[];
  markNotificationAsRead: (id: string) => void;
  clearAllNotifications: () => void;

  // Student Mode State & Operations
  appMode: AppMode;
  setAppMode: (mode: AppMode) => void;
  studentClasses: StudentClassItem[];
  addStudentClass: (cls: Omit<StudentClassItem, 'id'>) => StudentClassItem;
  updateStudentClass: (id: string, data: Partial<StudentClassItem>) => void;
  deleteStudentClass: (id: string) => void;

  studentExams: StudentExamMark[];
  addStudentExam: (exam: Omit<StudentExamMark, 'id' | 'createdAt'>) => StudentExamMark;
  updateStudentExam: (id: string, data: Partial<StudentExamMark>) => void;
  deleteStudentExam: (id: string) => void;

  studentProfile: StudentRoutineSettings;
  updateStudentProfile: (profile: Partial<StudentRoutineSettings>) => void;

  // Computed Properties & Summaries
  todayClasses: TeachingClass[];
  todayDayName: DayOfWeek;
  activeStudentsCount: number;
  classesScheduledTodayCount: number;
  pendingPayments: PaymentRecord[];
  overduePayments: PaymentRecord[];
  currentMonthTuitionIncome: { received: number; expected: number; pending: number };
  currentMonthCollegeIncome: { received: number; earned: number; pending: number };
  totalWorkingHoursThisMonth: number;
  totalClassesThisMonth: number;

  // Backup & Restore
  exportDataJson: () => void;
  importDataJson: (jsonData: string) => { success: boolean; error?: string };
  resetToSampleData: () => void;
  clearAllData: () => void;
}

const STORAGE_KEYS = {
  SETTINGS: 'tcm_settings_v1',
  STUDENTS: 'tcm_students_v1',
  INSTITUTIONS: 'tcm_institutions_v1',
  CLASSES: 'tcm_classes_v1',
  ATTENDANCE: 'tcm_attendance_v1',
  PAYMENTS: 'tcm_payments_v1',
  PERFORMANCE: 'tcm_performance_v1',
  DISMISSED_NOTIFICATIONS: 'tcm_dismissed_notifs_v1',
  APP_MODE: 'tcm_app_mode_v1',
  STUDENT_CLASSES: 'tcm_student_classes_v1',
  STUDENT_EXAMS: 'tcm_student_exams_v1',
  STUDENT_PROFILE: 'tcm_student_profile_v1',
};

export const sanitizeInstitution = (inst: Institution): Institution => {
  const isExplicitDayWise = inst.scheduleType === 'day_wise';
  const hasMismatchWithDefault =
    !isExplicitDayWise ||
    (Array.isArray(inst.workingDays) &&
      inst.workingDays.length > 0 &&
      !inst.workingDays.includes('Sunday') &&
      inst.dayWisePeriods?.['Sunday'] === 2 &&
      inst.numberOfPeriods !== 2);

  if (inst.scheduleType === 'uniform' || hasMismatchWithDefault) {
    const workingDays =
      Array.isArray(inst.workingDays) && inst.workingDays.length > 0
        ? inst.workingDays
        : (['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'] as DayOfWeek[]);
    const periods = inst.numberOfPeriods || 3;
    const syncedDayWise: Partial<Record<DayOfWeek, number>> = {
      Sunday: workingDays.includes('Sunday') ? periods : 0,
      Monday: workingDays.includes('Monday') ? periods : 0,
      Tuesday: workingDays.includes('Tuesday') ? periods : 0,
      Wednesday: workingDays.includes('Wednesday') ? periods : 0,
      Thursday: workingDays.includes('Thursday') ? periods : 0,
      Friday: workingDays.includes('Friday') ? periods : 0,
      Saturday: workingDays.includes('Saturday') ? periods : 0,
    };
    return {
      ...inst,
      workingDays,
      numberOfPeriods: periods,
      scheduleType: 'uniform',
      dayWisePeriods: syncedDayWise,
    };
  }

  return inst;
};

export const sanitizeTeachingClass = (cls: TeachingClass): TeachingClass => {
  if (cls.scheduleType === 'day_wise' && cls.dayWiseSchedules) {
    const activeFromSchedules = DAYS_OF_WEEK.filter(
      (d) => cls.dayWiseSchedules?.[d]?.isActive === true
    );
    if (activeFromSchedules.length > 0) {
      const hasDesync =
        activeFromSchedules.some((d) => !cls.scheduleDays?.includes(d)) ||
        cls.scheduleDays?.some((d) => cls.dayWiseSchedules?.[d]?.isActive === false);

      if (hasDesync) {
        const firstDay = activeFromSchedules[0];
        const firstCfg = cls.dayWiseSchedules[firstDay];
        return {
          ...cls,
          scheduleDays: activeFromSchedules,
          startTime: firstCfg?.startTime || cls.startTime,
          endTime: firstCfg?.endTime || cls.endTime,
          durationMinutes: firstCfg?.durationMinutes || cls.durationMinutes,
        };
      }
    }
  }
  return cls;
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // UI States
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [isQuickActionOpen, setIsQuickActionOpen] = useState<boolean>(false);
  const [quickActionType, setQuickActionType] = useState<string | null>(null);
  const [isNotificationOpen, setIsNotificationOpen] = useState<boolean>(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState<boolean>(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState<boolean>(false);
  const [resetModalInitialType, setResetModalInitialType] = useState<'all' | 'teacher' | 'students' | 'colleges'>('all');

  // Authentication & Cloud Sync States
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'synced' | 'error'>('idle');
  const isInitialLoadRef = useRef<boolean>(true);

  const toggleSidebar = () => setIsSidebarOpen((prev) => !prev);
  const closeSidebar = () => setIsSidebarOpen(false);
  const openSearchModal = () => setIsSearchModalOpen(true);
  const closeSearchModal = () => setIsSearchModalOpen(false);
  const openAuthModal = () => setIsAuthModalOpen(true);
  const closeAuthModal = () => setIsAuthModalOpen(false);
  const openResetModal = (type: 'all' | 'teacher' | 'students' | 'colleges' = 'all') => {
    setResetModalInitialType(type);
    setIsResetModalOpen(true);
  };
  const closeResetModal = () => setIsResetModalOpen(false);

  // Global Keyboard Shortcuts (Ctrl+K or Cmd+K to open Search)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchModalOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const [dismissedNotifIds, setDismissedNotifIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.DISMISSED_NOTIFICATIONS);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Load state from localStorage or initialize with sample data
  const [settings, setSettings] = useState<TeacherSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      return saved ? { ...INITIAL_SETTINGS, ...JSON.parse(saved) } : INITIAL_SETTINGS;
    } catch {
      return INITIAL_SETTINGS;
    }
  });

  const [students, setStudents] = useState<Student[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.STUDENTS);
      return saved ? JSON.parse(saved) : INITIAL_STUDENTS;
    } catch {
      return INITIAL_STUDENTS;
    }
  });

  const [institutions, setInstitutions] = useState<Institution[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.INSTITUTIONS);
      const raw = saved ? JSON.parse(saved) : INITIAL_INSTITUTIONS;
      return Array.isArray(raw) ? raw.map(sanitizeInstitution) : INITIAL_INSTITUTIONS;
    } catch {
      return INITIAL_INSTITUTIONS;
    }
  });

  const [classes, setClasses] = useState<TeachingClass[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CLASSES);
      const raw = saved ? JSON.parse(saved) : INITIAL_CLASSES;
      return Array.isArray(raw) ? raw.map(sanitizeTeachingClass) : INITIAL_CLASSES;
    } catch {
      return INITIAL_CLASSES;
    }
  });

  const [attendance, setAttendance] = useState<AttendanceRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ATTENDANCE);
      return saved ? JSON.parse(saved) : INITIAL_ATTENDANCE;
    } catch {
      return INITIAL_ATTENDANCE;
    }
  });

  const [payments, setPayments] = useState<PaymentRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PAYMENTS);
      return saved ? JSON.parse(saved) : INITIAL_PAYMENTS;
    } catch {
      return INITIAL_PAYMENTS;
    }
  });

  const [performance, setPerformance] = useState<PerformanceRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PERFORMANCE);
      return saved ? JSON.parse(saved) : INITIAL_PERFORMANCE;
    } catch {
      return INITIAL_PERFORMANCE;
    }
  });

  // Student Mode States
  const [appMode, setAppMode] = useState<AppMode>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.APP_MODE);
      return (saved === 'student' || saved === 'teacher') ? saved : 'teacher';
    } catch {
      return 'teacher';
    }
  });

  const [studentClasses, setStudentClasses] = useState<StudentClassItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.STUDENT_CLASSES);
      return saved ? JSON.parse(saved) : INITIAL_STUDENT_CLASSES;
    } catch {
      return INITIAL_STUDENT_CLASSES;
    }
  });

  const [studentExams, setStudentExams] = useState<StudentExamMark[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.STUDENT_EXAMS);
      return saved ? JSON.parse(saved) : INITIAL_STUDENT_EXAMS;
    } catch {
      return INITIAL_STUDENT_EXAMS;
    }
  });

  const [studentProfile, setStudentProfile] = useState<StudentRoutineSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.STUDENT_PROFILE);
      return saved ? { ...INITIAL_STUDENT_PROFILE, ...JSON.parse(saved) } : INITIAL_STUDENT_PROFILE;
    } catch {
      return INITIAL_STUDENT_PROFILE;
    }
  });

  // System theme listener
  const [systemPrefersDark, setSystemPrefersDark] = useState<boolean>(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => setSystemPrefersDark(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  const isDarkMode = settings.theme === 'dark' || (settings.theme === 'system' && systemPrefersDark);

  // Sync to localStorage and root html element
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      document.documentElement.setAttribute('data-theme', 'dark');
      document.documentElement.style.colorScheme = 'dark';
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.setAttribute('data-theme', 'light');
      document.documentElement.style.colorScheme = 'light';
    }
  }, [settings, isDarkMode]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
  }, [students]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.INSTITUTIONS, JSON.stringify(institutions));
  }, [institutions]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CLASSES, JSON.stringify(classes));
  }, [classes]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(attendance));
  }, [attendance]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PAYMENTS, JSON.stringify(payments));
  }, [payments]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PERFORMANCE, JSON.stringify(performance));
  }, [performance]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.DISMISSED_NOTIFICATIONS, JSON.stringify(dismissedNotifIds));
  }, [dismissedNotifIds]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.APP_MODE, appMode);
  }, [appMode]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.STUDENT_CLASSES, JSON.stringify(studentClasses));
  }, [studentClasses]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.STUDENT_EXAMS, JSON.stringify(studentExams));
  }, [studentExams]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.STUDENT_PROFILE, JSON.stringify(studentProfile));
  }, [studentProfile]);

  // Toast feedback state
  const [toast, setToast] = useState<ToastItem | null>(null);
  const toastTimerRef = useRef<any>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info', subtitle?: string) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast({ id: Date.now(), message, type, subtitle });
    toastTimerRef.current = setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  const dismissToast = () => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast(null);
  };

  // Last synced timestamp
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(() => {
    try {
      const saved = localStorage.getItem('teacher_last_cloud_sync');
      return saved ? new Date(saved) : null;
    } catch {
      return null;
    }
  });

  // Direct References to latest state values to avoid stale closures in async sync handlers
  const settingsRef = useRef(settings);
  useEffect(() => { settingsRef.current = settings; }, [settings]);

  const studentsRef = useRef(students);
  useEffect(() => { studentsRef.current = students; }, [students]);

  const institutionsRef = useRef(institutions);
  useEffect(() => { institutionsRef.current = institutions; }, [institutions]);

  const classesRef = useRef(classes);
  useEffect(() => { classesRef.current = classes; }, [classes]);

  const attendanceRef = useRef(attendance);
  useEffect(() => { attendanceRef.current = attendance; }, [attendance]);

  const paymentsRef = useRef(payments);
  useEffect(() => { paymentsRef.current = payments; }, [payments]);

  const performanceRef = useRef(performance);
  useEffect(() => { performanceRef.current = performance; }, [performance]);

  const currentUserRef = useRef(currentUser);
  useEffect(() => { currentUserRef.current = currentUser; }, [currentUser]);

  // Function to manually or automatically sync state to Cloud Firestore
  const syncDataToCloud = async (overrideData?: {
    classes?: TeachingClass[];
    students?: Student[];
    institutions?: Institution[];
    attendance?: AttendanceRecord[];
    payments?: PaymentRecord[];
    performance?: PerformanceRecord[];
    settings?: TeacherSettings;
  }): Promise<boolean> => {
    const activeUser = currentUserRef.current;
    if (!activeUser) {
      return false;
    }

    setIsSyncing(true);
    setSyncStatus('syncing');

    try {
      const docRef = doc(db, 'users', activeUser.uid, 'data', 'main');

      const dataToSave = {
        settings: overrideData?.settings ?? settingsRef.current,
        students: overrideData?.students ?? studentsRef.current,
        institutions: (overrideData?.institutions ?? institutionsRef.current).map(sanitizeInstitution),
        classes: (overrideData?.classes ?? classesRef.current).map(sanitizeTeachingClass),
        attendance: overrideData?.attendance ?? attendanceRef.current,
        payments: overrideData?.payments ?? paymentsRef.current,
        performance: overrideData?.performance ?? performanceRef.current,
        updatedAt: new Date().toISOString(),
      };

      // Ensure all undefined fields are eliminated recursively
      const cleanData = cleanForFirestore(dataToSave);

      await setDoc(docRef, cleanData, { merge: true });

      const now = new Date();
      setLastSyncedAt(now);
      try {
        localStorage.setItem('teacher_last_cloud_sync', now.toISOString());
      } catch {
        // ignore
      }

      setSyncStatus('synced');
      return true;
    } catch (err: any) {
      console.error('Failed to sync to cloud:', err);
      setSyncStatus('error');
      return false;
    } finally {
      setIsSyncing(false);
    }
  };

  const triggerManualSync = async (): Promise<boolean> => {
    if (!currentUserRef.current) {
      showToast(
        'Sign in to Sync Routines',
        'info',
        'Please sign in with your Google account to back up and sync your routines across devices.'
      );
      openAuthModal();
      return false;
    }

    showToast('Syncing with Google Cloud...', 'info', 'Uploading all routines, tuition classes, and records...');
    const ok = await syncDataToCloud();
    if (ok) {
      const routineCount = classesRef.current.length;
      showToast(
        'Synced with Google Cloud',
        'success',
        `All ${routineCount} routine${routineCount === 1 ? '' : 's'} and timetable records are safely backed up.`
      );
    } else {
      showToast(
        'Sync Error',
        'error',
        'Could not reach Firestore cloud database. Your data is safely saved in local storage.'
      );
    }
    return ok;
  };

  // Firebase Auth listener and Cloud sync
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user: FirebaseUser | null) => {
      setIsAuthLoading(true);
      if (user) {
        const authUser: AuthUser = {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
        };
        setCurrentUser(authUser);
        currentUserRef.current = authUser;

        // Fetch data from Firestore
        try {
          const docRef = doc(db, 'users', user.uid, 'data', 'main');
          const docSnap = await getDoc(docRef);

          if (docSnap.exists()) {
            const data = docSnap.data();

            // Smart Merge Classes/Routines (prevent refresh from wiping new local routines)
            const cloudClasses: TeachingClass[] = Array.isArray(data.classes)
              ? data.classes.map(sanitizeTeachingClass)
              : [];
            let localClasses: TeachingClass[] = [];
            try {
              const saved = localStorage.getItem(STORAGE_KEYS.CLASSES);
              if (saved) localClasses = JSON.parse(saved).map(sanitizeTeachingClass);
            } catch {
              localClasses = classesRef.current;
            }
            const cloudClassIds = new Set(cloudClasses.map(c => c.id));
            const newLocalClasses = localClasses.filter(c => !cloudClassIds.has(c.id));
            const mergedClasses = [...cloudClasses, ...newLocalClasses];
            setClasses(mergedClasses);
            classesRef.current = mergedClasses;
            localStorage.setItem(STORAGE_KEYS.CLASSES, JSON.stringify(mergedClasses));

            // Smart Merge Students
            const cloudStudents: Student[] = Array.isArray(data.students) ? data.students : [];
            let localStudents: Student[] = [];
            try {
              const saved = localStorage.getItem(STORAGE_KEYS.STUDENTS);
              if (saved) localStudents = JSON.parse(saved);
            } catch {
              localStudents = studentsRef.current;
            }
            const cloudStudentIds = new Set(cloudStudents.map(s => s.id));
            const newLocalStudents = localStudents.filter(s => !cloudStudentIds.has(s.id));
            const mergedStudents = [...cloudStudents, ...newLocalStudents];
            setStudents(mergedStudents);
            studentsRef.current = mergedStudents;
            localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(mergedStudents));

            // Smart Merge Institutions
            const cloudInstitutions: Institution[] = Array.isArray(data.institutions)
              ? data.institutions.map(sanitizeInstitution)
              : [];
            let localInstitutions: Institution[] = [];
            try {
              const saved = localStorage.getItem(STORAGE_KEYS.INSTITUTIONS);
              if (saved) localInstitutions = JSON.parse(saved).map(sanitizeInstitution);
            } catch {
              localInstitutions = institutionsRef.current;
            }
            const cloudInstIds = new Set(cloudInstitutions.map(i => i.id));
            const newLocalInstitutions = localInstitutions.filter(i => !cloudInstIds.has(i.id));
            const mergedInstitutions = [...cloudInstitutions, ...newLocalInstitutions];
            setInstitutions(mergedInstitutions);
            institutionsRef.current = mergedInstitutions;
            localStorage.setItem(STORAGE_KEYS.INSTITUTIONS, JSON.stringify(mergedInstitutions));

            // Attendance, Payments, Performance, Settings
            if (Array.isArray(data.attendance)) {
              setAttendance(data.attendance);
              attendanceRef.current = data.attendance;
            }
            if (Array.isArray(data.payments)) {
              setPayments(data.payments);
              paymentsRef.current = data.payments;
            }
            if (Array.isArray(data.performance)) {
              setPerformance(data.performance);
              performanceRef.current = data.performance;
            }
            if (data.settings) {
              setSettings(prev => ({ ...prev, ...data.settings }));
            }

            const now = new Date();
            setLastSyncedAt(now);
            setSyncStatus('synced');

            // If there were local additions that weren't in the cloud yet, push immediately
            if (newLocalClasses.length > 0 || newLocalStudents.length > 0 || newLocalInstitutions.length > 0) {
              const syncPayload = cleanForFirestore({
                settings: data.settings || settingsRef.current,
                students: mergedStudents,
                institutions: mergedInstitutions,
                classes: mergedClasses,
                attendance: data.attendance || attendanceRef.current,
                payments: data.payments || paymentsRef.current,
                performance: data.performance || performanceRef.current,
                updatedAt: new Date().toISOString(),
              });
              setDoc(docRef, syncPayload, { merge: true }).catch(err => console.error('Cloud auto-upload error:', err));
            }
          } else {
            // First time login: upload initial/current state to Cloud
            const initialPayload = cleanForFirestore({
              settings: {
                ...settingsRef.current,
                email: user.email || settingsRef.current.email,
                teacherName: user.displayName || settingsRef.current.teacherName,
              },
              students: studentsRef.current,
              institutions: institutionsRef.current,
              classes: classesRef.current,
              attendance: attendanceRef.current,
              payments: paymentsRef.current,
              performance: performanceRef.current,
              updatedAt: new Date().toISOString(),
            });
            await setDoc(docRef, initialPayload);
            setSyncStatus('synced');
            setLastSyncedAt(new Date());
          }
        } catch (err) {
          console.error('Error fetching cloud data:', err);
          setSyncStatus('error');
        }
      } else {
        setCurrentUser(null);
        currentUserRef.current = null;
        setSyncStatus('idle');
      }
      setIsAuthLoading(false);
      isInitialLoadRef.current = false;
    });

    return () => unsubscribe();
  }, []);

  // One-time entity fee reconciliation on initial mount
  // Ensures any previously edited student/institution fees are strictly synchronized across classes and unpaid payments
  useEffect(() => {
    let classesChanged = false;
    const reconciledClasses = classesRef.current.map((c) => {
      if (c.type === 'home_tuition' && c.studentId) {
        const st = studentsRef.current.find((s) => s.id === c.studentId);
        if (st && (c.feeAmount !== st.feeAmount || c.feeStructure !== st.feeStructure)) {
          classesChanged = true;
          return { ...c, feeAmount: st.feeAmount, feeStructure: st.feeStructure };
        }
      } else if (c.type === 'college' && c.institutionId) {
        const inst = institutionsRef.current.find((i) => i.id === c.institutionId);
        if (
          inst &&
          (c.feeAmount !== inst.rateAmount ||
            c.feeStructure !== inst.paymentStructure ||
            c.semesterDurationMonths !== inst.semesterDurationMonths)
        ) {
          classesChanged = true;
          return {
            ...c,
            feeAmount: inst.rateAmount,
            feeStructure: inst.paymentStructure,
            semesterDurationMonths: inst.semesterDurationMonths,
            semesterName: inst.semesterName,
          };
        }
      }
      return c;
    });

    if (classesChanged) {
      classesRef.current = reconciledClasses;
      setClasses(reconciledClasses);
      localStorage.setItem(STORAGE_KEYS.CLASSES, JSON.stringify(reconciledClasses));
    }

    let paymentsChanged = false;
    const today = new Date().toISOString().split('T')[0];
    const reconciledPayments = paymentsRef.current.map((p) => {
      if (p.status !== 'paid') {
        if (p.studentId) {
          const st = studentsRef.current.find((s) => s.id === p.studentId);
          if (st) {
            const expectedDue =
              st.feeStructure === 'hourly'
                ? Math.round(((st.classDurationMinutes || 60) / 60) * st.feeAmount)
                : st.feeAmount;
            if (p.amountDue !== expectedDue) {
              paymentsChanged = true;
              const rem = Math.max(0, expectedDue - p.amountPaid);
              return {
                ...p,
                amountDue: expectedDue,
                remainingBalance: rem,
                status:
                  rem === 0
                    ? 'paid'
                    : p.amountPaid > 0
                    ? 'partially_paid'
                    : p.dueDate && p.dueDate < today
                    ? 'overdue'
                    : 'pending',
              };
            }
          }
        } else if (p.institutionId) {
          const inst = institutionsRef.current.find((i) => i.id === p.institutionId);
          if (inst) {
            let expectedDue = inst.rateAmount;
            if (inst.paymentStructure === 'semester') {
              expectedDue = Math.round(inst.rateAmount / (inst.semesterDurationMonths || 6));
            } else if (inst.paymentStructure === 'hourly') {
              expectedDue = Math.round(((inst.periodDurationMinutes || 60) / 60) * inst.rateAmount);
            }
            if (p.amountDue !== expectedDue) {
              paymentsChanged = true;
              const rem = Math.max(0, expectedDue - p.amountPaid);
              return {
                ...p,
                amountDue: expectedDue,
                remainingBalance: rem,
                status:
                  rem === 0
                    ? 'paid'
                    : p.amountPaid > 0
                    ? 'partially_paid'
                    : p.dueDate && p.dueDate < today
                    ? 'overdue'
                    : 'pending',
              };
            }
          }
        }
      }
      return p;
    });

    if (paymentsChanged) {
      paymentsRef.current = reconciledPayments;
      setPayments(reconciledPayments);
      localStorage.setItem(STORAGE_KEYS.PAYMENTS, JSON.stringify(reconciledPayments));
    }
  }, []);

  // Auto-sync debounced changes when user is logged in
  useEffect(() => {
    if (!currentUser || isInitialLoadRef.current) return;
    const timer = setTimeout(() => {
      syncDataToCloud();
    }, 1500);

    return () => clearTimeout(timer);
  }, [students, institutions, classes, attendance, payments, performance, settings, currentUser]);

  const loginWithGoogle = async () => {
    try {
      setIsAuthLoading(true);
      await signInWithGoogle();
      setIsAuthModalOpen(false);
    } catch (err) {
      console.error('Google login failed:', err);
      throw err;
    } finally {
      setIsAuthLoading(false);
    }
  };

  const loginWithEmail = async (email: string, password: string) => {
    try {
      setIsAuthLoading(true);
      await signInWithEmail(email, password);
      setIsAuthModalOpen(false);
    } catch (err) {
      console.error('Email login failed:', err);
      throw err;
    } finally {
      setIsAuthLoading(false);
    }
  };

  const signupWithEmail = async (email: string, password: string, displayName?: string) => {
    try {
      setIsAuthLoading(true);
      await signUpWithEmail(email, password, displayName);
      setIsAuthModalOpen(false);
    } catch (err) {
      console.error('Email signup failed:', err);
      throw err;
    } finally {
      setIsAuthLoading(false);
    }
  };

  const sendPasswordReset = async (email: string) => {
    try {
      await resetPassword(email);
    } catch (err) {
      console.error('Password reset failed:', err);
      throw err;
    }
  };

  const logout = async () => {
    try {
      setIsAuthLoading(true);
      await signOutUser();
      setCurrentUser(null);
    } catch (err) {
      console.error('Logout failed:', err);
      throw err;
    } finally {
      setIsAuthLoading(false);
    }
  };

  // Quick Action Modal handlers
  const openQuickAction = (type: string) => {
    setQuickActionType(type);
    setIsQuickActionOpen(true);
  };

  const closeQuickAction = () => {
    setIsQuickActionOpen(false);
    setQuickActionType(null);
  };

  // Settings Actions
  const updateSettings = (newSettings: Partial<TeacherSettings>) => {
    const updated = { ...settingsRef.current, ...newSettings };
    settingsRef.current = updated;
    setSettings(updated);
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updated));
    if (currentUserRef.current) {
      syncDataToCloud({ settings: updated });
    }
  };

  const toggleDateSystem = () => {
    const nextSystem = settingsRef.current.dateSystem === 'AD' ? 'BS' : 'AD';
    updateSettings({ dateSystem: nextSystem });
  };

  const toggleTheme = () => {
    const nextTheme = isDarkMode ? 'light' : 'dark';
    updateSettings({ theme: nextTheme });
  };

  // Student Actions
  const addStudent = (studentData: Omit<Student, 'id' | 'createdAt'>): Student => {
    const newStudent: Student = {
      ...studentData,
      startDate: studentData.startDate || getTodayIso(),
      id: `std-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
    };
    const updatedStudents = [newStudent, ...studentsRef.current];
    studentsRef.current = updatedStudents;
    setStudents(updatedStudents);
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(updatedStudents));

    // Also optionally generate initial payment pending record
    const today = new Date();
    const currentMonthStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
    const recDay = studentData.paymentReceivingDay || studentData.paymentDueDay || 10;
    const graceDays = studentData.dueDays !== undefined ? studentData.dueDays : 5;
    const calSys = studentData.paymentCalendarSystem || (settings.calendarMode || settings.dateSystem) || 'BS';
    const schedule = calculatePaymentSchedule(recDay, graceDays, calSys);
    const dueDateStr = schedule.dueDateIso;

    if (studentData.feeAmount > 0) {
      const initialAmount = studentData.feeStructure === 'hourly'
        ? Math.round(((studentData.classDurationMinutes || 60) / 60) * studentData.feeAmount)
        : studentData.feeAmount;

      const newPay: PaymentRecord = {
        id: `pay-${Date.now()}`,
        type: 'tuition',
        studentId: newStudent.id,
        targetName: newStudent.name,
        periodMonthYear: currentMonthStr,
        amountDue: initialAmount,
        amountPaid: 0,
        remainingBalance: initialAmount,
        paymentDate: '',
        dueDate: dueDateStr,
        paymentMethod: studentData.paymentMethod || 'eSewa',
        status: 'pending',
        referenceNote: `Initial fee record for ${newStudent.name}${
          studentData.feeStructure === 'hourly'
            ? ` (${studentData.classDurationMinutes || 60}m session @ ${studentData.feeAmount}/hr)`
            : ''
        }`,
        recordedAt: new Date().toISOString(),
      };
      const updatedPayments = [newPay, ...paymentsRef.current];
      paymentsRef.current = updatedPayments;
      setPayments(updatedPayments);
      localStorage.setItem(STORAGE_KEYS.PAYMENTS, JSON.stringify(updatedPayments));
      if (currentUserRef.current) {
        syncDataToCloud({ students: updatedStudents, payments: updatedPayments });
      }
    } else if (currentUserRef.current) {
      syncDataToCloud({ students: updatedStudents });
    }

    return newStudent;
  };

  const updateStudent = (id: string, data: Partial<Student>) => {
    const existingStudent = studentsRef.current.find((s) => s.id === id);
    if (!existingStudent) return;

    const mergedStudent = { ...existingStudent, ...data };
    const updated = studentsRef.current.map((s) => (s.id === id ? mergedStudent : s));
    studentsRef.current = updated;
    setStudents(updated);
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(updated));

    // 1. Cascade updates to classes linked to this student
    const updatedClasses = classesRef.current.map((c) => {
      if (c.studentId === id || c.studentIds?.includes(id)) {
        return sanitizeTeachingClass({
          ...c,
          title: data.name ? (c.studentId === id ? `${data.name} - ${c.subject || 'Tuition'}` : c.title.replace(existingStudent.name, data.name)) : c.title,
          feeAmount: data.feeAmount !== undefined ? data.feeAmount : c.feeAmount,
          feeStructure: data.feeStructure !== undefined ? data.feeStructure : c.feeStructure,
          durationMinutes: data.classDurationMinutes !== undefined ? data.classDurationMinutes : c.durationMinutes,
        });
      }
      return c;
    });
    classesRef.current = updatedClasses;
    setClasses(updatedClasses);
    localStorage.setItem(STORAGE_KEYS.CLASSES, JSON.stringify(updatedClasses));

    // 2. Cascade updates to pending / unpaid payments for this student
    const today = new Date().toISOString().split('T')[0];
    const updatedPayments = paymentsRef.current.map((p) => {
      if (p.studentId === id && p.status !== 'paid') {
        const effFee = data.feeAmount !== undefined ? data.feeAmount : existingStudent.feeAmount;
        const effStructure = data.feeStructure !== undefined ? data.feeStructure : existingStudent.feeStructure;
        const effDuration = data.classDurationMinutes !== undefined ? data.classDurationMinutes : (existingStudent.classDurationMinutes || 60);

        const newAmountDue = effStructure === 'hourly'
          ? Math.round((effDuration / 60) * effFee)
          : effFee;

        const newRemaining = Math.max(0, newAmountDue - p.amountPaid);
        let newStatus: PaymentStatus = 'pending';
        if (newRemaining === 0) {
          newStatus = 'paid';
        } else if (p.amountPaid > 0) {
          newStatus = 'partially_paid';
        } else if (p.dueDate && p.dueDate < today) {
          newStatus = 'overdue';
        }

        return {
          ...p,
          amountDue: newAmountDue,
          remainingBalance: newRemaining,
          status: newStatus,
          targetName: data.name || p.targetName,
        };
      } else if (p.studentId === id && data.name) {
        return {
          ...p,
          targetName: data.name,
        };
      }
      return p;
    });
    paymentsRef.current = updatedPayments;
    setPayments(updatedPayments);
    localStorage.setItem(STORAGE_KEYS.PAYMENTS, JSON.stringify(updatedPayments));

    // 3. Cascade updates to attendance records if student name changed
    let updatedAttendance = attendanceRef.current;
    if (data.name) {
      updatedAttendance = attendanceRef.current.map((a) => {
        if (a.studentId === id) {
          return { ...a, targetName: data.name! };
        }
        return a;
      });
      attendanceRef.current = updatedAttendance;
      setAttendance(updatedAttendance);
      localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(updatedAttendance));
    }

    if (currentUserRef.current) {
      syncDataToCloud({
        students: updated,
        classes: updatedClasses,
        payments: updatedPayments,
        attendance: updatedAttendance,
      });
    }
  };

  const deleteStudent = (id: string) => {
    const updatedStudents = studentsRef.current.filter(s => s.id !== id);
    const updatedClasses = classesRef.current.filter(c => c.studentId !== id);
    studentsRef.current = updatedStudents;
    classesRef.current = updatedClasses;
    setStudents(updatedStudents);
    setClasses(updatedClasses);
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(updatedStudents));
    localStorage.setItem(STORAGE_KEYS.CLASSES, JSON.stringify(updatedClasses));
    if (currentUserRef.current) {
      syncDataToCloud({ students: updatedStudents, classes: updatedClasses });
    }
  };

  // Institution Actions
  const addInstitution = (instData: Omit<Institution, 'id' | 'createdAt'>): Institution => {
    const newInst: Institution = sanitizeInstitution({
      ...instData,
      id: `inst-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
    });
    const updated = [newInst, ...institutionsRef.current];
    institutionsRef.current = updated;
    setInstitutions(updated);
    localStorage.setItem(STORAGE_KEYS.INSTITUTIONS, JSON.stringify(updated));
    if (currentUserRef.current) {
      syncDataToCloud({ institutions: updated });
    }
    return newInst;
  };

  const updateInstitution = (id: string, data: Partial<Institution>) => {
    const existingInst = institutionsRef.current.find((i) => i.id === id);
    if (!existingInst) return;

    const mergedInst = sanitizeInstitution({ ...existingInst, ...data });
    const updated = institutionsRef.current.map((i) => (i.id === id ? mergedInst : i));
    institutionsRef.current = updated;
    setInstitutions(updated);
    localStorage.setItem(STORAGE_KEYS.INSTITUTIONS, JSON.stringify(updated));

    // 1. Cascade updates to classes for this institution
    const updatedClasses = classesRef.current.map((c) => {
      if (c.institutionId === id) {
        return sanitizeTeachingClass({
          ...c,
          title: data.name ? `${data.name} - ${c.subject || 'Class'}` : c.title,
          feeAmount: data.rateAmount !== undefined ? data.rateAmount : c.feeAmount,
          feeStructure: data.paymentStructure !== undefined ? data.paymentStructure : c.feeStructure,
          durationMinutes: data.periodDurationMinutes !== undefined ? data.periodDurationMinutes : c.durationMinutes,
          semesterDurationMonths: data.semesterDurationMonths !== undefined ? data.semesterDurationMonths : c.semesterDurationMonths,
          semesterName: data.semesterName !== undefined ? data.semesterName : c.semesterName,
        });
      }
      return c;
    });
    classesRef.current = updatedClasses;
    setClasses(updatedClasses);
    localStorage.setItem(STORAGE_KEYS.CLASSES, JSON.stringify(updatedClasses));

    // 2. Cascade updates to pending / unpaid payments for this college
    const today = new Date().toISOString().split('T')[0];
    const updatedPayments = paymentsRef.current.map((p) => {
      if (p.institutionId === id && p.status !== 'paid') {
        const effRate = data.rateAmount !== undefined ? data.rateAmount : existingInst.rateAmount;
        const effStructure = data.paymentStructure !== undefined ? data.paymentStructure : existingInst.paymentStructure;
        const effDuration = data.periodDurationMinutes !== undefined ? data.periodDurationMinutes : (existingInst.periodDurationMinutes || 60);
        const effSemMonths = data.semesterDurationMonths !== undefined ? data.semesterDurationMonths : (existingInst.semesterDurationMonths || 6);

        let newAmountDue = effRate;
        if (effStructure === 'semester') {
          newAmountDue = Math.round(effRate / effSemMonths);
        } else if (effStructure === 'hourly') {
          newAmountDue = Math.round((effDuration / 60) * effRate);
        }

        const newRemaining = Math.max(0, newAmountDue - p.amountPaid);
        let newStatus: PaymentStatus = 'pending';
        if (newRemaining === 0) {
          newStatus = 'paid';
        } else if (p.amountPaid > 0) {
          newStatus = 'partially_paid';
        } else if (p.dueDate && p.dueDate < today) {
          newStatus = 'overdue';
        }

        return {
          ...p,
          amountDue: newAmountDue,
          remainingBalance: newRemaining,
          status: newStatus,
          targetName: data.name ? `${data.name} (${existingInst.facultyOrGrade})` : p.targetName,
        };
      } else if (p.institutionId === id && data.name) {
        return {
          ...p,
          targetName: `${data.name} (${existingInst.facultyOrGrade})`,
        };
      }
      return p;
    });
    paymentsRef.current = updatedPayments;
    setPayments(updatedPayments);
    localStorage.setItem(STORAGE_KEYS.PAYMENTS, JSON.stringify(updatedPayments));

    // 3. Cascade updates to attendance records if institution name changed
    let updatedAttendance = attendanceRef.current;
    if (data.name) {
      updatedAttendance = attendanceRef.current.map((a) => {
        if (a.institutionId === id) {
          const sec = a.section ? ` (${a.section})` : '';
          return { ...a, targetName: `${data.name}${sec}` };
        }
        return a;
      });
      attendanceRef.current = updatedAttendance;
      setAttendance(updatedAttendance);
      localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(updatedAttendance));
    }

    if (currentUserRef.current) {
      syncDataToCloud({
        institutions: updated,
        classes: updatedClasses,
        payments: updatedPayments,
        attendance: updatedAttendance,
      });
    }
  };

  const deleteInstitution = (id: string) => {
    const updatedInsts = institutionsRef.current.filter(i => i.id !== id);
    const updatedClasses = classesRef.current.filter(c => c.institutionId !== id);
    institutionsRef.current = updatedInsts;
    classesRef.current = updatedClasses;
    setInstitutions(updatedInsts);
    setClasses(updatedClasses);
    localStorage.setItem(STORAGE_KEYS.INSTITUTIONS, JSON.stringify(updatedInsts));
    localStorage.setItem(STORAGE_KEYS.CLASSES, JSON.stringify(updatedClasses));
    if (currentUserRef.current) {
      syncDataToCloud({ institutions: updatedInsts, classes: updatedClasses });
    }
  };

  // Class Actions - Automatic Immediate Persistence and Cloud Synchronization
  const addClass = (clsData: Omit<TeachingClass, 'id'>): TeachingClass => {
    const newCls: TeachingClass = sanitizeTeachingClass({
      ...clsData,
      id: `cls-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    });
    const updated = [newCls, ...classesRef.current];
    classesRef.current = updated;
    setClasses(updated);
    localStorage.setItem(STORAGE_KEYS.CLASSES, JSON.stringify(updated));

    // Immediately trigger cloud sync so new tuition routines are never lost on reload
    if (currentUserRef.current) {
      syncDataToCloud({ classes: updated });
    }

    return newCls;
  };

  const updateClass = (id: string, data: Partial<TeachingClass>) => {
    const existingClass = classesRef.current.find((c) => c.id === id);
    if (!existingClass) return;

    const updatedClass = sanitizeTeachingClass({ ...existingClass, ...data });
    const updated = classesRef.current.map((c) => (c.id === id ? updatedClass : c));
    classesRef.current = updated;
    setClasses(updated);
    localStorage.setItem(STORAGE_KEYS.CLASSES, JSON.stringify(updated));

    // If tuition fee/structure was modified on class, synchronize with student profile & payments
    let updatedStudents = studentsRef.current;
    let updatedInstitutions = institutionsRef.current;
    let updatedPayments = paymentsRef.current;

    if (
      updatedClass.type === 'home_tuition' &&
      updatedClass.studentId &&
      (data.feeAmount !== undefined || data.feeStructure !== undefined || data.durationMinutes !== undefined)
    ) {
      const st = studentsRef.current.find((s) => s.id === updatedClass.studentId);
      if (st) {
        updatedStudents = studentsRef.current.map((s) => {
          if (s.id === updatedClass.studentId) {
            return {
              ...s,
              feeAmount: data.feeAmount !== undefined ? data.feeAmount : s.feeAmount,
              feeStructure: data.feeStructure !== undefined ? data.feeStructure : s.feeStructure,
              classDurationMinutes: data.durationMinutes !== undefined ? data.durationMinutes : s.classDurationMinutes,
            };
          }
          return s;
        });
        studentsRef.current = updatedStudents;
        setStudents(updatedStudents);
        localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(updatedStudents));

        const today = new Date().toISOString().split('T')[0];
        const effFee = data.feeAmount !== undefined ? data.feeAmount : st.feeAmount;
        const effStructure = data.feeStructure !== undefined ? data.feeStructure : st.feeStructure;
        const effDur = data.durationMinutes !== undefined ? data.durationMinutes : (st.classDurationMinutes || 60);
        const expectedDue = effStructure === 'hourly' ? Math.round((effDur / 60) * effFee) : effFee;

        updatedPayments = paymentsRef.current.map((p) => {
          if (p.studentId === updatedClass.studentId && p.status !== 'paid') {
            const rem = Math.max(0, expectedDue - p.amountPaid);
            let pStatus: PaymentStatus =
              rem === 0
                ? 'paid'
                : p.amountPaid > 0
                ? 'partially_paid'
                : p.dueDate && p.dueDate < today
                ? 'overdue'
                : 'pending';
            return { ...p, amountDue: expectedDue, remainingBalance: rem, status: pStatus };
          }
          return p;
        });
        paymentsRef.current = updatedPayments;
        setPayments(updatedPayments);
        localStorage.setItem(STORAGE_KEYS.PAYMENTS, JSON.stringify(updatedPayments));
      }
    } else if (
      updatedClass.type === 'college' &&
      updatedClass.institutionId &&
      (data.feeAmount !== undefined || data.feeStructure !== undefined || data.durationMinutes !== undefined)
    ) {
      const inst = institutionsRef.current.find((i) => i.id === updatedClass.institutionId);
      if (inst) {
        updatedInstitutions = institutionsRef.current.map((i) => {
          if (i.id === updatedClass.institutionId) {
            return sanitizeInstitution({
              ...i,
              rateAmount: data.feeAmount !== undefined ? data.feeAmount : i.rateAmount,
              paymentStructure: data.feeStructure !== undefined ? data.feeStructure : i.paymentStructure,
              periodDurationMinutes: data.durationMinutes !== undefined ? data.durationMinutes : i.periodDurationMinutes,
            });
          }
          return i;
        });
        institutionsRef.current = updatedInstitutions;
        setInstitutions(updatedInstitutions);
        localStorage.setItem(STORAGE_KEYS.INSTITUTIONS, JSON.stringify(updatedInstitutions));

        const today = new Date().toISOString().split('T')[0];
        const effRate = data.feeAmount !== undefined ? data.feeAmount : inst.rateAmount;
        const effStructure = data.feeStructure !== undefined ? data.feeStructure : inst.paymentStructure;
        const effDur = data.durationMinutes !== undefined ? data.durationMinutes : (inst.periodDurationMinutes || 60);
        const effSem = inst.semesterDurationMonths || 6;
        let expectedDue = effRate;
        if (effStructure === 'semester') {
          expectedDue = Math.round(effRate / effSem);
        } else if (effStructure === 'hourly') {
          expectedDue = Math.round((effDur / 60) * effRate);
        }

        updatedPayments = paymentsRef.current.map((p) => {
          if (p.institutionId === updatedClass.institutionId && p.status !== 'paid') {
            const rem = Math.max(0, expectedDue - p.amountPaid);
            let pStatus: PaymentStatus =
              rem === 0
                ? 'paid'
                : p.amountPaid > 0
                ? 'partially_paid'
                : p.dueDate && p.dueDate < today
                ? 'overdue'
                : 'pending';
            return { ...p, amountDue: expectedDue, remainingBalance: rem, status: pStatus };
          }
          return p;
        });
        paymentsRef.current = updatedPayments;
        setPayments(updatedPayments);
        localStorage.setItem(STORAGE_KEYS.PAYMENTS, JSON.stringify(updatedPayments));
      }
    }

    if (currentUserRef.current) {
      syncDataToCloud({
        classes: updated,
        students: updatedStudents,
        institutions: updatedInstitutions,
        payments: updatedPayments,
      });
    }
  };

  const deleteClass = (id: string) => {
    const updated = classesRef.current.filter(c => c.id !== id);
    classesRef.current = updated;
    setClasses(updated);
    localStorage.setItem(STORAGE_KEYS.CLASSES, JSON.stringify(updated));

    if (currentUserRef.current) {
      syncDataToCloud({ classes: updated });
    }
  };

  // Attendance Actions
  const markAttendance = (recordData: Omit<AttendanceRecord, 'id' | 'recordedAt'>) => {
    // Check if attendance already recorded for this class & date
    const existingIndex = attendance.findIndex(
      a => a.classId === recordData.classId && a.date === recordData.date && a.studentId === recordData.studentId
    );

    if (existingIndex >= 0) {
      setAttendance(prev => {
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          ...recordData,
          recordedAt: new Date().toISOString(),
        };
        return updated;
      });
    } else {
      const newRecord: AttendanceRecord = {
        ...recordData,
        id: `att-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        recordedAt: new Date().toISOString(),
      };
      setAttendance(prev => [newRecord, ...prev]);
    }
  };

  const updateAttendance = (id: string, data: Partial<AttendanceRecord>) => {
    setAttendance(prev => prev.map(a => (a.id === id ? { ...a, ...data } : a)));
  };

  const deleteAttendance = (id: string) => {
    setAttendance(prev => prev.filter(a => a.id !== id));
  };

  const batchMarkAttendanceToday = (status: AttendanceStatus) => {
    const todayIso = getTodayIso();

    todayClasses.forEach(cls => {
      let targetName = cls.title;
      if (cls.type === 'home_tuition') {
        const student = students.find(s => s.id === cls.studentId);
        if (student) targetName = student.name;
        if (cls.groupName) targetName = cls.groupName;
      } else if (cls.type === 'college') {
        const inst = institutions.find(i => i.id === cls.institutionId);
        if (inst) {
          const secName = (cls as any).sectionName || cls.section;
          targetName = secName ? `${inst.name} (${secName})` : inst.name;
        }
      }

      markAttendance({
        date: todayIso,
        classId: cls.id,
        type: cls.type,
        studentId: cls.studentId,
        institutionId: cls.institutionId,
        targetName,
        subject: cls.subject,
        startTime: cls.startTime,
        endTime: cls.endTime,
        durationMinutes: cls.durationMinutes,
        periodsCount: cls.type === 'college' ? 1 : undefined,
        section: (cls as any).sectionName || cls.section,
        sectionSlotId: (cls as any).sectionSlotId,
        status,
        notes: `Batch marked as ${status}${(cls as any).sectionName ? ` for ${(cls as any).sectionName}` : ''}`,
      });
    });
  };

  const rescheduleTodayClass = (params: {
    classId: string;
    fromDate: string;
    toDate: string;
    newStartTime: string;
    newEndTime: string;
    newDurationMinutes: number;
    reason?: string;
  }) => {
    const { classId, fromDate, toDate, newStartTime, newEndTime, newDurationMinutes, reason } = params;
    const targetClass = classes.find((c) => c.id === classId);
    if (!targetClass) return;

    let targetName = targetClass.title;
    if (targetClass.type === 'home_tuition') {
      const student = students.find((s) => s.id === targetClass.studentId);
      if (student) targetName = student.name;
      if (targetClass.groupName) targetName = targetClass.groupName;
    } else if (targetClass.type === 'college') {
      const inst = institutions.find((i) => i.id === targetClass.institutionId);
      if (inst) {
        targetName = targetClass.section ? `${inst.name} (${targetClass.section})` : inst.name;
      }
    }

    // 1. Mark fromDate (today) attendance as 'rescheduled'
    markAttendance({
      date: fromDate,
      classId,
      type: targetClass.type,
      studentId: targetClass.studentId,
      institutionId: targetClass.institutionId,
      targetName,
      subject: targetClass.subject,
      startTime: targetClass.startTime,
      endTime: targetClass.endTime,
      durationMinutes: targetClass.durationMinutes,
      status: 'rescheduled',
      isRescheduled: true,
      rescheduledToDate: toDate,
      rescheduledToTime: `${newStartTime} - ${newEndTime}`,
      rescheduledReason: reason,
      notes: `Rescheduled to ${toDate} (${newStartTime} - ${newEndTime})${reason ? `: ${reason}` : ''}`,
    });

    // 2. Add or update dateSpecificSchedule on the target class for toDate
    const existingDateSpecifics = targetClass.dateSpecificSchedules || [];
    const filteredSpecifics = existingDateSpecifics.filter((s) => s.date !== toDate);
    const newOverride = {
      id: `resched-${Date.now()}`,
      date: toDate,
      startTime: newStartTime,
      endTime: newEndTime,
      durationMinutes: newDurationMinutes,
      note: `Rescheduled session from ${fromDate}${reason ? ` (${reason})` : ''}`,
    };

    updateClass(classId, {
      dateSpecificSchedules: [...filteredSpecifics, newOverride],
    });

    showToast(
      'Class Rescheduled',
      'success',
      `${targetName} rescheduled from ${fromDate} to ${toDate} (${newStartTime} - ${newEndTime})`
    );
  };

  // Payment Actions
  const recordPayment = (paymentData: Omit<PaymentRecord, 'id' | 'recordedAt'>) => {
    const remainingBalance = Math.max(0, paymentData.amountDue - paymentData.amountPaid);
    let status: PaymentRecord['status'] = paymentData.status;

    if (paymentData.amountPaid >= paymentData.amountDue && paymentData.amountDue > 0) {
      status = 'paid';
    } else if (paymentData.amountPaid > 0 && paymentData.amountPaid < paymentData.amountDue) {
      status = 'partially_paid';
    }

    const newPayment: PaymentRecord = {
      ...paymentData,
      remainingBalance,
      status,
      id: `pay-${Date.now()}`,
      receiptNumber: paymentData.receiptNumber || `REC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      recordedAt: new Date().toISOString(),
    };

    setPayments(prev => [newPayment, ...prev]);
  };

  const updatePayment = (id: string, data: Partial<PaymentRecord>) => {
    setPayments(prev =>
      prev.map(p => {
        if (p.id === id) {
          const amountDue = data.amountDue !== undefined ? data.amountDue : p.amountDue;
          const amountPaid = data.amountPaid !== undefined ? data.amountPaid : p.amountPaid;
          const remainingBalance = Math.max(0, amountDue - amountPaid);
          let status = data.status || p.status;
          if (amountPaid >= amountDue && amountDue > 0) {
            status = 'paid';
          } else if (amountPaid > 0 && amountPaid < amountDue) {
            status = 'partially_paid';
          }
          return {
            ...p,
            ...data,
            amountDue,
            amountPaid,
            remainingBalance,
            status,
          };
        }
        return p;
      })
    );
  };

  const deletePayment = (id: string) => {
    setPayments(prev => prev.filter(p => p.id !== id));
  };

  // Performance Actions
  const addPerformance = (recordData: Omit<PerformanceRecord, 'id' | 'recordedAt' | 'percentage' | 'grade'>) => {
    const percentage = recordData.fullMarks > 0
      ? Number(((recordData.obtainedMarks / recordData.fullMarks) * 100).toFixed(2))
      : 0;
    const { grade } = calculateGrade(percentage);

    const newRecord: PerformanceRecord = {
      ...recordData,
      percentage,
      grade,
      id: `perf-${Date.now()}`,
      recordedAt: new Date().toISOString(),
    };

    setPerformance(prev => [newRecord, ...prev]);
  };

  const updatePerformance = (id: string, data: Partial<PerformanceRecord>) => {
    setPerformance(prev =>
      prev.map(p => {
        if (p.id === id) {
          const fullMarks = data.fullMarks !== undefined ? data.fullMarks : p.fullMarks;
          const obtainedMarks = data.obtainedMarks !== undefined ? data.obtainedMarks : p.obtainedMarks;
          const percentage = fullMarks > 0 ? Number(((obtainedMarks / fullMarks) * 100).toFixed(2)) : p.percentage;
          const { grade } = calculateGrade(percentage);
          return {
            ...p,
            ...data,
            fullMarks,
            obtainedMarks,
            percentage,
            grade,
          };
        }
        return p;
      })
    );
  };

  const deletePerformance = (id: string) => {
    setPerformance(prev => prev.filter(p => p.id !== id));
  };

  // Student Mode Actions
  const addStudentClass = (cls: Omit<StudentClassItem, 'id'>): StudentClassItem => {
    const newClass: StudentClassItem = {
      ...cls,
      id: `s-cls-${Date.now()}`,
    };
    setStudentClasses(prev => [...prev, newClass]);
    return newClass;
  };

  const updateStudentClass = (id: string, data: Partial<StudentClassItem>) => {
    setStudentClasses(prev =>
      prev.map(c => (c.id === id ? { ...c, ...data } : c))
    );
  };

  const deleteStudentClass = (id: string) => {
    setStudentClasses(prev => prev.filter(c => c.id !== id));
  };

  const addStudentExam = (exam: Omit<StudentExamMark, 'id' | 'createdAt'>): StudentExamMark => {
    const newExam: StudentExamMark = {
      ...exam,
      id: `s-exam-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setStudentExams(prev => [newExam, ...prev]);
    return newExam;
  };

  const updateStudentExam = (id: string, data: Partial<StudentExamMark>) => {
    setStudentExams(prev =>
      prev.map(e => (e.id === id ? { ...e, ...data } : e))
    );
  };

  const deleteStudentExam = (id: string) => {
    setStudentExams(prev => prev.filter(e => e.id !== id));
  };

  const updateStudentProfile = (profile: Partial<StudentRoutineSettings>) => {
    setStudentProfile(prev => ({ ...prev, ...profile }));
  };

  // Notifications
  const markNotificationAsRead = (id: string) => {
    setDismissedNotifIds(prev => [...prev, id]);
  };

  const clearAllNotifications = () => {
    const allIds = notifications.map(n => n.id);
    setDismissedNotifIds(prev => Array.from(new Set([...prev, ...allIds])));
  };

  // Computed Summaries
  const todayDayName: DayOfWeek = useMemo(() => {
    const days: DayOfWeek[] = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[new Date().getDay()];
  }, []);

  const todayClasses = useMemo(() => {
    const todayIso = getTodayIso();
    const result: (TeachingClass & { sectionSlotId?: string; sectionName?: string })[] = [];

    classes.forEach(c => {
      if (!c.isActive) return;
      const slots = resolveClassDaySlots(c, todayDayName, todayIso);
      if (slots.length === 0) return;

      slots.forEach((slot, idx) => {
        const hasMultipleSlots = slots.length > 1;
        const sectionLabel = slot.section || c.section;
        const sectionSuffix = sectionLabel ? ` (${sectionLabel})` : '';
        const titleWithSection = sectionLabel && !c.title.includes(sectionLabel)
          ? `${c.title}${sectionSuffix}`
          : c.title;

        result.push({
          ...c,
          // Unique identifier for each period/section slot today
          id: hasMultipleSlots ? `${c.id}__slot__${slot.slotId || idx}` : c.id,
          title: titleWithSection,
          subject: slot.subject || c.subject,
          location: slot.room || c.location,
          startTime: slot.startTime,
          endTime: slot.endTime,
          durationMinutes: slot.durationMinutes,
          section: sectionLabel,
          sectionSlotId: slot.slotId,
          sectionName: sectionLabel,
        });
      });
    });

    return result.sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [classes, todayDayName]);

  const activeStudentsCount = useMemo(() => {
    return students.filter(s => s.status === 'active').length;
  }, [students]);

  const classesScheduledTodayCount = useMemo(() => {
    return todayClasses.length;
  }, [todayClasses]);

  const pendingPayments = useMemo(() => {
    return payments.filter(p => p.status === 'pending' || p.status === 'partially_paid');
  }, [payments]);

  const overduePayments = useMemo(() => {
    const today = getTodayIso();
    return payments.filter(p => {
      if (p.status === 'paid') return false;
      if (p.status === 'overdue') return true;
      if (p.dueDate && p.dueDate < today && p.remainingBalance > 0) return true;
      return false;
    });
  }, [payments]);

  // Current Month Income Breakdown
  const currentMonthTuitionIncome = useMemo(() => {
    const today = new Date();
    const currentMonthIso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;

    let received = 0;
    let expected = 0;
    let pending = 0;

    payments
      .filter(p => (p.type === 'tuition' || p.type === 'tuition_fee' || (!p.institutionId && !!p.studentId)) && (p.periodMonthYear === currentMonthIso || p.paymentDate?.startsWith(currentMonthIso)))
      .forEach(p => {
        received += p.amountPaid;
        expected += p.amountDue;
        pending += p.remainingBalance;
      });

    return { received, expected, pending };
  }, [payments]);

  const currentMonthCollegeIncome = useMemo(() => {
    const today = new Date();
    const currentMonthIso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;

    let received = 0;
    let earned = 0;
    let pending = 0;

    payments
      .filter(p => (p.type === 'college_salary' || (!p.studentId && !!p.institutionId)) && (p.periodMonthYear === currentMonthIso || p.paymentDate?.startsWith(currentMonthIso)))
      .forEach(p => {
        received += p.amountPaid;
        earned += p.amountDue;
        pending += p.remainingBalance;
      });

    // Also calculate earned from attendance records this month if per_period or hourly
    attendance
      .filter(a => a.type === 'college' && a.date.startsWith(currentMonthIso) && a.status === 'present')
      .forEach(a => {
        const inst = institutions.find(i => i.id === a.institutionId);
        if (inst) {
          if (inst.paymentStructure === 'per_period') {
            const periods = a.periodsCount || 1;
            earned += periods * (inst.rateAmount || 0);
          } else if (inst.paymentStructure === 'hourly') {
            const durationMins = a.durationMinutes || 60;
            earned += Math.round((durationMins / 60) * (inst.rateAmount || 0));
          }
        }
      });

    return { received, earned, pending };
  }, [payments, attendance, institutions]);

  const totalWorkingHoursThisMonth = useMemo(() => {
    const today = new Date();
    const currentMonthIso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;

    const totalMinutes = attendance
      .filter(a => a.date.startsWith(currentMonthIso) && a.status === 'present')
      .reduce((sum, a) => sum + (a.durationMinutes || 60), 0);

    return Number((totalMinutes / 60).toFixed(1));
  }, [attendance]);

  const totalClassesThisMonth = useMemo(() => {
    const today = new Date();
    const currentMonthIso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;

    return attendance.filter(a => a.date.startsWith(currentMonthIso) && a.status === 'present').length;
  }, [attendance]);

  // Dynamic In-App Notifications
  const notifications: NotificationItem[] = useMemo(() => {
    const items: NotificationItem[] = [];
    const todayIso = getTodayIso();
    const reminderWindow = settings.reminderDaysBeforeDue || 3;

    // 1. Overdue payments (Tuition & College)
    overduePayments.forEach(p => {
      const notifId = `notif-overdue-${p.id}`;
      if (!dismissedNotifIds.includes(notifId)) {
        const dualDate = p.dueDate ? formatDualDate(p.dueDate) : 'earlier this month';
        items.push({
          id: notifId,
          type: 'payment_overdue',
          title: `Overdue Fee: ${p.targetName}`,
          message: `Pending balance of Rs. ${p.remainingBalance.toLocaleString()} was due on ${dualDate}.`,
          date: p.dueDate || todayIso,
          priority: 'high',
          actionLink: 'payments',
          isRead: false,
        });
      }
    });

    // 2. Payments Due Today or Due Soon (within reminder window)
    payments.forEach(p => {
      if (p.status === 'paid' || p.remainingBalance <= 0 || !p.dueDate) return;
      if (p.dueDate === todayIso) {
        const notifId = `notif-due-today-${p.id}`;
        if (!dismissedNotifIds.includes(notifId)) {
          items.push({
            id: notifId,
            type: 'payment_due_soon',
            title: `Payment Due Today: ${p.targetName}`,
            message: `Fee of Rs. ${p.remainingBalance.toLocaleString()} is due today (${formatDualDate(p.dueDate)}).`,
            date: p.dueDate,
            priority: 'high',
            actionLink: 'payments',
            isRead: false,
          });
        }
      } else if (p.dueDate > todayIso) {
        const dueTime = new Date(p.dueDate + 'T12:00:00').getTime();
        const todayTime = new Date(todayIso + 'T12:00:00').getTime();
        const daysLeft = Math.round((dueTime - todayTime) / (1000 * 60 * 60 * 24));
        if (daysLeft > 0 && daysLeft <= reminderWindow) {
          const notifId = `notif-due-soon-${p.id}`;
          if (!dismissedNotifIds.includes(notifId)) {
            items.push({
              id: notifId,
              type: 'payment_due_soon',
              title: `Payment Due Soon: ${p.targetName}`,
              message: `Fee of Rs. ${p.remainingBalance.toLocaleString()} is due in ${daysLeft} day(s) on ${formatDualDate(p.dueDate)}.`,
              date: p.dueDate,
              priority: 'medium',
              actionLink: 'payments',
              isRead: false,
            });
          }
        }
      }
    });

    // 3. College Contract Salary Due / Overdue Notifications
    const today = new Date();
    const currentMonthIso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
    institutions.filter(inst => inst.status === 'active').forEach(inst => {
      const recDay = inst.paymentReceivingDay || inst.paymentDueDay || 1;
      const graceDays = inst.dueDays !== undefined ? inst.dueDays : 5;
      const calSys = inst.paymentCalendarSystem || (settings.calendarMode || settings.dateSystem) || 'BS';
      const schedule = calculatePaymentSchedule(recDay, graceDays, calSys);

      // Check if salary record already exists for this institution in current month
      const isPaidThisMonth = payments.some(
        p => p.institutionId === inst.id &&
             (p.periodMonthYear === currentMonthIso || p.paymentDate?.startsWith(currentMonthIso)) &&
             p.status === 'paid'
      );

      if (!isPaidThisMonth) {
        const estAmount = inst.rateAmount || 0;
        if (schedule.dueDateIso < todayIso) {
          const notifId = `notif-inst-overdue-${inst.id}-${currentMonthIso}`;
          if (!dismissedNotifIds.includes(notifId)) {
            items.push({
              id: notifId,
              type: 'payment_overdue',
              title: `College Salary Overdue: ${inst.name}`,
              message: `Monthly salary of Rs. ${estAmount.toLocaleString()} (${schedule.cycleMonthLabel}) was due on ${schedule.dueDateDual}.`,
              date: schedule.dueDateIso,
              priority: 'high',
              actionLink: 'institutions',
              isRead: false,
            });
          }
        } else if (schedule.dueDateIso === todayIso) {
          const notifId = `notif-inst-today-${inst.id}-${currentMonthIso}`;
          if (!dismissedNotifIds.includes(notifId)) {
            items.push({
              id: notifId,
              type: 'payment_due_soon',
              title: `College Salary Due Today: ${inst.name}`,
              message: `Monthly salary of Rs. ${estAmount.toLocaleString()} (${schedule.cycleMonthLabel}) is due today (${schedule.dueDateDual}).`,
              date: schedule.dueDateIso,
              priority: 'high',
              actionLink: 'institutions',
              isRead: false,
            });
          }
        } else if (schedule.daysUntilDue > 0 && schedule.daysUntilDue <= reminderWindow) {
          const notifId = `notif-inst-soon-${inst.id}-${currentMonthIso}`;
          if (!dismissedNotifIds.includes(notifId)) {
            items.push({
              id: notifId,
              type: 'payment_due_soon',
              title: `College Salary Due Soon: ${inst.name}`,
              message: `Monthly salary of Rs. ${estAmount.toLocaleString()} is due in ${schedule.daysUntilDue} day(s) on ${schedule.dueDateDual}.`,
              date: schedule.dueDateIso,
              priority: 'medium',
              actionLink: 'institutions',
              isRead: false,
            });
          }
        }
      }
    });

    // 3.5 Student Tuition Fee Due / Overdue Notifications
    students.filter(std => std.status === 'active').forEach(std => {
      const recDay = std.paymentReceivingDay || std.paymentDueDay || 10;
      const graceDays = std.dueDays !== undefined ? std.dueDays : 5;
      const calSys = std.paymentCalendarSystem || (settings.calendarMode || settings.dateSystem) || 'BS';
      const schedule = calculatePaymentSchedule(recDay, graceDays, calSys);

      // Check if student has paid for this cycle
      const isPaidThisMonth = payments.some(
        p => p.studentId === std.id &&
             (p.periodMonthYear === currentMonthIso || p.paymentDate?.startsWith(currentMonthIso)) &&
             p.status === 'paid'
      );

      if (!isPaidThisMonth) {
        const estAmount = std.feeAmount || 0;
        if (schedule.dueDateIso < todayIso) {
          const notifId = `notif-std-overdue-${std.id}-${currentMonthIso}`;
          if (!dismissedNotifIds.includes(notifId)) {
            items.push({
              id: notifId,
              type: 'payment_overdue',
              title: `Tuition Fee Overdue: ${std.name}`,
              message: `Fee of Rs. ${estAmount.toLocaleString()} (${schedule.cycleMonthLabel}) was due on ${schedule.dueDateDual}.`,
              date: schedule.dueDateIso,
              priority: 'high',
              actionLink: 'payments',
              isRead: false,
            });
          }
        } else if (schedule.dueDateIso === todayIso) {
          const notifId = `notif-std-today-${std.id}-${currentMonthIso}`;
          if (!dismissedNotifIds.includes(notifId)) {
            items.push({
              id: notifId,
              type: 'payment_due_soon',
              title: `Tuition Fee Due Today: ${std.name}`,
              message: `Fee of Rs. ${estAmount.toLocaleString()} (${schedule.cycleMonthLabel}) is due today (${schedule.dueDateDual}).`,
              date: schedule.dueDateIso,
              priority: 'high',
              actionLink: 'payments',
              isRead: false,
            });
          }
        } else if (schedule.daysUntilDue > 0 && schedule.daysUntilDue <= reminderWindow) {
          const notifId = `notif-std-soon-${std.id}-${currentMonthIso}`;
          if (!dismissedNotifIds.includes(notifId)) {
            items.push({
              id: notifId,
              type: 'payment_due_soon',
              title: `Tuition Fee Due Soon: ${std.name}`,
              message: `Fee of Rs. ${estAmount.toLocaleString()} is due in ${schedule.daysUntilDue} day(s) on ${schedule.dueDateDual}.`,
              date: schedule.dueDateIso,
              priority: 'medium',
              actionLink: 'payments',
              isRead: false,
            });
          }
        }
      }
    });

    // 4. Pending attendance for today's classes
    const recordedClassIdsToday = attendance.filter(a => a.date === todayIso).map(a => a.classId);
    const unrecordedClassesToday = todayClasses.filter(c => !recordedClassIdsToday.includes(c.id));
    if (unrecordedClassesToday.length > 0) {
      const notifId = `notif-att-${todayIso}`;
      if (!dismissedNotifIds.includes(notifId)) {
        items.push({
          id: notifId,
          type: 'attendance_pending',
          title: `${unrecordedClassesToday.length} Classes Pending Attendance`,
          message: `You have ${unrecordedClassesToday.length} classes scheduled today that need attendance verification.`,
          date: todayIso,
          priority: 'medium',
          actionLink: 'attendance',
          isRead: false,
        });
      }
    }

    // 5. Performance alerts (students who scored < 40%)
    performance.forEach(perf => {
      if (perf.percentage < 40) {
        const notifId = `notif-perf-${perf.id}`;
        if (!dismissedNotifIds.includes(notifId)) {
          items.push({
            id: notifId,
            type: 'performance_alert',
            title: `Performance Alert: ${perf.studentName}`,
            message: `Scored ${perf.obtainedMarks}/${perf.fullMarks} (${perf.percentage}%) in ${perf.subject} (${perf.examName}). Extra attention recommended.`,
            date: perf.date,
            priority: 'medium',
            actionLink: 'performance',
            isRead: false,
          });
        }
      }
    });

    return items;
  }, [overduePayments, payments, institutions, settings, todayClasses, attendance, performance, dismissedNotifIds]);

  // Export Data JSON
  const exportDataJson = () => {
    const exportObject = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      settings,
      students,
      institutions,
      classes,
      attendance,
      payments,
      performance,
    };
    const jsonString = JSON.stringify(exportObject, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `teacher-class-tuition-backup-${getTodayIso()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Import Data JSON
  const importDataJson = (jsonData: string): { success: boolean; error?: string } => {
    try {
      const parsed = JSON.parse(jsonData);
      if (parsed.settings) setSettings(parsed.settings);
      if (Array.isArray(parsed.students)) setStudents(parsed.students);
      if (Array.isArray(parsed.institutions)) setInstitutions(parsed.institutions.map(sanitizeInstitution));
      if (Array.isArray(parsed.classes)) setClasses(parsed.classes.map(sanitizeTeachingClass));
      if (Array.isArray(parsed.attendance)) setAttendance(parsed.attendance);
      if (Array.isArray(parsed.payments)) setPayments(parsed.payments);
      if (Array.isArray(parsed.performance)) setPerformance(parsed.performance);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Invalid JSON backup format' };
    }
  };

  // Reset to sample data
  const resetToSampleData = () => {
    setSettings(INITIAL_SETTINGS);
    setStudents(INITIAL_STUDENTS);
    setInstitutions(INITIAL_INSTITUTIONS);
    setClasses(INITIAL_CLASSES);
    setAttendance(INITIAL_ATTENDANCE);
    setPayments(INITIAL_PAYMENTS);
    setPerformance(INITIAL_PERFORMANCE);
    setDismissedNotifIds([]);
  };

  // Reset Option 1: Delete All (Wipe all student and teacher data, preserve teacher login email)
  const resetAllData = async () => {
    const preservedEmail = currentUser?.email || settings.email || '';
    const resetSettings: TeacherSettings = {
      ...INITIAL_SETTINGS,
      teacherName: '',
      email: preservedEmail,
      phone: '',
      qualification: '',
      specialization: '',
    };

    setSettings(resetSettings);
    setStudents([]);
    setInstitutions([]);
    setClasses([]);
    setAttendance([]);
    setPayments([]);
    setPerformance([]);
    setDismissedNotifIds([]);

    // Clear local storage
    localStorage.removeItem(STORAGE_KEYS.STUDENTS);
    localStorage.removeItem(STORAGE_KEYS.INSTITUTIONS);
    localStorage.removeItem(STORAGE_KEYS.CLASSES);
    localStorage.removeItem(STORAGE_KEYS.ATTENDANCE);
    localStorage.removeItem(STORAGE_KEYS.PAYMENTS);
    localStorage.removeItem(STORAGE_KEYS.PERFORMANCE);
    localStorage.removeItem(STORAGE_KEYS.DISMISSED_NOTIFICATIONS);
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(resetSettings));

    // Clear cloud Firestore if logged in
    if (currentUser) {
      try {
        setIsSyncing(true);
        const docRef = doc(db, 'users', currentUser.uid, 'data', 'main');
        await setDoc(docRef, {
          settings: resetSettings,
          students: [],
          institutions: [],
          classes: [],
          attendance: [],
          payments: [],
          performance: [],
          updatedAt: new Date().toISOString(),
        });
        setSyncStatus('synced');
      } catch (err) {
        console.error('Failed to reset cloud data:', err);
      } finally {
        setIsSyncing(false);
      }
    }
  };

  // Reset Option 2: Teacher Only (Wipe teacher profile information, keep email, colleges & students)
  const resetTeacherDataOnly = async () => {
    const preservedEmail = currentUser?.email || settings.email || '';
    const resetSettings: TeacherSettings = {
      ...settings,
      teacherName: '',
      email: preservedEmail,
      phone: '',
      qualification: '',
      specialization: '',
      address: '',
      bio: '',
    };

    setSettings(resetSettings);

    // Save local storage
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(resetSettings));

    // Sync cloud Firestore if logged in
    if (currentUser) {
      try {
        setIsSyncing(true);
        const docRef = doc(db, 'users', currentUser.uid, 'data', 'main');
        await setDoc(
          docRef,
          {
            settings: resetSettings,
            updatedAt: new Date().toISOString(),
          },
          { merge: true }
        );
        setSyncStatus('synced');
      } catch (err) {
        console.error('Failed to sync teacher reset to cloud:', err);
      } finally {
        setIsSyncing(false);
      }
    }
  };

  // Reset Option 3: Students Only (Wipe all student profiles, routines, attendance & fees, keep teacher profile & colleges)
  const resetStudentsDataOnly = async () => {
    setStudents([]);
    const updatedClasses = classes.filter(c => c.type !== 'home_tuition' && !c.studentId);
    setClasses(updatedClasses);
    const updatedAttendance = attendance.filter(a => a.type !== 'tuition' && !a.studentId);
    setAttendance(updatedAttendance);
    const updatedPayments = payments.filter(p => p.type !== 'tuition_fee' && p.type !== 'tuition' && !p.studentId);
    setPayments(updatedPayments);
    setPerformance([]);

    // Save local storage
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.CLASSES, JSON.stringify(updatedClasses));
    localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(updatedAttendance));
    localStorage.setItem(STORAGE_KEYS.PAYMENTS, JSON.stringify(updatedPayments));
    localStorage.setItem(STORAGE_KEYS.PERFORMANCE, JSON.stringify([]));

    // Sync cloud Firestore if logged in
    if (currentUser) {
      try {
        setIsSyncing(true);
        const docRef = doc(db, 'users', currentUser.uid, 'data', 'main');
        await setDoc(
          docRef,
          {
            students: [],
            classes: updatedClasses,
            attendance: updatedAttendance,
            payments: updatedPayments,
            performance: [],
            updatedAt: new Date().toISOString(),
          },
          { merge: true }
        );
        setSyncStatus('synced');
      } catch (err) {
        console.error('Failed to sync student reset to cloud:', err);
      } finally {
        setIsSyncing(false);
      }
    }
  };

  // Reset Option 4: Colleges Only (Wipe all institutions, college classes, college attendance & college salaries)
  const resetCollegesDataOnly = async () => {
    setInstitutions([]);
    const updatedClasses = classes.filter(c => c.type !== 'college' && !c.institutionId);
    setClasses(updatedClasses);
    const updatedAttendance = attendance.filter(a => a.type !== 'college' && !a.institutionId);
    setAttendance(updatedAttendance);
    const updatedPayments = payments.filter(p => p.type !== 'college_salary' && !p.institutionId);
    setPayments(updatedPayments);

    // Save local storage
    localStorage.setItem(STORAGE_KEYS.INSTITUTIONS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.CLASSES, JSON.stringify(updatedClasses));
    localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(updatedAttendance));
    localStorage.setItem(STORAGE_KEYS.PAYMENTS, JSON.stringify(updatedPayments));

    // Sync cloud Firestore if logged in
    if (currentUser) {
      try {
        setIsSyncing(true);
        const docRef = doc(db, 'users', currentUser.uid, 'data', 'main');
        await setDoc(
          docRef,
          {
            institutions: [],
            classes: updatedClasses,
            attendance: updatedAttendance,
            payments: updatedPayments,
            updatedAt: new Date().toISOString(),
          },
          { merge: true }
        );
        setSyncStatus('synced');
      } catch (err) {
        console.error('Failed to sync college reset to cloud:', err);
      } finally {
        setIsSyncing(false);
      }
    }
  };

  // Clear all data (Legacy helper)
  const clearAllData = () => {
    resetAllData();
  };

  return (
    <AppContext.Provider
      value={{
        activeTab,
        setActiveTab,
        searchQuery,
        setSearchQuery,
        isSidebarOpen,
        setIsSidebarOpen,
        toggleSidebar,
        closeSidebar,
        isQuickActionOpen,
        setIsQuickActionOpen,
        quickActionType,
        openQuickAction,
        closeQuickAction,
        isNotificationOpen,
        setIsNotificationOpen,
        isSearchModalOpen,
        setIsSearchModalOpen,
        openSearchModal,
        closeSearchModal,
        isAuthModalOpen,
        setIsAuthModalOpen,
        openAuthModal,
        closeAuthModal,

        isResetModalOpen,
        setIsResetModalOpen,
        resetModalInitialType,
        openResetModal,
        closeResetModal,
        resetAllData,
        resetTeacherDataOnly,
        resetStudentsDataOnly,
        resetCollegesDataOnly,

        // Auth & Cloud Sync
        currentUser,
        isAuthLoading,
        isSyncing,
        syncStatus,
        lastSyncedAt,
        loginWithGoogle,
        loginWithEmail,
        signupWithEmail,
        sendPasswordReset,
        logout,
        syncDataToCloud,
        triggerManualSync,
        toast,
        showToast,
        dismissToast,

        settings,
        updateSettings,
        toggleDateSystem,
        isDarkMode,
        toggleTheme,

        students,
        addStudent,
        updateStudent,
        deleteStudent,

        institutions,
        addInstitution,
        updateInstitution,
        deleteInstitution,

        classes,
        addClass,
        updateClass,
        deleteClass,

        attendance,
        markAttendance,
        updateAttendance,
        deleteAttendance,
        batchMarkAttendanceToday,
        rescheduleTodayClass,

        payments,
        recordPayment,
        updatePayment,
        deletePayment,

        performance,
        addPerformance,
        updatePerformance,
        deletePerformance,
        addPerformanceRecord: addPerformance,
        updatePerformanceRecord: updatePerformance,
        deletePerformanceRecord: deletePerformance,

        notifications,
        markNotificationAsRead,
        clearAllNotifications,

        // Student Mode State & Handlers
        appMode,
        setAppMode,
        studentClasses,
        addStudentClass,
        updateStudentClass,
        deleteStudentClass,
        studentExams,
        addStudentExam,
        updateStudentExam,
        deleteStudentExam,
        studentProfile,
        updateStudentProfile,

        todayClasses,
        todayDayName,
        activeStudentsCount,
        classesScheduledTodayCount,
        pendingPayments,
        overduePayments,
        currentMonthTuitionIncome,
        currentMonthCollegeIncome,
        totalWorkingHoursThisMonth,
        totalClassesThisMonth,

        exportDataJson,
        importDataJson,
        resetToSampleData,
        clearAllData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
