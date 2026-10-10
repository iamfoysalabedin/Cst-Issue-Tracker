import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  ShieldCheck, 
  Sliders, 
  LogOut, 
  ArrowLeft, 
  Search, 
  Check, 
  X, 
  LayoutDashboard, 
  HeartHandshake, 
  PlusCircle, 
  FileText, 
  BarChart3, 
  Calendar, 
  Clock, 
  History, 
  Megaphone, 
  Settings, 
  Eye, 
  EyeOff, 
  RefreshCw,
  ExternalLink,
  Layers,
  BadgeDollarSign
} from 'lucide-react';
import { 
  adminAuthService, 
  ModuleConfig, 
  MODULE_META_LIST,
  DEFAULT_MODULE_CONFIG
} from '../../services/adminAuthService';

export const AdminPanelPage: React.FC = () => {
  const navigate = useNavigate();
  const [config, setConfig] = useState<ModuleConfig>(() => adminAuthService.getModuleConfig());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    // Auth Guard: if not logged in, redirect to login page
    if (!adminAuthService.isAdminLoggedIn()) {
      navigate('/admin/login', { replace: true });
    }
  }, [navigate]);

  useEffect(() => {
    const handleConfigChange = (e: any) => {
      if (e.detail) setConfig(e.detail);
    };
    window.addEventListener('module-config-changed', handleConfigChange);
    return () => {
      window.removeEventListener('module-config-changed', handleConfigChange);
    };
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleToggle = (id: keyof ModuleConfig, label: string) => {
    const updated = adminAuthService.toggleModule(id);
    setConfig(updated);
    showToast(`${label} is now ${updated[id] ? 'VISIBLE' : 'HIDDEN'} in the sidebar.`);
  };

  const handleSetAll = (state: boolean) => {
    const updated = adminAuthService.setAllModules(state);
    setConfig(updated);
    showToast(state ? 'All modules turned ON in sidebar.' : 'All modules turned OFF in sidebar.');
  };

  const handleReset = () => {
    adminAuthService.saveModuleConfig(DEFAULT_MODULE_CONFIG);
    setConfig(DEFAULT_MODULE_CONFIG);
    showToast('Reset all modules to default (Visible).');
  };

  const handleLogout = () => {
    adminAuthService.logout();
    navigate('/dashboard', { replace: true });
  };

  const getModuleIcon = (id: keyof ModuleConfig) => {
    switch (id) {
      case 'Dashboard': return LayoutDashboard;
      case 'Sales': return BadgeDollarSign;
      case 'Retention': return HeartHandshake;
      case 'IssueEntry': return PlusCircle;
      case 'IssueReports': return FileText;
      case 'Analytics': return BarChart3;
      case 'WeeklyReport': return FileText;
      case 'MonthlyEntry': return Calendar;
      case 'MonthlyReports': return BarChart3;
      case 'DowntimeEntry': return Clock;
      case 'DowntimeReports': return History;
      case 'NoticeGenerator': return Megaphone;
      case 'SimFinder': return Search;
      case 'Settings': return Settings;
      default: return Sliders;
    }
  };

  const totalCount = MODULE_META_LIST.length;
  const visibleCount = Object.values(config).filter(Boolean).length;
  const hiddenCount = totalCount - visibleCount;

  // Filter modules
  const filteredModules = MODULE_META_LIST.filter(item => {
    if (selectedCategory !== 'all' && item.category !== selectedCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return item.label.toLowerCase().includes(q) || item.description.toLowerCase().includes(q);
    }
    return true;
  });

  const categories = ['all', 'Main', 'Retention', 'Issues', 'Monthly', 'Infrastructure', 'Config'];

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-2xl border border-slate-700 text-xs font-semibold flex items-center gap-2 animate-bounce">
          <Check size={14} className="text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Admin Navigation Header */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-md shadow-indigo-600/20 shrink-0">
            <Sliders size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                Admin Control Panel
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 flex items-center gap-1">
                <ShieldCheck size={13} /> Logged In
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Toggle sidebar modules ON or OFF to control navigation visibility
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors shadow-xs"
          >
            <ArrowLeft size={14} />
            Go to App
          </Link>
          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-900/60 hover:bg-rose-100 dark:hover:bg-rose-900/50 transition-colors shadow-xs"
          >
            <LogOut size={14} />
            Logout
          </button>
        </div>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total System Modules</span>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1.5">{totalCount}</p>
          <span className="text-[11px] text-slate-400">Configured in application</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">Currently Visible in Sidebar</span>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1.5">{visibleCount}</p>
          <span className="text-[11px] text-slate-400">Active for all users</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs font-semibold text-rose-600 dark:text-rose-400">Hidden from Sidebar</span>
          <p className="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-1.5">{hiddenCount}</p>
          <span className="text-[11px] text-slate-400">Disabled by Admin</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">Admin Account</span>
          <p className="text-sm font-bold text-slate-900 dark:text-white truncate mt-1">fapolok7@gmail.com</p>
          <span className="text-[11px] text-slate-400">Full System Privileges</span>
        </div>
      </div>

      {/* Main Module Management Panel */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 sm:p-5 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Search */}
          <div className="relative w-full lg:w-80">
            <Search size={16} className="absolute left-3.5 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search module name..."
              className="w-full pl-10 pr-3.5 py-2 text-xs sm:text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden text-slate-900 dark:text-white"
            />
          </div>

          {/* Bulk Controls */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => handleSetAll(true)}
              className="px-3 py-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 rounded-lg border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 transition-colors shadow-xs"
            >
              Turn All ON
            </button>
            <button
              onClick={() => handleSetAll(false)}
              className="px-3 py-1.5 text-xs font-semibold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 rounded-lg border border-rose-200 dark:border-rose-800 hover:bg-rose-100 transition-colors shadow-xs"
            >
              Turn All OFF
            </button>
            <button
              onClick={handleReset}
              className="px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors shadow-xs flex items-center gap-1"
            >
              <RefreshCw size={12} />
              Reset Defaults
            </button>
          </div>
        </div>

        {/* Category Pills */}
        <div className="px-5 pt-3 pb-2 flex items-center gap-1.5 overflow-x-auto no-scrollbar border-b border-slate-100 dark:border-slate-800/80">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-all whitespace-nowrap ${
                selectedCategory === cat
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {cat === 'all' ? 'All Modules' : cat}
            </button>
          ))}
        </div>

        {/* Modules Grid */}
        <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {filteredModules.map((item) => {
            const isEnabled = config[item.id] !== false;
            const Icon = getModuleIcon(item.id);

            return (
              <div
                key={item.id}
                className={`p-4 rounded-xl border flex items-center justify-between transition-all ${
                  isEnabled
                    ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xs'
                    : 'bg-slate-50 dark:bg-slate-950/70 border-slate-200/80 dark:border-slate-800/80'
                }`}
              >
                <div className="flex items-center gap-3.5 min-w-0 pr-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                    isEnabled
                      ? 'bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500'
                  }`}>
                    <Icon size={20} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className={`font-bold text-sm truncate ${isEnabled ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-300'}`}>
                        {item.label}
                      </h3>
                      {isEnabled ? (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-sm bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                          ON
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-sm bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                          OFF
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">{item.description}</p>
                    <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500 mt-0.5 block">{item.path}</span>
                  </div>
                </div>

                {/* Toggle Switch */}
                <div className="flex items-center gap-2.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleToggle(item.id, item.label)}
                    className={`relative inline-flex h-6 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                      isEnabled ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'
                    }`}
                    role="switch"
                    aria-checked={isEnabled}
                  >
                    <span
                      aria-hidden="true"
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                        isEnabled ? 'translate-x-6' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
