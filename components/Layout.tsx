
import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  PlusCircle, 
  FileText, 
  Calendar, 
  BarChart3, 
  Clock, 
  History,
  Menu,
  X,
  Sun,
  Moon,
  ShieldCheck,
  Settings
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const location = useLocation();
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark' || 
      (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const navItems = [
    { id: 'Dashboard', icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    { id: 'divider', type: 'divider', label: 'Issues' },
    { id: 'IssueEntry', icon: PlusCircle, label: 'Issue Entry', path: '/issue-entry' },
    { id: 'IssueReports', icon: FileText, label: 'Issue Reports', path: '/issue-reports' },
    { id: 'Analytics', icon: BarChart3, label: 'Analytics', path: '/analytics' },
    { id: 'WeeklyReport', icon: FileText, label: 'Weekly Report', path: '/weekly-report' },
    { id: 'divider2', type: 'divider', label: 'Monthly Tracking' },
    { id: 'MonthlyEntry', icon: Calendar, label: 'Monthly Entry', path: '/monthly-entry' },
    { id: 'MonthlyReports', icon: BarChart3, label: 'Monthly Reports', path: '/monthly-reports' },
    { id: 'divider3', type: 'divider', label: 'Infrastructure' },
    { id: 'DowntimeEntry', icon: Clock, label: 'Downtime Entry', path: '/downtime-entry' },
    { id: 'DowntimeReports', icon: History, label: 'Downtime Reports', path: '/downtime-reports' },
    { id: 'divider4', type: 'divider', label: 'Config' },
    { id: 'Settings', icon: Settings, label: 'Settings', path: '/settings' },
  ];

  const currentLabel = navItems.find(i => i.path === location.pathname)?.label || 'Issue Tracker';

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Overlay for mobile */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-4 flex items-center justify-between border-b border-slate-100 dark:border-slate-800/50">
            <div>
              <h1 className="font-bold text-lg tracking-tight text-slate-900 dark:text-white leading-none">Issue Tracker</h1>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">INOVACE</span>
            </div>
            <button 
              onClick={() => setIsSidebarOpen(false)}
              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 lg:hidden"
            >
              <X size={18} />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto no-scrollbar">
            {navItems.map((item) => {
              if (item.type === 'divider') {
                return (
                  <div key={item.id} className="px-3 pt-4 pb-1">
                    <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                      {item.label}
                    </span>
                  </div>
                );
              }

              const Icon = item.icon!;

              return (
                <NavLink
                  key={item.id}
                  to={item.path!}
                  onClick={() => {
                    if (window.innerWidth < 1024) setIsSidebarOpen(false);
                  }}
                  className={({ isActive }) => `w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-[13px] font-medium transition-all ${
                    isActive 
                      ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 shadow-sm' 
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {({ isActive }) => (
                    <>
                      <Icon size={16} className={isActive ? 'text-indigo-600 dark:text-indigo-400' : ''} />
                      {item.label}
                    </>
                  )}
                </NavLink>
              );
            })}
          </nav>

          {/* User & Theme */}
          <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
            <button 
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="w-full flex items-center justify-between gap-2.5 px-3 py-1.5 rounded-md text-[13px] font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                {isDarkMode ? <Moon size={16} /> : <Sun size={16} />}
                <span>{isDarkMode ? 'Dark Mode' : 'Light Mode'}</span>
              </div>
              <div className={`w-7 h-3.5 rounded-full relative transition-colors ${isDarkMode ? 'bg-indigo-600' : 'bg-slate-300'}`}>
                 <div className={`absolute top-0.5 w-2.5 h-2.5 rounded-full bg-white transition-all ${isDarkMode ? 'left-4' : 'left-0.5'}`} />
              </div>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`flex-1 transition-all duration-300 ${isSidebarOpen ? 'lg:pl-64' : ''}`}>
        {/* Header */}
        <header className="sticky top-0 z-30 flex items-center justify-between px-5 py-3 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
            >
              <Menu size={18} />
            </button>
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">
              {currentLabel}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            {/* System status and profile removed as requested */}
          </div>
        </header>

        {/* Page Content */}
        <div className="p-5">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;