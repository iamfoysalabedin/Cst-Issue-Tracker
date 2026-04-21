
import React, { useState, useEffect } from 'react';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
  LineChart, Line, AreaChart, Area
} from 'recharts';
import { 
  AlertCircle, 
  Bug, 
  Smartphone, 
  Lightbulb, 
  HelpCircle, 
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  ChevronDown
} from 'lucide-react';
import { dbService } from '../services/dbService';
import { Issue, MonthlyEntry, SystemDowntime } from '../types';
import { CHART_COLORS } from '../constants';

const Dashboard: React.FC = () => {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [monthlyEntries, setMonthlyEntries] = useState<MonthlyEntry[]>([]);
  const [downtime, setDowntime] = useState<SystemDowntime[]>([]);
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());
  const [selectedMonth, setSelectedMonth] = useState<string>(String(new Date().getMonth() + 1).padStart(2, '0'));
  const [frequentReportersPage, setFrequentReportersPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    const fetchData = async () => {
      const [i, m, d] = await Promise.all([
        dbService.getIssues(),
        dbService.getMonthlyEntries(),
        dbService.getDowntime(),
      ]);
      setIssues(i);
      setMonthlyEntries(m);
      setDowntime(d);
    };
    fetchData();
  }, []);

  // Filter and process data
  const filteredIssues = issues.filter(issue => {
    const dateToUse = issue.issue_date || issue.created_at;
    if (typeof dateToUse !== 'string') return false;
    
    const [year, month] = dateToUse.split('-');
    const matchesYear = year === selectedYear;
    const matchesMonth = selectedMonth ? month === selectedMonth : true;
    
    return matchesYear && matchesMonth;
  });

  const monthKey = selectedMonth ? `${selectedYear}-${selectedMonth}` : '';
  const currentMonthlyEntry = monthlyEntries.find(e => e.month === monthKey);

  useEffect(() => {
    setFrequentReportersPage(1);
  }, [selectedYear, selectedMonth]);

  // Metrics
  const stats = [
    { label: 'Total Issues', value: currentMonthlyEntry?.total_issues || filteredIssues.length, icon: AlertCircle, color: 'text-indigo-600', bg: 'bg-indigo-100 dark:bg-indigo-900/20' },
    { label: 'System Bugs', value: currentMonthlyEntry?.system_bugs || filteredIssues.filter(i => i.issue_type === 'System Bugs').length, icon: Bug, color: 'text-rose-600', bg: 'bg-rose-100 dark:bg-rose-900/20' },
    { label: 'Device Issues', value: currentMonthlyEntry?.device_issues || filteredIssues.filter(i => i.issue_type === 'Device Issues').length, icon: Smartphone, color: 'text-amber-600', bg: 'bg-amber-100 dark:bg-amber-900/20' },
    { label: 'Awareness', value: currentMonthlyEntry?.awareness || filteredIssues.filter(i => i.issue_type === 'Awareness').length, icon: Lightbulb, color: 'text-emerald-600', bg: 'bg-emerald-100 dark:bg-emerald-900/20' },
    { label: 'Help Requests', value: currentMonthlyEntry?.help_requests || filteredIssues.filter(i => i.issue_type === 'Help Requests').length, icon: HelpCircle, color: 'text-sky-600', bg: 'bg-sky-100 dark:bg-sky-900/20' },
    { label: 'System Downtime', value: `${downtime.filter(d => {
      if (typeof d.date !== 'string') return false;
      const [y, m] = d.date.split('-');
      return y === selectedYear && (selectedMonth ? m === selectedMonth : true);
    }).reduce((acc, d) => acc + d.duration_minutes, 0)} min`, icon: Activity, color: 'text-fuchsia-600', bg: 'bg-fuchsia-100 dark:bg-fuchsia-900/20' },
  ];

  // Frequent Issue Companies
  const companyCounts = filteredIssues.reduce((acc, issue) => {
    acc[issue.client_name] = (acc[issue.client_name] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Fixed type casting for Object.entries to resolve 'unknown' operator issues on line 67 and 68
  const frequentCompanies = Object.entries(companyCounts)
    .filter(([, count]) => (count as number) >= 2)
    .sort((a, b) => (b[1] as number) - (a[1] as number));

  const totalFrequentPages = Math.ceil(frequentCompanies.length / itemsPerPage);
  const paginatedFrequentCompanies = frequentCompanies.slice(
    (frequentReportersPage - 1) * itemsPerPage,
    frequentReportersPage * itemsPerPage
  );

  // Chart Data
  const issueTypeData = [
    { name: 'System Bugs', value: currentMonthlyEntry?.system_bugs || filteredIssues.filter(i => i.issue_type === 'System Bugs').length },
    { name: 'Device Issues', value: currentMonthlyEntry?.device_issues || filteredIssues.filter(i => i.issue_type === 'Device Issues').length },
    { name: 'Awareness', value: currentMonthlyEntry?.awareness || filteredIssues.filter(i => i.issue_type === 'Awareness').length },
    { name: 'Help Requests', value: currentMonthlyEntry?.help_requests || filteredIssues.filter(i => i.issue_type === 'Help Requests').length },
  ].filter(d => d.value > 0);

  const statusData = ['Open', 'Close', 'Pending', 'In Progress', 'Done'].map(status => ({
    name: status,
    count: filteredIssues.filter(i => i.status === status).length
  }));

  const downtimeTimeline = downtime
    .filter(d => {
      if (typeof d.date !== 'string') return false;
      const [y, m] = d.date.split('-');
      return y === selectedYear && (selectedMonth ? m === selectedMonth : true);
    })
    .map(d => ({
      date: selectedMonth ? d.date.split('-')[2] : `${d.date.split('-')[1]}/${d.date.split('-')[2]}`,
      duration: d.duration_minutes,
      system: d.system_name
    }));

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header & Filter */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Performance Overview</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">Track and analyze system health and issues</p>
        </div>
        <div className="flex items-center gap-3 bg-white dark:bg-slate-900 p-1 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-1.5 border-r border-slate-200 dark:border-slate-800 pr-3">
            <span className="text-[10px] font-bold text-slate-400 pl-2 uppercase">Year</span>
            <select 
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="bg-transparent text-xs font-semibold outline-none cursor-pointer text-indigo-600"
            >
              {Array.from({ length: 5 }, (_, i) => {
                const year = new Date().getFullYear() - i;
                return <option key={year} value={year}>{year}</option>;
              })}
            </select>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold text-slate-400 pl-2 uppercase">Month</span>
            <select 
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-transparent text-xs font-semibold outline-none pr-2 cursor-pointer text-indigo-600"
            >
              <option value="">All Months</option>
              {Array.from({ length: 12 }, (_, i) => {
                const monthNum = String(i + 1).padStart(2, '0');
                const monthName = new Date(2000, i).toLocaleString('default', { month: 'long' });
                return <option key={monthNum} value={monthNum}>{monthName}</option>;
              })}
            </select>
          </div>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
            <div className={`w-8 h-8 ${stat.bg} rounded-lg flex items-center justify-center mb-2.5`}>
              <stat.icon size={16} className={stat.color} />
            </div>
            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{stat.label}</p>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">{stat.value}</h3>
          </div>
        ))}
      </div>

      {/* Middle Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Frequent Companies */}
        <div className="lg:col-span-1 bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Frequent Reporters</h3>
            <span className="text-[9px] px-1.5 py-0.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full font-bold uppercase">Critical</span>
          </div>
          <div className="space-y-2.5">
            {paginatedFrequentCompanies.length > 0 ? paginatedFrequentCompanies.map(([name, count], i) => (
              <div key={name} className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-md bg-white dark:bg-slate-900 flex items-center justify-center text-[10px] font-bold text-slate-400">
                    #{(frequentReportersPage - 1) * itemsPerPage + i + 1}
                  </div>
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{name}</span>
                </div>
                <div className="flex items-center gap-1 px-1.5 py-0.5 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 rounded-md text-[10px] font-bold">
                  <ArrowUpRight size={12} />
                  {count}
                </div>
              </div>
            )) : (
              <div className="py-8 text-center text-slate-400">
                <p className="text-xs">No frequent reports</p>
              </div>
            )}
          </div>

          {totalFrequentPages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setFrequentReportersPage(p => Math.max(1, p - 1))}
                disabled={frequentReportersPage === 1}
                className="px-2 py-1 text-[10px] font-bold text-slate-500 hover:text-indigo-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                Prev
              </button>
              <span className="text-[9px] font-bold text-slate-400 uppercase">
                {frequentReportersPage} / {totalFrequentPages}
              </span>
              <button
                onClick={() => setFrequentReportersPage(p => Math.min(totalFrequentPages, p + 1))}
                disabled={frequentReportersPage === totalFrequentPages}
                className="px-2 py-1 text-[10px] font-bold text-slate-500 hover:text-indigo-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          )}
        </div>

        {/* Issue Distribution Pie */}
        <div className="lg:col-span-1 bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm min-h-[300px]">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">Distribution by Type</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={issueTypeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {issueTypeData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '6px', color: '#fff', fontSize: '11px' }}
                  itemStyle={{ color: '#fff', padding: '2px 0' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status Breakdown Bar */}
        <div className="lg:col-span-1 bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm min-h-[300px]">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">Status Breakdown</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 600 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 600 }} />
                <Tooltip 
                  cursor={{ fill: 'rgba(226, 232, 240, 0.4)' }}
                  contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '6px', color: '#fff', fontSize: '11px' }}
                />
                <Bar dataKey="count" fill="#6366f1" radius={[3, 3, 0, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Downtime Timeline Chart */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">System Downtime Timeline</h3>
            <p className="text-xs text-slate-500">Duration by system across the month</p>
          </div>
          <div className="flex gap-3">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              <span className="text-[10px] font-medium text-slate-500">Critical</span>
            </div>
          </div>
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={downtimeTimeline.length > 0 ? downtimeTimeline : [{date: '01', duration: 0}, {date: '30', duration: 0}]}>
              <defs>
                <linearGradient id="colorDur" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 9 }} label={{ value: 'Day', position: 'insideBottom', offset: -5, fontSize: 9 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9 }} unit="m" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '6px', color: '#fff', fontSize: '11px' }}
                labelFormatter={(label) => `Day: ${label}`}
              />
              <Area 
                type="monotone" 
                dataKey="duration" 
                stroke="#f43f5e" 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#colorDur)" 
                animationDuration={1000}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
