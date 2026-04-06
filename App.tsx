
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
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/weekly-report" element={<WeeklyReport />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
};

export default App;
