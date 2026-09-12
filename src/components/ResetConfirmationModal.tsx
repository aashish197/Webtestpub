import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  AlertTriangle,
  Trash2,
  User,
  Users,
  Building2,
  ShieldAlert,
  Check,
  X,
  RefreshCw,
  Mail,
} from 'lucide-react';

export type ResetType = 'all' | 'teacher' | 'students' | 'colleges';

interface ResetConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialType?: ResetType;
}

export const ResetConfirmationModal: React.FC<ResetConfirmationModalProps> = ({
  isOpen,
  onClose,
  initialType = 'all',
}) => {
  const {
    currentUser,
    settings,
    students,
    institutions,
    classes,
    payments,
    attendance,
    performance,
    resetAllData,
    resetTeacherDataOnly,
    resetStudentsDataOnly,
    resetCollegesDataOnly,
  } = useApp();

  const [selectedType, setSelectedType] = useState<ResetType>(initialType);
  const [confirmText, setConfirmText] = useState('');
  const [hasAcknowledged, setHasAcknowledged] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const preservedEmail = currentUser?.email || settings.email || 'Logged-in Account Email';

  const handleExecuteReset = async () => {
    if (confirmText.trim().toUpperCase() !== 'RESET' || !hasAcknowledged) {
      return;
    }

    setIsProcessing(true);
    try {
      if (selectedType === 'all') {
        await resetAllData();
        setSuccessMessage('All student and teacher data has been completely erased. Your email address was preserved.');
      } else if (selectedType === 'teacher') {
        await resetTeacherDataOnly();
        setSuccessMessage('Teacher profile information has been reset. Colleges, students, and tuition data were preserved.');
      } else if (selectedType === 'students') {
        await resetStudentsDataOnly();
        setSuccessMessage('All student profiles, tuition routines, attendance, and fee records have been erased.');
      } else if (selectedType === 'colleges') {
        await resetCollegesDataOnly();
        setSuccessMessage('All colleges, campus schedules, and salary records have been erased. Student records and teacher profile were preserved.');
      }

      setTimeout(() => {
        setIsProcessing(false);
        setSuccessMessage(null);
        setConfirmText('');
        setHasAcknowledged(false);
        onClose();
      }, 1800);
    } catch (error) {
      console.error('Failed to execute reset:', error);
      setIsProcessing(false);
    }
  };

  const isFormValid = confirmText.trim().toUpperCase() === 'RESET' && hasAcknowledged;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 max-w-xl w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Data Reset & Erasure
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Choose the scope of data you wish to delete. Confirmation is strictly required.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success Overlay if finished */}
        {successMessage ? (
          <div className="py-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 mx-auto flex items-center justify-center">
              <Check className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Reset Completed
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 max-w-sm mx-auto">
              {successMessage}
            </p>
          </div>
        ) : (
          <>
            {/* Reset Scope Selector */}
            <div className="space-y-2.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                1. Select Reset Scope
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                {/* 1. Delete All */}
                <button
                  type="button"
                  onClick={() => setSelectedType('all')}
                  className={`p-3 rounded-xl border text-left transition relative flex flex-col justify-between ${
                    selectedType === 'all'
                      ? 'border-rose-500 bg-rose-50/50 dark:bg-rose-950/30 ring-2 ring-rose-500/20'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="p-1.5 rounded-lg bg-rose-100 dark:bg-rose-900/50 text-rose-600 dark:text-rose-300">
                      <Trash2 className="w-4 h-4" />
                    </span>
                    {selectedType === 'all' && (
                      <span className="w-2 h-2 rounded-full bg-rose-600" />
                    )}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                      Delete All
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-tight">
                      Erases all data except login email ID.
                    </p>
                  </div>
                </button>

                {/* 2. Teacher Only */}
                <button
                  type="button"
                  onClick={() => setSelectedType('teacher')}
                  className={`p-3 rounded-xl border text-left transition relative flex flex-col justify-between ${
                    selectedType === 'teacher'
                      ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/30 ring-2 ring-amber-500/20'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="p-1.5 rounded-lg bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300">
                      <User className="w-4 h-4" />
                    </span>
                    {selectedType === 'teacher' && (
                      <span className="w-2 h-2 rounded-full bg-amber-600" />
                    )}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                      Teacher Only
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-tight">
                      Wipes teacher profile info. Keeps students & colleges.
                    </p>
                  </div>
                </button>

                {/* 3. Students Only */}
                <button
                  type="button"
                  onClick={() => setSelectedType('students')}
                  className={`p-3 rounded-xl border text-left transition relative flex flex-col justify-between ${
                    selectedType === 'students'
                      ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/30 ring-2 ring-blue-500/20'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300">
                      <Users className="w-4 h-4" />
                    </span>
                    {selectedType === 'students' && (
                      <span className="w-2 h-2 rounded-full bg-blue-600" />
                    )}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                      Students Only
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-tight">
                      Wipes all students & fees. Keeps teacher & colleges.
                    </p>
                  </div>
                </button>

                {/* 4. Colleges Only */}
                <button
                  type="button"
                  onClick={() => setSelectedType('colleges')}
                  className={`p-3 rounded-xl border text-left transition relative flex flex-col justify-between ${
                    selectedType === 'colleges'
                      ? 'border-purple-500 bg-purple-50/50 dark:bg-purple-950/30 ring-2 ring-purple-500/20'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="p-1.5 rounded-lg bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-300">
                      <Building2 className="w-4 h-4" />
                    </span>
                    {selectedType === 'colleges' && (
                      <span className="w-2 h-2 rounded-full bg-purple-600" />
                    )}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                      Colleges Only
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-tight">
                      Wipes colleges & salaries. Keeps students & teacher.
                    </p>
                  </div>
                </button>
              </div>
            </div>

            {/* Scope Details & Breakdown */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700 dark:text-slate-300">
                  Detailed Scope Summary:
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                  {selectedType === 'all'
                    ? 'Delete All'
                    : selectedType === 'teacher'
                    ? 'Teacher Profile Only'
                    : selectedType === 'students'
                    ? 'Students Data Only'
                    : 'Colleges Data Only'}
                </span>
              </div>

              <div className="space-y-2 text-xs">
                {selectedType === 'all' && (
                  <>
                    <div className="flex items-start gap-2 text-rose-600 dark:text-rose-400">
                      <Trash2 className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                      <span>
                        <strong>Will delete:</strong> All {students.length} students, {classes.length} routine slots, {attendance.length} attendance records, {payments.length} payment records, {performance.length} exam marks, {institutions.length} institutions, and teacher profile details.
                      </span>
                    </div>
                    <div className="flex items-start gap-2 text-emerald-600 dark:text-emerald-400 pt-1 border-t border-slate-200 dark:border-slate-700">
                      <Mail className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                      <span>
                        <strong>Preserved:</strong> Your login email ID (<span className="font-mono font-semibold">{preservedEmail}</span>) will remain saved and intact.
                      </span>
                    </div>
                  </>
                )}

                {selectedType === 'teacher' && (
                  <>
                    <div className="flex items-start gap-2 text-amber-700 dark:text-amber-400">
                      <Trash2 className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                      <span>
                        <strong>Will delete:</strong> Teacher personal name, contact number, qualification, subject specializations, address, and biography.
                      </span>
                    </div>
                    <div className="flex items-start gap-2 text-emerald-600 dark:text-emerald-400 pt-1 border-t border-slate-200 dark:border-slate-700">
                      <Check className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                      <span>
                        <strong>Preserved:</strong> Email ID (<span className="font-mono font-semibold">{preservedEmail}</span>), all {students.length} student records, student tuition classes, student attendance, student payments, and {institutions.length} colleges with schedules & salaries.
                      </span>
                    </div>
                  </>
                )}

                {selectedType === 'students' && (
                  <>
                    <div className="flex items-start gap-2 text-rose-600 dark:text-rose-400">
                      <Trash2 className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                      <span>
                        <strong>Will delete:</strong> All {students.length} student profiles, student tuition classes, student attendance logs, student fee records, and exam marks.
                      </span>
                    </div>
                    <div className="flex items-start gap-2 text-emerald-600 dark:text-emerald-400 pt-1 border-t border-slate-200 dark:border-slate-700">
                      <Check className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                      <span>
                        <strong>Preserved:</strong> Teacher profile, email ID (<span className="font-mono font-semibold">{preservedEmail}</span>), all {institutions.length} colleges, college classes, and college salary payment records.
                      </span>
                    </div>
                  </>
                )}

                {selectedType === 'colleges' && (
                  <>
                    <div className="flex items-start gap-2 text-purple-600 dark:text-purple-400">
                      <Trash2 className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                      <span>
                        <strong>Will delete:</strong> All {institutions.length} colleges/institutions, college period routines, college attendance logs, and college salary payment records.
                      </span>
                    </div>
                    <div className="flex items-start gap-2 text-emerald-600 dark:text-emerald-400 pt-1 border-t border-slate-200 dark:border-slate-700">
                      <Check className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                      <span>
                        <strong>Preserved:</strong> Teacher profile, email ID (<span className="font-mono font-semibold">{preservedEmail}</span>), all {students.length} student records, student tuition classes, student attendance, student fee payments, and performance exam records.
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Acknowledgment & Type-to-Confirm */}
            <div className="space-y-3 pt-2">
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasAcknowledged}
                  onChange={(e) => setHasAcknowledged(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded text-rose-600 focus:ring-rose-500 border-slate-300 dark:border-slate-700"
                />
                <span className="text-xs text-slate-700 dark:text-slate-300 font-medium select-none">
                  I understand that this action cannot be undone and will permanently remove selected data from local storage and cloud database.
                </span>
              </label>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Type <span className="font-mono font-bold text-rose-600 bg-rose-50 dark:bg-rose-950/60 px-1 py-0.5 rounded">RESET</span> to confirm:
                </label>
                <input
                  type="text"
                  placeholder="Type RESET here"
                  value={confirmText || ''}
                  onChange={(e) => setConfirmText(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={onClose}
                disabled={isProcessing}
                className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteReset}
                disabled={!isFormValid || isProcessing}
                className={`px-5 py-2 text-xs font-bold rounded-xl text-white shadow-sm flex items-center gap-1.5 transition ${
                  isFormValid && !isProcessing
                    ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-500/20 cursor-pointer'
                    : 'bg-slate-300 dark:bg-slate-800 text-slate-500 cursor-not-allowed'
                }`}
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Erasing Data...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>
                      {selectedType === 'all'
                        ? 'Confirm Delete All'
                        : selectedType === 'teacher'
                        ? 'Confirm Reset Teacher'
                        : 'Confirm Reset Students'}
                    </span>
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
