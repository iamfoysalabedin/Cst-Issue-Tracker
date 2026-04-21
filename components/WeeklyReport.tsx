
import React, { useState, useEffect, useRef } from 'react';
import { dbService } from '../services/dbService';
import { Issue, SystemDowntime } from '../types';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  AlertCircle, 
  Bug, 
  Smartphone, 
  Lightbulb, 
  HelpCircle, 
  Activity,
  CheckCircle2,
  CircleDot,
  Filter,
  Download,
  FileDown
} from 'lucide-react';
import { PRIORITY_COLORS } from '../constants';

const WeeklyReport: React.FC = () => {
  const reportRef = useRef<HTMLDivElement>(null);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [isExporting, setIsExporting] = useState(false);
  const [downtime, setDowntime] = useState<SystemDowntime[]>([]);
  const [fromDate, setFromDate] = useState<string>(() => {
    const d = new Date();
    const day = d.getDay(); // 0 is Sunday
    const diff = d.getDate() - day;
    const sunday = new Date(d.setDate(diff));
    return sunday.toISOString().split('T')[0];
  });
  const [toDate, setToDate] = useState<string>(() => {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + 4; // Thursday is 4 days after Sunday
    const thursday = new Date(d.setDate(diff));
    return thursday.toISOString().split('T')[0];
  });
  
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);

  useEffect(() => {
    const fetchData = async () => {
      const [i, d] = await Promise.all([
        dbService.getIssues(),
        dbService.getDowntime(),
      ]);
      setIssues(i);
      setDowntime(d);
    };
    fetchData();
  }, []);

  const setWorkingWeek = () => {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day;
    const sunday = new Date(new Date().setDate(diff));
    const thursday = new Date(new Date().setDate(diff + 4));
    
    setFromDate(sunday.toISOString().split('T')[0]);
    setToDate(thursday.toISOString().split('T')[0]);
    setCurrentPage(1);
  };

  const filteredIssues = issues.filter(issue => {
    const issueDate = issue.issue_date || issue.created_at.split('T')[0];
    return issueDate >= fromDate && issueDate <= toDate;
  });

  const filteredDowntime = downtime.filter(d => {
    return d.date >= fromDate && d.date <= toDate;
  });

  const totalDowntimeMinutes = filteredDowntime.reduce((acc, d) => acc + d.duration_minutes, 0);

  const stats = [
    { label: 'Total Issues', value: filteredIssues.length, icon: AlertCircle, color: 'text-indigo-600', bg: 'bg-indigo-100 dark:bg-indigo-900/20' },
    { label: 'System Bugs', value: filteredIssues.filter(i => i.issue_type === 'System Bugs').length, icon: Bug, color: 'text-rose-600', bg: 'bg-rose-100 dark:bg-rose-900/20' },
    { label: 'Device Issues', value: filteredIssues.filter(i => i.issue_type === 'Device Issues').length, icon: Smartphone, color: 'text-amber-600', bg: 'bg-amber-100 dark:bg-amber-900/20' },
    { label: 'Awareness', value: filteredIssues.filter(i => i.issue_type === 'Awareness').length, icon: Lightbulb, color: 'text-emerald-600', bg: 'bg-emerald-100 dark:bg-emerald-900/20' },
    { label: 'Help Requests', value: filteredIssues.filter(i => i.issue_type === 'Help Requests').length, icon: HelpCircle, color: 'text-sky-600', bg: 'bg-sky-100 dark:bg-sky-900/20' },
    { label: 'System Downtime', value: `${totalDowntimeMinutes} min`, icon: Activity, color: 'text-fuchsia-600', bg: 'bg-fuchsia-100 dark:bg-fuchsia-900/20' },
  ];

  const statusStats = [
    { label: 'Open Issues', value: filteredIssues.filter(i => i.status === 'Open').length, icon: CircleDot, color: 'text-orange-600', bg: 'bg-orange-100 dark:bg-orange-900/20' },
    { label: 'Closed Issues', value: filteredIssues.filter(i => i.status === 'Close' || i.status === 'Done').length, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-100 dark:bg-emerald-900/20' },
  ];

  const totalPages = Math.ceil(filteredIssues.length / itemsPerPage);
  const currentIssues = filteredIssues.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const exportCSV = () => {
    const headers = ['Date', 'Client', 'Type', 'Priority', 'Status', 'Assigned', 'Details'];
    const rows = filteredIssues.map(i => [
      i.issue_date, i.client_name, i.issue_type, i.priority, i.status, i.assigned_person, i.issue_details.replace(/,/g, ';')
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `weekly_report_${fromDate}_to_${toDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportPDF = async () => {
    if (!reportRef.current) return;
    
    setIsExporting(true);
    try {
      // Wait for the DOM to update (show the PDF header)
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: document.documentElement.classList.contains('dark') ? '#020617' : '#f8fafc'
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: [canvas.width, canvas.height]
      });
      
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
      pdf.save(`weekly_report_${fromDate}_to_${toDate}.pdf`);
    } catch (error) {
      console.error('PDF Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div ref={reportRef} className="space-y-8 animate-in fade-in duration-500 p-1">
      {/* Header & Controls */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm" data-html2canvas-ignore="true">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Weekly Report</h1>
          <p className="text-slate-500 dark:text-slate-400">Analyze performance within a specific date range</p>
        </div>

        <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto">
          <button 
            onClick={setWorkingWeek}
            className="px-4 py-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-xl text-sm font-bold hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-all flex items-center gap-2"
          >
            <Calendar size={16} />
            Sun - Thu
          </button>

          <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
            <input 
              type="date"
              value={fromDate}
              onChange={(e) => { setFromDate(e.target.value); setCurrentPage(1); }}
              className="bg-transparent px-3 py-1.5 text-sm font-semibold outline-none text-slate-700 dark:text-slate-200"
            />
            <span className="text-slate-400 font-bold">→</span>
            <input 
              type="date"
              value={toDate}
              onChange={(e) => { setToDate(e.target.value); setCurrentPage(1); }}
              className="bg-transparent px-3 py-1.5 text-sm font-semibold outline-none text-slate-700 dark:text-slate-200"
            />
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={exportCSV}
              className="p-2.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-xl hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-all"
              title="Export CSV"
            >
              <Download size={20} />
            </button>
            <button 
              onClick={exportPDF}
              disabled={isExporting}
              className="p-2.5 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 rounded-xl hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-all disabled:opacity-50"
              title="Export PDF"
            >
              <FileDown size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* PDF Header (Only visible during export) */}
      <div className={`${isExporting ? 'block' : 'hidden'} bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm mb-8`}>
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white">Weekly Performance Report</h1>
            <p className="text-slate-500 font-bold mt-1">Range: {fromDate} to {toDate}</p>
          </div>
          <div className="text-right">
            <div className="text-indigo-600 font-black text-xl">INOVACE</div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Issue Tracking System</div>
          </div>
        </div>
      </div>

      {/* Primary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all group">
            <div className={`w-10 h-10 ${stat.bg} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
              <stat.icon size={20} className={stat.color} />
            </div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{stat.label}</p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">{stat.value}</h3>
          </div>
        ))}
      </div>

      {/* Status Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {statusStats.map((stat, i) => (
          <div key={i} className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-6 group">
            <div className={`w-16 h-16 ${stat.bg} rounded-2xl flex items-center justify-center group-hover:rotate-6 transition-transform`}>
              <stat.icon size={32} className={stat.color} />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">{stat.label}</p>
              <h3 className="text-4xl font-black text-slate-900 dark:text-white mt-1">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* Downtime Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Activity size={18} className="text-fuchsia-500" />
            System Downtime Report in Range
          </h3>
          <span className="text-xs font-bold px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-full">
            {filteredDowntime.length} Results
          </span>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">System Name</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Start Time</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">End Time</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Duration</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredDowntime.length > 0 ? filteredDowntime.map(d => (
                <tr key={d.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="px-6 py-4 text-sm font-bold text-slate-600 dark:text-slate-400 whitespace-nowrap">
                    {d.date}
                  </td>
                  <td className="px-6 py-4 text-sm font-bold text-slate-900 dark:text-white">
                    {d.system_name}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                    {d.start_time}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                    {d.end_time}
                  </td>
                  <td className="px-6 py-4 text-sm font-bold text-fuchsia-600">
                    {d.duration_minutes} min
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-slate-400 italic">
                    No downtime entries found in this date range.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Issues Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Filter size={18} className="text-indigo-500" />
            Issues in Range
          </h3>
          <span className="text-xs font-bold px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-full">
            {filteredIssues.length} Results
          </span>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Client</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Type</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Priority</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Assigned</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {currentIssues.length > 0 ? currentIssues.map(issue => (
                <tr key={issue.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="px-6 py-4 text-sm font-bold text-slate-600 dark:text-slate-400 whitespace-nowrap">
                    {issue.issue_date}
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-900 dark:text-white text-sm">{issue.client_name}</div>
                    <div className="text-xs text-slate-400 truncate max-w-[250px]">{issue.issue_details}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-[10px] px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-md font-bold uppercase">
                      {issue.issue_type}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-[10px] px-2 py-1 rounded-full font-black uppercase border ${(PRIORITY_COLORS as any)[issue.priority] || 'bg-slate-100'}`}>
                      {issue.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-xs font-bold ${
                      issue.status === 'Open' ? 'text-orange-600' : 
                      issue.status === 'Close' || issue.status === 'Done' ? 'text-emerald-600' : 
                      'text-slate-500'
                    }`}>
                      {issue.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm font-bold text-slate-600 dark:text-slate-400">{issue.assigned_person}</td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center text-slate-400 italic">
                    No issues found in this date range.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-4 bg-slate-50/50 dark:bg-slate-800/30 border-t border-slate-100 dark:divide-slate-800 flex flex-col sm:row items-center justify-between gap-4" data-html2canvas-ignore="true">
          <div className="flex items-center gap-6">
            <span className="text-xs font-bold text-slate-400 uppercase">
              Showing {Math.min(filteredIssues.length, (currentPage-1)*itemsPerPage+1)} - {Math.min(currentPage*itemsPerPage, filteredIssues.length)} of {filteredIssues.length}
            </span>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black text-slate-400 uppercase">Rows:</span>
              <select 
                value={itemsPerPage}
                onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                className="bg-transparent text-sm font-black text-indigo-600 outline-none cursor-pointer"
              >
                {[10, 20, 50, 100, 500].map(v => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>
          </div>
          
          {totalPages > 1 && (
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 border border-slate-200 dark:border-slate-700 rounded-xl disabled:opacity-30 text-slate-600 dark:text-white hover:bg-white dark:hover:bg-slate-800 transition-all"
              >
                <ChevronLeft size={18} />
              </button>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum = i + 1;
                  if (totalPages > 5 && currentPage > 3) {
                    pageNum = currentPage - 3 + i + 1;
                    if (pageNum > totalPages) pageNum = totalPages - (4 - i);
                  }
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`w-8 h-8 rounded-lg text-xs font-black transition-all ${
                        currentPage === pageNum 
                          ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200 dark:shadow-none' 
                          : 'text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 border border-slate-200 dark:border-slate-700 rounded-xl disabled:opacity-30 text-slate-600 dark:text-white hover:bg-white dark:hover:bg-slate-800 transition-all"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WeeklyReport;
