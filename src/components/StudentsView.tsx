import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Student, TuitionType, FeeStructureType, PaymentMethod } from '../types';
import {
  Users,
  Plus,
  Search,
  Filter,
  Phone,
  MapPin,
  Calendar,
  BookOpen,
  CreditCard,
  Edit2,
  Trash2,
  Eye,
  CheckCircle,
  XCircle,
  Copy,
  Check,
  Award,
  Clock,
  UserCheck,
  X,
  Building,
  Send,
} from 'lucide-react';
import {
  formatCurrency,
  getFeeStructureLabel,
  generatePaymentReminderText,
  calculateGrade,
  exportToCsv,
} from '../utils/formatters';
import { formatDisplayDate, getTodayIso } from '../utils/nepaliCalendar';

export const StudentsView: React.FC = () => {
  const {
    students,
    addStudent,
    updateStudent,
    deleteStudent,
    settings,
    payments,
    attendance,
    performance,
    classes,
    searchQuery,
    setSearchQuery,
  } = useApp();

  // Filters & State
  const [localSearch, setLocalSearch] = useState(searchQuery || '');
  const [gradeFilter, setGradeFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState<'ALL' | TuitionType>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'active' | 'inactive'>('ALL');

  useEffect(() => {
    if (searchQuery !== undefined) {
      setLocalSearch(searchQuery);
    }
  }, [searchQuery]);

  // Modals & Drawers
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [selectedStudentForDrawer, setSelectedStudentForDrawer] = useState<Student | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Form State
  const initialFormState: Omit<Student, 'id' | 'createdAt'> = {
    name: '',
    grade: 'Grade 10',
    schoolOrCollege: '',
    contactNumber: '',
    parentName: '',
    parentContact: '',
    address: '',
    subjects: ['Mathematics'],
    tuitionType: 'individual',
    groupName: '',
    startDate: getTodayIso(),
    classFrequency: '6 days/week',
    classDurationMinutes: settings.defaultClassDuration || 60,
    feeStructure: 'monthly',
    feeAmount: 10000,
    paymentMethod: 'eSewa',
    paymentCalendarSystem: 'BS',
    paymentReceivingDay: 1,
    dueDays: 5,
    paymentDueDay: 6,
    notes: '',
    status: 'active',
  };

  const [formData, setFormData] = useState<Omit<Student, 'id' | 'createdAt'>>(initialFormState);
  const [subjectInput, setSubjectInput] = useState('');

  // Extract unique grades for filter dropdown
  const uniqueGrades = useMemo(() => {
    const set = new Set(students.map((s) => s.grade).filter(Boolean));
    return Array.from(set);
  }, [students]);

  // Filtered Students List
  const filteredStudents = useMemo(() => {
    const q = (searchQuery || localSearch).toLowerCase().trim();
    return students.filter((s) => {
      const matchSearch =
        !q ||
        s.name.toLowerCase().includes(q) ||
        s.schoolOrCollege.toLowerCase().includes(q) ||
        s.grade.toLowerCase().includes(q) ||
        s.subjects.some((sub) => sub.toLowerCase().includes(q)) ||
        s.address.toLowerCase().includes(q) ||
        (s.parentName && s.parentName.toLowerCase().includes(q));

      const matchGrade = gradeFilter === 'ALL' || s.grade === gradeFilter;
      const matchType = typeFilter === 'ALL' || s.tuitionType === typeFilter;
      const matchStatus = statusFilter === 'ALL' || s.status === statusFilter;

      return matchSearch && matchGrade && matchType && matchStatus;
    });
  }, [students, searchQuery, localSearch, gradeFilter, typeFilter, statusFilter]);

  // Open Add Modal
  const handleOpenAdd = () => {
    setEditingStudent(null);
    setFormData(initialFormState);
    setSubjectInput('');
    setIsAddModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (student: Student) => {
    setEditingStudent(student);
    setFormData({
      name: student.name,
      grade: student.grade,
      schoolOrCollege: student.schoolOrCollege,
      contactNumber: student.contactNumber,
      parentName: student.parentName,
      parentContact: student.parentContact,
      address: student.address,
      subjects: [...student.subjects],
      tuitionType: student.tuitionType,
      groupName: student.groupName || '',
      startDate: student.startDate || getTodayIso(),
      classFrequency: student.classFrequency,
      classDurationMinutes: student.classDurationMinutes,
      feeStructure: student.feeStructure,
      feeAmount: student.feeAmount,
      paymentMethod: student.paymentMethod,
      paymentCalendarSystem: student.paymentCalendarSystem || 'BS',
      paymentReceivingDay: student.paymentReceivingDay || 1,
      dueDays: student.dueDays !== undefined ? student.dueDays : 5,
      paymentDueDay: student.paymentDueDay || ((student.paymentReceivingDay || 1) + (student.dueDays !== undefined ? student.dueDays : 5)),
      notes: student.notes || '',
      status: student.status,
    });
    setSubjectInput('');
    setIsAddModalOpen(true);
  };

  // Submit Add / Edit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    if (editingStudent) {
      updateStudent(editingStudent.id, formData);
      if (selectedStudentForDrawer && selectedStudentForDrawer.id === editingStudent.id) {
        setSelectedStudentForDrawer({ ...selectedStudentForDrawer, ...formData });
      }
    } else {
      addStudent(formData);
    }
    setIsAddModalOpen(false);
  };

  // Add Subject Pill to Form
  const handleAddSubject = () => {
    if (subjectInput.trim() && !formData.subjects.includes(subjectInput.trim())) {
      setFormData({
        ...formData,
        subjects: [...formData.subjects, subjectInput.trim()],
      });
      setSubjectInput('');
    }
  };

  // Remove Subject Pill
  const handleRemoveSubject = (sub: string) => {
    setFormData({
      ...formData,
      subjects: formData.subjects.filter((s) => s !== sub),
    });
  };

  // Copy Reminder
  const handleCopyStudentReminder = (student: Student) => {
    // Find latest pending or overdue payment for student
    const studentPayments = payments.filter((p) => p.studentId === student.id);
    const pendingPay = studentPayments.find((p) => p.remainingBalance > 0);
    const amountDue = pendingPay ? pendingPay.remainingBalance : student.feeAmount;
    const dueDay = student.paymentDueDay || 10;
    const dueDateStr = `${dueDay}th of this month`;

    const text = generatePaymentReminderText(
      student.name,
      student.parentName,
      amountDue,
      'current month',
      dueDateStr,
      settings.teacherName,
      student.paymentMethod
    );

    navigator.clipboard.writeText(text);
    setCopiedId(student.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const getWhatsAppStudentUrl = (student: Student) => {
    const rawPhone = student.parentContact || student.contactNumber || '';
    const cleanPhone = rawPhone.replace(/[^0-9]/g, '');
    const amountDue = student.feeAmount || 0;
    const dueDay = student.paymentDueDay || 10;
    const dueDateStr = `${dueDay}th of this month`;
    const text = generatePaymentReminderText(
      student.name,
      student.parentName,
      amountDue,
      'current month',
      dueDateStr,
      settings.teacherName,
      student.paymentMethod
    );
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
  };

  // Export CSV
  const handleExportCsv = () => {
    const rows = students.map((s) => ({
      ID: s.id,
      Name: s.name,
      Grade: s.grade,
      School_College: s.schoolOrCollege,
      Tuition_Type: s.tuitionType,
      Group_Name: s.groupName || '',
      Phone: s.contactNumber,
      Parent_Name: s.parentName,
      Parent_Phone: s.parentContact,
      Address: s.address,
      Subjects: (s.subjects || []).join('; '),
      Start_Date: s.startDate,
      Frequency: s.classFrequency,
      Duration_Minutes: s.classDurationMinutes,
      Fee_Structure: s.feeStructure,
      Fee_Amount: s.feeAmount,
      Payment_Method: s.paymentMethod,
      Due_Day: s.paymentDueDay,
      Status: s.status,
    }));
    exportToCsv(`students-list-${getTodayIso()}.csv`, rows);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400">
              <Users className="w-5 h-5" />
            </div>
            Home Tuition Students
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage individual and group tuition student profiles, fees, subjects, and schedules.
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
            id="btn-add-student-main"
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shadow-indigo-600/20 transition active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Add Student</span>
          </button>
        </div>
      </div>

      {/* Search & Filter Controls */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by student, school, address..."
              value={localSearch || ''}
              onChange={(e) => {
                setLocalSearch(e.target.value);
                setSearchQuery(e.target.value);
              }}
              className="w-full pl-9 pr-8 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
            {localSearch && (
              <button
                type="button"
                onClick={() => {
                  setLocalSearch('');
                  setSearchQuery('');
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                ✕
              </button>
            )}
          </div>

          {/* Grade Filter */}
          <div>
            <select
              value={gradeFilter || 'ALL'}
              onChange={(e) => setGradeFilter(e.target.value)}
              className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="ALL">All Grades / Levels</option>
              {uniqueGrades.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>

          {/* Tuition Type (Individual vs Group) */}
          <div>
            <select
              value={typeFilter || 'ALL'}
              onChange={(e) => setTypeFilter(e.target.value as any)}
              className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="ALL">All Tuition Types</option>
              <option value="individual">Individual Tuition</option>
              <option value="group">Group Tuition</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter || 'ALL'}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="ALL">All Statuses (Active & Inactive)</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>
          </div>
        </div>

        {/* Filter Count Summary */}
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800">
          <span>
            Showing <strong className="text-slate-800 dark:text-slate-200">{filteredStudents.length}</strong> of{' '}
            {students.length} students
          </span>
          {(localSearch || gradeFilter !== 'ALL' || typeFilter !== 'ALL' || statusFilter !== 'ALL') && (
            <button
              onClick={() => {
                setLocalSearch('');
                setGradeFilter('ALL');
                setTypeFilter('ALL');
                setStatusFilter('ALL');
              }}
              className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Student Cards Grid */}
      {filteredStudents.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center">
          <Users className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
            No students found
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
            Try adjusting your search query or filters, or add a new student profile to get started.
          </p>
          <button
            onClick={handleOpenAdd}
            className="mt-4 px-4 py-2 text-xs font-semibold rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition"
          >
            + Add First Student
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredStudents.map((student) => {
            const studentPayments = payments.filter((p) => p.studentId === student.id);
            const totalPaid = studentPayments.reduce((s, p) => s + p.amountPaid, 0);
            const totalDue = studentPayments.reduce((s, p) => s + p.amountDue, 0);
            const outstanding = Math.max(0, totalDue - totalPaid);

            const studentAttendance = attendance.filter((a) => a.studentId === student.id);
            const presentCount = studentAttendance.filter((a) => a.status === 'present').length;
            const attRate =
              studentAttendance.length > 0
                ? Math.round((presentCount / studentAttendance.length) * 100)
                : 100;

            const isCopied = copiedId === student.id;

            return (
              <div
                key={student.id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs hover:border-indigo-300 dark:hover:border-indigo-800/80 transition flex flex-col justify-between"
              >
                <div>
                  {/* Top Bar: Name, Grade & Type Badge */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-slate-900 dark:text-white">
                          {student.name}
                        </h3>
                        <span
                          className={`w-2 h-2 rounded-full ${
                            student.status === 'active' ? 'bg-emerald-500' : 'bg-slate-400'
                          }`}
                          title={`Status: ${student.status}`}
                        />
                      </div>
                      <p className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold mt-0.5">
                        {student.grade}
                      </p>
                    </div>

                    <span
                      className={`px-2 py-0.5 text-[10px] font-bold rounded-md ${
                        student.tuitionType === 'group'
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
                          : 'bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300'
                      }`}
                    >
                      {student.tuitionType === 'group' ? 'Group' : 'Individual'}
                    </span>
                  </div>

                  {/* School / College */}
                  {student.schoolOrCollege && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5">
                      <Building className="w-3.5 h-3.5 text-slate-400" />
                      <span className="truncate">{student.schoolOrCollege}</span>
                    </p>
                  )}

                  {/* Subjects */}
                  <div className="mt-3 flex flex-wrap gap-1">
                    {student.subjects.map((sub) => (
                      <span
                        key={sub}
                        className="px-2 py-0.5 text-[11px] font-medium rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                      >
                        {sub}
                      </span>
                    ))}
                  </div>

                  {/* Key Stats Row: Fee & Attendance */}
                  <div className="mt-4 grid grid-cols-2 gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold">
                        Fee Structure
                      </span>
                      <p className="font-bold text-slate-900 dark:text-white">
                        {student.feeStructure === 'hourly'
                          ? `${formatCurrency(Math.round(((student.classDurationMinutes || 60) / 60) * student.feeAmount), settings.currency)}/session`
                          : formatCurrency(student.feeAmount, settings.currency)}
                      </p>
                      <span className="text-[10px] text-slate-500">
                        {student.feeStructure === 'hourly'
                          ? `${formatCurrency(student.feeAmount, settings.currency)}/hr (${student.classDurationMinutes || 60}m)`
                          : `${student.feeStructure} • Due ${student.paymentDueDay}th`}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold">
                        Attendance
                      </span>
                      <p className="font-bold text-slate-900 dark:text-white">
                        {attRate}% ({presentCount}/{studentAttendance.length})
                      </p>
                      <span className="text-[10px] text-slate-500">
                        {student.classFrequency}
                      </span>
                    </div>
                  </div>

                  {/* Start Date & Contacts */}
                  <div className="mt-3 space-y-1 text-xs text-slate-600 dark:text-slate-400">
                    <div className="flex items-center gap-1.5 truncate">
                      <Calendar className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 shrink-0" />
                      <span>
                        Started:{' '}
                        <strong className="text-slate-800 dark:text-slate-200">
                          {formatDisplayDate(student.startDate, settings.calendarMode)}
                        </strong>
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 truncate">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>
                        {student.contactNumber || 'No student phone'}
                        {student.parentContact && ` • Parent: ${student.parentContact}`}
                      </span>
                    </div>
                    {student.address && (
                      <div className="flex items-center gap-1.5 truncate">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{student.address}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom Action Footer */}
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-1">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setSelectedStudentForDrawer(student)}
                      className="px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 flex items-center gap-1 transition"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Profile</span>
                    </button>

                    <button
                      onClick={() => handleCopyStudentReminder(student)}
                      title="Copy Tuition Fee Reminder Message"
                      className="px-2 py-1.5 text-xs font-medium rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1 transition"
                    >
                      {isCopied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-600 font-bold">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>

                    <a
                      href={getWhatsAppStudentUrl(student)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2 py-1.5 text-xs font-semibold rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 flex items-center gap-1 transition"
                      title="Send WhatsApp payment reminder directly"
                    >
                      <Send className="w-3 h-3" />
                      <span>WhatsApp</span>
                    </a>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(student)}
                      title="Edit student"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeleteConfirmId(student.id)}
                      title="Delete student"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Student Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 max-w-2xl w-full p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                {editingStudent ? 'Edit Student Profile' : 'Add New Home Tuition Student'}
              </h2>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs">
              {/* Row 1: Name & Grade */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Student Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Aarav Sharma"
                    value={formData.name || ''}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Grade / Level / Class *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Grade 10 (SEE) or +2 Science"
                    value={formData.grade || ''}
                    onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              </div>

              {/* Row 2: School, Tuition Type & Starting Date */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    School / College Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. St. Xavier's School"
                    value={formData.schoolOrCollege || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, schoolOrCollege: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Tuition Arrangement *
                  </label>
                  <select
                    value={formData.tuitionType || 'individual'}
                    onChange={(e) =>
                      setFormData({ ...formData, tuitionType: e.target.value as TuitionType })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  >
                    <option value="individual">Individual (1-on-1 Tuition)</option>
                    <option value="group">Group Tuition (Batch)</option>
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                      Starting Date *
                    </label>
                    {formData.startDate && (
                      <span className="text-[10px] font-medium text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/60 px-1.5 py-0.5 rounded border border-teal-200/50 dark:border-teal-900/50">
                        {formatDisplayDate(formData.startDate, settings.calendarMode || settings.dateSystem)}
                      </span>
                    )}
                  </div>
                  <input
                    type="date"
                    required
                    value={formData.startDate || ''}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              </div>

              {/* If Group, group name */}
              {formData.tuitionType === 'group' && (
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Group / Batch Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Grade 10 Opt Math Morning Batch"
                    value={formData.groupName || ''}
                    onChange={(e) => setFormData({ ...formData, groupName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              )}

              {/* Subjects Multi-Select / Tagging */}
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Subjects Taught
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    placeholder="Type subject (e.g. Physics, Opt Math) and press Add"
                    value={subjectInput || ''}
                    onChange={(e) => setSubjectInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddSubject();
                      }
                    }}
                    className="flex-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                  <button
                    type="button"
                    onClick={handleAddSubject}
                    className="px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold hover:bg-slate-300"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {formData.subjects.map((sub) => (
                    <span
                      key={sub}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-medium"
                    >
                      <span>{sub}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveSubject(sub)}
                        className="text-indigo-400 hover:text-indigo-700"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Row 3: Contacts & Address */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Student Contact No.
                  </label>
                  <input
                    type="text"
                    placeholder="+977 98..."
                    value={formData.contactNumber || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, contactNumber: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Parent / Guardian Name
                  </label>
                  <input
                    type="text"
                    placeholder="Parent's Name"
                    value={formData.parentName || ''}
                    onChange={(e) => setFormData({ ...formData, parentName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Parent Contact No.
                  </label>
                  <input
                    type="text"
                    placeholder="+977 98..."
                    value={formData.parentContact || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, parentContact: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Tuition Location / Address
                </label>
                <input
                  type="text"
                  placeholder="e.g. Baneshwor Chowk, Near Standard Chartered Bank"
                  value={formData.address || ''}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              {/* Fee & Payment Section */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
                <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4 text-indigo-600" />
                  Fee & Payment Arrangement
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Fee Type
                    </label>
                    <select
                      value={formData.feeStructure || 'monthly'}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          feeStructure: e.target.value as FeeStructureType,
                        })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
                    >
                      <option value="monthly">Monthly Fee</option>
                      <option value="per_class">Per Class</option>
                      <option value="hourly">Hourly Rate</option>
                      <option value="custom">Custom Arrangement</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Fee Amount (Rs.) *
                    </label>
                    <input
                      type="number"
                      required
                      min={0}
                      value={formData.feeAmount ?? 0}
                      onChange={(e) =>
                        setFormData({ ...formData, feeAmount: Number(e.target.value) })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Payment Mode
                    </label>
                    <select
                      value={formData.paymentMethod || 'eSewa'}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          paymentMethod: e.target.value as PaymentMethod,
                        })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
                    >
                      <option value="eSewa">eSewa</option>
                      <option value="Khalti">Khalti</option>
                      <option value="Cash">Cash</option>
                      <option value="Bank Transfer">Bank Transfer</option>
                      <option value="PhonePe/UPI">PhonePe / UPI</option>
                      <option value="Cheque">Cheque</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                {/* Payment Schedule Settings */}
                <div className="mt-3 p-3.5 rounded-xl bg-purple-50/70 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900/60 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-purple-900 dark:text-purple-200 flex items-center gap-1.5">
                      <CreditCard className="w-3.5 h-3.5 text-purple-600" />
                      Tuition Payment Schedule & Due Notification
                    </span>
                    <span className="text-[11px] text-purple-600 dark:text-purple-400 font-medium">
                      Calculates automatic fee due alerts
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Calendar System
                      </label>
                      <select
                        value={formData.paymentCalendarSystem || 'BS'}
                        onChange={(e) => {
                          const newCal = e.target.value as 'BS' | 'AD';
                          const maxDay = newCal === 'BS' ? 32 : 31;
                          const curRec = formData.paymentReceivingDay || 1;
                          const clampedRec = Math.min(curRec, maxDay);
                          const due = clampedRec + (formData.dueDays !== undefined ? formData.dueDays : 5);
                          setFormData({
                            ...formData,
                            paymentCalendarSystem: newCal,
                            paymentReceivingDay: clampedRec,
                            paymentDueDay: due,
                          });
                        }}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:outline-none"
                      >
                        <option value="BS">Bikram Sambat (BS - Nepali Month)</option>
                        <option value="AD">Gregorian (AD - English Month)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Receiving Day ({formData.paymentCalendarSystem === 'BS' ? '1 to 32 BS' : '1 to 31 AD'})
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={formData.paymentCalendarSystem === 'BS' ? 32 : 31}
                        value={formData.paymentReceivingDay || 1}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          const max = formData.paymentCalendarSystem === 'BS' ? 32 : 31;
                          const clamped = Math.max(1, Math.min(val || 1, max));
                          const dueDaysVal = formData.dueDays !== undefined ? formData.dueDays : 5;
                          setFormData({
                            ...formData,
                            paymentReceivingDay: clamped,
                            paymentDueDay: clamped + dueDaysVal,
                          });
                        }}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Due Days (Grace Period)
                      </label>
                      <input
                        type="number"
                        min={0}
                        max={30}
                        value={formData.dueDays ?? 5}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          const dueDaysVal = Math.max(0, Math.min(val || 0, 30));
                          const recDay = formData.paymentReceivingDay || 1;
                          setFormData({
                            ...formData,
                            dueDays: dueDaysVal,
                            paymentDueDay: recDay + dueDaysVal,
                          });
                        }}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Calculated summary badge */}
                  <div className="p-2 rounded-lg bg-white dark:bg-slate-900/80 border border-purple-200/70 dark:border-purple-800 text-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                    <span className="text-slate-600 dark:text-slate-300">
                      Fee billing on <strong>Day {formData.paymentReceivingDay || 1}</strong> of every {formData.paymentCalendarSystem === 'BS' ? 'Nepali month (BS)' : 'month (AD)'}
                    </span>
                    <span className="font-bold text-purple-700 dark:text-purple-300 flex items-center gap-1">
                      Payment Due: Day {(formData.paymentReceivingDay || 1) + (formData.dueDays !== undefined ? formData.dueDays : 5)} (+{formData.dueDays !== undefined ? formData.dueDays : 5} days)
                    </span>
                  </div>
                </div>

                {formData.feeStructure === 'hourly' && (
                  <div className="mt-3 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-amber-900 dark:text-amber-200 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                        Hourly Calculation Preview:
                      </span>
                      <p className="text-[11px] text-amber-700 dark:text-amber-300 mt-0.5">
                        {formData.classDurationMinutes || 60} mins ({((formData.classDurationMinutes || 60) / 60).toFixed(1)} hrs) × Rs. {formData.feeAmount}/hr
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] uppercase font-semibold text-amber-600 dark:text-amber-400 block">
                        Per Session Fee
                      </span>
                      <span className="text-sm font-extrabold text-amber-900 dark:text-amber-100">
                        Rs. {Math.round(((formData.classDurationMinutes || 60) / 60) * (formData.feeAmount || 0))}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Frequency, Duration & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Class Frequency
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 6 days/week or Sun, Tue, Thu"
                    value={formData.classFrequency || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, classFrequency: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-semibold text-slate-700 dark:text-slate-300">
                      Class Duration (Minutes)
                    </label>
                    <div className="flex items-center gap-1">
                      {[35, 40, 45, 50, 60, 90].map((d) => (
                        <button
                          key={d}
                          type="button"
                          onClick={() => setFormData({ ...formData, classDurationMinutes: d })}
                          className={`px-1.5 py-0.5 text-[10px] font-medium rounded transition ${
                            formData.classDurationMinutes === d
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
                    min={5}
                    step={1}
                    value={formData.classDurationMinutes ?? 60}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        classDurationMinutes: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Student Status
                  </label>
                  <select
                    value={formData.status || 'active'}
                    onChange={(e) =>
                      setFormData({ ...formData, status: e.target.value as any })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
                  >
                    <option value="active">Active Student</option>
                    <option value="inactive">Inactive / Completed</option>
                  </select>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Private Teacher Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Focus areas, weak topics, exam targets..."
                  value={formData.notes || ''}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition active:scale-95"
                >
                  {editingStudent ? 'Save Changes' : 'Save Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 max-w-md w-full p-6 shadow-xl text-center">
            <div className="w-12 h-12 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-600 mx-auto flex items-center justify-center mb-3">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Delete Student Profile?
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs mx-auto">
              This action will remove the student profile and unbind linked classes.
            </p>
            <div className="mt-5 flex items-center justify-center gap-3">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  deleteStudent(deleteConfirmId);
                  setDeleteConfirmId(null);
                  if (selectedStudentForDrawer?.id === deleteConfirmId) {
                    setSelectedStudentForDrawer(null);
                  }
                }}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-rose-600 hover:bg-rose-700 text-white shadow-sm"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detailed Student Profile Slide-Over Drawer */}
      {selectedStudentForDrawer && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
            onClick={() => setSelectedStudentForDrawer(null)}
          />

          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-2xl bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col">
              {/* Drawer Header */}
              <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-start justify-between bg-slate-50/50 dark:bg-slate-800/50">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                      {selectedStudentForDrawer.name}
                    </h2>
                    <span
                      className={`px-2 py-0.5 text-[10px] font-bold rounded-md ${
                        selectedStudentForDrawer.status === 'active'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {selectedStudentForDrawer.status.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold mt-0.5">
                    {selectedStudentForDrawer.grade} • {selectedStudentForDrawer.schoolOrCollege}
                  </p>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleOpenEdit(selectedStudentForDrawer)}
                    className="p-2 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                    title="Edit profile"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setSelectedStudentForDrawer(null)}
                    className="p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Drawer Content */}
              <div className="flex-1 overflow-y-auto p-5 space-y-6 text-xs">
                {/* Academic & Contact Info */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400">
                      Starting Date
                    </span>
                    <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                      {formatDisplayDate(selectedStudentForDrawer.startDate, settings.calendarMode)}
                    </p>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400">
                      Parent / Guardian
                    </span>
                    <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                      {selectedStudentForDrawer.parentName || 'Not specified'}
                    </p>
                    <p className="text-slate-500">{selectedStudentForDrawer.parentContact}</p>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400">
                      Student Phone
                    </span>
                    <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                      {selectedStudentForDrawer.contactNumber || 'Not specified'}
                    </p>
                  </div>

                  <div className="col-span-2 sm:col-span-3 border-t border-slate-200/60 dark:border-slate-700/60 pt-2">
                    <span className="text-[10px] uppercase font-bold text-slate-400">
                      Address / Location
                    </span>
                    <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                      {selectedStudentForDrawer.address || 'Not specified'}
                    </p>
                  </div>
                </div>

                {/* Fee & Payment Ledger for this student */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <CreditCard className="w-4 h-4 text-indigo-600" />
                      Payment History & Fees
                    </h4>
                    <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                      {selectedStudentForDrawer.feeStructure === 'hourly'
                        ? `${formatCurrency(Math.round(((selectedStudentForDrawer.classDurationMinutes || 60) / 60) * selectedStudentForDrawer.feeAmount), settings.currency)}/session (${formatCurrency(selectedStudentForDrawer.feeAmount, settings.currency)}/hr)`
                        : `${formatCurrency(selectedStudentForDrawer.feeAmount, settings.currency)} / ${selectedStudentForDrawer.feeStructure}`}
                    </span>
                  </div>

                  <div className="space-y-2">
                    {payments
                      .filter((p) => p.studentId === selectedStudentForDrawer.id)
                      .map((p) => (
                        <div
                          key={p.id}
                          className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex items-center justify-between"
                        >
                          <div>
                            <span className="font-bold text-slate-900 dark:text-white block">
                              Period: {p.periodMonthYear}
                            </span>
                            <span className="text-[11px] text-slate-500">
                              Paid {formatDisplayDate(p.paymentDate, settings.dateSystem, 'short')} via{' '}
                              {p.paymentMethod}
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="font-bold text-emerald-600 dark:text-emerald-400 block">
                              {formatCurrency(p.amountPaid, settings.currency)}
                            </span>
                            {p.remainingBalance > 0 && (
                              <span className="text-[10px] text-rose-500 font-bold">
                                Bal: {formatCurrency(p.remainingBalance, settings.currency)}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>

                {/* Academic Performance Test History */}
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 mb-2">
                    <Award className="w-4 h-4 text-indigo-600" />
                    Test & Exam Records
                  </h4>

                  <div className="space-y-2">
                    {performance
                      .filter((perf) => perf.studentId === selectedStudentForDrawer.id)
                      .map((perf) => {
                        const { grade, color } = calculateGrade(perf.percentage);
                        return (
                          <div
                            key={perf.id}
                            className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <span className="font-bold text-slate-900 dark:text-white block">
                                  {perf.examName} ({perf.subject})
                                </span>
                                <span className="text-[11px] text-slate-500">
                                  {formatDisplayDate(perf.date, settings.dateSystem, 'medium')}
                                </span>
                              </div>
                              <span className={`px-2 py-0.5 text-xs font-bold rounded-md border ${color}`}>
                                {grade} ({perf.percentage}%) • {perf.obtainedMarks}/{perf.fullMarks}
                              </span>
                            </div>
                            {perf.teacherRemarks && (
                              <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-2 bg-slate-50 dark:bg-slate-900/50 p-2 rounded-lg italic">
                                "{perf.teacherRemarks}"
                              </p>
                            )}
                          </div>
                        );
                      })}
                  </div>
                </div>

                {/* Notes */}
                {selectedStudentForDrawer.notes && (
                  <div className="p-3.5 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-800/40">
                    <span className="text-[10px] uppercase font-bold text-amber-800 dark:text-amber-300 block mb-1">
                      Teacher Notes
                    </span>
                    <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                      {selectedStudentForDrawer.notes}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
