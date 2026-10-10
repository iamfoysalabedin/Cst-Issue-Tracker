
import React, { useState, useEffect } from 'react';
import { NavLink, Link, useLocation, useNavigate } from 'react-router-dom';
import { dbService, applyFaviconAndTitle } from '../services/dbService';
import { BrandingConfig } from '../types';
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
  Settings, 
  Search, 
  Megaphone, 
  ChevronDown, 
  ChevronRight, 
  HeartHandshake, 
  Users, 
  UserCheck, 
  Contact, 
  PhoneCall, 
  MessageSquare, 
  BarChart2,
  Lock,
  Sliders,
  LogOut,
  BadgeDollarSign,
  FileSpreadsheet
} from 'lucide-react';
import { adminAuthService, ModuleConfig } from '../services/adminAuthService';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();
  const [branding, setBranding] = useState<BrandingConfig>(() => dbService.getCachedBranding());
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark' || 
      (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });

  const isSalesActive = location.pathname.startsWith('/sales');
  const [isSalesOpen, setIsSalesOpen] = useState(false);

  const isRetentionActive = location.pathname.startsWith('/retention');
  const [isRetentionOpen, setIsRetentionOpen] = useState(false);

  // Admin Auth and Module Visibility States
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(() => adminAuthService.isAdminLoggedIn());
  const [moduleConfig, setModuleConfig] = useState<ModuleConfig>(() => adminAuthService.getModuleConfig());

  useEffect(() => {
    const handleAuthChange = () => {
      setIsAdminLoggedIn(adminAuthService.isAdminLoggedIn());
    };
    const handleConfigChange = (e: any) => {
      if (e.detail) {
        setModuleConfig(e.detail);
      } else {
        setModuleConfig(adminAuthService.getModuleConfig());
      }
    };

    window.addEventListener('admin-auth-changed', handleAuthChange);
    window.addEventListener('module-config-changed', handleConfigChange);
    return () => {
      window.removeEventListener('admin-auth-changed', handleAuthChange);
      window.removeEventListener('module-config-changed', handleConfigChange);
    };
  }, []);

  useEffect(() => {
    if (isSalesActive) {
      setIsSalesOpen(true);
    }
  }, [isSalesActive]);

  useEffect(() => {
    if (isRetentionActive) {
      setIsRetentionOpen(true);
    }
  }, [isRetentionActive]);

  useEffect(() => {
    applyFaviconAndTitle(branding);

    dbService.getBranding().then((b) => {
      setBranding(b);
      applyFaviconAndTitle(b);
    });

    const handleBrandingChange = (e: any) => {
      if (e.detail) {
        setBranding(e.detail);
        applyFaviconAndTitle(e.detail);
      }
    };

    window.addEventListener('branding-changed', handleBrandingChange);
    return () => {
      window.removeEventListener('branding-changed', handleBrandingChange);
    };
  }, []);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const isDashboardVisible = moduleConfig.Dashboard !== false;
  const isSalesVisible = moduleConfig.Sales !== false;
  const isRetentionVisible = moduleConfig.Retention !== false;

  const issuesGroup = [
    { id: 'IssueEntry', icon: PlusCircle, label: 'Issue Entry', path: '/issue-entry' },
    { id: 'IssueReports', icon: FileText, label: 'Issue Reports', path: '/issue-reports' },
    { id: 'Analytics', icon: BarChart3, label: 'Analytics', path: '/analytics' },
    { id: 'WeeklyReport', icon: FileText, label: 'Weekly Report', path: '/weekly-report' },
  ].filter(item => moduleConfig[item.id as keyof ModuleConfig] !== false);

  const monthlyGroup = [
    { id: 'MonthlyEntry', icon: Calendar, label: 'Monthly Entry', path: '/monthly-entry' },
    { id: 'MonthlyReports', icon: BarChart3, label: 'Monthly Reports', path: '/monthly-reports' },
  ].filter(item => moduleConfig[item.id as keyof ModuleConfig] !== false);

  const infraGroup = [
    { id: 'DowntimeEntry', icon: Clock, label: 'Downtime Entry', path: '/downtime-entry' },
    { id: 'DowntimeReports', icon: History, label: 'Downtime Reports', path: '/downtime-reports' },
  ].filter(item => moduleConfig[item.id as keyof ModuleConfig] !== false);

  const configGroup = [
    { id: 'NoticeGenerator', icon: Megaphone, label: 'Notice Generator', path: '/notice-generator' },
    { id: 'SimFinder', icon: Search, label: 'SIM Finder', path: '/sim-finder' },
    { id: 'Settings', icon: Settings, label: 'Settings', path: '/settings' },
  ].filter(item => moduleConfig[item.id as keyof ModuleConfig] !== false);

  const hasAnyVisibleModules = isDashboardVisible || isSalesVisible || isRetentionVisible || 
    issuesGroup.length > 0 || monthlyGroup.length > 0 || infraGroup.length > 0 || configGroup.length > 0;

  const salesSubItems = [
    { id: 'SalesDashboard', label: '1. Dashboard', path: '/sales/dashboard', icon: LayoutDashboard },
    { id: 'SalesAdd', label: '2. Add Sales', path: '/sales/add', icon: PlusCircle },
    { id: 'SalesReport', label: '3. Sales Report', path: '/sales/report', icon: FileSpreadsheet },
  ];

  const retentionSubItems = [
    { id: 'RetDashboard', label: '1. Dashboard', path: '/retention/dashboard', icon: LayoutDashboard },
    { id: 'RetCustomers', label: '2. Customers', path: '/retention/customers', icon: Users },
    { id: 'RetAssignment', label: '3. Customer Assignment', path: '/retention/assignment', icon: UserCheck },
    { id: 'RetTeam', label: '4. Team Members', path: '/retention/team', icon: Contact },
    { id: 'RetFollowup', label: '5. Monthly Follow-up', path: '/retention/followup', icon: PhoneCall },
    { id: 'RetFeedback', label: '6. Customer Feedback', path: '/retention/feedback', icon: MessageSquare },
    { id: 'RetReports', label: '7. Reports & Analytics', path: '/retention/reports', icon: BarChart2 },
  ];

  const ALL_MODULE_LABELS: Record<string, string> = {
    '/dashboard': 'Dashboard',
    '/sales/dashboard': 'Sales Dashboard',
    '/sales/add': 'Add Sales Entry',
    '/sales/report': 'Sales Report',
    '/issue-entry': 'Issue Entry',
    '/issue-reports': 'Issue Reports',
    '/analytics': 'Analytics',
    '/weekly-report': 'Weekly Report',
    '/monthly-entry': 'Monthly Entry',
    '/monthly-reports': 'Monthly Reports',
    '/downtime-entry': 'Downtime Entry',
    '/downtime-reports': 'Downtime Reports',
    '/notice-generator': 'Notice Generator',
    '/sim-finder': 'SIM Finder',
    '/settings': 'Settings',
    '/admin/login': 'Admin Portal Login',
    '/admin': 'Admin Control Panel',
  };

  const salesActiveItem = salesSubItems.find(i => i.path === location.pathname);
  const retentionActiveItem = retentionSubItems.find(i => i.path === location.pathname);
  const currentLabel = salesActiveItem
    ? `Sales / ${salesActiveItem.label}`
    : (retentionActiveItem 
        ? `Retention / ${retentionActiveItem.label}` 
        : (ALL_MODULE_LABELS[location.pathname] || 'Issue Tracker'));

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
          {/* Logo & Brand Name */}
          <div className="p-4 flex items-center justify-between border-b border-slate-100 dark:border-slate-800/50">
            <div className="flex items-center gap-2.5 min-w-0">
              {branding.logo_url ? (
                <img 
                  src={branding.logo_url} 
                  alt={branding.brand_name || 'Brand Logo'} 
                  className="w-8 h-8 rounded-lg object-contain bg-white dark:bg-slate-800 p-0.5 border border-slate-200 dark:border-slate-700 shadow-xs shrink-0" 
                />
              ) : (
                <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-xs shrink-0">
                  {(branding.brand_name || 'I').charAt(0).toUpperCase()}
                </div>
              )}
              <div className="min-w-0">
                <h1 className="font-bold text-base tracking-tight text-slate-900 dark:text-white leading-tight truncate">
                  {branding.brand_name || 'Issue Tracker'}
                </h1>
                {branding.subtitle ? (
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.18em] truncate block mt-0.5">
                    {branding.subtitle}
                  </span>
                ) : null}
              </div>
            </div>
            <button 
              onClick={() => setIsSidebarOpen(false)}
              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 lg:hidden shrink-0 ml-1"
            >
              <X size={18} />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto no-scrollbar">
            {!hasAnyVisibleModules && (
              <div className="p-4 text-center text-xs text-slate-400 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-800 my-4">
                <Sliders size={20} className="mx-auto mb-2 text-slate-400" />
                <p className="font-medium text-slate-700 dark:text-slate-300">All Modules Hidden</p>
                <p className="text-[11px] mt-1 text-slate-500">
                  {isAdminLoggedIn 
                    ? 'Use "Manage Modules" above to turn modules ON.' 
                    : 'Admin has toggled all sidebar modules off.'}
                </p>
              </div>
            )}

            {/* Main Dashboard (Only if enabled) */}
            {isDashboardVisible && (
              <NavLink
                to="/dashboard"
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
                    <LayoutDashboard size={16} className={isActive ? 'text-indigo-600 dark:text-indigo-400' : ''} />
                    Dashboard
                  </>
                )}
              </NavLink>
            )}

            {/* Sales (Parent Module) Dropdown (Only if enabled) */}
            {isSalesVisible && (
              <div className="pt-2 pb-1">
                <div className="px-3 pt-2 pb-1">
                  <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    Sales & Revenue
                  </span>
                </div>
                
                <div className="rounded-xl overflow-hidden border border-emerald-200/70 dark:border-emerald-900/50 bg-emerald-50/40 dark:bg-emerald-950/20">
                  <button
                    type="button"
                    onClick={() => setIsSalesOpen(!isSalesOpen)}
                    className={`w-full flex items-center justify-between px-3 py-2 text-[13px] font-bold transition-all ${
                      isSalesActive
                        ? 'text-emerald-700 dark:text-emerald-400 bg-emerald-50/80 dark:bg-emerald-900/40'
                        : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <BadgeDollarSign size={17} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span className="truncate">Sales</span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300">
                        3
                      </span>
                      {isSalesOpen ? <ChevronDown size={14} className="text-slate-400" /> : <ChevronRight size={14} className="text-slate-400" />}
                    </div>
                  </button>

                  {isSalesOpen && (
                    <div className="py-1 px-1.5 space-y-0.5 border-t border-emerald-100 dark:border-emerald-950/40 bg-white/60 dark:bg-slate-900/60">
                      {salesSubItems.map((sub) => {
                        const SubIcon = sub.icon;
                        return (
                          <NavLink
                            key={sub.id}
                            to={sub.path}
                            onClick={() => {
                              if (window.innerWidth < 1024) setIsSidebarOpen(false);
                            }}
                            className={({ isActive }) => `w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                              isActive 
                                ? 'bg-emerald-600 text-white shadow-xs font-semibold' 
                                : 'text-slate-600 dark:text-slate-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 hover:text-emerald-600 dark:hover:text-emerald-300'
                            }`}
                          >
                            {({ isActive }) => (
                              <>
                                <SubIcon size={14} className={isActive ? 'text-white' : 'text-slate-400 shrink-0'} />
                                <span className="truncate">{sub.label}</span>
                              </>
                            )}
                          </NavLink>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Retention (Parent Module) Dropdown (Only if enabled) */}
            {isRetentionVisible && (
              <div className="pt-2 pb-1">
                <div className="px-3 pt-2 pb-1">
                  <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    Client Retention
                  </span>
                </div>
                
                <div className="rounded-xl overflow-hidden border border-indigo-200/70 dark:border-indigo-900/50 bg-indigo-50/40 dark:bg-indigo-950/20">
                  <button
                    type="button"
                    onClick={() => setIsRetentionOpen(!isRetentionOpen)}
                    className={`w-full flex items-center justify-between px-3 py-2 text-[13px] font-bold transition-all ${
                      isRetentionActive
                        ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50/80 dark:bg-indigo-900/40'
                        : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <HeartHandshake size={17} className="text-indigo-600 dark:text-indigo-400 shrink-0" />
                      <span className="truncate">Retention</span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300">
                        7
                      </span>
                      {isRetentionOpen ? <ChevronDown size={14} className="text-slate-400" /> : <ChevronRight size={14} className="text-slate-400" />}
                    </div>
                  </button>

                  {isRetentionOpen && (
                    <div className="py-1 px-1.5 space-y-0.5 border-t border-indigo-100 dark:border-indigo-950/40 bg-white/60 dark:bg-slate-900/60">
                      {retentionSubItems.map((sub) => {
                        const SubIcon = sub.icon;
                        return (
                          <NavLink
                            key={sub.id}
                            to={sub.path}
                            onClick={() => {
                              if (window.innerWidth < 1024) setIsSidebarOpen(false);
                            }}
                            className={({ isActive }) => `w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                              isActive 
                                ? 'bg-indigo-600 text-white shadow-xs font-semibold' 
                                : 'text-slate-600 dark:text-slate-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 hover:text-indigo-600 dark:hover:text-indigo-300'
                            }`}
                          >
                            {({ isActive }) => (
                              <>
                                <SubIcon size={14} className={isActive ? 'text-white' : 'text-slate-400 shrink-0'} />
                                <span className="truncate">{sub.label}</span>
                              </>
                            )}
                          </NavLink>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Issues Group */}
            {issuesGroup.length > 0 && (
              <>
                <div className="px-3 pt-3 pb-1">
                  <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    Issues
                  </span>
                </div>
                {issuesGroup.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.id}
                      to={item.path}
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
              </>
            )}

            {/* Monthly Tracking Group */}
            {monthlyGroup.length > 0 && (
              <>
                <div className="px-3 pt-3 pb-1">
                  <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    Monthly Tracking
                  </span>
                </div>
                {monthlyGroup.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.id}
                      to={item.path}
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
              </>
            )}

            {/* Infrastructure Group */}
            {infraGroup.length > 0 && (
              <>
                <div className="px-3 pt-3 pb-1">
                  <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    Infrastructure
                  </span>
                </div>
                {infraGroup.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.id}
                      to={item.path}
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
              </>
            )}

            {/* Config Group */}
            {configGroup.length > 0 && (
              <>
                <div className="px-3 pt-3 pb-1">
                  <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    Config
                  </span>
                </div>
                {configGroup.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.id}
                      to={item.path}
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
              </>
            )}
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

          {/* Right Header Corner: Admin Login & Controls */}
          <div className="flex items-center gap-2">
            {/* Quick Dark/Light Mode Toggle */}
            <button
              type="button"
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors shadow-xs flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
              title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {isDarkMode ? (
                <>
                  <Sun size={15} className="text-amber-400" />
                  <span className="hidden sm:inline text-xs">Light</span>
                </>
              ) : (
                <>
                  <Moon size={15} className="text-indigo-600" />
                  <span className="hidden sm:inline text-xs">Dark</span>
                </>
              )}
            </button>

            {isAdminLoggedIn ? (
              <div className="flex items-center gap-2">
                <Link
                  to="/admin"
                  className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-semibold hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors"
                >
                  <ShieldCheck size={14} className="text-emerald-600 dark:text-emerald-400" />
                  <span>Admin Mode</span>
                </Link>
                <Link
                  to="/admin"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-colors"
                  title="Open Admin Panel"
                >
                  <Sliders size={13} />
                  <span>Admin Panel</span>
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    adminAuthService.logout();
                    setIsAdminLoggedIn(false);
                    navigate('/dashboard', { replace: true });
                  }}
                  className="p-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                  title="Admin Logout"
                >
                  <LogOut size={16} />
                </button>
              </div>
            ) : (
              <Link
                to="/admin/login"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors shadow-xs"
              >
                <Lock size={13} className="text-indigo-600 dark:text-indigo-400" />
                <span>Admin</span>
              </Link>
            )}
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