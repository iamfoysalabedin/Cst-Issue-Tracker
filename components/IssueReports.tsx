
import React, { useState, useEffect, useRef } from 'react';
import { dbService } from '../services/dbService';
import { Issue, SettingItem } from '../types';
import { PRIORITY_COLORS, STATUS_COLORS } from '../constants';
import { Search, Filter, Download, Trash2, Edit2, X, ChevronLeft, ChevronRight, Upload, FileSpreadsheet, CheckSquare, Square } from 'lucide-react';
import * as XLSX from 'xlsx';

const convert24hTo12h = (time24: string): string => {
  if (!time24) return '';
  const parts = time24.split(':');
  if (parts.length < 2) return time24;
  let hours = parseInt(parts[0], 10);
  const minutes = parts[1];
  if (isNaN(hours)) return time24;
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; // supports 12 instead of 0
  const formattedHours = String(hours).padStart(2, '0');
  return `${formattedHours}:${minutes} ${ampm}`;
};

const convert12hTo24h = (time12: string): string => {
  if (!time12) return '';
  const match = time12.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (!match) return '';
  let hours = parseInt(match[1], 10);
  const minutes = match[2];
  const ampm = match[3].toUpperCase();
  if (ampm === 'PM' && hours < 12) {
    hours += 12;
  } else if (ampm === 'AM' && hours === 12) {
    hours = 0;
  }
  return `${String(hours).padStart(2, '0')}:${minutes}`;
};

const IssueReports: React.FC = () => {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [search, setSearch] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [assignedFilter, setAssignedFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [editingIssue, setEditingIssue] = useState<Issue | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<{show: boolean, id: string | null, isBulk: boolean}>({ show: false, id: null, isBulk: false });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatIssueDateTime = (dateStr: string, createdAtStr?: string) => {
    // Prioritize createdAtStr as it contains the full timezone-aware timestamp
    const targetStr = createdAtStr || dateStr;
    if (!targetStr) return '';
    
    const dateObj = new Date(targetStr);
    if (isNaN(dateObj.getTime())) return targetStr;

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const day = String(dateObj.getDate()).padStart(2, '0');
    const month = months[dateObj.getMonth()];
    const year = dateObj.getFullYear();
    
    let hours = dateObj.getHours();
    const minutes = String(dateObj.getMinutes()).padStart(2, '0');
    const seconds = String(dateObj.getSeconds()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // supports 12 instead of 0
    const formattedHours = String(hours).padStart(2, '0');

    // For legacy dates without time components (e.g. "2026-06-04" of length <= 10 with no time separator)
    const isOnlyDate = targetStr && !targetStr.includes('T') && !targetStr.includes(':') && targetStr.length <= 10;
    
    // Check if it's exactly midnight (means legacy or imported date)
    const isMidnight = dateObj.getHours() === 0 && dateObj.getMinutes() === 0 && dateObj.getSeconds() === 0;

    if (isOnlyDate || isMidnight) {
      return `${day}-${month}-${year}`;
    }

    return `${day}-${month}-${year} ${formattedHours}:${minutes} ${ampm}`;
  };

  const formatForDateTimeLocal = (dateStr: string) => {
    if (!dateStr) return '';
    const dateObj = new Date(dateStr);
    if (isNaN(dateObj.getTime())) return '';
    
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    const hours = String(dateObj.getHours()).padStart(2, '0');
    const minutes = String(dateObj.getMinutes()).padStart(2, '0');
    
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const [options, setOptions] = useState<{
    issueTypes: SettingItem[];
    priorities: SettingItem[];
    categories: SettingItem[];
    statuses: SettingItem[];
    assignedPersons: SettingItem[];
  }>({
    issueTypes: [],
    priorities: [],
    categories: [],
    statuses: [],
    assignedPersons: [],
  });

  useEffect(() => {
    loadIssues();
    loadOptions();
  }, []);

  const loadOptions = async () => {
    const [it, pr, st, ap, cat] = await Promise.all([
      dbService.getSettingsByCategory('issue_type'),
      dbService.getSettingsByCategory('priority'),
      dbService.getSettingsByCategory('status'),
      dbService.getSettingsByCategory('assigned_person'),
      dbService.getSettingsByCategory('issue_category'),
    ]);
    setOptions({
      issueTypes: it,
      priorities: pr,
      categories: cat,
      statuses: st,
      assignedPersons: ap,
    });
  };

  const loadIssues = async () => {
    const data = await dbService.getIssues();
    setIssues(data);
  };

  const handleDelete = (id: string) => {
    setShowDeleteConfirm({ show: true, id, isBulk: false });
  };

  const handleDeleteSelected = () => {
    if (selectedIds.length === 0) return;
    setShowDeleteConfirm({ show: true, id: null, isBulk: true });
  };

  const confirmDelete = async () => {
    try {
      if (showDeleteConfirm.isBulk) {
        await dbService.deleteIssues(selectedIds);
        setSelectedIds([]);
      } else if (showDeleteConfirm.id) {
        await dbService.deleteIssue(showDeleteConfirm.id);
        setSelectedIds(prev => prev.filter(selectedId => selectedId !== showDeleteConfirm.id));
      }
      setShowDeleteConfirm({ show: false, id: null, isBulk: false });
      loadIssues();
    } catch (err) {
      console.error('Delete failed:', err);
      // We could add an error state here if needed
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === currentIssues.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(currentIssues.map(i => i.id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws) as any[];

        const normalizeType = (type: string) => {
          const t = type?.toLowerCase() || '';
          if (t.includes('bug')) return 'System Bugs';
          if (t.includes('device')) return 'Device Issues';
          if (t.includes('awareness')) return 'Awareness';
          if (t.includes('help') || t.includes('request')) return 'Help Requests';
          return 'System Bugs';
        };

        const parseDate = (dateVal: any) => {
          if (!dateVal) return new Date().toISOString().split('T')[0];
          
          // If it's a number (Excel serial date)
          if (typeof dateVal === 'number') {
            // Excel dates are number of days since 1899-12-30
            const jsDate = new Date(Math.round((dateVal - 25569) * 86400 * 1000));
            return jsDate.toISOString().split('T')[0];
          }

          const dateStr = String(dateVal).trim();
          
          // Handle dd-mm-yyyy or dd/mm/yyyy
          const dmyMatch = dateStr.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
          if (dmyMatch) {
            const [_, d, m, y] = dmyMatch;
            return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
          }

          // Fallback to standard Date parsing
          const d = new Date(dateStr);
          if (!isNaN(d.getTime())) {
            return d.toISOString().split('T')[0];
          }

          return new Date().toISOString().split('T')[0];
        };

        const newIssues = data.map(row => ({
          client_name: row['Client Name'] || row['client_name'] || 'Unknown',
          issue_type: normalizeType(row['Issue Type'] || row['issue_type']),
          category: row['Category'] || row['category'] || '',
          priority: row['Priority'] || row['priority'] || 'Medium',
          status: row['Status'] || row['status'] || 'Open',
          assigned_person: row['Assigned To'] || row['assigned_person'] || 'Unassigned',
          issue_details: row['Issue Details'] || row['issue_details'] || '',
          issue_date: parseDate(row['Issue Date'] || row['issue_date']),
          response_time: row['Response Time'] || row['response_time'] || '',
          resolution_time: row['Resolution Time'] || row['resolution_time'] || '',
          client_reporting_time: row['Client Reporting Time'] || row['client_reporting_time'] || '',
        }));

        for (const issue of newIssues) {
          await dbService.saveIssue(issue);
        }
        
        alert(`Successfully uploaded ${newIssues.length} issues.`);
        loadIssues();
        if (fileInputRef.current) fileInputRef.current.value = '';
      } catch (err) {
        console.error('Upload failed:', err);
        alert('Failed to process Excel file. Please ensure it matches the sample format.');
      }
    };
    reader.readAsBinaryString(file);
  };

  const downloadSample = () => {
    const today = new Date();
    const formattedDate = `${today.getDate().toString().padStart(2, '0')}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getFullYear()}`;

    const sampleData = [
      {
        'Client Name': 'Sample Client',
        'Issue Type': 'System Bugs',
        'Category': 'Hardware',
        'Priority': 'High',
        'Status': 'Open',
        'Assigned To': 'Fuad',
        'Issue Details': 'This is a sample bug description',
        'Issue Date': formattedDate,
        'Response Time': '10:30 AM',
        'Resolution Time': '11:45 AM',
        'Client Reporting Time': '10:15 AM'
      }
    ];
    const ws = XLSX.utils.json_to_sheet(sampleData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Issues");
    XLSX.writeFile(wb, "issue_sample.xlsx");
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingIssue) {
      await dbService.updateIssue(editingIssue.id, editingIssue);
      setEditingIssue(null);
      loadIssues();
    }
  };

  const clearFilters = () => {
    setSearch('');
    setFromDate('');
    setToDate('');
    setSelectedMonth('');
    setAssignedFilter('');
    setStatusFilter('');
    setCurrentPage(1);
  };

  const filteredIssues = issues.filter(issue => {
    const matchesSearch = issue.client_name.toLowerCase().includes(search.toLowerCase()) || 
                          issue.issue_details.toLowerCase().includes(search.toLowerCase());
    
    const issueDateStr = issue.issue_date || issue.created_at;
    const issueDateObj = new Date(issueDateStr);
    const issueDateTime = issueDateObj.getTime();
    
    const matchesFromDate = fromDate ? issueDateTime >= new Date(fromDate).getTime() : true;
    const matchesToDate = toDate ? issueDateTime <= new Date(toDate).getTime() + 86400000 : true;

    let matchesMonth = true;
    if (selectedMonth) {
      const [year, month] = selectedMonth.split('-').map(Number);
      matchesMonth = issueDateObj.getFullYear() === year && (issueDateObj.getMonth() + 1) === month;
    }

    const matchesAssigned = assignedFilter ? issue.assigned_person === assignedFilter : true;
    const matchesCategory = categoryFilter ? issue.category === categoryFilter : true;
    const matchesStatus = statusFilter ? issue.status === statusFilter : true;

    return matchesSearch && matchesFromDate && matchesToDate && matchesMonth && matchesAssigned && matchesCategory && matchesStatus;
  });

  const totalPages = Math.ceil(filteredIssues.length / itemsPerPage);
  const currentIssues = filteredIssues.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const exportExcel = () => {
    const headers = [
      'Ticket ID',
      'Client Name',
      'Issue Type',
      'Category',
      'Priority',
      'Status',
      'Assigned Handler',
      'Issue Date & Time',
      'Client Reporting Time',
      'Response Time',
      'Resolution Time',
      'Issue Details',
      'System Log Time'
    ];

    const rows = filteredIssues.map(i => [
      i.id || '',
      i.client_name || '',
      i.issue_type || '',
      i.category || '',
      i.priority || '',
      i.status || '',
      i.assigned_person || '',
      formatIssueDateTime(i.issue_date, i.created_at),
      i.client_reporting_time || '',
      i.response_time || '',
      i.resolution_time || '',
      i.issue_details || '',
      i.created_at ? new Date(i.created_at).toLocaleString() : ''
    ]);

    // Create sheet
    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);

    // Set column widths for a polished, readable layout
    const wscols = [
      { wch: 12 },  // Ticket ID
      { wch: 25 },  // Client Name
      { wch: 18 },  // Issue Type
      { wch: 15 },  // Category
      { wch: 12 },  // Priority
      { wch: 12 },  // Status
      { wch: 22 },  // Assigned Handler
      { wch: 22 },  // Issue Date & Time
      { wch: 22 },  // Client Reporting Time
      { wch: 18 },  // Response Time
      { wch: 18 },  // Resolution Time
      { wch: 45 },  // Issue Details (widened for easy reading of log details)
      { wch: 22 }   // System Log Time
    ];
    ws['!cols'] = wscols;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Issue Reports");

    // Save file with timestamp in name
    const today = new Date().toISOString().split('T')[0];
    XLSX.writeFile(wb, `Issue_Report_${today}.xlsx`);
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-500">
      {/* Filters Bar */}
      <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row gap-3 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input 
            type="text"
            placeholder="Search by client or details..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white text-xs"
          />
        </div>
        
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Month:</span>
            <input 
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-2 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center gap-1.5 border-l border-slate-200 dark:border-slate-800 pl-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Assigned:</span>
            <select 
              value={assignedFilter}
              onChange={(e) => setAssignedFilter(e.target.value)}
              className="px-2 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All</option>
              {options.assignedPersons.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
            </select>
          </div>

          <div className="flex items-center gap-1.5 border-l border-slate-200 dark:border-slate-800 pl-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Category:</span>
            <select 
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-2 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All</option>
              {options.categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
            </select>
          </div>

          <div className="flex items-center gap-1.5 border-l border-slate-200 dark:border-slate-800 pl-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Status:</span>
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All</option>
              {options.statuses.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
            </select>
          </div>

          <div className="flex items-center gap-1.5 border-l border-slate-200 dark:border-slate-800 pl-2">
            <input 
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="px-2 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <span className="text-slate-400 text-xs">to</span>
            <input 
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="px-2 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {(search || selectedMonth || fromDate || toDate || assignedFilter || statusFilter) && (
            <button 
              onClick={clearFilters}
              className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-lg text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-all flex items-center gap-1.5 animate-in fade-in zoom-in-95 duration-200"
            >
              <X size={14} />
              Clear
            </button>
          )}
          
          <div className="flex items-center gap-1.5 border-l border-slate-200 dark:border-slate-800 pl-2">
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileUpload} 
              accept=".xlsx, .xls, .csv" 
              className="hidden" 
            />
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all"
              title="Upload Excel"
            >
              <Upload size={16} />
            </button>
            <button 
              onClick={downloadSample}
              className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all"
              title="Download Sample"
            >
              <FileSpreadsheet size={16} />
            </button>
            <button 
              onClick={exportExcel}
              className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all"
              title="Export Excel"
            >
              <Download size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedIds.length > 0 && (
        <div className="flex items-center justify-between p-3 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 rounded-xl animate-in slide-in-from-top-2">
          <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">{selectedIds.length} items selected</span>
          <button 
            onClick={handleDeleteSelected}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 text-white rounded-lg text-xs font-bold shadow-md hover:bg-rose-700 transition-all"
          >
            <Trash2 size={14} />
            Delete Selected
          </button>
        </div>
      )}

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                <th className="px-4 py-3 w-8">
                  <button onClick={toggleSelectAll} className="text-slate-400 hover:text-indigo-600">
                    {selectedIds.length === currentIssues.length && currentIssues.length > 0 ? <CheckSquare size={16} /> : <Square size={16} />}
                  </button>
                </th>
                <th className="px-4 py-3 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Client</th>
                <th className="px-4 py-3 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Type</th>
                <th className="px-4 py-3 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Category</th>
                <th className="px-4 py-3 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Priority</th>
                <th className="px-4 py-3 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Assigned</th>
                <th className="px-4 py-3 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">Issue Date and time</th>
                <th className="px-4 py-3 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">Client Reporting Time</th>
                <th className="px-4 py-3 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">Response Time</th>
                <th className="px-4 py-3 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">Resolution Time</th>
                <th className="px-4 py-3 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {currentIssues.length > 0 ? currentIssues.map(issue => (
                <tr key={issue.id} className={`hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors ${selectedIds.includes(issue.id) ? 'bg-indigo-50/30 dark:bg-indigo-900/10' : ''}`}>
                  <td className="px-4 py-2.5">
                    <button onClick={() => toggleSelect(issue.id)} className={selectedIds.includes(issue.id) ? 'text-indigo-600' : 'text-slate-300'}>
                      {selectedIds.includes(issue.id) ? <CheckSquare size={16} /> : <Square size={16} />}
                    </button>
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="font-semibold text-slate-900 dark:text-white text-xs">{issue.client_name}</div>
                    <div className="text-[10px] text-slate-400 truncate max-w-[180px]">{issue.issue_details}</div>
                  </td>
                  <td className="px-4 py-2.5">
                    <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-md font-medium">
                      {issue.issue_type}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-[10px] font-medium text-slate-600 dark:text-slate-400">
                    {issue.category}
                  </td>
                  <td className="px-4 py-2.5">
                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase border ${(PRIORITY_COLORS as any)[issue.priority] || 'bg-slate-100'}`}>
                      {issue.priority}
                    </span>
                  </td>
                  <td className="px-4 py-2.5">
                    <span className={`text-[10px] font-semibold ${((STATUS_COLORS as any)[issue.status] || 'text-slate-600').split(' ')[1]}`}>
                      {issue.status}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-xs font-medium text-slate-600 dark:text-slate-400">{issue.assigned_person}</td>
                  <td className="px-4 py-2.5 text-xs font-medium text-slate-600 dark:text-slate-400 whitespace-nowrap">{formatIssueDateTime(issue.issue_date, issue.created_at)}</td>
                  <td className="px-4 py-2.5 text-xs font-medium text-slate-600 dark:text-slate-400 whitespace-nowrap">{issue.client_reporting_time || '-'}</td>
                  <td className="px-4 py-2.5 text-xs font-medium text-slate-600 dark:text-slate-400 whitespace-nowrap">{issue.response_time || '-'}</td>
                  <td className="px-4 py-2.5 text-xs font-medium text-slate-600 dark:text-slate-400 whitespace-nowrap">{issue.resolution_time || '-'}</td>
                  <td className="px-4 py-2.5 text-right flex-nowrap">
                    <div className="flex items-center justify-end gap-1.5">
                      <button 
                        onClick={() => setEditingIssue(issue)}
                        className="p-1 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-md transition-all"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button 
                        onClick={() => handleDelete(issue.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-md transition-all"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={12} className="px-4 py-10 text-center text-slate-400 text-xs">
                    No issues found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination & Rows per page */}
        <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/30 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500">Showing {(currentPage-1)*itemsPerPage+1} to {Math.min(currentPage*itemsPerPage, filteredIssues.length)} of {filteredIssues.length}</span>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-slate-400 font-bold uppercase">Rows:</span>
              <select 
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="bg-transparent text-xs font-bold text-slate-600 dark:text-slate-400 outline-none cursor-pointer"
              >
                {[10, 20, 50, 100, 500, 1000].map(v => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>
          </div>
          
          {totalPages > 1 && (
            <div className="flex items-center gap-1.5">
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1.5 border border-slate-200 dark:border-slate-700 rounded-lg disabled:opacity-30 dark:text-white"
              >
                <ChevronLeft size={14} />
              </button>
              <span className="text-xs font-bold px-1.5 dark:text-white">{currentPage} / {totalPages}</span>
              <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 border border-slate-200 dark:border-slate-700 rounded-lg disabled:opacity-30 dark:text-white"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {editingIssue && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-bold text-base dark:text-white">Edit Issue</h3>
              <button onClick={() => setEditingIssue(null)} className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleUpdate} className="p-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Client Name</label>
                  <input 
                    type="text"
                    value={editingIssue.client_name}
                    onChange={(e) => setEditingIssue({...editingIssue, client_name: e.target.value})}
                    className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Type</label>
                  <select 
                    value={editingIssue.issue_type}
                    onChange={(e) => setEditingIssue({...editingIssue, issue_type: e.target.value})}
                    className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white text-xs"
                  >
                    {options.issueTypes.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Category</label>
                  <select 
                    value={editingIssue.category}
                    onChange={(e) => setEditingIssue({...editingIssue, category: e.target.value})}
                    className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white text-xs"
                  >
                    {options.categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Priority</label>
                  <select 
                    value={editingIssue.priority}
                    onChange={(e) => setEditingIssue({...editingIssue, priority: e.target.value})}
                    className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white text-xs"
                  >
                    {options.priorities.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Status</label>
                  <select 
                    value={editingIssue.status}
                    onChange={(e) => setEditingIssue({...editingIssue, status: e.target.value})}
                    className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white text-xs"
                  >
                    {options.statuses.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Ticket Create Time</label>
                  <input 
                    type="datetime-local"
                    value={formatForDateTimeLocal(editingIssue.created_at || editingIssue.issue_date)}
                    onChange={(e) => {
                      const val = e.target.value;
                      setEditingIssue({
                        ...editingIssue,
                        created_at: val ? new Date(val).toISOString() : '',
                        issue_date: val ? val.split('T')[0] : ''
                      });
                    }}
                    className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Client Reporting Time</label>
                  <input 
                    type="time"
                    value={convert12hTo24h(editingIssue.client_reporting_time || '')}
                    onChange={(e) => setEditingIssue({...editingIssue, client_reporting_time: convert24hTo12h(e.target.value)})}
                    className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Response Time</label>
                  <input 
                    type="time"
                    value={convert12hTo24h(editingIssue.response_time || '')}
                    onChange={(e) => setEditingIssue({...editingIssue, response_time: convert24hTo12h(e.target.value)})}
                    className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Resolution Time</label>
                  <input 
                    type="time"
                    value={convert12hTo24h(editingIssue.resolution_time || '')}
                    onChange={(e) => setEditingIssue({...editingIssue, resolution_time: convert24hTo12h(e.target.value)})}
                    className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white text-xs"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Details</label>
                <textarea 
                  rows={3}
                  value={editingIssue.issue_details}
                  onChange={(e) => setEditingIssue({...editingIssue, issue_details: e.target.value})}
                  className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white resize-none text-xs"
                />
              </div>
              <div className="flex gap-2 mt-4">
                <button type="button" onClick={() => setEditingIssue(null)} className="flex-1 px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg font-bold text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">Cancel</button>
                <button type="submit" className="flex-1 px-3 py-2 gradient-bg text-white font-bold rounded-lg shadow-md hover:opacity-90 transition-opacity text-xs">Update Issue</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm.show && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-xs shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-200">
            <div className="p-6 text-center">
              <div className="w-12 h-12 bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 size={24} />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">Confirm Deletion</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {showDeleteConfirm.isBulk 
                  ? `Delete ${selectedIds.length} selected issues?`
                  : 'Delete this issue?'}
              </p>
              <div className="flex gap-2 mt-6">
                <button 
                  onClick={() => setShowDeleteConfirm({ show: false, id: null, isBulk: false })}
                  className="flex-1 px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg font-bold text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={confirmDelete}
                  className="flex-1 px-3 py-2 bg-rose-600 text-white font-bold rounded-lg shadow-md hover:bg-rose-700 transition-colors text-xs"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IssueReports;
