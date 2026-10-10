export interface ModuleConfig {
  Dashboard: boolean;
  Sales: boolean;
  Retention: boolean;
  IssueEntry: boolean;
  IssueReports: boolean;
  Analytics: boolean;
  WeeklyReport: boolean;
  MonthlyEntry: boolean;
  MonthlyReports: boolean;
  DowntimeEntry: boolean;
  DowntimeReports: boolean;
  NoticeGenerator: boolean;
  SimFinder: boolean;
  Settings: boolean;
}

export const DEFAULT_MODULE_CONFIG: ModuleConfig = {
  Dashboard: true,
  Sales: true,
  Retention: true,
  IssueEntry: true,
  IssueReports: true,
  Analytics: true,
  WeeklyReport: true,
  MonthlyEntry: true,
  MonthlyReports: true,
  DowntimeEntry: true,
  DowntimeReports: true,
  NoticeGenerator: true,
  SimFinder: true,
  Settings: true,
};

export interface ModuleItemMeta {
  id: keyof ModuleConfig;
  label: string;
  description: string;
  category: 'Main' | 'Retention' | 'Issues' | 'Monthly' | 'Infrastructure' | 'Config';
  path: string;
}

export const MODULE_META_LIST: ModuleItemMeta[] = [
  { id: 'Dashboard', label: 'Dashboard', description: 'Overview and system metrics', category: 'Main', path: '/dashboard' },
  { id: 'Sales', label: 'Sales (Parent Module)', description: 'Sales entry, multi-product line items, orders & revenue reports', category: 'Main', path: '/sales/dashboard' },
  { id: 'Retention', label: 'Retention (Parent Module)', description: 'Customer relationship and churn management (7 sections)', category: 'Retention', path: '/retention/dashboard' },
  { id: 'IssueEntry', label: 'Issue Entry', description: 'Log client issue tickets', category: 'Issues', path: '/issue-entry' },
  { id: 'IssueReports', label: 'Issue Reports', description: 'Issue breakdown & client reports', category: 'Issues', path: '/issue-reports' },
  { id: 'Analytics', label: 'Analytics', description: 'Charts and analytics trends', category: 'Issues', path: '/analytics' },
  { id: 'WeeklyReport', label: 'Weekly Report', description: 'Weekly operational performance summary', category: 'Issues', path: '/weekly-report' },
  { id: 'MonthlyEntry', label: 'Monthly Entry', description: 'Monthly issue categorization', category: 'Monthly', path: '/monthly-entry' },
  { id: 'MonthlyReports', label: 'Monthly Reports', description: 'Monthly aggregated issue reports', category: 'Monthly', path: '/monthly-reports' },
  { id: 'DowntimeEntry', label: 'Downtime Entry', description: 'System downtime & outage logger', category: 'Infrastructure', path: '/downtime-entry' },
  { id: 'DowntimeReports', label: 'Downtime Reports', description: 'Infrastructure downtime analysis', category: 'Infrastructure', path: '/downtime-reports' },
  { id: 'NoticeGenerator', label: 'Notice Generator', description: 'Automated client notice broadcaster', category: 'Config', path: '/notice-generator' },
  { id: 'SimFinder', label: 'SIM Finder', description: 'SIM & device inventory tracking', category: 'Config', path: '/sim-finder' },
  { id: 'Settings', label: 'Settings', description: 'System branding & configurations', category: 'Config', path: '/settings' },
];

const ADMIN_CREDENTIALS = {
  email: 'fapolok7@gmail.com',
  password: 'Admin@123',
};

const STORAGE_KEYS = {
  ADMIN_SESSION: 'app_admin_session_v1',
  MODULE_CONFIG: 'app_sidebar_modules_config_v1',
};

export const adminAuthService = {
  isAdminLoggedIn(): boolean {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.ADMIN_SESSION);
      if (!data) return false;
      const parsed = JSON.parse(data);
      return parsed.isLoggedIn === true && parsed.email?.toLowerCase() === ADMIN_CREDENTIALS.email.toLowerCase();
    } catch {
      return false;
    }
  },

  login(email: string, pass: string): { success: boolean; error?: string } {
    const cleanEmail = email.trim().toLowerCase();
    const cleanPass = pass.trim();

    if (cleanEmail === ADMIN_CREDENTIALS.email.toLowerCase() && cleanPass === ADMIN_CREDENTIALS.password) {
      const session = {
        isLoggedIn: true,
        email: cleanEmail,
        loginTime: new Date().toISOString(),
      };
      localStorage.setItem(STORAGE_KEYS.ADMIN_SESSION, JSON.stringify(session));
      window.dispatchEvent(new CustomEvent('admin-auth-changed', { detail: session }));
      return { success: true };
    }

    return { 
      success: false, 
      error: 'Invalid email or password. Please try again.' 
    };
  },

  logout(): void {
    localStorage.removeItem(STORAGE_KEYS.ADMIN_SESSION);
    window.dispatchEvent(new CustomEvent('admin-auth-changed', { detail: { isLoggedIn: false } }));
  },

  getModuleConfig(): ModuleConfig {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.MODULE_CONFIG);
      if (data) {
        return { ...DEFAULT_MODULE_CONFIG, ...JSON.parse(data) };
      }
    } catch {}
    return { ...DEFAULT_MODULE_CONFIG };
  },

  saveModuleConfig(config: ModuleConfig): void {
    localStorage.setItem(STORAGE_KEYS.MODULE_CONFIG, JSON.stringify(config));
    window.dispatchEvent(new CustomEvent('module-config-changed', { detail: config }));
  },

  toggleModule(moduleId: keyof ModuleConfig): ModuleConfig {
    const current = this.getModuleConfig();
    const updated = {
      ...current,
      [moduleId]: !current[moduleId],
    };
    this.saveModuleConfig(updated);
    return updated;
  },

  setAllModules(state: boolean): ModuleConfig {
    const updated: ModuleConfig = {
      Dashboard: state,
      Sales: state,
      Retention: state,
      IssueEntry: state,
      IssueReports: state,
      Analytics: state,
      WeeklyReport: state,
      MonthlyEntry: state,
      MonthlyReports: state,
      DowntimeEntry: state,
      DowntimeReports: state,
      NoticeGenerator: state,
      SimFinder: state,
      Settings: state,
    };
    this.saveModuleConfig(updated);
    return updated;
  }
};
