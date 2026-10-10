
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import IssueEntry from './components/IssueEntry';
import IssueReports from './components/IssueReports';
import MonthlyEntry from './components/MonthlyEntry';
import MonthlyReports from './components/MonthlyReports';
import DowntimeEntry from './components/DowntimeEntry';
import DowntimeReports from './components/DowntimeReports';
import Settings from './components/Settings';
import Analytics from './components/Analytics';
import WeeklyReport from './components/WeeklyReport';
import SimFinder from './components/SimFinder';
import NoticeGenerator from './components/NoticeGenerator';
import { RetentionDashboard } from './components/retention/RetentionDashboard';
import { RetentionCustomers } from './components/retention/RetentionCustomers';
import { CustomerAssignment } from './components/retention/CustomerAssignment';
import { TeamMembers } from './components/retention/TeamMembers';
import { MonthlyFollowup } from './components/retention/MonthlyFollowup';
import { CustomerFeedback } from './components/retention/CustomerFeedback';
import { RetentionReports } from './components/retention/RetentionReports';
import { SalesDashboard } from './components/sales/SalesDashboard';
import { AddSales } from './components/sales/AddSales';
import { SalesReport } from './components/sales/SalesReport';
import { AdminLoginPage } from './components/admin/AdminLoginPage';
import { AdminPanelPage } from './components/admin/AdminPanelPage';

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/issue-entry" element={<IssueEntry />} />
          <Route path="/issue-reports" element={<IssueReports />} />
          <Route path="/monthly-entry" element={<MonthlyEntry />} />
          <Route path="/monthly-reports" element={<MonthlyReports />} />
          <Route path="/downtime-entry" element={<DowntimeEntry />} />
          <Route path="/downtime-reports" element={<DowntimeReports />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/notice-generator" element={<NoticeGenerator />} />
          <Route path="/sim-finder" element={<SimFinder />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/weekly-report" element={<WeeklyReport />} />
          
          {/* Sales Module Routes */}
          <Route path="/sales" element={<Navigate to="/sales/dashboard" replace />} />
          <Route path="/sales/dashboard" element={<SalesDashboard />} />
          <Route path="/sales/add" element={<AddSales />} />
          <Route path="/sales/report" element={<SalesReport />} />

          {/* Retention Module Routes */}
          <Route path="/retention" element={<Navigate to="/retention/dashboard" replace />} />
          <Route path="/retention/dashboard" element={<RetentionDashboard />} />
          <Route path="/retention/customers" element={<RetentionCustomers />} />
          <Route path="/retention/assignment" element={<CustomerAssignment />} />
          <Route path="/retention/team" element={<TeamMembers />} />
          <Route path="/retention/followup" element={<MonthlyFollowup />} />
          <Route path="/retention/feedback" element={<CustomerFeedback />} />
          <Route path="/retention/reports" element={<RetentionReports />} />

          {/* Admin Routes */}
          <Route path="/admin/login" element={<AdminLoginPage />} />
          <Route path="/admin" element={<AdminPanelPage />} />

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
};

export default App;
