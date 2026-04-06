
import React, { useState, useEffect, useRef } from 'react';
import { dbService } from '../services/dbService';
import { Issue, SettingItem } from '../types';
import { PRIORITY_COLORS, STATUS_COLORS } from '../constants';
import { Search, Filter, Download, Trash2, Edit2, X, ChevronLeft, ChevronRight, Upload, FileSpreadsheet, CheckSquare, Square } from 'lucide-react';
import * as XLSX from 'xlsx';

const IssueReports: React.FC = () => {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [search, setSearch] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [editingIssue, setEditingIssue] = useState<Issue | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<{show: boolean, id: string | null, isBulk: boolean}>({ show: false, id: null, isBulk: false });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [options, setOptions] = useState<{
    issueTypes: SettingItem[];
    priorities: SettingItem[];
    statuses: SettingItem[];
    assignedPersons: SettingItem[];
  }>({
    issueTypes: [],
    priorities: [],
    statuses: [],
    assignedPersons: [],
  });

  useEffect(() => {
    loadIssues();
    loadOptions();
  }, []);

  const loadOptions = async () => {
    const [it, pr, st, ap] = await Promise.all([
      dbService.getSettingsByCategory('issue_type'),
      dbService.getSettingsByCategory('priority'),
      dbService.getSettingsByCategory('status'),
      dbService.getSettingsByCategory('assigned_person'),
    ]);
    setOptions({
      issueTypes: it,
      priorities: pr,
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
          priority: row['Priority'] || row['priority'] || 'Medium',
          status: row['Status'] || row['status'] || 'Open',
          assigned_person: row['Assigned To'] || row['assigned_person'] || 'Unassigned',
          issue_details: row['Issue Details'] || row['issue_details'] || '',
          issue_date: parseDate(row['Issue Date'] || row['issue_date']),
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
        'Priority': 'High',
        'Status': 'Open',
        'Assigned To': 'Fuad',
        'Issue Details': 'This is a sample bug description',
        'Issue Date': formattedDate
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

    return matchesSearch && matchesFromDate && matchesToDate && matchesMonth;
  });

  const totalPages = Math.ceil(filteredIssues.length / itemsPerPage);
  const currentIssues = filteredIssues.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const exportCSV = () => {
    const headers = ['ID', 'Client', 'Type', 'Priority', 'Status', 'Assigned', 'Issue Date', 'Created At'];
    const rows = filteredIssues.map(i => [
      i.id, i.client_name, i.issue_type, i.priority, i.status, i.assigned_person, i.issue_date || new Date(i.created_at).toLocaleDateString(), new Date(i.created_at).toLocaleDateString()
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "issue_report.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Filters Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text"
            placeholder="Search by client or details..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white text-sm"
          />
        </div>
        
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-400 uppercase">Month:</span>
            <input 
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center gap-2 border-l border-slate-200 dark:border-slate-800 pl-2">
            <input 
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <span className="text-slate-400">to</span>
            <input 
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {(search || selectedMonth || fromDate || toDate) && (
            <button 
              onClick={clearFilters}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-xl text-sm font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-all flex items-center gap-2 animate-in fade-in zoom-in-95 duration-200"
            >
              <X size={16} />
              Clear
            </button>
          )}
          
          <div className="flex items-center gap-2 border-l border-slate-200 dark:border-slate-800 pl-2">
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileUpload} 
              accept=".xlsx, .xls, .csv" 
              className="hidden" 
            />
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
              title="Upload Excel"
            >
              <Upload size={18} />
            </button>
            <button 
              onClick={downloadSample}
              className="p-2 text-slate-500 hover:text-emerald-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
              title="Download Sample"
            >
              <FileSpreadsheet size={18} />
            </button>
            <button 
              onClick={exportCSV}
              className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
              title="Export CSV"
            >
              <Download size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedIds.length > 0 && (
        <div className="flex items-center justify-between p-4 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 rounded-2xl animate-in slide-in-from-top-2">
          <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">{selectedIds.length} items selected</span>
          <button 
            onClick={handleDeleteSelected}
            className="flex items-center gap-2 px-4 py-2 bg-rose-600 text-white rounded-xl text-sm font-bold shadow-lg hover:bg-rose-700 transition-all"
          >
            <Trash2 size={16} />
            Delete Selected
          </button>
        </div>
      )}

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                <th className="px-6 py-4 w-10">
                  <button onClick={toggleSelectAll} className="text-slate-400 hover:text-indigo-600">
                    {selectedIds.length === currentIssues.length && currentIssues.length > 0 ? <CheckSquare size={18} /> : <Square size={18} />}
                  </button>
                </th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Client</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Type</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Priority</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Assigned</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Issue Date</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {currentIssues.length > 0 ? currentIssues.map(issue => (
                <tr key={issue.id} className={`hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors ${selectedIds.includes(issue.id) ? 'bg-indigo-50/30 dark:bg-indigo-900/10' : ''}`}>
                  <td className="px-6 py-4">
                    <button onClick={() => toggleSelect(issue.id)} className={selectedIds.includes(issue.id) ? 'text-indigo-600' : 'text-slate-300'}>
                      {selectedIds.includes(issue.id) ? <CheckSquare size={18} /> : <Square size={18} />}
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-semibold text-slate-900 dark:text-white text-sm">{issue.client_name}</div>
                    <div className="text-xs text-slate-400 truncate max-w-[200px]">{issue.issue_details}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-md font-medium">
                      {issue.issue_type}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-[10px] px-2 py-1 rounded-full font-bold uppercase border ${(PRIORITY_COLORS as any)[issue.priority] || 'bg-slate-100'}`}>
                      {issue.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-xs font-semibold ${((STATUS_COLORS as any)[issue.status] || 'text-slate-600').split(' ')[1]}`}>
                      {issue.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-slate-600 dark:text-slate-400">{issue.assigned_person}</td>
                  <td className="px-6 py-4 text-sm font-medium text-slate-600 dark:text-slate-400">{issue.issue_date || new Date(issue.created_at).toLocaleDateString()}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => setEditingIssue(issue)}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-all"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        onClick={() => handleDelete(issue.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-all"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    No issues found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination & Rows per page */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/30 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-500">Showing {(currentPage-1)*itemsPerPage+1} to {Math.min(currentPage*itemsPerPage, filteredIssues.length)} of {filteredIssues.length} issues</span>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-bold uppercase">Rows:</span>
              <select 
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="bg-transparent text-sm font-bold text-slate-600 dark:text-slate-400 outline-none cursor-pointer"
              >
                {[10, 20, 50, 100, 500, 1000].map(v => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>
          </div>
          
          {totalPages > 1 && (
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 border border-slate-200 dark:border-slate-700 rounded-lg disabled:opacity-30 dark:text-white"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-sm font-bold px-2 dark:text-white">{currentPage} / {totalPages}</span>
              <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 border border-slate-200 dark:border-slate-700 rounded-lg disabled:opacity-30 dark:text-white"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {editingIssue && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-bold text-xl dark:text-white">Edit Issue</h3>
              <button onClick={() => setEditingIssue(null)} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleUpdate} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase">Client Name</label>
                  <input 
                    type="text"
                    value={editingIssue.client_name}
                    onChange={(e) => setEditingIssue({...editingIssue, client_name: e.target.value})}
                    className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase">Type</label>
                  <select 
                    value={editingIssue.issue_type}
                    onChange={(e) => setEditingIssue({...editingIssue, issue_type: e.target.value})}
                    className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
                  >
                    {options.issueTypes.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase">Priority</label>
                  <select 
                    value={editingIssue.priority}
                    onChange={(e) => setEditingIssue({...editingIssue, priority: e.target.value})}
                    className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
                  >
                    {options.priorities.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase">Status</label>
                  <select 
                    value={editingIssue.status}
                    onChange={(e) => setEditingIssue({...editingIssue, status: e.target.value})}
                    className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
                  >
                    {options.statuses.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase">Issue Date</label>
                  <input 
                    type="date"
                    value={editingIssue.issue_date || ''}
                    onChange={(e) => setEditingIssue({...editingIssue, issue_date: e.target.value})}
                    className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase">Details</label>
                <textarea 
                  rows={4}
                  value={editingIssue.issue_details}
                  onChange={(e) => setEditingIssue({...editingIssue, issue_details: e.target.value})}
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white resize-none"
                />
              </div>
              <div className="flex gap-3 mt-6">
                <button type="button" onClick={() => setEditingIssue(null)} className="flex-1 px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-3 gradient-bg text-white font-bold rounded-xl shadow-lg hover:opacity-90 transition-opacity">Update Issue</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm.show && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-200">
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-full flex items-center justify-center mx-auto mb-6">
                <Trash2 size={32} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Confirm Deletion</h3>
              <p className="text-slate-500 dark:text-slate-400">
                {showDeleteConfirm.isBulk 
                  ? `Are you sure you want to delete ${selectedIds.length} selected issues? This action cannot be undone.`
                  : 'Are you sure you want to delete this issue? This action cannot be undone.'}
              </p>
              <div className="flex gap-3 mt-8">
                <button 
                  onClick={() => setShowDeleteConfirm({ show: false, id: null, isBulk: false })}
                  className="flex-1 px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={confirmDelete}
                  className="flex-1 px-4 py-3 bg-rose-600 text-white font-bold rounded-xl shadow-lg hover:bg-rose-700 transition-colors"
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
