import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { TeacherSettings, CurrencyCode, DateSystem, TimeFormat } from '../types';
import {
  Settings as SettingsIcon,
  User,
  Users,
  Globe,
  Clock,
  DollarSign,
  Database,
  Upload,
  Download,
  RotateCcw,
  Trash2,
  CheckCircle,
  AlertTriangle,
  Building2,
  Save,
  MessageSquare,
  ShieldCheck,
  Cloud,
  LogOut,
  RefreshCw,
  Sparkles,
  LogIn,
} from 'lucide-react';
import { getTodayIso } from '../utils/nepaliCalendar';

export const SettingsView: React.FC = () => {
  const {
    settings,
    updateSettings,
    exportDataJson,
    importDataJson,
    resetToSampleData,
    clearAllData,
    openResetModal,
    currentUser,
    openAuthModal,
    syncStatus,
    syncDataToCloud,
    isSyncing,
    logout,
  } = useApp();

  const sanitizeSettings = (s: TeacherSettings): TeacherSettings => ({
    ...s,
    teacherName: s.teacherName || '',
    phone: s.phone || '',
    email: s.email || '',
    address: s.address || '',
    bio: s.bio || '',
    reminderTemplate: s.reminderTemplate || '',
  });

  const [formData, setFormData] = useState<TeacherSettings>(() => sanitizeSettings(settings));
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState(false);

  useEffect(() => {
    setFormData(sanitizeSettings(settings));
  }, [settings]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings(formData);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleDownloadBackup = () => {
    const jsonStr = exportDataJson();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `teacher-manager-backup-${getTodayIso()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const success = importDataJson(content);
        if (success) {
          setImportSuccess(true);
          setImportError(null);
          setTimeout(() => setImportSuccess(false), 3000);
        } else {
          setImportError('Invalid backup JSON format. Please verify the file structure.');
        }
      } catch (err) {
        setImportError('Failed to parse backup JSON file.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              <SettingsIcon className="w-5 h-5" />
            </div>
            Settings & System Preferences
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Teacher profile, global date system (AD/BS), currency, notification templates, and backups.
          </p>
        </div>
      </div>

      {/* GOOGLE ACCOUNT & CLOUD SYNC CARD */}
      <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Cloud className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Google Account & Cloud Database
            </h2>
          </div>
          {currentUser && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Connected & Synced
            </span>
          )}
        </div>

        {currentUser ? (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700">
            <div className="flex items-center gap-3.5">
              {currentUser.photoURL ? (
                <img
                  src={currentUser.photoURL}
                  alt={currentUser.displayName || 'Google Profile'}
                  referrerPolicy="no-referrer"
                  className="w-12 h-12 rounded-full border-2 border-indigo-500 shadow-xs object-cover"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-indigo-600 text-white font-bold text-lg flex items-center justify-center">
                  {(currentUser.displayName || currentUser.email || 'T')[0].toUpperCase()}
                </div>
              )}
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  {currentUser.displayName || 'Google User'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {currentUser.email}
                </p>
                <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                  Firestore UID: {currentUser.uid}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                id="btn-settings-sync-now"
                onClick={() => syncDataToCloud()}
                disabled={isSyncing}
                className="px-3 py-2 text-xs font-semibold rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition flex items-center gap-1.5 disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{isSyncing ? 'Syncing...' : 'Sync to Cloud Now'}</span>
              </button>
              <button
                type="button"
                id="btn-settings-signout"
                onClick={() => logout()}
                className="px-3 py-2 text-xs font-semibold rounded-xl border border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition flex items-center gap-1.5"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Sign in or Register to protect your data
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Automatically backup student fees, class routines, attendance, and exam marks to Cloud Firestore via Email or Google.
              </p>
            </div>
            <button
              type="button"
              id="btn-settings-google-signin"
              onClick={openAuthModal}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm shadow-indigo-600/20 transition flex items-center justify-center gap-2 shrink-0 active:scale-95"
            >
              <LogIn className="w-4 h-4 shrink-0" />
              <span>Sign In / Register</span>
            </button>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 1. TEACHER PROFILE */}
        <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
            <User className="w-5 h-5 text-indigo-600" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Teacher Profile</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Teacher Full Name *
              </label>
              <input
                type="text"
                required
                value={formData.teacherName || ''}
                onChange={(e) => setFormData({ ...formData, teacherName: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Primary Contact Number *
              </label>
              <input
                type="text"
                required
                value={formData.phone || ''}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={formData.email || ''}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Address / City
              </label>
              <input
                type="text"
                value={formData.address || ''}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Specialization / Teaching Bio
              </label>
              <input
                type="text"
                value={formData.bio || ''}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                placeholder="e.g. Senior Faculty of Mathematics & Physics (M.Sc.)"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* 2. LOCALIZATION & SYSTEM PREFERENCES */}
        <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
            <Globe className="w-5 h-5 text-indigo-600" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Localization & Calendar Settings
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Date System (AD / BS)
              </label>
              <select
                value={formData.dateSystem || 'BS'}
                onChange={(e) =>
                  setFormData({ ...formData, dateSystem: e.target.value as DateSystem })
                }
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
              >
                <option value="BS">Bikram Sambat (BS - नेपाली क्यालेन्डर)</option>
                <option value="AD">Gregorian Calendar (AD - International)</option>
              </select>
              <p className="text-[10px] text-slate-400 mt-1">
                Controls all UI dates across dashboard, routine, and attendance.
              </p>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Currency
              </label>
              <select
                value={formData.currency || 'NPR'}
                onChange={(e) =>
                  setFormData({ ...formData, currency: e.target.value as CurrencyCode })
                }
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
              >
                <option value="NPR">NPR (Rs. - Nepalese Rupee)</option>
                <option value="INR">INR (₹ - Indian Rupee)</option>
                <option value="USD">USD ($ - US Dollar)</option>
                <option value="EUR">EUR (€ - Euro)</option>
                <option value="GBP">GBP (£ - British Pound)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Time Format
              </label>
              <select
                value={formData.timeFormat || '12h'}
                onChange={(e) =>
                  setFormData({ ...formData, timeFormat: e.target.value as TimeFormat })
                }
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
              >
                <option value="12h">12-Hour Format (e.g. 04:30 PM)</option>
                <option value="24h">24-Hour Format (e.g. 16:30)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-2">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block font-semibold text-slate-700 dark:text-slate-300">
                  Default Class Duration (Minutes)
                </label>
                <div className="flex items-center gap-1">
                  {[35, 40, 45, 50, 60].map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setFormData({ ...formData, defaultClassDuration: d })}
                      className={`px-1.5 py-0.5 text-[10px] font-medium rounded transition ${
                        formData.defaultClassDuration === d
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
                value={formData.defaultClassDuration ?? 60}
                onChange={(e) =>
                  setFormData({ ...formData, defaultClassDuration: Number(e.target.value) })
                }
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Application Theme
              </label>
              <select
                value={formData.theme || 'system'}
                onChange={(e) => {
                  const newTheme = e.target.value as 'light' | 'dark' | 'system';
                  setFormData({ ...formData, theme: newTheme });
                  updateSettings({ theme: newTheme });
                }}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
              >
                <option value="system">Follow System Appearance</option>
                <option value="light">Light Theme</option>
                <option value="dark">Dark Theme</option>
              </select>
            </div>
          </div>
        </div>

        {/* 3. PAYMENT REMINDER TEMPLATE */}
        <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
            <MessageSquare className="w-5 h-5 text-indigo-600" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              WhatsApp / SMS Payment Reminder Template
            </h2>
          </div>

          <div className="text-xs space-y-2">
            <label className="block font-semibold text-slate-700 dark:text-slate-300">
              Message Template
            </label>
            <textarea
              rows={4}
              value={formData.reminderTemplate || ''}
              onChange={(e) => setFormData({ ...formData, reminderTemplate: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none font-mono text-[11px]"
            />
            <p className="text-[11px] text-slate-400">
              Available tags: <code className="text-indigo-600">&#123;studentName&#125;</code>,{' '}
              <code className="text-indigo-600">&#123;month&#125;</code>,{' '}
              <code className="text-indigo-600">&#123;amountDue&#125;</code>,{' '}
              <code className="text-indigo-600">&#123;teacherName&#125;</code>,{' '}
              <code className="text-indigo-600">&#123;teacherPhone&#125;</code>
            </p>
          </div>
        </div>

        {/* Save Settings Bar */}
        <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700">
          <div>
            {saveSuccess && (
              <span className="text-xs font-bold text-emerald-600 flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4" />
                Settings saved successfully!
              </span>
            )}
          </div>

          <button
            type="submit"
            className="flex items-center gap-1.5 px-5 py-2.5 text-xs sm:text-sm font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition active:scale-95"
          >
            <Save className="w-4 h-4" />
            <span>Save Preferences</span>
          </button>
        </div>
      </form>

      {/* 4. DATA BACKUP & RESTORE */}
      <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
          <Database className="w-5 h-5 text-indigo-600" />
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Data Safety & Backup Management
          </h2>
        </div>

        <p className="text-xs text-slate-500">
          All your student routines, attendance, payments, and marks are safely stored in your browser's private offline storage. You can download complete JSON backups or restore previous data.
        </p>

        {importError && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-xs text-rose-600 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{importError}</span>
          </div>
        )}

        {importSuccess && (
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-600 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 shrink-0" />
            <span>Data backup restored successfully!</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          {/* Download Backup */}
          <button
            type="button"
            onClick={handleDownloadBackup}
            className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-left transition flex items-center justify-between"
          >
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Download className="w-4 h-4 text-indigo-600" />
                Export Full Backup
              </h4>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Download .json file containing all records
              </p>
            </div>
          </button>

          {/* Restore Backup */}
          <label className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-left transition flex items-center justify-between cursor-pointer">
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Upload className="w-4 h-4 text-teal-600" />
                Restore from Backup
              </h4>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Upload a previously exported .json file
              </p>
            </div>
            <input
              type="file"
              accept=".json"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        </div>

        {/* Danger Zone: Comprehensive Reset */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" />
              Danger Zone & Data Reset
            </h3>
            <button
              type="button"
              onClick={() => {
                if (window.confirm('Reset all records to standard demo sample data?')) {
                  resetToSampleData();
                }
              }}
              className="px-3 py-1.5 text-xs font-medium rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1.5 transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Load Demo Sample Data</span>
            </button>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400">
            Permanently clear data with strict confirmation. You can wipe all data, reset teacher credentials only, remove student records only, or remove college affiliations only.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-1">
            {/* Delete All */}
            <button
              type="button"
              onClick={() => openResetModal('all')}
              className="p-3 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/50 dark:bg-rose-950/20 hover:bg-rose-100/70 dark:hover:bg-rose-900/30 text-left transition"
            >
              <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-bold text-xs">
                <Trash2 className="w-4 h-4 shrink-0" />
                <span>Delete All Data</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                Wipes all records. <strong>Preserves email ID</strong>.
              </p>
            </button>

            {/* Teacher Only */}
            <button
              type="button"
              onClick={() => openResetModal('teacher')}
              className="p-3 rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/50 dark:bg-amber-950/20 hover:bg-amber-100/70 dark:hover:bg-amber-900/30 text-left transition"
            >
              <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-bold text-xs">
                <User className="w-4 h-4 shrink-0" />
                <span>Reset Teacher Only</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                Wipes teacher profile info. <strong>Preserves students & colleges</strong>.
              </p>
            </button>

            {/* Students Only */}
            <button
              type="button"
              onClick={() => openResetModal('students')}
              className="p-3 rounded-xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/50 dark:bg-blue-950/20 hover:bg-blue-100/70 dark:hover:bg-blue-900/30 text-left transition"
            >
              <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-bold text-xs">
                <Users className="w-4 h-4 shrink-0" />
                <span>Reset Students Only</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                Wipes all students & fees. <strong>Preserves teacher & colleges</strong>.
              </p>
            </button>

            {/* Colleges Only */}
            <button
              type="button"
              onClick={() => openResetModal('colleges')}
              className="p-3 rounded-xl border border-purple-200 dark:border-purple-900/60 bg-purple-50/50 dark:bg-purple-950/20 hover:bg-purple-100/70 dark:hover:bg-purple-900/30 text-left transition"
            >
              <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 font-bold text-xs">
                <Building2 className="w-4 h-4 shrink-0" />
                <span>Reset Colleges Only</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                Wipes colleges, classes & salaries. <strong>Preserves students & teacher</strong>.
              </p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
