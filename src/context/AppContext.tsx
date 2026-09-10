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
} from '../types';
import {
  INITIAL_SETTINGS,
  INITIAL_STUDENTS,
  INITIAL_INSTITUTIONS,
  INITIAL_CLASSES,
  INITIAL_ATTENDANCE,
  INITIAL_PAYMENTS,
  INITIAL_PERFORMANCE,
} from '../utils/sampleData';
import { getTodayIso, adToBs } from '../utils/nepaliCalendar';
import { calculateGrade } from '../utils/formatters';
import { resolveClassSchedule } from '../utils/scheduleHelpers';
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
} from '../lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

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
  loginWithGoogle: () => Promise<void>;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  signupWithEmail: (email: string, password: string, displayName?: string) => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  syncDataToCloud: () => Promise<void>;

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
      return saved ? JSON.parse(saved) : INITIAL_CLASSES;
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

        // Fetch data from Firestore
        try {
          const docRef = doc(db, 'users', user.uid, 'data', 'main');
          const docSnap = await getDoc(docRef);

          if (docSnap.exists()) {
            const data = docSnap.data();
            if (data.settings) setSettings(prev => ({ ...prev, ...data.settings }));
            if (Array.isArray(data.students)) setStudents(data.students);
            if (Array.isArray(data.institutions)) setInstitutions(data.institutions.map(sanitizeInstitution));
            if (Array.isArray(data.classes)) setClasses(data.classes);
            if (Array.isArray(data.attendance)) setAttendance(data.attendance);
            if (Array.isArray(data.payments)) setPayments(data.payments);
            if (Array.isArray(data.performance)) setPerformance(data.performance);
            setSyncStatus('synced');
          } else {
            // First time login: upload initial/current state to Cloud
            await setDoc(docRef, {
              settings: {
                ...settings,
                email: user.email || settings.email,
                teacherName: user.displayName || settings.teacherName,
              },
              students,
              institutions,
              classes,
              attendance,
              payments,
              performance,
              updatedAt: new Date().toISOString(),
            });
            setSyncStatus('synced');
          }
        } catch (err) {
          console.error('Error fetching cloud data:', err);
          setSyncStatus('error');
        }
      } else {
        setCurrentUser(null);
        setSyncStatus('idle');
      }
      setIsAuthLoading(false);
      isInitialLoadRef.current = false;
    });

    return () => unsubscribe();
  }, []);

  // Function to manually or automatically sync state to Cloud Firestore
  const syncDataToCloud = async () => {
    if (!currentUser) return;
    setIsSyncing(true);
    setSyncStatus('syncing');
    try {
      const docRef = doc(db, 'users', currentUser.uid, 'data', 'main');
      await setDoc(
        docRef,
        {
          settings,
          students,
          institutions,
          classes,
          attendance,
          payments,
          performance,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
      setSyncStatus('synced');
    } catch (err) {
      console.error('Failed to sync to cloud:', err);
      setSyncStatus('error');
    } finally {
      setIsSyncing(false);
    }
  };

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
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  const toggleDateSystem = () => {
    setSettings(prev => ({
      ...prev,
      dateSystem: prev.dateSystem === 'AD' ? 'BS' : 'AD',
    }));
  };

  const toggleTheme = () => {
    setSettings(prev => {
      const nextTheme = isDarkMode ? 'light' : 'dark';
      return { ...prev, theme: nextTheme };
    });
  };

  // Student Actions
  const addStudent = (studentData: Omit<Student, 'id' | 'createdAt'>): Student => {
    const newStudent: Student = {
      ...studentData,
      startDate: studentData.startDate || getTodayIso(),
      id: `std-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setStudents(prev => [newStudent, ...prev]);

    // Also optionally generate initial payment pending record
    const today = new Date();
    const currentMonthStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
    const dueDay = String(studentData.paymentDueDay || 10).padStart(2, '0');
    const dueDateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${dueDay}`;

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
      setPayments(prev => [newPay, ...prev]);
    }

    return newStudent;
  };

  const updateStudent = (id: string, data: Partial<Student>) => {
    setStudents(prev => prev.map(s => (s.id === id ? { ...s, ...data } : s)));
    // Also update student names in classes/attendance if changed
    if (data.name) {
      setClasses(prev => prev.map(c => c.studentId === id ? { ...c, title: c.title.replace(s => s, data.name!) } : c));
    }
  };

  const deleteStudent = (id: string) => {
    setStudents(prev => prev.filter(s => s.id !== id));
    setClasses(prev => prev.filter(c => c.studentId !== id));
  };

  // Institution Actions
  const addInstitution = (instData: Omit<Institution, 'id' | 'createdAt'>): Institution => {
    const newInst: Institution = sanitizeInstitution({
      ...instData,
      id: `inst-${Date.now()}`,
      createdAt: new Date().toISOString(),
    });
    setInstitutions(prev => [newInst, ...prev]);
    return newInst;
  };

  const updateInstitution = (id: string, data: Partial<Institution>) => {
    setInstitutions(prev => prev.map(i => (i.id === id ? sanitizeInstitution({ ...i, ...data }) : i)));
  };

  const deleteInstitution = (id: string) => {
    setInstitutions(prev => prev.filter(i => i.id !== id));
    setClasses(prev => prev.filter(c => c.institutionId !== id));
  };

  // Class Actions
  const addClass = (clsData: Omit<TeachingClass, 'id'>): TeachingClass => {
    const newCls: TeachingClass = {
      ...clsData,
      id: `cls-${Date.now()}`,
    };
    setClasses(prev => [newCls, ...prev]);
    return newCls;
  };

  const updateClass = (id: string, data: Partial<TeachingClass>) => {
    setClasses(prev => prev.map(c => (c.id === id ? { ...c, ...data } : c)));
  };

  const deleteClass = (id: string) => {
    setClasses(prev => prev.filter(c => c.id !== id));
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
    const days: DayOfWeek[] = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const currentDay = days[new Date().getDay()];
    const todayClsList = classes.filter(c => c.isActive && c.scheduleDays.includes(currentDay));

    todayClsList.forEach(cls => {
      let targetName = cls.title;
      if (cls.type === 'home_tuition') {
        const student = students.find(s => s.id === cls.studentId);
        if (student) targetName = student.name;
        if (cls.groupName) targetName = cls.groupName;
      } else if (cls.type === 'college') {
        const inst = institutions.find(i => i.id === cls.institutionId);
        if (inst) targetName = inst.name;
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
        status,
        notes: `Batch marked as ${status}`,
      });
    });
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
    return classes
      .filter(c => {
        if (!c.isActive) return false;
        const hasDateOverride = c.dateSpecificSchedules?.some(d => d.date === todayIso);
        if (hasDateOverride) return true;
        return c.scheduleDays.includes(todayDayName);
      })
      .map(c => {
        const resolved = resolveClassSchedule(c, todayDayName, todayIso);
        return {
          ...c,
          startTime: resolved.startTime,
          endTime: resolved.endTime,
          durationMinutes: resolved.durationMinutes,
        };
      })
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
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
      .filter(p => p.type === 'tuition' && (p.periodMonthYear === currentMonthIso || p.paymentDate?.startsWith(currentMonthIso)))
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
      .filter(p => p.type === 'college_salary' && (p.periodMonthYear === currentMonthIso || p.paymentDate?.startsWith(currentMonthIso)))
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

    // 1. Overdue payments
    overduePayments.forEach(p => {
      const notifId = `notif-overdue-${p.id}`;
      if (!dismissedNotifIds.includes(notifId)) {
        items.push({
          id: notifId,
          type: 'payment_overdue',
          title: `Overdue Fee: ${p.targetName}`,
          message: `Pending balance of Rs. ${p.remainingBalance.toLocaleString()} was due on ${p.dueDate || 'earlier this month'}.`,
          date: p.dueDate || todayIso,
          priority: 'high',
          actionLink: 'payments',
          isRead: false,
        });
      }
    });

    // 2. Pending attendance for today's classes
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

    // 3. Performance alerts (students who scored < 40%)
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
  }, [overduePayments, todayClasses, attendance, performance, dismissedNotifIds]);

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
      if (Array.isArray(parsed.institutions)) setInstitutions(parsed.institutions);
      if (Array.isArray(parsed.classes)) setClasses(parsed.classes);
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
        loginWithGoogle,
        loginWithEmail,
        signupWithEmail,
        sendPasswordReset,
        logout,
        syncDataToCloud,

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
