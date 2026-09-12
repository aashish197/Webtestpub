import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { PerformanceRecord, TestType, AssignmentStatus } from '../types';
import {
  GraduationCap,
  Plus,
  Search,
  Filter,
  TrendingUp,
  Award,
  BookOpen,
  Edit2,
  Trash2,
  CheckCircle,
  AlertCircle,
  FileSpreadsheet,
  X,
  Target,
} from 'lucide-react';
import { calculateGrade, exportToCsv } from '../utils/formatters';
import { formatDisplayDate, getTodayIso } from '../utils/nepaliCalendar';

export const PerformanceView: React.FC = () => {
  const {
    performance,
    addPerformanceRecord,
    updatePerformanceRecord,
    deletePerformanceRecord,
    students,
    settings,
  } = useApp();

  const [studentFilter, setStudentFilter] = useState<string>('ALL');
  const [testTypeFilter, setTestTypeFilter] = useState<string>('ALL');
  const [search, setSearch] = useState('');

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<PerformanceRecord | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Form State
  const initialFormState: Omit<PerformanceRecord, 'id' | 'recordedAt'> = {
    studentId: students[0]?.id || '',
    studentName: students[0]?.name || 'Student',
    testName: 'Unit Test 1',
    testType: 'unit_test',
    date: getTodayIso(),
    subject: students[0]?.subjects[0] || 'Mathematics',
    totalMarks: 50,
    obtainedMarks: 42,
    percentage: 84,
    grade: 'A',
    topicsCovered: 'Coordinate Geometry, Matrix',
    weakAreas: 'Calculation accuracy in inverse matrices',
    assignmentStatus: 'completed',
    teacherRemarks: 'Strong grasp of foundational principles. Keep practicing speed.',
  };

  const [formData, setFormData] = useState<Omit<PerformanceRecord, 'id' | 'recordedAt'>>(initialFormState);

  // Overall performance stats
  const performanceStats = useMemo(() => {
    if (performance.length === 0) return { avgPercentage: 0, totalTests: 0, topGradeCount: 0 };
    const totalPercentage = performance.reduce((sum, p) => sum + p.percentage, 0);
    const avgPercentage = Math.round(totalPercentage / performance.length);
    const topGradeCount = performance.filter((p) => p.percentage >= 80).length;
    return {
      avgPercentage,
      totalTests: performance.length,
      topGradeCount,
    };
  }, [performance]);

  // Filtered list
  const filteredRecords = useMemo(() => {
    const q = search.toLowerCase().trim();
    return performance.filter((p) => {
      const matchSearch =
        !q ||
        p.studentName.toLowerCase().includes(q) ||
        p.testName.toLowerCase().includes(q) ||
        p.subject.toLowerCase().includes(q) ||
        (p.weakAreas && p.weakAreas.toLowerCase().includes(q));

      const matchStudent = studentFilter === 'ALL' || p.studentId === studentFilter;
      const matchType = testTypeFilter === 'ALL' || p.testType === testTypeFilter;

      return matchSearch && matchStudent && matchType;
    });
  }, [performance, search, studentFilter, testTypeFilter]);

  const handleOpenAdd = () => {
    setEditingRecord(null);
    setFormData(initialFormState);
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (rec: PerformanceRecord) => {
    setEditingRecord(rec);
    setFormData({
      studentId: rec.studentId,
      studentName: rec.studentName,
      testName: rec.testName,
      testType: rec.testType,
      date: rec.date,
      subject: rec.subject,
      totalMarks: rec.totalMarks,
      obtainedMarks: rec.obtainedMarks,
      percentage: rec.percentage,
      grade: rec.grade,
      topicsCovered: rec.topicsCovered || '',
      weakAreas: rec.weakAreas || '',
      assignmentStatus: rec.assignmentStatus,
      teacherRemarks: rec.teacherRemarks || '',
    });
    setIsAddModalOpen(true);
  };

  const handleMarksChange = (total: number, obtained: number) => {
    const pct = total > 0 ? Math.round((obtained / total) * 100) : 0;
    const grd = calculateGrade(pct);
    setFormData({
      ...formData,
      totalMarks: total,
      obtainedMarks: obtained,
      percentage: pct,
      grade: grd.grade,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingRecord) {
      updatePerformanceRecord(editingRecord.id, formData);
    } else {
      addPerformanceRecord(formData);
    }
    setIsAddModalOpen(false);
  };

  const handleExportCsv = () => {
    const rows = performance.map((p) => ({
      ID: p.id,
      Student: p.studentName,
      Test_Name: p.testName,
      Type: p.testType,
      Date_AD: p.date,
      Subject: p.subject,
      Total_Marks: p.totalMarks,
      Obtained_Marks: p.obtainedMarks,
      Percentage: `${p.percentage}%`,
      Grade: typeof p.grade === 'object' ? (p.grade as any)?.grade : p.grade,
      Assignment_Status: p.assignmentStatus,
      Weak_Areas: p.weakAreas || '',
      Teacher_Remarks: p.teacherRemarks || '',
    }));
    exportToCsv(`student-performance-${getTodayIso()}.csv`, rows);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
              <GraduationCap className="w-5 h-5" />
            </div>
            Student Academic Performance
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Record unit tests, terminal exams, homework completion, and identify weak learning areas.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCsv}
            className="px-3 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition"
          >
            Export CSV
          </button>
          <button
            id="btn-add-performance-main"
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Add Test Result</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-500">Average Student Score</span>
            <p className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">
              {performanceStats.avgPercentage}% (Grade {calculateGrade(performanceStats.avgPercentage).grade})
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-500">Distinction (≥ 80%)</span>
            <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
              {performanceStats.topGradeCount} of {performanceStats.totalTests} exams
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-500">Tests Recorded</span>
            <p className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">
              {performanceStats.totalTests} total evaluations
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by student, test, subject, weak area..."
              value={search || ''}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
            />
          </div>

          <div>
            <select
              value={studentFilter || 'ALL'}
              onChange={(e) => setStudentFilter(e.target.value)}
              className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
            >
              <option value="ALL">All Students</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.grade})
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={testTypeFilter || 'ALL'}
              onChange={(e) => setTestTypeFilter(e.target.value)}
              className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
            >
              <option value="ALL">All Assessment Types</option>
              <option value="unit_test">Unit Test</option>
              <option value="terminal_exam">Terminal Exam</option>
              <option value="weekly_quiz">Weekly Quiz</option>
              <option value="mock_board">Board / Mock Exam</option>
            </select>
          </div>
        </div>
      </div>

      {/* Performance Records Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredRecords.length === 0 ? (
          <div className="col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center text-slate-400">
            <GraduationCap className="w-12 h-12 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
            <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm">
              No test evaluations found
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Click "+ Add Test Result" to record your students' scores and progress.
            </p>
          </div>
        ) : (
          filteredRecords.map((rec) => {
            const isTopGrade = rec.percentage >= 80;
            const isNeedHelp = rec.percentage < 60;

            return (
              <div
                key={rec.id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs hover:border-blue-300 dark:hover:border-blue-800 transition flex flex-col justify-between"
              >
                <div>
                  {/* Top Bar */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white">
                        {rec.studentName}
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {rec.testName} • <strong className="text-slate-700 dark:text-slate-300">{rec.subject}</strong>
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span
                        className={`px-2.5 py-1 text-xs font-black rounded-lg ${
                          isTopGrade
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : isNeedHelp
                            ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                            : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                        }`}
                      >
                        {typeof rec.grade === 'object' ? (rec.grade as any)?.grade : rec.grade} ({rec.percentage}%)
                      </span>
                    </div>
                  </div>

                  {/* Score Progress Bar */}
                  <div className="mt-3">
                    <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400 mb-1">
                      <span>Score: {rec.obtainedMarks} / {rec.totalMarks} marks</span>
                      <span>{rec.percentage}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isTopGrade
                            ? 'bg-emerald-500'
                            : isNeedHelp
                            ? 'bg-rose-500'
                            : 'bg-blue-500'
                        }`}
                        style={{ width: `${Math.min(100, rec.percentage)}%` }}
                      />
                    </div>
                  </div>

                  {/* Weak Areas & Topics */}
                  <div className="mt-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-xs space-y-2">
                    {rec.topicsCovered && (
                      <div>
                        <span className="text-slate-400 font-semibold block text-[10px] uppercase">
                          Topics Tested:
                        </span>
                        <p className="text-slate-800 dark:text-slate-200 mt-0.5 font-medium">
                          {rec.topicsCovered}
                        </p>
                      </div>
                    )}

                    {rec.weakAreas && (
                      <div className="pt-1.5 border-t border-slate-200/50 dark:border-slate-700/50">
                        <span className="text-amber-600 dark:text-amber-400 font-semibold block text-[10px] uppercase flex items-center gap-1">
                          <Target className="w-3 h-3" />
                          Needs Improvement:
                        </span>
                        <p className="text-slate-700 dark:text-slate-300 mt-0.5">
                          {rec.weakAreas}
                        </p>
                      </div>
                    )}

                    {rec.teacherRemarks && (
                      <div className="pt-1.5 border-t border-slate-200/50 dark:border-slate-700/50">
                        <span className="text-slate-400 font-semibold block text-[10px] uppercase">
                          Teacher Feedback:
                        </span>
                        <p className="text-slate-600 dark:text-slate-400 italic mt-0.5">
                          "{rec.teacherRemarks}"
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
                  <span>
                    {formatDisplayDate(rec.date, settings.dateSystem, 'short')} •{' '}
                    HW: <strong className="capitalize">{rec.assignmentStatus}</strong>
                  </span>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(rec)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeleteConfirmId(rec.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add / Edit Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 max-w-lg w-full p-6 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                {editingRecord ? 'Edit Test Evaluation' : 'Record Student Test Result'}
              </h2>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Student *
                  </label>
                  <select
                    value={formData.studentId || ''}
                    onChange={(e) => {
                      const st = students.find((s) => s.id === e.target.value);
                      if (st) {
                        setFormData({
                          ...formData,
                          studentId: st.id,
                          studentName: st.name,
                          subject: st.subjects[0] || formData.subject,
                        });
                      }
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
                  >
                    {students.map((st) => (
                      <option key={st.id} value={st.id}>
                        {st.name} ({st.grade})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Subject *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.subject || ''}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Test / Exam Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Unit Test 2 or First Term"
                    value={formData.testName || ''}
                    onChange={(e) => setFormData({ ...formData, testName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Assessment Type
                  </label>
                  <select
                    value={formData.testType || 'unit_test'}
                    onChange={(e) =>
                      setFormData({ ...formData, testType: e.target.value as TestType })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
                  >
                    <option value="unit_test">Unit Test</option>
                    <option value="weekly_quiz">Weekly Quiz</option>
                    <option value="terminal_exam">Terminal Exam</option>
                    <option value="mock_board">Mock Board Exam</option>
                  </select>
                </div>
              </div>

              {/* Marks & Percentage */}
              <div className="grid grid-cols-4 gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Total Marks
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={formData.totalMarks ?? 100}
                    onChange={(e) =>
                      handleMarksChange(Number(e.target.value), formData.obtainedMarks)
                    }
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Obtained
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={formData.obtainedMarks ?? 0}
                    onChange={(e) =>
                      handleMarksChange(formData.totalMarks, Number(e.target.value))
                    }
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-blue-600"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Percentage
                  </label>
                  <input
                    type="text"
                    disabled
                    value={`${formData.percentage}%`}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 font-bold"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Grade
                  </label>
                  <input
                    type="text"
                    disabled
                    value={typeof formData.grade === 'object' ? (formData.grade as any)?.grade : formData.grade}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-emerald-600 font-black"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    value={formData.date || ''}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Homework Status
                  </label>
                  <select
                    value={formData.assignmentStatus || 'completed'}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        assignmentStatus: e.target.value as AssignmentStatus,
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
                  >
                    <option value="completed">Completed</option>
                    <option value="partial">Partially Done</option>
                    <option value="not_done">Not Done / Incomplete</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Topics Covered / Chapters
                </label>
                <input
                  type="text"
                  placeholder="e.g. Thermodynamics, Linear Equations"
                  value={formData.topicsCovered || ''}
                  onChange={(e) => setFormData({ ...formData, topicsCovered: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Weak Areas / Topics Needing Work
                </label>
                <input
                  type="text"
                  placeholder="e.g. Word problem interpretation, trigonometric transformations"
                  value={formData.weakAreas || ''}
                  onChange={(e) => setFormData({ ...formData, weakAreas: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Teacher Remarks / Parent Feedback
                </label>
                <textarea
                  rows={2}
                  placeholder="Feedback on student focus, homework consistency, progress..."
                  value={formData.teacherRemarks || ''}
                  onChange={(e) => setFormData({ ...formData, teacherRemarks: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
                >
                  {editingRecord ? 'Save Changes' : 'Save Test Score'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 max-w-md w-full p-6 shadow-xl text-center">
            <div className="w-12 h-12 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-600 mx-auto flex items-center justify-center mb-3">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Delete Evaluation Record?
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs mx-auto">
              This score entry will be removed from student performance history.
            </p>
            <div className="mt-5 flex items-center justify-center gap-3">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  deletePerformanceRecord(deleteConfirmId);
                  setDeleteConfirmId(null);
                }}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-rose-600 text-white hover:bg-rose-700"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
