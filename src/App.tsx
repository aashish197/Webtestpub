import React, { useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { ViewHeaderNav } from './components/ViewHeaderNav';
import { MobileBottomNav } from './components/MobileBottomNav';
import { NotificationDrawer } from './components/NotificationDrawer';
import { QuickActionModal } from './components/QuickActionModal';
import { AuthModal } from './components/AuthModal';
import { GlobalSearchModal } from './components/GlobalSearchModal';
import { ResetConfirmationModal } from './components/ResetConfirmationModal';
import { Dashboard } from './components/Dashboard';
import { StudentsView } from './components/StudentsView';
import { InstitutionsView } from './components/InstitutionsView';
import { ClassesRoutineView } from './components/ClassesRoutineView';
import { AttendanceView } from './components/AttendanceView';
import { PaymentsView } from './components/PaymentsView';
import { PerformanceView } from './components/PerformanceView';
import { IncomeView } from './components/IncomeView';
import { ReportsView } from './components/ReportsView';
import { SettingsView } from './components/SettingsView';
import { WorkloadEarningsCalculator } from './components/WorkloadEarningsCalculator';
import { StudentModeView } from './components/StudentModeView';

const MainContent: React.FC = () => {
  const {
    activeTab,
    appMode,
    isDarkMode,
    isResetModalOpen,
    closeResetModal,
    resetModalInitialType,
  } = useApp();

  // Apply dark class to root document if active
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const renderActiveView = () => {
    // If user is in Student Mode, show StudentModeView (or Settings if navigated there)
    if (appMode === 'student') {
      if (activeTab === 'settings') {
        return <SettingsView />;
      }
      return <StudentModeView />;
    }

    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'students':
        return <StudentsView />;
      case 'institutions':
        return <InstitutionsView />;
      case 'classes':
      case 'routine':
        return <ClassesRoutineView />;
      case 'attendance':
        return <AttendanceView />;
      case 'payments':
        return <PaymentsView />;
      case 'performance':
        return <PerformanceView />;
      case 'income':
        return <IncomeView />;
      case 'calculator':
        return <WorkloadEarningsCalculator />;
      case 'reports':
        return <ReportsView />;
      case 'settings':
        return <SettingsView />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-100/70 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      {/* Top Navigation */}
      <Navbar />

      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Sidebar (Desktop fixed/toggleable & Mobile Drawer) */}
        <Sidebar />

        {/* Main View Area */}
        <main className="flex-1 overflow-y-auto p-3 sm:p-5 lg:p-8 pb-24 lg:pb-10 max-w-7xl w-full mx-auto">
          {/* Top Breadcrumb & Back Navigation Header */}
          <ViewHeaderNav />

          {/* Active View */}
          {renderActiveView()}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <MobileBottomNav />

      {/* Notification Drawer */}
      <NotificationDrawer />

      {/* Quick Add & Action Modal */}
      <QuickActionModal />

      {/* Google Login & Account Modal */}
      <AuthModal />

      {/* Global Command & Search Modal */}
      <GlobalSearchModal />

      {/* Global Reset & Data Erasure Confirmation Modal */}
      <ResetConfirmationModal
        isOpen={isResetModalOpen}
        onClose={closeResetModal}
        initialType={resetModalInitialType}
      />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainContent />
    </AppProvider>
  );
}
