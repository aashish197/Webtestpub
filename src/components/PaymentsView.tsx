import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { PaymentRecord, PaymentType, PaymentStatus, PaymentMethod } from '../types';
import {
  CreditCard,
  Plus,
  Search,
  Filter,
  CheckCircle,
  AlertTriangle,
  Clock,
  Send,
  Download,
  Copy,
  Edit2,
  Trash2,
  Check,
  Building2,
  Users,
  DollarSign,
  X,
  FileText,
  Printer,
} from 'lucide-react';
import {
  formatCurrency,
  getPaymentStatusBadge,
  generatePaymentReminderText,
  exportToCsv,
} from '../utils/formatters';
import { formatDisplayDate, getTodayIso, NEPALI_MONTHS_EN, adToBs } from '../utils/nepaliCalendar';

export const PaymentsView: React.FC = () => {
  const {
    payments,
    recordPayment,
    updatePayment,
    deletePayment,
    students,
    institutions,
    settings,
  } = useApp();

  const [typeFilter, setTypeFilter] = useState<'ALL' | PaymentType>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | PaymentStatus>('ALL');
  const [search, setSearch] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<PaymentRecord | null>(null);
  const [receiptRecord, setReceiptRecord] = useState<PaymentRecord | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const todayIso = getTodayIso();
  const currentMonthIso = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;

  // Form State
  const initialFormState: Omit<PaymentRecord, 'id' | 'createdAt'> = {
    type: 'tuition_fee',
    studentId: students[0]?.id || '',
    institutionId: '',
    targetName: students[0]?.name || 'Student',
    periodMonthYear: currentMonthIso,
    amountDue: students[0]?.feeAmount || 10000,
    amountPaid: students[0]?.feeAmount || 10000,
    remainingBalance: 0,
    paymentDate: todayIso,
    dueDate: todayIso,
    paymentMethod: 'eSewa',
    status: 'paid',
    receiptNumber: `REC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
    referenceNote: '',
  };

  const [formData, setFormData] = useState<Omit<PaymentRecord, 'id' | 'createdAt'>>(initialFormState);

  // Summary figures
  const totalCollectedThisMonth = useMemo(() => {
    return payments
      .filter((p) => (p.periodMonthYear === currentMonthIso || p.paymentDate.startsWith(currentMonthIso)) && p.status === 'paid')
      .reduce((sum, p) => sum + p.amountPaid, 0);
  }, [payments, currentMonthIso]);

  const totalPendingOrOverdue = useMemo(() => {
    return payments
      .filter((p) => p.status === 'pending' || p.status === 'overdue' || p.status === 'partial')
      .reduce((sum, p) => sum + p.remainingBalance, 0);
  }, [payments]);

  const overdueCount = useMemo(() => {
    return payments.filter((p) => p.status === 'overdue' || (p.status === 'pending' && p.dueDate < todayIso)).length;
  }, [payments, todayIso]);

  // Filtered Payments
  const filteredPayments = useMemo(() => {
    const q = search.toLowerCase().trim();
    return payments.filter((p) => {
      const matchSearch =
        !q ||
        p.targetName.toLowerCase().includes(q) ||
        (p.receiptNumber && p.receiptNumber.toLowerCase().includes(q)) ||
        (p.referenceNote && p.referenceNote.toLowerCase().includes(q));

      const matchType =
        typeFilter === 'ALL' ||
        (typeFilter === 'tuition_fee' &&
          (p.type === 'tuition_fee' || p.type === 'tuition' || (!p.institutionId && !!p.studentId))) ||
        (typeFilter === 'college_salary' &&
          (p.type === 'college_salary' || (!p.studentId && !!p.institutionId)));
      const matchStatus = statusFilter === 'ALL' || p.status === statusFilter;

      return matchSearch && matchType && matchStatus;
    });
  }, [payments, search, typeFilter, statusFilter]);

  const handleOpenAdd = () => {
    setEditingPayment(null);
    setFormData(initialFormState);
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (rec: PaymentRecord) => {
    setEditingPayment(rec);
    setFormData({
      type: rec.type,
      studentId: rec.studentId,
      institutionId: rec.institutionId,
      targetName: rec.targetName,
      periodMonthYear: rec.periodMonthYear,
      amountDue: rec.amountDue,
      amountPaid: rec.amountPaid,
      remainingBalance: rec.remainingBalance,
      paymentDate: rec.paymentDate,
      dueDate: rec.dueDate,
      paymentMethod: rec.paymentMethod,
      status: rec.status,
      receiptNumber: rec.receiptNumber,
      referenceNote: rec.referenceNote || '',
    });
    setIsAddModalOpen(true);
  };

  const handleFormAmountChange = (due: number, paid: number) => {
    const remaining = Math.max(0, due - paid);
    let st: PaymentStatus = 'pending';
    if (paid >= due && due > 0) st = 'paid';
    else if (paid > 0 && paid < due) st = 'partial';
    else if (formData.dueDate < todayIso) st = 'overdue';

    setFormData({
      ...formData,
      amountDue: due,
      amountPaid: paid,
      remainingBalance: remaining,
      status: st,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingPayment) {
      updatePayment(editingPayment.id, formData);
    } else {
      recordPayment(formData);
    }
    setIsAddModalOpen(false);
  };

  const handleCopyReminder = (rec: PaymentRecord) => {
    const student = students.find((s) => s.id === rec.studentId);
    const msg = generatePaymentReminderText(rec, student, settings);
    navigator.clipboard.writeText(msg);
    setCopiedId(rec.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const getWhatsAppUrlForPayment = (rec: PaymentRecord) => {
    const student = students.find((s) => s.id === rec.studentId);
    const rawPhone = student?.parentPhone || student?.parentContact || student?.contactNumber || '';
    const cleanPhone = rawPhone.replace(/[^0-9]/g, '');
    const msg = generatePaymentReminderText(rec, student, settings);
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`;
  };

  const getWhatsAppReceiptUrl = (rec: PaymentRecord) => {
    const student = students.find((s) => s.id === rec.studentId);
    const rawPhone = student?.parentPhone || student?.parentContact || student?.contactNumber || '';
    const cleanPhone = rawPhone.replace(/[^0-9]/g, '');
    const text = `*OFFICIAL TUITION PAYMENT RECEIPT*
Receipt No: ${rec.receiptNumber || 'N/A'}
Educator: ${settings.teacherName}
Student: ${rec.targetName}
Period / Month: ${rec.periodMonthYear}
Amount Paid: ${formatCurrency(rec.amountPaid, settings.currency)}
Payment Date: ${formatDisplayDate(rec.paymentDate, settings.dateSystem, 'medium')}
Mode: ${rec.paymentMethod}
${rec.remainingBalance > 0 ? `Remaining Due: ${formatCurrency(rec.remainingBalance, settings.currency)}\n` : 'Status: Fully Cleared (PAID)\n'}
Thank you for your payment!`;
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
  };

  const handleExportCsv = () => {
    const rows = payments.map((p) => ({
      ID: p.id,
      Receipt_No: p.receiptNumber || '',
      Type: p.type,
      Target: p.targetName,
      Period: p.periodMonthYear,
      Due_Date_AD: p.dueDate,
      Payment_Date_AD: p.paymentDate,
      Amount_Due: p.amountDue,
      Amount_Paid: p.amountPaid,
      Remaining_Balance: p.remainingBalance,
      Status: p.status,
      Method: p.paymentMethod,
      Note: p.referenceNote || '',
    }));
    exportToCsv(`payment-ledger-${getTodayIso()}.csv`, rows);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400">
              <CreditCard className="w-5 h-5" />
            </div>
            Payments & Fee Tracking
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Track tuition fee collections, college salaries, pending balances, and copy payment reminders.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCsv}
            className="px-3 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition"
          >
            Export Ledger CSV
          </button>
          <button
            id="btn-add-payment-main"
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Record Payment</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-500">Collected This Month</span>
            <p className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">
              {formatCurrency(totalCollectedThisMonth, settings.currency)}
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-500">Total Pending Balance</span>
            <p className="text-xl font-bold text-amber-600 dark:text-amber-400 mt-0.5">
              {formatCurrency(totalPendingOrOverdue, settings.currency)}
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-500">Overdue Invoices</span>
            <p className="text-xl font-bold text-rose-600 dark:text-rose-400 mt-0.5">
              {overdueCount} student / contract{overdueCount === 1 ? '' : 's'}
            </p>
          </div>
        </div>
      </div>

      {/* SEARCH & FILTERS */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search target, receipt number, note..."
              value={search || ''}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-8 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                ✕
              </button>
            )}
          </div>

          <div>
            <select
              value={typeFilter || 'ALL'}
              onChange={(e) => setTypeFilter(e.target.value as any)}
              className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
            >
              <option value="ALL">All Payment Types</option>
              <option value="tuition_fee">Student Tuition Fees</option>
              <option value="college_salary">College Salary Payments</option>
            </select>
          </div>

          <div>
            <select
              value={statusFilter || 'ALL'}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
              <option value="overdue">Overdue</option>
              <option value="partial">Partial</option>
            </select>
          </div>
        </div>
      </div>

      {/* PAYMENTS TABLE */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-4 py-3 font-semibold">Receipt / Target</th>
                <th className="px-4 py-3 font-semibold">Period</th>
                <th className="px-4 py-3 font-semibold">Amount Due</th>
                <th className="px-4 py-3 font-semibold">Amount Paid</th>
                <th className="px-4 py-3 font-semibold">Due Date</th>
                <th className="px-4 py-3 font-semibold">Method & Status</th>
                <th className="px-4 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                    No payment records found.
                  </td>
                </tr>
              ) : (
                filteredPayments.map((p) => {
                  const { label, badgeClass } = getPaymentStatusBadge(p.status);
                  const isTuition = p.type === 'tuition_fee' || p.type === 'tuition' || (!p.institutionId && !!p.studentId);

                  return (
                    <tr
                      key={p.id}
                      className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition"
                    >
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              isTuition ? 'bg-teal-500' : 'bg-purple-500'
                            }`}
                          />
                          <div>
                            <span className="font-bold text-slate-900 dark:text-white block">
                              {p.targetName}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {p.receiptNumber || 'No receipt'}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3 text-slate-700 dark:text-slate-300 font-medium whitespace-nowrap">
                        {p.periodMonthYear}
                      </td>

                      <td className="px-4 py-3 font-bold text-slate-900 dark:text-white whitespace-nowrap">
                        {formatCurrency(p.amountDue, settings.currency)}
                      </td>

                      <td className="px-4 py-3 font-bold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                        {formatCurrency(p.amountPaid, settings.currency)}
                        {p.remainingBalance > 0 && (
                          <span className="block text-[10px] font-semibold text-amber-500">
                            Due: {formatCurrency(p.remainingBalance, settings.currency)}
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                        {formatDisplayDate(p.dueDate, settings.dateSystem, 'short')}
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md ${badgeClass}`}>
                            {label}
                          </span>
                          <span className="text-[10px] font-medium text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                            {p.paymentMethod}
                          </span>
                        </div>
                      </td>

                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          {isTuition && (p.status === 'pending' || p.status === 'overdue' || p.status === 'partial') && (
                            <>
                              <button
                                onClick={() => handleCopyReminder(p)}
                                className="px-2 py-1 text-[11px] font-semibold rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 dark:bg-amber-950/60 dark:text-amber-300 flex items-center gap-1"
                                title="Copy friendly SMS/WhatsApp reminder"
                              >
                                {copiedId === p.id ? (
                                  <>
                                    <Check className="w-3 h-3 text-emerald-600" />
                                    <span>Copied!</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3 h-3" />
                                    <span>Copy</span>
                                  </>
                                )}
                              </button>

                              <a
                                href={getWhatsAppUrlForPayment(p)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-2 py-1 text-[11px] font-semibold rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-300 flex items-center gap-1"
                                title="Send reminder directly via WhatsApp"
                              >
                                <Send className="w-3 h-3" />
                                <span>WhatsApp</span>
                              </a>
                            </>
                          )}

                          <button
                            onClick={() => setReceiptRecord(p)}
                            className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                            title="View / Print Receipt Slip"
                          >
                            <FileText className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleOpenEdit(p)}
                            className="p-1 rounded text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                            title="Edit payment"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => setDeleteConfirmId(p.id)}
                            className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                            title="Delete payment"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Payment Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 max-w-lg w-full p-6 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                {editingPayment ? 'Edit Payment Record' : 'Record Fee / Salary Payment'}
              </h2>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Payment Type
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setFormData({
                        ...formData,
                        type: 'tuition_fee',
                        targetName: students[0]?.name || 'Student',
                        studentId: students[0]?.id || '',
                        institutionId: '',
                        amountDue: students[0]?.feeAmount || 10000,
                        amountPaid: students[0]?.feeAmount || 10000,
                        remainingBalance: 0,
                      });
                    }}
                    className={`py-2 rounded-xl font-bold border transition ${
                      formData.type === 'tuition_fee'
                        ? 'bg-teal-50 dark:bg-teal-950 border-teal-500 text-teal-700 dark:text-teal-300'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 text-slate-600'
                    }`}
                  >
                    Tuition Fee
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setFormData({
                        ...formData,
                        type: 'college_salary',
                        targetName: institutions[0]?.name || 'College',
                        institutionId: institutions[0]?.id || '',
                        studentId: '',
                        amountDue: institutions[0]?.rateAmount || 35000,
                        amountPaid: institutions[0]?.rateAmount || 35000,
                        remainingBalance: 0,
                      });
                    }}
                    className={`py-2 rounded-xl font-bold border transition ${
                      formData.type === 'college_salary'
                        ? 'bg-purple-50 dark:bg-purple-950 border-purple-500 text-purple-700 dark:text-purple-300'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 text-slate-600'
                    }`}
                  >
                    College Salary
                  </button>
                </div>
              </div>

              {formData.type === 'tuition_fee' ? (
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Student *
                  </label>
                  <select
                    value={formData.studentId || ''}
                    onChange={(e) => {
                      const st = students.find((s) => s.id === e.target.value);
                      if (st) {
                        const calculatedFee = st.feeStructure === 'hourly'
                          ? Math.round(((st.classDurationMinutes || 60) / 60) * st.feeAmount)
                          : st.feeAmount;
                        setFormData({
                          ...formData,
                          studentId: st.id,
                          targetName: st.name,
                          amountDue: calculatedFee,
                          amountPaid: calculatedFee,
                          remainingBalance: 0,
                          referenceNote: st.feeStructure === 'hourly'
                            ? `Class fee (${st.classDurationMinutes || 60} mins @ ${formatCurrency(st.feeAmount, settings.currency)}/hr)`
                            : formData.referenceNote,
                        });
                      }
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
                  >
                    {students.map((st) => {
                      const sessionFee = st.feeStructure === 'hourly'
                        ? Math.round(((st.classDurationMinutes || 60) / 60) * st.feeAmount)
                        : st.feeAmount;
                      return (
                        <option key={st.id} value={st.id}>
                          {st.name} ({st.grade}) - {formatCurrency(sessionFee, settings.currency)}
                          {st.feeStructure === 'hourly' ? ` (${st.classDurationMinutes || 60}m @ ${formatCurrency(st.feeAmount, settings.currency)}/hr)` : ''}
                        </option>
                      );
                    })}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    College / Institution *
                  </label>
                  <select
                    value={formData.institutionId || ''}
                    onChange={(e) => {
                      const inst = institutions.find((i) => i.id === e.target.value);
                      if (inst) {
                        const calculatedFee =
                          inst.paymentStructure === 'hourly'
                            ? Math.round(((inst.periodDurationMinutes || 60) / 60) * inst.rateAmount)
                            : inst.paymentStructure === 'semester'
                            ? Math.round(inst.rateAmount / (inst.semesterDurationMonths || 6))
                            : inst.rateAmount;
                        setFormData({
                          ...formData,
                          institutionId: inst.id,
                          targetName: `${inst.name} (${inst.facultyOrGrade})`,
                          amountDue: calculatedFee,
                          amountPaid: calculatedFee,
                          remainingBalance: 0,
                          referenceNote:
                            inst.paymentStructure === 'hourly'
                              ? `Lecture salary (${inst.periodDurationMinutes || 60} mins @ ${formatCurrency(inst.rateAmount, settings.currency)}/hr)`
                              : inst.paymentStructure === 'semester'
                              ? `Semester salary (${inst.semesterDurationMonths || 6} months @ ${formatCurrency(inst.rateAmount, settings.currency)}/sem)`
                              : formData.referenceNote,
                        });
                      }
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
                  >
                    {institutions.map((inst) => (
                      <option key={inst.id} value={inst.id}>
                        {inst.name} ({inst.facultyOrGrade})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Billing Period (Month)
                  </label>
                  <input
                    type="month"
                    value={formData.periodMonthYear || ''}
                    onChange={(e) => setFormData({ ...formData, periodMonthYear: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Payment Method
                  </label>
                  <select
                    value={formData.paymentMethod || 'eSewa'}
                    onChange={(e) =>
                      setFormData({ ...formData, paymentMethod: e.target.value as PaymentMethod })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
                  >
                    <option value="eSewa">eSewa</option>
                    <option value="Khalti">Khalti</option>
                    <option value="Cash">Cash in Hand</option>
                    <option value="Bank Transfer">Bank Transfer / ConnectIPS</option>
                    <option value="Cheque">Cheque</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Total Due (Rs.) *
                  </label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={formData.amountDue ?? 0}
                    onChange={(e) =>
                      handleFormAmountChange(Number(e.target.value), formData.amountPaid)
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Amount Paid (Rs.) *
                  </label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={formData.amountPaid ?? 0}
                    onChange={(e) =>
                      handleFormAmountChange(formData.amountDue, Number(e.target.value))
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Balance (Rs.)
                  </label>
                  <input
                    type="number"
                    disabled
                    value={formData.remainingBalance ?? 0}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Payment Date
                  </label>
                  <input
                    type="date"
                    value={formData.paymentDate || ''}
                    onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={formData.dueDate || ''}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Reference / Transaction Note
                </label>
                <input
                  type="text"
                  placeholder="e.g. Transaction ID, Check # or Remarks"
                  value={formData.referenceNote || ''}
                  onChange={(e) => setFormData({ ...formData, referenceNote: e.target.value })}
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
                  className="px-5 py-2 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                >
                  {editingPayment ? 'Save Changes' : 'Record Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Printable Receipt Modal */}
      {receiptRecord && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-lg w-full p-6 sm:p-7 shadow-2xl space-y-5 print:p-0 print:border-none print:shadow-none">
            {/* Modal Top Controls (hidden on print) */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 print:hidden">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                  <FileText className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">Payment Receipt Voucher</h3>
              </div>
              <button
                onClick={() => setReceiptRecord(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Receipt Certificate Content */}
            <div className="p-6 rounded-2xl bg-slate-50/80 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs space-y-4 print:bg-white print:border-slate-300">
              {/* Institution / Teacher Header */}
              <div className="text-center pb-3 border-b border-dashed border-slate-200 dark:border-slate-700">
                <span className="text-[10px] uppercase font-bold tracking-widest text-indigo-600 dark:text-indigo-400 block mb-1">
                  OFFICIAL TUITION PAYMENT RECEIPT
                </span>
                <h4 className="font-extrabold text-slate-900 dark:text-white text-lg tracking-tight">
                  {settings.teacherName}
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Academic Tutoring & Private Coaching Services
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Contact: {settings.phone || 'N/A'} • Email: {settings.email || 'N/A'}
                </p>
              </div>

              {/* Receipt Metadata Pills */}
              <div className="grid grid-cols-2 gap-2 text-[11px] bg-white dark:bg-slate-900/80 p-3 rounded-xl border border-slate-200/80 dark:border-slate-700/80">
                <div>
                  <span className="text-slate-400 block text-[10px] font-semibold uppercase">Receipt No.</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                    {receiptRecord.receiptNumber || `RCP-${receiptRecord.id.slice(-6).toUpperCase()}`}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 block text-[10px] font-semibold uppercase">Payment Date</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {formatDisplayDate(receiptRecord.paymentDate, settings.dateSystem, 'medium')}
                  </span>
                </div>
              </div>

              {/* Itemized Particulars */}
              <div className="space-y-2 pt-1">
                <div className="flex justify-between py-1 border-b border-slate-200/50 dark:border-slate-700/50">
                  <span className="text-slate-500">Student / Payee:</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {receiptRecord.targetName}
                  </span>
                </div>

                <div className="flex justify-between py-1 border-b border-slate-200/50 dark:border-slate-700/50">
                  <span className="text-slate-500">Billing Period / Month:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {receiptRecord.periodMonthYear}
                  </span>
                </div>

                <div className="flex justify-between py-1 border-b border-slate-200/50 dark:border-slate-700/50">
                  <span className="text-slate-500">Payment Mode:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {receiptRecord.paymentMethod}
                  </span>
                </div>

                {receiptRecord.referenceNote && (
                  <div className="flex justify-between py-1 border-b border-slate-200/50 dark:border-slate-700/50">
                    <span className="text-slate-500">Reference / Note:</span>
                    <span className="text-slate-700 dark:text-slate-300 italic">
                      {receiptRecord.referenceNote}
                    </span>
                  </div>
                )}
              </div>

              {/* Totals & Clear Status Box */}
              <div className="p-3.5 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/50 space-y-1.5">
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Total Amount Due:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {formatCurrency(receiptRecord.amountDue, settings.currency)}
                  </span>
                </div>

                <div className="flex justify-between items-center pt-1 border-t border-indigo-200/60 dark:border-indigo-800/60">
                  <span className="font-bold text-slate-900 dark:text-white text-sm">
                    Amount Received:
                  </span>
                  <span className="text-base font-extrabold text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(receiptRecord.amountPaid, settings.currency)}
                  </span>
                </div>

                {receiptRecord.remainingBalance > 0 ? (
                  <div className="flex justify-between text-rose-600 dark:text-rose-400 font-bold text-xs pt-1 border-t border-indigo-200/60 dark:border-indigo-800/60">
                    <span>Outstanding Balance:</span>
                    <span>{formatCurrency(receiptRecord.remainingBalance, settings.currency)}</span>
                  </div>
                ) : (
                  <div className="pt-1 text-center">
                    <span className="inline-block px-3 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200 font-extrabold text-[10px] tracking-wider uppercase border border-emerald-300 dark:border-emerald-700">
                      ✓ Paid in Full & Cleared
                    </span>
                  </div>
                )}
              </div>

              {/* Signature Line */}
              <div className="pt-6 flex justify-between items-end text-[11px] text-slate-500">
                <div className="text-[10px]">
                  Generated via Teacher Suite<br />
                  System Timestamp: {new Date().toLocaleDateString()}
                </div>
                <div className="text-right">
                  <div className="w-32 border-b border-slate-400 dark:border-slate-500 mb-1" />
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    Authorized Educator Signature
                  </span>
                </div>
              </div>
            </div>

            {/* Modal Bottom Actions (hidden on print) */}
            <div className="flex flex-wrap items-center justify-end gap-2 pt-2 print:hidden">
              <a
                href={getWhatsAppReceiptUrl(receiptRecord)}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 shadow-sm transition active:scale-95"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send via WhatsApp</span>
              </a>

              <button
                onClick={() => window.print()}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 flex items-center gap-1.5 shadow-sm transition active:scale-95"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print / Save PDF</span>
              </button>
            </div>
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
              Delete Payment Entry?
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs mx-auto">
              This record will be deleted from your payment ledger and income summaries.
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
                  deletePayment(deleteConfirmId);
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
