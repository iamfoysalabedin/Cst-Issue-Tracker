
import React, { useState, useEffect } from 'react';
import { dbService } from '../services/dbService';
import { SettingItem } from '../types';
import { CheckCircle, AlertCircle } from 'lucide-react';

const IssueEntry: React.FC = () => {
  const [formData, setFormData] = useState({
    client_name: '',
    issue_type: '',
    priority: '',
    status: 'Open',
    assigned_person: '',
    issue_details: '',
    issue_date: new Date().toISOString().split('T')[0],
  });

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

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
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
    // Set initial defaults
    setFormData(prev => ({
      ...prev,
      issue_type: '',
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
    if (!formData.client_name || !formData.issue_details || !formData.issue_type || !formData.priority || !formData.assigned_person || !formData.issue_date) {
      setError('Please fill in all required fields.');
      setIsLoading(false);
      return;
    }

    try {
      // 1. Save to Supabase
      let supabaseSuccess = false;
      try {
        await dbService.saveIssue(formData);
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
          const googleSheetUrl = 'https://script.google.com/macros/s/AKfycbxCB_bSRrMg70OaBJpM--XOPqZayWzwQtJ8gh1tZOscmqwXSmrdJ8YQwwvYXSExAksz/exec';
          
          // Using no-cors mode for Google Apps Script if needed, but standard fetch usually works for doPost
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
              <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Priority *</label>
              <select 
                value={formData.priority}
                onChange={(e) => setFormData({...formData, priority: e.target.value})}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white text-xs"
              >
                {options.priorities.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Issue Date *</label>
              <input 
                type="date"
                value={formData.issue_date}
                onChange={(e) => setFormData({...formData, issue_date: e.target.value})}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white text-xs"
              />
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
