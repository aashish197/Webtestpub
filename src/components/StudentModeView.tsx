import React, { useState, useMemo, useEffect } from 'react';
import {
  BookOpen,
  School,
  GraduationCap,
  Sparkles,
  Plus,
  Clock,
  Calendar,
  Award,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Trash2,
  Edit3,
  Brain,
  Coffee,
  Sun,
  Moon,
  ChevronRight,
  Filter,
  RefreshCw,
  Target,
  Zap,
  Check,
  X,
  Layers,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { StudentClassItem, StudentExamMark, StudentRoutineSettings, DayOfWeek } from '../types';
import { formatDisplayDate, getTodayIso } from '../utils/nepaliCalendar';

const DAYS_OF_WEEK: DayOfWeek[] = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export const StudentModeView: React.FC = () => {
  const {
    studentClasses,
    studentExams,
    studentProfile,
    addStudentClass,
    updateStudentClass,
    deleteStudentClass,
    addStudentExam,
    updateStudentExam,
    deleteStudentExam,
    updateStudentProfile,
    settings,
    setAppMode,
  } = useApp();

  // Navigation tab inside Student Mode
  const [activeTab, setActiveTab] = useState<'routine' | 'classes' | 'exams' | 'ai_coach'>('routine');

  // Modals
  const [isClassModalOpen, setIsClassModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<StudentClassItem | null>(null);

  const [isExamModalOpen, setIsExamModalOpen] = useState(false);
  const [editingExam, setEditingExam] = useState<StudentExamMark | null>(null);

  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // Filters
  const [classTypeFilter, setClassTypeFilter] = useState<'all' | 'school' | 'tuition'>('all');
  const [examTypeFilter, setExamTypeFilter] = useState<'all' | 'terminal_exam' | 'unit_test'>('all');

  // AI Advisor States
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [freeTimeAiResult, setFreeTimeAiResult] = useState<any>(null);
  const [examAiResult, setExamAiResult] = useState<any>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  // Form states for Class
  const [classForm, setClassForm] = useState<Omit<StudentClassItem, 'id'>>({
    type: 'school',
    subject: '',
    teacherOrInstitute: '',
    scheduleDays: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    startTime: '09:00',
    endTime: '09:45',
    durationMinutes: 45,
    location: '',
    color: '#3b82f6',
    notes: '',
    isActive: true,
  });

  // Form states for Exam Mark
  const [examForm, setExamForm] = useState<Omit<StudentExamMark, 'id' | 'createdAt' | 'percentage' | 'grade'>>({
    examType: 'terminal_exam',
    termName: 'First Terminal Examination',
    subject: '',
    date: getTodayIso(),
    fullMarks: 100,
    passMarks: 40,
    obtainedMarks: 75,
    weakTopics: [],
    strongTopics: [],
    remarks: '',
  });
  const [weakInput, setWeakInput] = useState('');
  const [strongInput, setStrongInput] = useState('');

  // Profile Form state
  const [profileForm, setProfileForm] = useState<StudentRoutineSettings>(() => ({
    ...studentProfile,
    studentName: studentProfile?.studentName || '',
    grade: studentProfile?.grade || '',
    schoolName: studentProfile?.schoolName || '',
    examGoals: studentProfile?.examGoals || '',
    targetBedTime: studentProfile?.targetBedTime || '22:30',
    targetWakeUpTime: studentProfile?.targetWakeUpTime || '06:00',
    targetDailySelfStudyHours: studentProfile?.targetDailySelfStudyHours ?? 3.5,
  }));

  useEffect(() => {
    if (studentProfile) {
      setProfileForm({
        ...studentProfile,
        studentName: studentProfile.studentName || '',
        grade: studentProfile.grade || '',
        schoolName: studentProfile.schoolName || '',
        examGoals: studentProfile.examGoals || '',
        targetBedTime: studentProfile.targetBedTime || '22:30',
        targetWakeUpTime: studentProfile.targetWakeUpTime || '06:00',
        targetDailySelfStudyHours: studentProfile.targetDailySelfStudyHours ?? 3.5,
      });
    }
  }, [studentProfile]);

  // Time & Routine Calculations
  const timeCalculations = useMemo(() => {
    // Calculate total daily scheduled class minutes across the week
    const activeClasses = studentClasses.filter((c) => c.isActive);
    const weeklySchoolMins = activeClasses
      .filter((c) => c.type === 'school')
      .reduce((sum, c) => sum + c.durationMinutes * c.scheduleDays.length, 0);

    const weeklyTuitionMins = activeClasses
      .filter((c) => c.type === 'tuition')
      .reduce((sum, c) => sum + c.durationMinutes * c.scheduleDays.length, 0);

    // Average per day (dividing by 6 working days)
    const dailySchoolHours = Number((weeklySchoolMins / 6 / 60).toFixed(1));
    const dailyTuitionHours = Number((weeklyTuitionMins / 6 / 60).toFixed(1));
    const totalClassHours = Number((dailySchoolHours + dailyTuitionHours).toFixed(1));

    // Self study hours from profile
    const selfStudyHours = studentProfile.targetDailySelfStudyHours || 3;

    // Sleep calculation from bedtime to wakeup
    const parseTimeToMins = (t: string) => {
      const [h, m] = (t || '06:00').split(':').map(Number);
      return h * 60 + m;
    };
    const wakeMins = parseTimeToMins(studentProfile.targetWakeUpTime);
    const bedMins = parseTimeToMins(studentProfile.targetBedTime);
    let sleepMins = 0;
    if (bedMins > wakeMins) {
      sleepMins = 24 * 60 - bedMins + wakeMins;
    } else {
      sleepMins = wakeMins - bedMins;
    }
    const sleepHours = Number((sleepMins / 60).toFixed(1));

    // Routine & meals (approx 2.5 hours)
    const routineCareHours = 2.5;

    // Total Study
    const totalStudyHours = Number((totalClassHours + selfStudyHours).toFixed(1));

    // Rest = Sleep + Breaks (approx 1.5h)
    const restHours = Number((sleepHours + 1.5).toFixed(1));

    // Remaining Free Time
    const committedHours = totalClassHours + selfStudyHours + sleepHours + routineCareHours;
    const freeHours = Math.max(0.5, Number((24 - committedHours).toFixed(1)));

    return {
      dailySchoolHours,
      dailyTuitionHours,
      totalClassHours,
      selfStudyHours,
      totalStudyHours,
      sleepHours,
      restHours,
      freeHours,
    };
  }, [studentClasses, studentProfile]);

  // Exam marks calculations
  const examStats = useMemo(() => {
    if (studentExams.length === 0) return { avgPercentage: 0, total: 0, highest: null, lowest: null };
    const avg = Math.round(
      studentExams.reduce((sum, e) => sum + e.percentage, 0) / studentExams.length
    );
    const sorted = [...studentExams].sort((a, b) => b.percentage - a.percentage);
    return {
      avgPercentage: avg,
      total: studentExams.length,
      highest: sorted[0],
      lowest: sorted[sorted.length - 1],
    };
  }, [studentExams]);

  // Filtered lists
  const filteredClasses = useMemo(() => {
    return studentClasses.filter((c) => {
      if (classTypeFilter === 'school') return c.type === 'school';
      if (classTypeFilter === 'tuition') return c.type === 'tuition';
      return true;
    });
  }, [studentClasses, classTypeFilter]);

  const filteredExams = useMemo(() => {
    return studentExams.filter((e) => {
      if (examTypeFilter === 'terminal_exam') return e.examType === 'terminal_exam';
      if (examTypeFilter === 'unit_test') return e.examType === 'unit_test';
      return true;
    });
  }, [studentExams, examTypeFilter]);

  // AI Suggestions Handler
  const handleFetchAiFreeTimeSuggestions = async () => {
    setIsAiLoading(true);
    setAiError(null);
    try {
      const res = await fetch('/api/student-ai-advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'free_time_suggestions',
          classes: studentClasses,
          exams: studentExams,
          profile: studentProfile,
          timeStats: timeCalculations,
        }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        setFreeTimeAiResult(data.data);
      } else {
        throw new Error(data.message || 'Failed to fetch AI suggestions');
      }
    } catch (err: any) {
      setAiError(err.message || 'Could not connect to AI advisor');
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleFetchAiExamFeedback = async () => {
    setIsAiLoading(true);
    setAiError(null);
    try {
      const res = await fetch('/api/student-ai-advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'exam_feedback',
          classes: studentClasses,
          exams: studentExams,
          profile: studentProfile,
          timeStats: timeCalculations,
        }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        setExamAiResult(data.data);
      } else {
        throw new Error(data.message || 'Failed to analyze exam marks');
      }
    } catch (err: any) {
      setAiError(err.message || 'Could not generate exam feedback');
    } finally {
      setIsAiLoading(false);
    }
  };

  // Helper to open Class modal
  const openAddClassModal = (defaultType: 'school' | 'tuition' = 'school') => {
    setEditingClass(null);
    setClassForm({
      type: defaultType,
      subject: '',
      teacherOrInstitute: defaultType === 'school' ? studentProfile.schoolName || '' : '',
      scheduleDays: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      startTime: defaultType === 'school' ? '10:00' : '17:00',
      endTime: defaultType === 'school' ? '10:45' : '18:00',
      durationMinutes: defaultType === 'school' ? 45 : 60,
      location: '',
      color: defaultType === 'school' ? '#3b82f6' : '#ec4899',
      notes: '',
      isActive: true,
    });
    setIsClassModalOpen(true);
  };

  const openEditClassModal = (cls: StudentClassItem) => {
    setEditingClass(cls);
    setClassForm({
      type: cls.type,
      subject: cls.subject,
      teacherOrInstitute: cls.teacherOrInstitute,
      scheduleDays: [...cls.scheduleDays],
      startTime: cls.startTime,
      endTime: cls.endTime,
      durationMinutes: cls.durationMinutes,
      location: cls.location || '',
      color: cls.color || '#3b82f6',
      notes: cls.notes || '',
      isActive: cls.isActive,
    });
    setIsClassModalOpen(true);
  };

  const handleSaveClass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!classForm.subject.trim()) return;

    if (editingClass) {
      updateStudentClass(editingClass.id, classForm);
    } else {
      addStudentClass(classForm);
    }
    setIsClassModalOpen(false);
  };

  // Helper to open Exam modal
  const openAddExamModal = () => {
    setEditingExam(null);
    setExamForm({
      examType: 'terminal_exam',
      termName: 'Second Terminal Examination',
      subject: '',
      date: getTodayIso(),
      fullMarks: 100,
      passMarks: 40,
      obtainedMarks: 75,
      weakTopics: [],
      strongTopics: [],
      remarks: '',
    });
    setWeakInput('');
    setStrongInput('');
    setIsExamModalOpen(true);
  };

  const openEditExamModal = (exam: StudentExamMark) => {
    setEditingExam(exam);
    setExamForm({
      examType: exam.examType,
      termName: exam.termName,
      subject: exam.subject,
      date: exam.date,
      fullMarks: exam.fullMarks,
      passMarks: exam.passMarks,
      obtainedMarks: exam.obtainedMarks,
      weakTopics: [...(exam.weakTopics || [])],
      strongTopics: [...(exam.strongTopics || [])],
      remarks: exam.remarks || '',
    });
    setWeakInput('');
    setStrongInput('');
    setIsExamModalOpen(true);
  };

  const handleSaveExam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!examForm.subject.trim()) return;

    const fullMarks = Number(examForm.fullMarks) || 100;
    const obtainedMarks = Number(examForm.obtainedMarks) || 0;
    const percentage = Number(((obtainedMarks / fullMarks) * 100).toFixed(1));

    let grade = 'F';
    if (percentage >= 90) grade = 'A+';
    else if (percentage >= 80) grade = 'A';
    else if (percentage >= 70) grade = 'B+';
    else if (percentage >= 60) grade = 'B';
    else if (percentage >= 50) grade = 'C+';
    else if (percentage >= 40) grade = 'C';
    else if (percentage >= 35) grade = 'D';

    const payload = {
      ...examForm,
      fullMarks,
      passMarks: Number(examForm.passMarks) || 40,
      obtainedMarks,
      percentage,
      grade,
    };

    if (editingExam) {
      updateStudentExam(editingExam.id, payload);
    } else {
      addStudentExam(payload);
    }
    setIsExamModalOpen(false);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateStudentProfile(profileForm);
    setIsProfileModalOpen(false);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner & Mode Switcher Bar */}
      <div className="bg-linear-to-r from-indigo-700 via-purple-700 to-pink-600 rounded-3xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-bold tracking-wide uppercase flex items-center gap-1.5">
                <GraduationCap className="w-4 h-4" />
                Student Mode Active
              </span>
              <span className="text-xs bg-pink-500/80 px-2.5 py-0.5 rounded-full font-semibold">
                {studentProfile.grade}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {studentProfile.studentName}’s Learning Hub
            </h1>
            <p className="text-white/80 text-sm mt-1 max-w-xl">
              Manage school & tuition timetables, analyze terminal and unit test marks, balance study vs. rest time, and receive smart AI insights.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:self-center">
            {/* Quick Switch to Teacher Mode */}
            <button
              onClick={() => setAppMode('teacher')}
              className="px-4 py-2.5 bg-white text-purple-900 hover:bg-purple-50 rounded-xl font-bold text-xs shadow-md transition flex items-center gap-2 hover:scale-[1.02]"
            >
              <School className="w-4 h-4 text-purple-700" />
              Switch to Teacher Mode
            </button>

            <button
              onClick={() => {
                setProfileForm(studentProfile);
                setIsProfileModalOpen(true);
              }}
              className="px-3.5 py-2.5 bg-white/15 hover:bg-white/25 rounded-xl text-xs font-semibold backdrop-blur-md border border-white/20 transition flex items-center gap-1.5"
            >
              <Edit3 className="w-3.5 h-3.5" />
              Edit Profile & Goals
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl">
          <button
            onClick={() => setActiveTab('routine')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === 'routine'
                ? 'bg-white dark:bg-slate-900 text-purple-700 dark:text-purple-300 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            Study vs. Rest Balance
          </button>

          <button
            onClick={() => setActiveTab('classes')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === 'classes'
                ? 'bg-white dark:bg-slate-900 text-purple-700 dark:text-purple-300 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            School & Tuition Classes ({studentClasses.length})
          </button>

          <button
            onClick={() => setActiveTab('exams')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === 'exams'
                ? 'bg-white dark:bg-slate-900 text-purple-700 dark:text-purple-300 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            Terminal & Unit Tests ({studentExams.length})
          </button>

          <button
            onClick={() => setActiveTab('ai_coach')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === 'ai_coach'
                ? 'bg-linear-to-r from-purple-600 to-pink-600 text-white shadow-xs'
                : 'text-purple-600 dark:text-purple-400 font-semibold hover:bg-purple-50 dark:hover:bg-purple-950/40'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            AI Suggestions & Insights
          </button>
        </div>

        {/* Dynamic Action Button based on sub-tab */}
        <div>
          {activeTab === 'classes' && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => openAddClassModal('school')}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl flex items-center gap-1 shadow-xs transition"
              >
                <Plus className="w-3.5 h-3.5" />
                Add School Class
              </button>
              <button
                onClick={() => openAddClassModal('tuition')}
                className="px-3 py-1.5 bg-pink-600 hover:bg-pink-700 text-white text-xs font-bold rounded-xl flex items-center gap-1 shadow-xs transition"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Tuition Class
              </button>
            </div>
          )}

          {activeTab === 'exams' && (
            <button
              onClick={openAddExamModal}
              className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-xs transition"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Test / Exam Mark
            </button>
          )}

          {activeTab === 'ai_coach' && (
            <button
              onClick={handleFetchAiFreeTimeSuggestions}
              disabled={isAiLoading}
              className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-xs transition disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isAiLoading ? 'animate-spin' : ''}`} />
              Generate New Suggestions
            </button>
          )}
        </div>
      </div>

      {/* SUB-TAB 1: STUDY VS REST TIME CALCULATION */}
      {activeTab === 'routine' && (
        <div className="space-y-6">
          {/* Main Time Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="flex items-center justify-between text-xs text-blue-600 dark:text-blue-400 font-semibold mb-1">
                <span className="flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4" />
                  School & Tuition
                </span>
                <span>Daily Avg</span>
              </div>
              <p className="text-2xl font-extrabold text-slate-900 dark:text-white">
                {timeCalculations.totalClassHours} <span className="text-sm font-semibold text-slate-500">hrs/day</span>
              </p>
              <div className="text-xs text-slate-500 mt-1 flex justify-between">
                <span>School: {timeCalculations.dailySchoolHours}h</span>
                <span>Tuition: {timeCalculations.dailyTuitionHours}h</span>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="flex items-center justify-between text-xs text-emerald-600 dark:text-emerald-400 font-semibold mb-1">
                <span className="flex items-center gap-1.5">
                  <Brain className="w-4 h-4" />
                  Self-Study Goal
                </span>
                <span>Target</span>
              </div>
              <p className="text-2xl font-extrabold text-slate-900 dark:text-white">
                {timeCalculations.selfStudyHours} <span className="text-sm font-semibold text-slate-500">hrs/day</span>
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Total Study Time: <strong>{timeCalculations.totalStudyHours} hrs</strong>
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="flex items-center justify-between text-xs text-purple-600 dark:text-purple-400 font-semibold mb-1">
                <span className="flex items-center gap-1.5">
                  <Moon className="w-4 h-4" />
                  Rest & Sleep
                </span>
                <span>Recharge</span>
              </div>
              <p className="text-2xl font-extrabold text-slate-900 dark:text-white">
                {timeCalculations.sleepHours} <span className="text-sm font-semibold text-slate-500">hrs sleep</span>
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Bed: {studentProfile.targetBedTime} • Wake: {studentProfile.targetWakeUpTime}
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="flex items-center justify-between text-xs text-amber-600 dark:text-amber-400 font-semibold mb-1">
                <span className="flex items-center gap-1.5">
                  <Sun className="w-4 h-4" />
                  Discretionary Free Time
                </span>
                <span>Available</span>
              </div>
              <p className="text-2xl font-extrabold text-slate-900 dark:text-white">
                ~{timeCalculations.freeHours} <span className="text-sm font-semibold text-slate-500">hrs/day</span>
              </p>
              <p className="text-xs text-amber-600 dark:text-amber-400 font-medium mt-1">
                Ideal for sports, reading & refresh
              </p>
            </div>
          </div>

          {/* 24-Hour Visual Balance Bar */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Layers className="w-4 h-4 text-purple-600" />
                  24-Hour Daily Allocation Breakdown
                </h3>
                <p className="text-xs text-slate-500">
                  Calculated from your active school schedule, tuition batches, self-study targets, and sleep intervals.
                </p>
              </div>
              <button
                onClick={() => setIsProfileModalOpen(true)}
                className="text-xs text-purple-600 dark:text-purple-400 font-semibold hover:underline flex items-center gap-1 self-start"
              >
                Adjust Schedule Parameters
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Segmented Bar */}
            <div className="h-6 w-full bg-slate-100 dark:bg-slate-800 rounded-xl overflow-hidden flex shadow-inner">
              <div
                style={{ width: `${(timeCalculations.dailySchoolHours / 24) * 100}%` }}
                className="bg-blue-500 h-full flex items-center justify-center text-[10px] text-white font-bold px-1 truncate"
                title={`School Classes: ${timeCalculations.dailySchoolHours}h`}
              >
                School ({timeCalculations.dailySchoolHours}h)
              </div>
              <div
                style={{ width: `${(timeCalculations.dailyTuitionHours / 24) * 100}%` }}
                className="bg-pink-500 h-full flex items-center justify-center text-[10px] text-white font-bold px-1 truncate"
                title={`Tuition: ${timeCalculations.dailyTuitionHours}h`}
              >
                Tuition ({timeCalculations.dailyTuitionHours}h)
              </div>
              <div
                style={{ width: `${(timeCalculations.selfStudyHours / 24) * 100}%` }}
                className="bg-emerald-500 h-full flex items-center justify-center text-[10px] text-white font-bold px-1 truncate"
                title={`Self-Study: ${timeCalculations.selfStudyHours}h`}
              >
                Self-Study ({timeCalculations.selfStudyHours}h)
              </div>
              <div
                style={{ width: `${(timeCalculations.sleepHours / 24) * 100}%` }}
                className="bg-indigo-600 h-full flex items-center justify-center text-[10px] text-white font-bold px-1 truncate"
                title={`Sleep: ${timeCalculations.sleepHours}h`}
              >
                Sleep ({timeCalculations.sleepHours}h)
              </div>
              <div
                style={{ width: `${(timeCalculations.freeHours / 24) * 100}%` }}
                className="bg-amber-400 h-full flex items-center justify-center text-[10px] text-slate-900 font-bold px-1 truncate"
                title={`Free Time: ${timeCalculations.freeHours}h`}
              >
                Free (~{timeCalculations.freeHours}h)
              </div>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-slate-600 dark:text-slate-400">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> School ({timeCalculations.dailySchoolHours}h)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-pink-500" /> Tuition ({timeCalculations.dailyTuitionHours}h)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Self-Study ({timeCalculations.selfStudyHours}h)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" /> Sleep ({timeCalculations.sleepHours}h)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400" /> Free / Rest (~{timeCalculations.freeHours}h)
              </span>
            </div>
          </div>

          {/* Quick AI Free Time Recommendation Callout */}
          <div className="p-5 rounded-2xl bg-linear-to-r from-purple-50 to-pink-50 dark:from-purple-950/40 dark:to-pink-950/30 border border-purple-200 dark:border-purple-900/60 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-purple-600 text-white shadow-xs">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  Get AI Recommendations for Your ~{timeCalculations.freeHours} Hours Free Time
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                  Let AI analyze your class intensity and suggest high-yield micro-revisions, active recovery walks, or relaxation routines.
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                setActiveTab('ai_coach');
                if (!freeTimeAiResult) handleFetchAiFreeTimeSuggestions();
              }}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shrink-0 shadow-xs transition flex items-center gap-1.5"
            >
              <Zap className="w-3.5 h-3.5" />
              Explore Free Time Activities
            </button>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: SCHOOL & TUITION CLASSES */}
      {activeTab === 'classes' && (
        <div className="space-y-4">
          {/* Class Category Filter Pills */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setClassTypeFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                classTypeFilter === 'all'
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              All Classes ({studentClasses.length})
            </button>
            <button
              onClick={() => setClassTypeFilter('school')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                classTypeFilter === 'school'
                  ? 'bg-blue-600 text-white'
                  : 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300'
              }`}
            >
              <School className="w-3.5 h-3.5" />
              School Only ({studentClasses.filter((c) => c.type === 'school').length})
            </button>
            <button
              onClick={() => setClassTypeFilter('tuition')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                classTypeFilter === 'tuition'
                  ? 'bg-pink-600 text-white'
                  : 'bg-pink-50 text-pink-700 dark:bg-pink-950/40 dark:text-pink-300'
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5" />
              Tuition Batches ({studentClasses.filter((c) => c.type === 'tuition').length})
            </button>
          </div>

          {/* Classes Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredClasses.map((cls) => (
              <div
                key={cls.id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs hover:border-purple-300 dark:hover:border-purple-800 transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span
                        className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md ${
                          cls.type === 'school'
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                            : 'bg-pink-100 text-pink-800 dark:bg-pink-950 dark:text-pink-300'
                        }`}
                      >
                        {cls.type === 'school' ? 'School Class' : 'Tuition Class'}
                      </span>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white mt-1.5">
                        {cls.subject}
                      </h3>
                      <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                        {cls.teacherOrInstitute}
                      </p>
                    </div>

                    <span
                      className={`w-2.5 h-2.5 rounded-full ${
                        cls.isActive ? 'bg-emerald-500' : 'bg-slate-300'
                      }`}
                      title={cls.isActive ? 'Active' : 'Inactive'}
                    />
                  </div>

                  <div className="mt-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs space-y-1.5">
                    <div className="flex items-center justify-between text-slate-700 dark:text-slate-300 font-semibold">
                      <span className="flex items-center gap-1 text-slate-500">
                        <Clock className="w-3.5 h-3.5" />
                        Time:
                      </span>
                      <span>
                        {cls.startTime} - {cls.endTime} ({cls.durationMinutes}m)
                      </span>
                    </div>

                    {cls.location && (
                      <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                        <span className="text-slate-500">Location:</span>
                        <span>{cls.location}</span>
                      </div>
                    )}
                  </div>

                  {/* Schedule Days Badges */}
                  <div className="mt-3 flex flex-wrap gap-1">
                    {DAYS_OF_WEEK.map((day) => {
                      const isScheduled = cls.scheduleDays.includes(day);
                      return (
                        <span
                          key={day}
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            isScheduled
                              ? cls.type === 'school'
                                ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-900'
                                : 'bg-pink-50 text-pink-700 dark:bg-pink-950/60 dark:text-pink-300 border border-pink-200 dark:border-pink-900'
                              : 'bg-slate-100 dark:bg-slate-800/40 text-slate-400 dark:text-slate-600'
                          }`}
                        >
                          {day.slice(0, 3)}
                        </span>
                      );
                    })}
                  </div>

                  {cls.notes && (
                    <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 italic line-clamp-2">
                      “{cls.notes}”
                    </p>
                  )}
                </div>

                {/* Card footer buttons */}
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-[11px] font-medium text-slate-400">
                    {cls.scheduleDays.length} days/week
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditClassModal(cls)}
                      className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-400 hover:text-purple-600 transition"
                      title="Edit Class"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => deleteStudentClass(cls.id)}
                      className="p-1.5 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg text-slate-400 hover:text-red-600 transition"
                      title="Delete Class"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUB-TAB 3: TERMINAL & UNIT TEST MARKS */}
      {activeTab === 'exams' && (
        <div className="space-y-4">
          {/* Header Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <span className="text-xs text-slate-500 font-medium">Cumulative Average</span>
              <p className="text-2xl font-black text-purple-600 dark:text-purple-400 mt-1">
                {examStats.avgPercentage}%
              </p>
              <span className="text-[11px] text-slate-400">Across {studentExams.length} tests recorded</span>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <span className="text-xs text-slate-500 font-medium">Highest Scoring Subject</span>
              <p className="text-base font-bold text-slate-900 dark:text-white mt-1 truncate">
                {examStats.highest ? `${examStats.highest.subject} (${examStats.highest.percentage}%)` : 'No data'}
              </p>
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                {examStats.highest ? examStats.highest.termName : '—'}
              </span>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
              <div>
                <span className="text-xs text-slate-500 font-medium">AI Exam Insights</span>
                <p className="text-xs text-purple-700 dark:text-purple-300 font-semibold mt-1">
                  Ready to analyze strengths and weaknesses
                </p>
              </div>
              <button
                onClick={() => {
                  setActiveTab('ai_coach');
                  if (!examAiResult) handleFetchAiExamFeedback();
                }}
                className="mt-2 text-xs font-bold text-purple-600 hover:text-purple-700 dark:text-purple-400 flex items-center gap-1"
              >
                View Detailed AI Diagnostics
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Exam Type Filters */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setExamTypeFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                examTypeFilter === 'all'
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              All Tests ({studentExams.length})
            </button>
            <button
              onClick={() => setExamTypeFilter('terminal_exam')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                examTypeFilter === 'terminal_exam'
                  ? 'bg-purple-600 text-white'
                  : 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300'
              }`}
            >
              Terminal Exams Only
            </button>
            <button
              onClick={() => setExamTypeFilter('unit_test')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                examTypeFilter === 'unit_test'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300'
              }`}
            >
              Unit Tests Only
            </button>
          </div>

          {/* Exam Cards List */}
          <div className="space-y-3">
            {filteredExams.map((exam) => (
              <div
                key={exam.id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs hover:border-purple-300 dark:hover:border-purple-800 transition"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                          exam.examType === 'terminal_exam'
                            ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                            : 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300'
                        }`}
                      >
                        {exam.termName}
                      </span>
                      <span className="text-xs text-slate-400 font-medium">
                        {formatDisplayDate(exam.date, settings.dateSystem)} ({formatDisplayDate(exam.date, settings.dateSystem === 'BS' ? 'AD' : 'BS', 'short')})
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white mt-1">
                      {exam.subject}
                    </h3>
                  </div>

                  {/* Marks & Grade */}
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <span className="text-xl font-black text-slate-900 dark:text-white">
                        {exam.obtainedMarks}
                        <span className="text-xs font-medium text-slate-400">/{exam.fullMarks}</span>
                      </span>
                      <span className="block text-xs font-bold text-purple-600 dark:text-purple-400">
                        {exam.percentage}%
                      </span>
                    </div>

                    <span className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 font-black text-base flex items-center justify-center">
                      {exam.grade}
                    </span>

                    <div className="flex items-center gap-1 ml-2">
                      <button
                        onClick={() => openEditExamModal(exam)}
                        className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-purple-600"
                        title="Edit Record"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => deleteStudentExam(exam.id)}
                        className="p-1.5 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg text-slate-400 hover:text-red-600"
                        title="Delete Record"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Topics & Remarks */}
                <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {exam.weakTopics && exam.weakTopics.length > 0 && (
                    <div className="p-2 rounded-lg bg-red-50/60 dark:bg-red-950/20 border border-red-100 dark:border-red-900/40">
                      <span className="font-bold text-red-700 dark:text-red-400 block mb-1">
                        Areas to Review:
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {exam.weakTopics.map((topic, idx) => (
                          <span key={idx} className="bg-white dark:bg-slate-900 px-2 py-0.5 rounded text-red-600 dark:text-red-300 text-[11px]">
                            {topic}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {exam.strongTopics && exam.strongTopics.length > 0 && (
                    <div className="p-2 rounded-lg bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40">
                      <span className="font-bold text-emerald-700 dark:text-emerald-400 block mb-1">
                        Mastered Topics:
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {exam.strongTopics.map((topic, idx) => (
                          <span key={idx} className="bg-white dark:bg-slate-900 px-2 py-0.5 rounded text-emerald-600 dark:text-emerald-300 text-[11px]">
                            {topic}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {exam.aiFeedback && (
                  <div className="mt-2.5 p-2.5 rounded-xl bg-purple-50/80 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900/60 text-xs text-purple-900 dark:text-purple-200 flex items-start gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-purple-600 shrink-0 mt-0.5" />
                    <span><strong>AI Feedback:</strong> {exam.aiFeedback}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUB-TAB 4: AI SUGGESTIONS & ACADEMIC COACH */}
      {activeTab === 'ai_coach' && (
        <div className="space-y-6">
          {aiError && (
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-xs text-red-700 dark:text-red-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-500" />
              <span>{aiError}</span>
            </div>
          )}

          {/* Section 1: AI Free Time Optimizer */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400 flex items-center gap-1.5">
                  <Sun className="w-3.5 h-3.5" />
                  Free Time & Routine Optimizer
                </span>
                <h3 className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
                  AI Recommendations for Productive & Restful Free Time
                </h3>
              </div>

              <button
                onClick={handleFetchAiFreeTimeSuggestions}
                disabled={isAiLoading}
                className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 self-start disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isAiLoading ? 'animate-spin' : ''}`} />
                {freeTimeAiResult ? 'Refresh Recommendations' : 'Generate Free Time Plan'}
              </button>
            </div>

            {freeTimeAiResult ? (
              <div className="space-y-3">
                <p className="text-xs text-slate-600 dark:text-slate-300 italic bg-purple-50 dark:bg-purple-950/40 p-3 rounded-xl border border-purple-100 dark:border-purple-900/60">
                  “{freeTimeAiResult.summary}”
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {freeTimeAiResult.recommendations?.map((rec: any, idx: number) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/70 space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300">
                          {rec.category}
                        </span>
                        <span className="text-xs font-semibold text-slate-500">
                          {rec.recommendedMinutes} mins
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                        {rec.title}
                      </h4>
                      <p className="text-xs text-slate-600 dark:text-slate-300">
                        {rec.details}
                      </p>
                      {rec.actionTip && (
                        <div className="pt-1 text-[11px] text-purple-700 dark:text-purple-300 font-medium flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-purple-500" />
                          <span>Tip: {rec.actionTip}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {freeTimeAiResult.routineBalanceFeedback && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 text-right">
                    <strong>Schedule note:</strong> {freeTimeAiResult.routineBalanceFeedback}
                  </p>
                )}
              </div>
            ) : (
              <div className="text-center py-6 text-slate-400 text-xs">
                <Sparkles className="w-8 h-8 mx-auto text-purple-400 mb-2 opacity-60" />
                <p>Click "Generate Free Time Plan" to get customized activities based on your school and tuition routine.</p>
              </div>
            )}
          </div>

          {/* Section 2: AI Exam Diagnostic Insights */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-pink-600 dark:text-pink-400 flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5" />
                  Exam Performance & Marks Diagnostic
                </span>
                <h3 className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
                  AI Feedback on Terminal Exams & Unit Tests
                </h3>
              </div>

              <button
                onClick={handleFetchAiExamFeedback}
                disabled={isAiLoading}
                className="px-3.5 py-1.5 bg-pink-600 hover:bg-pink-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 self-start disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isAiLoading ? 'animate-spin' : ''}`} />
                {examAiResult ? 'Re-Analyze Marks' : 'Analyze My Marks'}
              </button>
            </div>

            {examAiResult ? (
              <div className="space-y-4">
                <div className="p-3.5 rounded-xl bg-pink-50/70 dark:bg-pink-950/30 border border-pink-100 dark:border-pink-900/60 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <p className="text-xs text-slate-700 dark:text-slate-200">
                    <strong>Evaluation Summary:</strong> {examAiResult.summary}
                  </p>
                  <span className="px-3 py-1 rounded-lg bg-pink-600 text-white text-xs font-bold shrink-0">
                    Tier: {examAiResult.overallGpaGrade || 'A'}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/60">
                    <h4 className="text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5 mb-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      Key Academic Strengths:
                    </h4>
                    <ul className="text-xs text-slate-700 dark:text-slate-300 space-y-1">
                      {examAiResult.strengths?.map((str: string, i: number) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <span className="text-emerald-500 font-bold">•</span>
                          <span>{str}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-3.5 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/60">
                    <h4 className="text-xs font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1.5 mb-2">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                      High-Priority Target Areas:
                    </h4>
                    <ul className="text-xs text-slate-700 dark:text-slate-300 space-y-1">
                      {examAiResult.weaknesses?.map((weak: string, i: number) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <span className="text-amber-500 font-bold">•</span>
                          <span>{weak}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* 3-Step Action Plan */}
                {examAiResult.actionablePlan && (
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white mb-2">
                      Recommended Next-Step Revision Strategy:
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      {examAiResult.actionablePlan.map((plan: any, i: number) => (
                        <div
                          key={i}
                          className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs space-y-1"
                        >
                          <span className="text-[10px] font-extrabold uppercase text-purple-600 dark:text-purple-400 block">
                            Step {i + 1}: {plan.step}
                          </span>
                          <p className="font-bold text-slate-800 dark:text-slate-200">
                            {plan.subject} ({plan.frequency})
                          </p>
                          <p className="text-slate-600 dark:text-slate-400 text-[11px]">
                            {plan.strategy}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {examAiResult.encouragement && (
                  <p className="text-xs text-center text-purple-700 dark:text-purple-300 font-semibold italic">
                    “{examAiResult.encouragement}”
                  </p>
                )}
              </div>
            ) : (
              <div className="text-center py-6 text-slate-400 text-xs">
                <Brain className="w-8 h-8 mx-auto text-pink-400 mb-2 opacity-60" />
                <p>Click "Analyze My Marks" to generate diagnostic review steps from your test scores.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL: ADD / EDIT CLASS */}
      {isClassModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-purple-600" />
                {editingClass ? 'Edit Scheduled Class' : 'Add New Class'}
              </h3>
              <button
                onClick={() => setIsClassModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveClass} className="space-y-3.5 text-xs">
              {/* Type Switcher */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setClassForm({ ...classForm, type: 'school' })}
                  className={`py-2 rounded-xl font-bold transition flex items-center justify-center gap-1.5 ${
                    classForm.type === 'school'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  <School className="w-3.5 h-3.5" />
                  School Class
                </button>
                <button
                  type="button"
                  onClick={() => setClassForm({ ...classForm, type: 'tuition' })}
                  className={`py-2 rounded-xl font-bold transition flex items-center justify-center gap-1.5 ${
                    classForm.type === 'tuition'
                      ? 'bg-pink-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  <GraduationCap className="w-3.5 h-3.5" />
                  Tuition Class
                </button>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Subject Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Compulsory Mathematics"
                  value={classForm.subject || ''}
                  onChange={(e) => setClassForm({ ...classForm, subject: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  School Name / Teacher / Tuition Center
                </label>
                <input
                  type="text"
                  placeholder="e.g. St. Xavier's School (Mr. Karki) or Baneshwor Tuition"
                  value={classForm.teacherOrInstitute || ''}
                  onChange={(e) => setClassForm({ ...classForm, teacherOrInstitute: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
                />
              </div>

              {/* Timing */}
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Start Time
                  </label>
                  <input
                    type="time"
                    value={classForm.startTime || '09:00'}
                    onChange={(e) => setClassForm({ ...classForm, startTime: e.target.value })}
                    className="w-full px-2 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    End Time
                  </label>
                  <input
                    type="time"
                    value={classForm.endTime || '09:45'}
                    onChange={(e) => setClassForm({ ...classForm, endTime: e.target.value })}
                    className="w-full px-2 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Duration (mins)
                  </label>
                  <input
                    type="number"
                    min={15}
                    step={5}
                    value={classForm.durationMinutes ?? 45}
                    onChange={(e) => setClassForm({ ...classForm, durationMinutes: Number(e.target.value) })}
                    className="w-full px-2 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>
              </div>

              {/* Days Selection */}
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Schedule Days
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {DAYS_OF_WEEK.map((day) => {
                    const isSelected = classForm.scheduleDays.includes(day);
                    return (
                      <button
                        type="button"
                        key={day}
                        onClick={() => {
                          const updated = isSelected
                            ? classForm.scheduleDays.filter((d) => d !== day)
                            : [...classForm.scheduleDays, day];
                          setClassForm({ ...classForm, scheduleDays: updated });
                        }}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                          isSelected
                            ? 'bg-purple-600 text-white shadow-xs'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                        }`}
                      >
                        {day.slice(0, 3)}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Location / Room / Desk (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Room 204 or Online Zoom"
                  value={classForm.location || ''}
                  onChange={(e) => setClassForm({ ...classForm, location: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Key Topics / Homework Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Quadratic equations, memorize theorems"
                  value={classForm.notes || ''}
                  onChange={(e) => setClassForm({ ...classForm, notes: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsClassModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold shadow-md"
                >
                  {editingClass ? 'Update Class' : 'Save Class'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD / EDIT EXAM MARK */}
      {isExamModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Award className="w-4 h-4 text-purple-600" />
                {editingExam ? 'Edit Test Mark' : 'Record Test / Exam Score'}
              </h3>
              <button
                onClick={() => setIsExamModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveExam} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Exam Category
                  </label>
                  <select
                    value={examForm.examType || 'terminal_exam'}
                    onChange={(e) => setExamForm({ ...examForm, examType: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
                  >
                    <option value="terminal_exam">Terminal Examination</option>
                    <option value="unit_test">Unit Test</option>
                    <option value="pre_board">Pre-Board Exam</option>
                    <option value="quiz">Weekly Quiz / Class Test</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Term / Test Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. First Terminal or Unit Test 1"
                    value={examForm.termName || ''}
                    onChange={(e) => setExamForm({ ...examForm, termName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Subject Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Optional Mathematics"
                    value={examForm.subject || ''}
                    onChange={(e) => setExamForm({ ...examForm, subject: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-semibold text-slate-700 dark:text-slate-300">
                      Exam Date
                    </label>
                    <span className="text-[10px] text-purple-600 dark:text-purple-300 font-semibold">
                      {formatDisplayDate(examForm.date, settings.dateSystem)}
                    </span>
                  </div>
                  <input
                    type="date"
                    value={examForm.date || ''}
                    onChange={(e) => setExamForm({ ...examForm, date: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>
              </div>

              {/* Marks inputs */}
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Full Marks
                  </label>
                  <input
                    type="number"
                    min={10}
                    value={examForm.fullMarks ?? 100}
                    onChange={(e) => setExamForm({ ...examForm, fullMarks: Number(e.target.value) })}
                    className="w-full px-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Pass Marks
                  </label>
                  <input
                    type="number"
                    min={5}
                    value={examForm.passMarks ?? 40}
                    onChange={(e) => setExamForm({ ...examForm, passMarks: Number(e.target.value) })}
                    className="w-full px-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Obtained Marks *
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={examForm.fullMarks}
                    value={examForm.obtainedMarks ?? 0}
                    onChange={(e) => setExamForm({ ...examForm, obtainedMarks: Number(e.target.value) })}
                    className="w-full px-2.5 py-2 rounded-xl border border-purple-300 dark:border-purple-700 bg-purple-50/50 dark:bg-purple-950/40 text-purple-900 dark:text-purple-100 font-bold focus:outline-none"
                  />
                </div>
              </div>

              {/* Live Grade Preview */}
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
                <span className="text-slate-600 dark:text-slate-300">
                  Calculated Percentage: <strong>{examForm.fullMarks > 0 ? ((examForm.obtainedMarks / examForm.fullMarks) * 100).toFixed(1) : 0}%</strong>
                </span>
                <span className="font-extrabold text-purple-700 dark:text-purple-300">
                  Status: {examForm.obtainedMarks >= examForm.passMarks ? 'PASSED' : 'NEEDS REVISION'}
                </span>
              </div>

              {/* Weak Topics */}
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Topics Needing Review (Weak Areas)
                </label>
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    placeholder="e.g. Trigonometry compound angles"
                    value={weakInput || ''}
                    onChange={(e) => setWeakInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && weakInput.trim()) {
                        e.preventDefault();
                        setExamForm({ ...examForm, weakTopics: [...(examForm.weakTopics || []), weakInput.trim()] });
                        setWeakInput('');
                      }
                    }}
                    className="flex-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (weakInput.trim()) {
                        setExamForm({ ...examForm, weakTopics: [...(examForm.weakTopics || []), weakInput.trim()] });
                        setWeakInput('');
                      }
                    }}
                    className="px-3 py-1.5 bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300 rounded-xl font-bold"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {examForm.weakTopics?.map((t, i) => (
                    <span key={i} className="px-2 py-0.5 rounded bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300 flex items-center gap-1 text-[11px]">
                      {t}
                      <button
                        type="button"
                        onClick={() => setExamForm({ ...examForm, weakTopics: examForm.weakTopics?.filter((_, idx) => idx !== i) })}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Strong Topics */}
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Topics Mastered (Strong Areas)
                </label>
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    placeholder="e.g. Matrices, Sets"
                    value={strongInput || ''}
                    onChange={(e) => setStrongInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && strongInput.trim()) {
                        e.preventDefault();
                        setExamForm({ ...examForm, strongTopics: [...(examForm.strongTopics || []), strongInput.trim()] });
                        setStrongInput('');
                      }
                    }}
                    className="flex-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (strongInput.trim()) {
                        setExamForm({ ...examForm, strongTopics: [...(examForm.strongTopics || []), strongInput.trim()] });
                        setStrongInput('');
                      }
                    }}
                    className="px-3 py-1.5 bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 rounded-xl font-bold"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {examForm.strongTopics?.map((t, i) => (
                    <span key={i} className="px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center gap-1 text-[11px]">
                      {t}
                      <button
                        type="button"
                        onClick={() => setExamForm({ ...examForm, strongTopics: examForm.strongTopics?.filter((_, idx) => idx !== i) })}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Teacher Remarks / Reflection
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Review geometry proofs before board exams"
                  value={examForm.remarks || ''}
                  onChange={(e) => setExamForm({ ...examForm, remarks: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsExamModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold shadow-md"
                >
                  {editingExam ? 'Update Record' : 'Save Score'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT STUDENT PROFILE & GOALS */}
      {isProfileModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Target className="w-4 h-4 text-purple-600" />
                Student Profile & Sleep/Study Goals
              </h3>
              <button
                onClick={() => setIsProfileModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Student Name
                </label>
                <input
                  type="text"
                  required
                  value={profileForm.studentName || ''}
                  onChange={(e) => setProfileForm({ ...profileForm, studentName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Grade / Level
                  </label>
                  <input
                    type="text"
                    value={profileForm.grade || ''}
                    onChange={(e) => setProfileForm({ ...profileForm, grade: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Daily Self-Study Target (hrs)
                  </label>
                  <input
                    type="number"
                    step={0.5}
                    min={1}
                    max={10}
                    value={profileForm.targetDailySelfStudyHours ?? 3.5}
                    onChange={(e) => setProfileForm({ ...profileForm, targetDailySelfStudyHours: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Target Bedtime
                  </label>
                  <input
                    type="time"
                    value={profileForm.targetBedTime || '22:30'}
                    onChange={(e) => setProfileForm({ ...profileForm, targetBedTime: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Target Wake-up Time
                  </label>
                  <input
                    type="time"
                    value={profileForm.targetWakeUpTime || '06:00'}
                    onChange={(e) => setProfileForm({ ...profileForm, targetWakeUpTime: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  School / College Name
                </label>
                <input
                  type="text"
                  value={profileForm.schoolName || ''}
                  onChange={(e) => setProfileForm({ ...profileForm, schoolName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Academic & Exam Goals
                </label>
                <textarea
                  rows={2}
                  value={profileForm.examGoals || ''}
                  onChange={(e) => setProfileForm({ ...profileForm, examGoals: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsProfileModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold shadow-md"
                >
                  Save Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
