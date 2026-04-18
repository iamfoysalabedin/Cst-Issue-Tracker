
import React, { useState, useEffect } from 'react';
import { dbService } from '../services/dbService';
import { Issue, SettingItem } from '../types';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import { 
  Users, 
  Trophy, 
  Calendar, 
  TrendingUp, 
  UserCheck,
  ChevronRight,
  Award
} from 'lucide-react';
import { CHART_COLORS } from '../constants';

const Analytics: React.FC = () => {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());
  const [selectedMonth, setSelectedMonth] = useState<string>(String(new Date().getMonth() + 1).padStart(2, '0'));

  useEffect(() => {
    const loadData = async () => {
      const data = await dbService.getIssues();
      setIssues(data);
    };
    loadData();
  }, []);

  // Process data for the selected year using robust date parsing
  const yearlyIssues = issues.filter(issue => {
    const dateStr = issue.issue_date || issue.created_at;
    if (!dateStr || typeof dateStr !== 'string') return false;
    
    // Fallback to startsWith only if it's a direct date string, otherwise try to extract year
    if (dateStr.includes('-')) {
      const parts = dateStr.split('-');
      // Check if YYYY-MM-DD or DD-MM-YYYY
      if (parts[0].length === 4) return parts[0] === selectedYear;
      if (parts[2] && parts[2].substring(0, 4) === selectedYear) return true;
    }
    
    return dateStr.startsWith(selectedYear);
  });

  // Process data for the selected month
  const monthlyIssues = yearlyIssues.filter(issue => {
    const dateStr = issue.issue_date || issue.created_at;
    const month = dateStr.split('-')[1];
    return month === selectedMonth;
  });

  // Aggregate by assigned person for the selected month
  const monthlyStats = monthlyIssues.reduce((acc, issue) => {
    const person = (issue.assigned_person || 'Unassigned').trim();
    acc[person] = (acc[person] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const monthlyRanking = Object.entries(monthlyStats)
    .filter(([name]) => name !== 'Unassigned') // Exclude Unassigned from leaderboard
    .map(([name, count]) => ({ name, count: count as number }))
    .sort((a, b) => b.count - a.count);

  // Aggregate by assigned person for the selected year
  const yearlyStats = yearlyIssues.reduce((acc, issue) => {
    const person = (issue.assigned_person || 'Unassigned').trim();
    acc[person] = (acc[person] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const yearlyRanking = Object.entries(yearlyStats)
    .filter(([name]) => name !== 'Unassigned') // Exclude Unassigned from leaderboard
    .map(([name, count]) => ({ name, count: count as number }))
    .sort((a, b) => b.count - a.count);

  // Aggregate Yearly Distribution data (include Unassigned here but maybe separate it?)
  const yearlyDistributionData = Object.entries(yearlyStats)
    .map(([name, count]) => ({ name, count: count as number }))
    .sort((a, b) => b.count - a.count);

  // Monthly trend for the selected year
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthlyTrend = months.map((monthName, index) => {
    const monthNum = String(index + 1).padStart(2, '0');
    const count = yearlyIssues.filter(issue => {
      const dateStr = issue.issue_date || issue.created_at;
      return dateStr.split('-')[1] === monthNum;
    }).length;
    return { name: monthName, count };
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header & Filters */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Assignment Analytics</h1>
          <p className="text-slate-500 dark:text-slate-400">Detailed breakdown of task assignments and performance</p>
        </div>
        
        <div className="flex items-center gap-4 bg-white dark:bg-slate-900 p-2 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-2 border-r border-slate-200 dark:border-slate-800 pr-4">
            <Calendar size={16} className="text-slate-400" />
            <select 
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="bg-transparent text-sm font-bold outline-none cursor-pointer text-indigo-600"
            >
              {Array.from({ length: 5 }, (_, i) => {
                const year = new Date().getFullYear() - i;
                return <option key={year} value={year}>{year}</option>;
              })}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <select 
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-transparent text-sm font-bold outline-none pr-2 cursor-pointer text-indigo-600"
            >
              {months.map((m, i) => (
                <option key={m} value={String(i + 1).padStart(2, '0')}>{m}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-indigo-50 dark:bg-indigo-900/10 rounded-full transition-transform group-hover:scale-110" />
          <div className="relative">
            <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 rounded-2xl flex items-center justify-center mb-4">
              <Users size={24} />
            </div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Yearly Issues</p>
            <h3 className="text-3xl font-bold text-slate-900 dark:text-white mt-1">{yearlyIssues.length}</h3>
            <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
              <Calendar size={14} className="text-indigo-500" />
              In {selectedYear}
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-rose-50 dark:bg-rose-900/10 rounded-full transition-transform group-hover:scale-110" />
          <div className="relative">
            <div className="w-12 h-12 bg-rose-100 dark:bg-rose-900/30 text-rose-600 rounded-2xl flex items-center justify-center mb-4">
              <Trophy size={24} />
            </div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Top Performer</p>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1 truncate">
              {monthlyRanking[0]?.name || 'N/A'}
            </h3>
            <p className="text-xs text-slate-500 mt-2">
              {monthlyRanking[0]?.count || 0} Assignments this month
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-emerald-50 dark:bg-emerald-900/10 rounded-full transition-transform group-hover:scale-110" />
          <div className="relative">
            <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rounded-2xl flex items-center justify-center mb-4">
              <UserCheck size={24} />
            </div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Yearly Leader</p>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1 truncate">
              {yearlyRanking[0]?.name || 'N/A'}
            </h3>
            <p className="text-xs text-slate-500 mt-2">
              {yearlyRanking[0]?.count || 0} Total in {selectedYear}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Monthly Ranking Table */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Award size={18} className="text-amber-500" />
              Monthly Ranking ({months[parseInt(selectedMonth) - 1]})
            </h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {monthlyRanking.length > 0 ? monthlyRanking.map((person, i) => (
                <div key={person.name} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 group hover:border-indigo-200 dark:hover:border-indigo-900 transition-all">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${
                      i === 0 ? 'bg-amber-100 text-amber-600' : 
                      i === 1 ? 'bg-slate-200 text-slate-600' : 
                      i === 2 ? 'bg-orange-100 text-orange-600' : 
                      'bg-white dark:bg-slate-900 text-slate-400'
                    }`}>
                      {i + 1}
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white">{person.name}</p>
                      <p className="text-xs text-slate-500">Assigned Tasks</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-black text-indigo-600 dark:text-indigo-400">{person.count}</p>
                    <div className="w-24 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mt-1 overflow-hidden">
                      <div 
                        className="h-full bg-indigo-500 rounded-full" 
                        style={{ width: `${monthlyRanking[0] ? (person.count / monthlyRanking[0].count) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                </div>
              )) : (
                <div className="py-12 text-center text-slate-400 italic">No assignments found for this month.</div>
              )}
            </div>
          </div>
        </div>

        {/* Yearly Distribution Chart */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
          <h3 className="font-bold text-slate-900 dark:text-white mb-8">Yearly Distribution ({selectedYear})</h3>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={yearlyDistributionData} layout="vertical" margin={{ left: 40 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0" />
                <XAxis type="number" hide />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fontWeight: 600, fill: '#64748b' }}
                />
                <Tooltip 
                  cursor={{ fill: 'rgba(99, 102, 241, 0.05)' }}
                  contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px', color: '#fff' }}
                />
                <Bar 
                  dataKey="count" 
                  fill="#6366f1" 
                  radius={[0, 8, 8, 0]} 
                  barSize={24}
                  label={{ position: 'right', fontSize: 12, fontWeight: 700, fill: '#6366f1' }}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Monthly Trend Chart */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white text-xl">Monthly Assignment Trend</h3>
            <p className="text-sm text-slate-500">Total volume of issues across {selectedYear}</p>
          </div>
        </div>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={monthlyTrend}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 12, fontWeight: 600, fill: '#64748b' }}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 12, fontWeight: 600, fill: '#64748b' }}
              />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px', color: '#fff' }}
              />
              <Line 
                type="monotone" 
                dataKey="count" 
                stroke="#6366f1" 
                strokeWidth={4} 
                dot={{ r: 6, fill: '#6366f1', strokeWidth: 3, stroke: '#fff' }}
                activeDot={{ r: 8, strokeWidth: 0 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
