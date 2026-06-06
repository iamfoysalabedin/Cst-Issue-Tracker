
import React, { useState, useEffect } from 'react';
import { dbService } from '../services/dbService';
import { SettingItem } from '../types';
import { CheckCircle, AlertCircle } from 'lucide-react';

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

const IssueEntry: React.FC = () => {
  const [formData, setFormData] = useState({
    client_name: '',
    issue_type: '',
    category: '',
    priority: '',
    status: 'Open',
    assigned_person: '',
    issue_details: '',
    issue_date: new Date().toISOString().split('T')[0],
    response_time: '',
    resolution_time: '',
    client_reporting_time: '',
  });

  const getCurrentTime12h = () => {
    const now = new Date();
    let hours = now.getHours();
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // supports 12 instead of 0
    const formattedHours = String(hours).padStart(2, '0');
    return `${formattedHours}:${minutes} ${ampm}`;
  };

  const [options, setOptions] = useState<{
    issueTypes: SettingItem[];
    categories: SettingItem[];
    priorities: SettingItem[];
    statuses: SettingItem[];
    assignedPersons: SettingItem[];
  }>({
    issueTypes: [],
    categories: [],
    priorities: [],
    statuses: [],
    assignedPersons: [],
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [useLiveTime, setUseLiveTime] = useState(true);
  const [manualDate, setManualDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [manualTime, setManualTime] = useState(() => {
    const d = new Date();
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  });

  const formatDate12h = (dateTimeStr: string) => {
    if (!dateTimeStr) return '';
    const dateObj = new Date(dateTimeStr);
    if (isNaN(dateObj.getTime())) return dateTimeStr;

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

    return `${day}-${month}-${year} ${formattedHours}:${minutes} ${ampm}`;
  };

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    const setSelectedDateAndTimeToFormData = (dateObj: Date) => {
      const year = dateObj.getFullYear();
      const month = String(dateObj.getMonth() + 1).padStart(2, '0');
      const day = String(dateObj.getDate()).padStart(2, '0');
      const hours = String(dateObj.getHours()).padStart(2, '0');
      const minutes = String(dateObj.getMinutes()).padStart(2, '0');
      const seconds = String(dateObj.getSeconds()).padStart(2, '0');
      
      const formattedDateTime = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
      setFormData(prev => ({
        ...prev,
        issue_date: formattedDateTime
      }));
    };

    const updateFormDataFromManual = (dateStr: string, timeStr: string) => {
      if (!dateStr || !timeStr) return;
      const formattedDateTime = `${dateStr}T${timeStr}:00`;
      setFormData(prev => ({
        ...prev,
        issue_date: formattedDateTime
      }));
    };

    if (useLiveTime) {
      setSelectedDateAndTimeToFormData(new Date());

      interval = setInterval(() => {
        setSelectedDateAndTimeToFormData(new Date());
      }, 1000);
    } else {
      updateFormDataFromManual(manualDate, manualTime);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [useLiveTime, manualDate, manualTime]);

  useEffect(() => {
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
      categories: cat,
      priorities: pr,
      statuses: st,
      assignedPersons: ap,
    });
    // Set initial defaults
    setFormData(prev => ({
      ...prev,
      issue_type: '',
      category: cat[0]?.name || '',
      priority: pr[0]?.name || '',
      status: st[0]?.name || 'Open',
      assigned_person: ap[0]?.name || '',
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(false);

    // Simple validation
    if (!formData.client_name || !formData.issue_details || !formData.issue_type || !formData.category || !formData.priority || !formData.assigned_person || !formData.issue_date) {
      setError('Please fill in all required fields.');
      setIsLoading(false);
      return;
    }

    try {
      // 1. Save to Supabase
      let supabaseSuccess = false;
      try {
        let finalCreatedAt = formData.issue_date;
        if (formData.issue_date) {
          const parsedDate = new Date(formData.issue_date);
          if (!isNaN(parsedDate.getTime())) {
            finalCreatedAt = parsedDate.toISOString();
          }
        }

        await dbService.saveIssue({
          ...formData,
          created_at: finalCreatedAt
        });
        supabaseSuccess = true;
      } catch (sbError: any) {
        console.error('Supabase Save Error:', sbError);
        setError(`Supabase Error: ${sbError.message || 'Failed to save to database'}`);
        setIsLoading(false);
        return; // Stop if Supabase fails
      }

      // 2. Save to Google Sheets directly from frontend
      if (supabaseSuccess) {
        try {
          // UPDATE THIS URL AFTER NEW DEPLOYMENT
          const googleSheetUrl = 'https://script.google.com/macros/s/AKfycbxqevYmFg3mzpHh8yUbR5yr-OB22ha4QEUbsVvN6caAVt4spoST9dLyoRq7KlZt7KZN/exec';
          
          await fetch(googleSheetUrl, {
            method: 'POST',
            mode: 'no-cors', // Google Apps Script requires no-cors or handles it via redirect
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData),
          });
          
          console.log('Google Sheets sync triggered');
        } catch (gsError) {
          console.error('Google Sheets Sync Error:', gsError);
        }
      }

      setSuccess(true);
      setFormData(prev => ({
        ...prev,
        client_name: '',
        issue_details: '',
        response_time: '',
        resolution_time: '',
        client_reporting_time: '',
      }));
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(`Error: ${err.message || 'An unexpected error occurred'}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto animate-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-lg overflow-hidden">
        <div className="gradient-bg p-5 text-white">
          <h2 className="text-lg font-bold">New Issue Report</h2>
          <p className="opacity-80 text-[11px] mt-0.5">Submit a detailed report to help our team investigate.</p>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 rounded-lg border border-rose-100 dark:border-rose-800 text-[11px]">
              <AlertCircle size={14} />
              {error}
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2 p-3 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-lg border border-emerald-100 dark:border-emerald-800 text-[11px]">
              <CheckCircle size={14} />
              Issue submitted successfully!
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Client Name *</label>
              <input 
                type="text"
                value={formData.client_name}
                onChange={(e) => setFormData({...formData, client_name: e.target.value})}
                placeholder="e.g. Acme Corp"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Issue Type *</label>
              <select 
                value={formData.issue_type}
                onChange={(e) => setFormData({...formData, issue_type: e.target.value})}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white text-xs"
              >
                <option value="">Select Type</option>
                <option value="System Bugs">System Bugs</option>
                <option value="Device Issues">Device Issues</option>
                <option value="Awareness">Awareness</option>
                <option value="Help Requests">Help Requests</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Category *</label>
              <select 
                value={formData.category}
                onChange={(e) => setFormData({...formData, category: e.target.value})}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white text-xs"
              >
                <option value="">Select Category</option>
                {options.categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Priority *</label>
              <select 
                value={formData.priority}
                onChange={(e) => setFormData({...formData, priority: e.target.value})}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white text-xs"
              >
                {options.priorities.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
              </select>
            </div>

            <div className="space-y-1.5 md:col-span-2 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200/60 dark:border-slate-700/50">
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Ticket Create Time *
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500">
                    {useLiveTime ? 'Live System Time' : 'Manual Entry'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setUseLiveTime(!useLiveTime)}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${useLiveTime ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'}`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${useLiveTime ? 'translate-x-4' : 'translate-x-0'}`}
                    />
                  </button>
                </div>
              </div>

              {useLiveTime ? (
                <div className="flex items-center justify-between bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2 px-3 shadow-inner">
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    <span className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200">
                      {formatDate12h(formData.issue_date)}
                    </span>
                  </div>
                  <span className="text-[9px] font-bold uppercase py-0.5 px-1.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-800/40 rounded-md">
                    Running
                  </span>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <input 
                      type="date"
                      value={manualDate}
                      onChange={(e) => {
                        setManualDate(e.target.value);
                      }}
                      className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white text-xs font-medium"
                    />
                    <input 
                      type="time"
                      value={manualTime}
                      onChange={(e) => {
                        setManualTime(e.target.value);
                      }}
                      className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white text-xs font-medium"
                    />
                  </div>
                  <div className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/30 p-1.5 px-2.5 rounded-md border border-indigo-100/50 dark:border-indigo-900/30 font-mono">
                    Selected (12h format): {formatDate12h(formData.issue_date)}
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Assigned To *</label>
              <select 
                value={formData.assigned_person}
                onChange={(e) => setFormData({...formData, assigned_person: e.target.value})}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white text-xs"
              >
                {options.assignedPersons.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status *</label>
              <select 
                value={formData.status}
                onChange={(e) => setFormData({...formData, status: e.target.value})}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white text-xs"
              >
                {options.statuses.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
              </select>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Client Reporting Time</label>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, client_reporting_time: getCurrentTime12h() }))}
                  className="text-[10px] text-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 font-bold transition-colors"
                >
                  Set Now
                </button>
              </div>
              <input 
                type="time"
                value={convert12hTo24h(formData.client_reporting_time)}
                onChange={(e) => setFormData({...formData, client_reporting_time: convert24hTo12h(e.target.value)})}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Response Time</label>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, response_time: getCurrentTime12h() }))}
                  className="text-[10px] text-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 font-bold transition-colors"
                >
                  Set Now
                </button>
              </div>
              <input 
                type="time"
                value={convert12hTo24h(formData.response_time)}
                onChange={(e) => setFormData({...formData, response_time: convert24hTo12h(e.target.value)})}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Resolution Time</label>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, resolution_time: getCurrentTime12h() }))}
                  className="text-[10px] text-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 font-bold transition-colors"
                >
                  Set Now
                </button>
              </div>
              <input 
                type="time"
                value={convert12hTo24h(formData.resolution_time)}
                onChange={(e) => setFormData({...formData, resolution_time: convert24hTo12h(e.target.value)})}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white text-xs"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Issue Details *</label>
            <textarea 
              rows={3}
              value={formData.issue_details}
              onChange={(e) => setFormData({...formData, issue_details: e.target.value})}
              placeholder="Provide a thorough description of the issue..."
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white resize-none text-xs"
            />
          </div>

          <button 
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 gradient-bg text-white font-bold rounded-lg shadow-md hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-xs"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : 'Submit Issue Report'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default IssueEntry;
