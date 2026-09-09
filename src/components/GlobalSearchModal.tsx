import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { formatCurrency } from '../utils/formatters';
import {
  Search,
  X,
  Users,
  Calendar,
  CreditCard,
  Building2,
  Award,
  ArrowRight,
  Plus,
  Sliders,
  CheckCircle2,
  Clock,
  BookOpen,
  CalendarDays,
  Sparkles,
} from 'lucide-react';

export const GlobalSearchModal: React.FC = () => {
  const {
    isSearchModalOpen,
    closeSearchModal,
    students,
    institutions,
    classes,
    payments,
    performance,
    setActiveTab,
    openQuickAction,
    settings,
    setSearchQuery: setGlobalSearchQuery,
  } = useApp();

  const [localQuery, setLocalQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto focus input when modal opens
  useEffect(() => {
    if (isSearchModalOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    } else {
      setLocalQuery('');
      setSelectedCategory('all');
    }
  }, [isSearchModalOpen]);

  // Close on escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isSearchModalOpen) {
        closeSearchModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSearchModalOpen, closeSearchModal]);

  const q = localQuery.toLowerCase().trim();

  // Search in Students
  const matchingStudents = useMemo(() => {
    if (!q) return students.slice(0, 4);
    return students.filter((s) => {
      return (
        (s.name && s.name.toLowerCase().includes(q)) ||
        (s.grade && s.grade.toLowerCase().includes(q)) ||
        (s.schoolOrCollege && s.schoolOrCollege.toLowerCase().includes(q)) ||
        (s.contactNumber && s.contactNumber.includes(q)) ||
        (s.subjects && s.subjects.some((sub) => sub.toLowerCase().includes(q)))
      );
    });
  }, [students, q]);

  // Search in Classes / Routine
  const matchingClasses = useMemo(() => {
    if (!q) return classes.slice(0, 3);
    return classes.filter((c) => {
      return (
        (c.title && c.title.toLowerCase().includes(q)) ||
        (c.subject && c.subject.toLowerCase().includes(q)) ||
        (c.location && c.location.toLowerCase().includes(q)) ||
        (c.scheduleDays && c.scheduleDays.some((d) => d.toLowerCase().includes(q))) ||
        (c.startTime && c.startTime.includes(q))
      );
    });
  }, [classes, q]);

  // Search in Payments
  const matchingPayments = useMemo(() => {
    if (!q) return payments.slice(0, 3);
    return payments.filter((p) => {
      return (
        (p.targetName && p.targetName.toLowerCase().includes(q)) ||
        (p.receiptNumber && p.receiptNumber.toLowerCase().includes(q)) ||
        (p.paymentMethod && p.paymentMethod.toLowerCase().includes(q)) ||
        (p.periodMonthYear && p.periodMonthYear.toLowerCase().includes(q)) ||
        (p.status && p.status.toLowerCase().includes(q)) ||
        String(p.amountPaid || '').includes(q)
      );
    });
  }, [payments, q]);

  // Search in Institutions
  const matchingInstitutions = useMemo(() => {
    if (!q) return institutions.slice(0, 3);
    return institutions.filter((inst) => {
      return (
        (inst.name && inst.name.toLowerCase().includes(q)) ||
        (inst.facultyOrGrade && inst.facultyOrGrade.toLowerCase().includes(q)) ||
        (inst.subjects && inst.subjects.some((f) => f.toLowerCase().includes(q))) ||
        (inst.contactPerson && inst.contactPerson.toLowerCase().includes(q))
      );
    });
  }, [institutions, q]);

  // Quick Navigation & Actions
  const quickActions = useMemo(() => {
    const actions = [
      {
        id: 'nav-routine',
        title: 'View Weekly Routine & Schedule',
        subtitle: 'View today’s periods and class timetable',
        icon: CalendarDays,
        tab: 'routine',
        category: 'navigation',
      },
      {
        id: 'nav-students',
        title: 'Manage Students & Batches',
        subtitle: 'Tuition fees, attendance, and contact directory',
        icon: Users,
        tab: 'students',
        category: 'navigation',
      },
      {
        id: 'nav-payments',
        title: 'Payment Register & Overdue Dues',
        subtitle: 'Student fee receipts and college payouts',
        icon: CreditCard,
        tab: 'payments',
        category: 'navigation',
      },
      {
        id: 'nav-attendance',
        title: 'Mark Daily Attendance',
        subtitle: 'Track student presence and college period logs',
        icon: CheckCircle2,
        tab: 'attendance',
        category: 'navigation',
      },
      {
        id: 'nav-calculator',
        title: 'College Salary & Rate Calculator',
        subtitle: 'Calculate period rates and monthly earnings',
        icon: Sliders,
        tab: 'calculator',
        category: 'navigation',
      },
      {
        id: 'act-add-student',
        title: 'Add New Tuition Student',
        subtitle: 'Create individual or group batch profile',
        icon: Plus,
        action: () => openQuickAction('student'),
        category: 'action',
      },
      {
        id: 'act-record-payment',
        title: 'Record Fee or Salary Payment',
        subtitle: 'Log received cash, eSewa, Khalti, or bank transfer',
        icon: CreditCard,
        action: () => openQuickAction('payment'),
        category: 'action',
      },
      {
        id: 'act-add-class',
        title: 'Schedule New Class / Period',
        subtitle: 'Add routine slot with start time and days',
        icon: Calendar,
        action: () => openQuickAction('class'),
        category: 'action',
      },
    ];

    if (!q) return actions.slice(0, 4);
    return actions.filter(
      (a) =>
        a.title.toLowerCase().includes(q) ||
        a.subtitle.toLowerCase().includes(q)
    );
  }, [q, openQuickAction]);

  const totalResultsCount =
    matchingStudents.length +
    matchingClasses.length +
    matchingPayments.length +
    matchingInstitutions.length +
    quickActions.length;

  if (!isSearchModalOpen) return null;

  const handleSelectStudent = (studentName: string) => {
    setGlobalSearchQuery(studentName);
    setActiveTab('students');
    closeSearchModal();
  };

  const handleSelectClass = () => {
    setActiveTab('routine');
    closeSearchModal();
  };

  const handleSelectPayment = () => {
    setActiveTab('payments');
    closeSearchModal();
  };

  const handleSelectInstitution = () => {
    setActiveTab('institutions');
    closeSearchModal();
  };

  const handleSelectAction = (item: any) => {
    if (item.tab) {
      setActiveTab(item.tab);
    } else if (item.action) {
      item.action();
    }
    closeSearchModal();
  };

  return (
    <div
      id="modal-global-search-overlay"
      className="fixed inset-0 z-50 flex items-start justify-center p-3 sm:p-6 sm:pt-16 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) closeSearchModal();
      }}
    >
      <div
        id="modal-global-search-container"
        className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-150"
      >
        {/* Search Input Bar */}
        <div className="p-3 sm:p-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
          <Search className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0" />
          <input
            ref={inputRef}
            id="input-spotlight-search"
            type="text"
            placeholder="Search students, classes, payments, colleges, actions..."
            value={localQuery}
            onChange={(e) => setLocalQuery(e.target.value)}
            className="flex-1 bg-transparent text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm sm:text-base focus:outline-none"
          />
          {localQuery && (
            <button
              onClick={() => setLocalQuery('')}
              className="p-1 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-md"
            >
              Clear
            </button>
          )}
          <button
            id="btn-close-spotlight"
            onClick={closeSearchModal}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
            aria-label="Close search"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Category Pills */}
        <div className="px-4 py-2 bg-slate-50/70 dark:bg-slate-850 border-b border-slate-100 dark:border-slate-800/80 flex items-center gap-1.5 overflow-x-auto no-scrollbar text-xs">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-2.5 py-1 rounded-lg font-medium transition whitespace-nowrap ${
              selectedCategory === 'all'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            All Results
          </button>
          <button
            onClick={() => setSelectedCategory('students')}
            className={`px-2.5 py-1 rounded-lg font-medium transition flex items-center gap-1 whitespace-nowrap ${
              selectedCategory === 'students'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <Users className="w-3 h-3" /> Students ({matchingStudents.length})
          </button>
          <button
            onClick={() => setSelectedCategory('classes')}
            className={`px-2.5 py-1 rounded-lg font-medium transition flex items-center gap-1 whitespace-nowrap ${
              selectedCategory === 'classes'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <Calendar className="w-3 h-3" /> Classes ({matchingClasses.length})
          </button>
          <button
            onClick={() => setSelectedCategory('payments')}
            className={`px-2.5 py-1 rounded-lg font-medium transition flex items-center gap-1 whitespace-nowrap ${
              selectedCategory === 'payments'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <CreditCard className="w-3 h-3" /> Payments ({matchingPayments.length})
          </button>
          <button
            onClick={() => setSelectedCategory('colleges')}
            className={`px-2.5 py-1 rounded-lg font-medium transition flex items-center gap-1 whitespace-nowrap ${
              selectedCategory === 'colleges'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <Building2 className="w-3 h-3" /> Colleges ({matchingInstitutions.length})
          </button>
        </div>

        {/* Results List */}
        <div className="p-3 sm:p-4 overflow-y-auto space-y-4 flex-1 divide-y divide-slate-100 dark:divide-slate-800/80">
          {totalResultsCount === 0 && (
            <div className="py-12 text-center text-slate-400 dark:text-slate-500">
              <Search className="w-10 h-10 mx-auto mb-2 opacity-40 text-indigo-500" />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                No matching records found for "{localQuery}"
              </p>
              <p className="text-xs mt-1">
                Try searching with a different student name, subject, or college.
              </p>
            </div>
          )}

          {/* 1. Quick Actions & Navigation */}
          {(selectedCategory === 'all' || selectedCategory === 'actions') && quickActions.length > 0 && (
            <div className="space-y-1.5">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-2">
                Quick Actions & Pages
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {quickActions.map((action) => {
                  const Icon = action.icon;
                  return (
                    <button
                      key={action.id}
                      onClick={() => handleSelectAction(action)}
                      className="p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/80 text-left transition flex items-center gap-3 border border-slate-100 dark:border-slate-800/50 group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                          {action.title}
                        </p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                          {action.subtitle}
                        </p>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 group-hover:text-indigo-500 transition-colors shrink-0" />
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 2. Students */}
          {(selectedCategory === 'all' || selectedCategory === 'students') && matchingStudents.length > 0 && (
            <div className="space-y-1.5 pt-3">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-2 flex items-center justify-between">
                <span>Students & Batches ({matchingStudents.length})</span>
                <span className="text-[10px] lowercase font-normal text-indigo-500">Click to view profile</span>
              </h4>
              <div className="space-y-1">
                {matchingStudents.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => handleSelectStudent(s.name)}
                    className="w-full p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-left transition flex items-center justify-between gap-3 border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 text-white font-bold text-xs flex items-center justify-center shrink-0">
                        {s.name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                            {s.name}
                          </p>
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                            {s.grade}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                          {(s.subjects || []).join(', ')} • {s.schoolOrCollege || s.tuitionType}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        {formatCurrency(s.feeAmount, settings.currency)}
                      </p>
                      <span
                        className={`text-[10px] font-medium uppercase ${
                          s.status === 'active'
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-slate-400'
                        }`}
                      >
                        {s.status}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 3. Classes / Routine */}
          {(selectedCategory === 'all' || selectedCategory === 'classes') && matchingClasses.length > 0 && (
            <div className="space-y-1.5 pt-3">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-2">
                Classes & Routine ({matchingClasses.length})
              </h4>
              <div className="space-y-1">
                {matchingClasses.map((c) => (
                  <button
                    key={c.id}
                    onClick={handleSelectClass}
                    className="w-full p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-left transition flex items-center justify-between gap-3 border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                        <Clock className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                          {c.title || c.subject}
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                          {c.subject} • {(c.scheduleDays || []).map((d) => d.slice(0, 3)).join(', ') || 'Flexible Schedule'}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                        {c.startTime}
                      </p>
                      <span className="text-[10px] text-slate-400">
                        {c.durationMinutes} mins
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 4. Payments */}
          {(selectedCategory === 'all' || selectedCategory === 'payments') && matchingPayments.length > 0 && (
            <div className="space-y-1.5 pt-3">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-2">
                Payments & Dues ({matchingPayments.length})
              </h4>
              <div className="space-y-1">
                {matchingPayments.map((p) => (
                  <button
                    key={p.id}
                    onClick={handleSelectPayment}
                    className="w-full p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-left transition flex items-center justify-between gap-3 border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                        <CreditCard className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                          {p.targetName} ({p.periodMonthYear})
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                          {p.type === 'college_salary' ? 'College Salary' : 'Student Tuition Fee'} • {p.paymentMethod}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="text-xs font-bold text-slate-900 dark:text-white">
                        {formatCurrency(p.amountPaid, settings.currency)}
                      </p>
                      <span
                        className={`text-[10px] font-semibold uppercase ${
                          p.status === 'paid'
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : p.status === 'overdue'
                            ? 'text-rose-600 dark:text-rose-400'
                            : 'text-amber-600 dark:text-amber-400'
                        }`}
                      >
                        {p.status}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 5. Institutions */}
          {(selectedCategory === 'all' || selectedCategory === 'colleges') && matchingInstitutions.length > 0 && (
            <div className="space-y-1.5 pt-3">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-2">
                Colleges & Schools ({matchingInstitutions.length})
              </h4>
              <div className="space-y-1">
                {matchingInstitutions.map((inst) => (
                  <button
                    key={inst.id}
                    onClick={handleSelectInstitution}
                    className="w-full p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-left transition flex items-center justify-between gap-3 border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                        <Building2 className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                          {inst.name}
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                          {inst.facultyOrGrade} • {(inst.subjects || []).join(', ')}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        {formatCurrency(inst.rateAmount, settings.currency)}
                        {inst.paymentStructure === 'per_period' ? '/period' : `/${inst.paymentStructure}`}
                      </p>
                      <span className="text-[10px] text-slate-400 capitalize">
                        {inst.paymentStructure.replace('_', ' ')}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer info & shortcut guide */}
        <div className="p-3 bg-slate-50 dark:bg-slate-850 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <span>Navigation:</span>
            <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[10px] font-mono shadow-2xs">
              Ctrl+K
            </kbd>
            <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[10px] font-mono shadow-2xs">
              ESC to close
            </kbd>
          </div>
          <div className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 font-medium">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Instant Spotlight</span>
          </div>
        </div>
      </div>
    </div>
  );
};
