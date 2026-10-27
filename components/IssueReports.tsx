
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

const isSystemBug = (type?: string): boolean => {
  if (!type) return false;
  return type.toLowerCase().includes('bug');
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
    segments: SettingItem[];
    statuses: SettingItem[];
    assignedPersons: SettingItem[];
  }>({
    issueTypes: [],
    priorities: [],
    categories: [],
    segments: [],
    statuses: [],
    assignedPersons: [],
  });

  useEffect(() => {
    loadIssues();
    loadOptions();
  }, []);

  const loadOptions = async () => {
    const [it, pr, st, ap, cat, seg] = await Promise.all([
      dbService.getSettingsByCategory('issue_type'),
      dbService.getSettingsByCategory('priority'),
      dbService.getSettingsByCategory('status'),
      dbService.getSettingsByCategory('assigned_person'),
      dbService.getSettingsByCategory('issue_category'),
      dbService.getSettingsByCategory('segment'),
    ]);
    setOptions({
      issueTypes: it,
      priorities: pr,
      categories: cat,
      segments: seg,
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
          if (!type) return 'System Bugs';
          const trimmed = String(type).trim();
          if (!trimmed) return 'System Bugs';
          const t = trimmed.toLowerCase();
          if (t.includes('bug')) return 'System Bugs';
          if (t.includes('device')) return 'Device Issues';
          if (t.includes('awareness')) return 'Awareness';
          if (t.includes('help') || t.includes('request')) return 'Help Requests';
          return trimmed;
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
          segment: row['Segment'] || row['segment'] || '',
          clickup_ticket_id: row['ClickUp Ticket ID'] || row['Clickup Ticket ID'] || row['clickup_ticket_id'] || '',
          category: row['Category'] || row['category'] || '',
          priority: row['Priority'] || row['priority'] || 'Medium',
          status: row['Status'] || row['status'] || 'Open',
          assigned_person: row['Assigned To'] || row['assigned_person'] || 'Unassigned',
          issue_details: row['Issue Details'] || row['issue_details'] || '',
          issue_date: parseDate(row['Issue Date'] || row['issue_date']),
          response_time: row['Response Time'] || row['response_time'] || '',
          resolution_time: row['Resolution Time'] || row['resolution_time'] || '',
          client_reporting_time: row['Client Reporting Time'] || row['client_reporting_time'] || '',
          issue_resolved_confirmed: row['Issue Resolved Confirmed'] || row['issue_resolved_confirmed'] || '',
          customer_satisfaction: row['Customer Satisfaction'] || row['customer_satisfaction'] || '',
          feedback_date: row['Feedback Date'] || row['feedback_date'] || '',
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
        'Segment': 'Segment A',
        'ClickUp Ticket ID': '#8678xyz',
        'Category': 'Hardware',
        'Priority': 'High',
        'Status': 'Open',
        'Assigned To': 'Fuad',
        'Issue Details': 'This is a sample bug description',
        'Issue Date': formattedDate,
        'Response Time': '10:30 AM',
        'Resolution Time': '11:45 AM',
        'Client Reporting Time': '10:15 AM',
        'Issue Resolved Confirmed': 'Yes',
        'Customer Satisfaction': 'Satisfied',
        'Feedback Date': formattedDate
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
      if (isSystemBug(editingIssue.issue_type) && !editingIssue.clickup_ticket_id?.trim()) {
        alert('ClickUp Ticket ID is mandatory when Issue Type is System Bugs.');
        return;
      }
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
                          issue.issue_details.toLowerCase().includes(search.toLowerCase()) ||
                          (issue.segment && issue.segment.toLowerCase().includes(search.toLowerCase())) ||
                          (issue.clickup_ticket_id && issue.clickup_ticket_id.toLowerCase().includes(search.toLowerCase())) ||
                          (issue.issue_resolved_confirmed && issue.issue_resolved_confirmed.toLowerCase().includes(search.toLowerCase())) ||
                          (issue.customer_satisfaction && issue.customer_satisfaction.toLowerCase().includes(search.toLowerCase()));
    
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
      'Issue Details',
      'Issue Type',
      'Segment',
      'Category',
      'ClickUp Ticket ID',
      'Priority',
      'Status',
      'Assigned Handler',
      'Issue Date & Time',
      'Client Reporting Time',
      'Response Time',
      'Resolution Time',
      'Issue Resolved Confirmed',
      'Customer Satisfaction',
      'Feedback Date',
      'System Log Time'
    ];

    const rows = filteredIssues.map(i => [
      i.id || '',
      i.client_name || '',
      i.issue_details || '',
      i.issue_type || '',
      i.segment || '',
      i.category || '',
      i.clickup_ticket_id || '',
      i.priority || '',
      i.status || '',
      i.assigned_person || '',
      formatIssueDateTime(i.issue_date, i.created_at),
      i.client_reporting_time || '',
      i.response_time || '',
      i.resolution_time || '',
      i.issue_resolved_confirmed || '',
      i.customer_satisfaction || '',
      i.feedback_date || '',
      i.created_at ? new Date(i.created_at).toLocaleString() : ''
    ]);

    // Create sheet
    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);

    // Set column widths for a polished, readable layout
    const wscols = [
      { wch: 12 },  // Ticket ID
      { wch: 25 },  // Client Name
      { wch: 55 },  // Issue Details (placed prominently beside Client Name)
      { wch: 18 },  // Issue Type
      { wch: 15 },  // Segment
      { wch: 15 },  // Category
      { wch: 18 },  // ClickUp Ticket ID
      { wch: 12 },  // Priority
      { wch: 12 },  // Status
      { wch: 22 },  // Assigned Handler
      { wch: 22 },  // Issue Date & Time
      { wch: 22 },  // Client Reporting Time
      { wch: 18 },  // Response Time
      { wch: 18 },  // Resolution Time
      { wch: 24 },  // Issue Resolved Confirmed
      { wch: 22 },  // Customer Satisfaction
      { wch: 16 },  // Feedback Date
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
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-slate-900 dark:text-white text-xs"
          />
        </div>
        
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Month:</span>
            <input 
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-2 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center gap-1.5 border-l border-slate-200 dark:border-slate-800 pl-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Assigned:</span>
            <select 
              value={assignedFilter}
              onChange={(e) => setAssignedFilter(e.target.value)}
              className="px-2 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">All</option>
              {options.assignedPersons.map(p => <option key={p.id} value={p.name} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">{p.name}</option>)}
            </select>
          </div>

          <div className="flex items-center gap-1.5 border-l border-slate-200 dark:border-slate-800 pl-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Category:</span>
            <select 
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-2 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">All</option>
              {options.categories.map(c => <option key={c.id} value={c.name} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">{c.name}</option>)}
            </select>
          </div>

          <div className="flex items-center gap-1.5 border-l border-slate-200 dark:border-slate-800 pl-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Status:</span>
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">All</option>
              {options.statuses.map(s => <option key={s.id} value={s.name} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">{s.name}</option>)}
            </select>
          </div>

          <div className="flex items-center gap-1.5 border-l border-slate-200 dark:border-slate-800 pl-2">
            <input 
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="px-2 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <span className="text-slate-400 text-xs">to</span>
            <input 
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="px-2 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
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
                <th className="px-4 py-3 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">Client</th>
                <th className="px-4 py-3 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">Type</th>
                <th className="px-4 py-3 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">Segment</th>
                <th className="px-4 py-3 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">ClickUp Ticket ID</th>
                <th className="px-4 py-3 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">Category</th>
                <th className="px-4 py-3 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">Priority</th>
                <th className="px-4 py-3 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">Status</th>
                <th className="px-4 py-3 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">Assigned</th>
                <th className="px-4 py-3 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">Issue Date and time</th>
                <th className="px-4 py-3 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">Client Reporting Time</th>
                <th className="px-4 py-3 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">Response Time</th>
                <th className="px-4 py-3 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">Resolution Time</th>
                <th className="px-4 py-3 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">Resolved Confirmed</th>
                <th className="px-4 py-3 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">Satisfaction</th>
                <th className="px-4 py-3 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">Feedback Date</th>
                <th className="px-4 py-3 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right whitespace-nowrap">Actions</th>
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
                  <td className="px-4 py-2.5 whitespace-nowrap">
                    <span className="text-[10px] px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-md font-medium inline-block whitespace-nowrap">
                      {issue.issue_type}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-[10px] font-medium text-slate-600 dark:text-slate-400 whitespace-nowrap">
                    {issue.segment || '-'}
                  </td>
                  <td className="px-4 py-2.5 text-xs font-mono font-medium text-slate-600 dark:text-slate-400 whitespace-nowrap">
                    {issue.clickup_ticket_id || '-'}
                  </td>
                  <td className="px-4 py-2.5 text-[10px] font-medium text-slate-600 dark:text-slate-400 whitespace-nowrap">
                    {issue.category}
                  </td>
                  <td className="px-4 py-2.5 whitespace-nowrap">
                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase border inline-block whitespace-nowrap ${(PRIORITY_COLORS as any)[issue.priority] || 'bg-slate-100'}`}>
                      {issue.priority}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 whitespace-nowrap">
                    <span className={`text-[10px] font-semibold inline-block whitespace-nowrap ${((STATUS_COLORS as any)[issue.status] || 'text-slate-600').split(' ')[1]}`}>
                      {issue.status}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-xs font-medium text-slate-600 dark:text-slate-400 whitespace-nowrap">{issue.assigned_person}</td>
                  <td className="px-4 py-2.5 text-xs font-medium text-slate-600 dark:text-slate-400 whitespace-nowrap">{formatIssueDateTime(issue.issue_date, issue.created_at)}</td>
                  <td className="px-4 py-2.5 text-xs font-medium text-slate-600 dark:text-slate-400 whitespace-nowrap">{issue.client_reporting_time || '-'}</td>
                  <td className="px-4 py-2.5 text-xs font-medium text-slate-600 dark:text-slate-400 whitespace-nowrap">{issue.response_time || '-'}</td>
                  <td className="px-4 py-2.5 text-xs font-medium text-slate-600 dark:text-slate-400 whitespace-nowrap">{issue.resolution_time || '-'}</td>
                  <td className="px-4 py-2.5 whitespace-nowrap">
                    {issue.issue_resolved_confirmed ? (
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border inline-block whitespace-nowrap ${
                        issue.issue_resolved_confirmed === 'Yes'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800'
                          : issue.issue_resolved_confirmed === 'No'
                          ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800'
                          : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800'
                      }`}>
                        {issue.issue_resolved_confirmed}
                      </span>
                    ) : (
                      <span className="text-slate-400 text-xs">-</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 whitespace-nowrap">
                    {issue.customer_satisfaction ? (
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border inline-block whitespace-nowrap ${
                        issue.customer_satisfaction === 'Satisfied'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800'
                          : issue.customer_satisfaction === 'Neutral'
                          ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800'
                          : 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800'
                      }`}>
                        {issue.customer_satisfaction}
                      </span>
                    ) : (
                      <span className="text-slate-400 text-xs">-</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-xs font-medium text-slate-600 dark:text-slate-400 whitespace-nowrap">
                    {issue.feedback_date || '-'}
                  </td>
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
                  <td colSpan={17} className="px-4 py-10 text-center text-slate-400 text-xs">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh] my-auto overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 shrink-0 bg-white dark:bg-slate-900">
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">Edit Issue Ticket</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Update issue details, timing, status, and feedback</p>
              </div>
              <button 
                type="button"
                onClick={() => setEditingIssue(null)} 
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Form with Scrollable Body */}
            <form onSubmit={handleUpdate} className="flex flex-col flex-1 min-h-0 overflow-hidden">
              <div className="p-6 overflow-y-auto space-y-5 flex-1">
                {/* Basic Information Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Client Name */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Client Name <span className="text-rose-500">*</span>
                    </label>
                    <input 
                      type="text"
                      required
                      value={editingIssue.client_name}
                      onChange={(e) => setEditingIssue({...editingIssue, client_name: e.target.value})}
                      className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white text-xs"
                    />
                  </div>

                  {/* Issue Type */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Issue Type <span className="text-rose-500">*</span>
                    </label>
                    <select 
                      value={editingIssue.issue_type}
                      onChange={(e) => setEditingIssue({...editingIssue, issue_type: e.target.value})}
                      className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white text-xs"
                    >
                      {options.issueTypes.map(t => (
                        <option key={t.id} value={t.name} className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200">
                          {t.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Segment */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Segment
                    </label>
                    <select 
                      value={editingIssue.segment || ''}
                      onChange={(e) => setEditingIssue({...editingIssue, segment: e.target.value})}
                      className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white text-xs"
                    >
                      <option value="" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200">Select Segment</option>
                      {options.segments.map(s => (
                        <option key={s.id} value={s.name} className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200">
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* ClickUp Ticket ID */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                        ClickUp Ticket ID {isSystemBug(editingIssue.issue_type) && <span className="text-rose-500">*</span>}
                      </label>
                      {isSystemBug(editingIssue.issue_type) && (
                        <span className="text-[10px] font-semibold text-rose-500 bg-rose-50 dark:bg-rose-900/30 px-2 py-0.5 rounded border border-rose-200/50 dark:border-rose-800/40">
                          Required for Bugs
                        </span>
                      )}
                    </div>
                    <input 
                      type="text"
                      value={editingIssue.clickup_ticket_id || ''}
                      onChange={(e) => setEditingIssue({...editingIssue, clickup_ticket_id: e.target.value})}
                      placeholder={isSystemBug(editingIssue.issue_type) ? "e.g. #8678xyz (Required)" : "e.g. #8678xyz"}
                      className={`w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white text-xs ${
                        isSystemBug(editingIssue.issue_type) && !editingIssue.clickup_ticket_id?.trim()
                          ? 'border-amber-400 dark:border-amber-600 bg-amber-50/20 dark:bg-amber-950/20'
                          : 'border-slate-200 dark:border-slate-700'
                      }`}
                    />
                  </div>

                  {/* Category */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Category
                    </label>
                    <select 
                      value={editingIssue.category}
                      onChange={(e) => setEditingIssue({...editingIssue, category: e.target.value})}
                      className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white text-xs"
                    >
                      {options.categories.map(c => (
                        <option key={c.id} value={c.name} className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200">
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Priority */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Priority <span className="text-rose-500">*</span>
                    </label>
                    <select 
                      value={editingIssue.priority}
                      onChange={(e) => setEditingIssue({...editingIssue, priority: e.target.value})}
                      className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white text-xs"
                    >
                      {options.priorities.map(p => (
                        <option key={p.id} value={p.name} className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200">
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Status */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Status <span className="text-rose-500">*</span>
                    </label>
                    <select 
                      value={editingIssue.status}
                      onChange={(e) => setEditingIssue({...editingIssue, status: e.target.value})}
                      className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white text-xs"
                    >
                      {options.statuses.map(s => (
                        <option key={s.id} value={s.name} className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200">
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Assigned Person */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Assigned To <span className="text-rose-500">*</span>
                    </label>
                    <select 
                      value={editingIssue.assigned_person}
                      onChange={(e) => setEditingIssue({...editingIssue, assigned_person: e.target.value})}
                      className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white text-xs"
                    >
                      {options.assignedPersons.map(ap => (
                        <option key={ap.id} value={ap.name} className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200">
                          {ap.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Timing & SLA Benchmarks */}
                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700/60 space-y-3">
                  <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                    Timing & SLA Metrics
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Ticket Create Time
                      </label>
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
                        className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Client Reporting Time
                      </label>
                      <input 
                        type="time"
                        value={convert12hTo24h(editingIssue.client_reporting_time || '')}
                        onChange={(e) => setEditingIssue({...editingIssue, client_reporting_time: convert24hTo12h(e.target.value)})}
                        className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Response Time
                      </label>
                      <input 
                        type="time"
                        value={convert12hTo24h(editingIssue.response_time || '')}
                        onChange={(e) => setEditingIssue({...editingIssue, response_time: convert24hTo12h(e.target.value)})}
                        className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Resolution Time
                      </label>
                      <input 
                        type="time"
                        value={convert12hTo24h(editingIssue.resolution_time || '')}
                        onChange={(e) => setEditingIssue({...editingIssue, resolution_time: convert24hTo12h(e.target.value)})}
                        className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white text-xs"
                      />
                    </div>
                  </div>
                </div>

                {/* Bug Resolution & Feedback Section */}
                <div className="bg-indigo-50/50 dark:bg-indigo-950/20 p-4 rounded-xl border border-indigo-100 dark:border-indigo-900/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-indigo-800 dark:text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-indigo-500 inline-block"></span>
                      Bug Resolution & Feedback
                    </span>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500">
                      {isSystemBug(editingIssue.issue_type) ? 'System Bug Feedback' : 'Optional Feedback'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                        Issue Resolved Confirmed
                      </label>
                      <select 
                        value={editingIssue.issue_resolved_confirmed || ''}
                        onChange={(e) => setEditingIssue({...editingIssue, issue_resolved_confirmed: e.target.value})}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white text-xs"
                      >
                        <option value="">Select Response</option>
                        <option value="Yes">Yes</option>
                        <option value="No">No</option>
                        <option value="No Response">No Response</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                        Customer Satisfaction
                      </label>
                      <select 
                        value={editingIssue.customer_satisfaction || ''}
                        onChange={(e) => setEditingIssue({...editingIssue, customer_satisfaction: e.target.value})}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white text-xs"
                      >
                        <option value="">Select Satisfaction</option>
                        <option value="Satisfied">Satisfied</option>
                        <option value="Neutral">Neutral</option>
                        <option value="Dissatisfied">Dissatisfied</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                        Feedback Date
                      </label>
                      <input 
                        type="date"
                        value={editingIssue.feedback_date || ''}
                        onChange={(e) => setEditingIssue({...editingIssue, feedback_date: e.target.value})}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white text-xs"
                      />
                    </div>
                  </div>
                </div>

                {/* Details Textarea */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Issue Details <span className="text-rose-500">*</span>
                  </label>
                  <textarea 
                    rows={4}
                    required
                    value={editingIssue.issue_details}
                    onChange={(e) => setEditingIssue({...editingIssue, issue_details: e.target.value})}
                    placeholder="Enter thorough details of the issue..."
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white text-xs leading-relaxed"
                  />
                </div>
              </div>

              {/* Sticky Modal Footer */}
              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-900/90 backdrop-blur-sm shrink-0">
                <button 
                  type="button" 
                  onClick={() => setEditingIssue(null)} 
                  className="px-5 py-2.5 border border-slate-300 dark:border-slate-700 rounded-xl font-bold text-xs text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 transition-colors shadow-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer"
                >
                  Update Issue
                </button>
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
