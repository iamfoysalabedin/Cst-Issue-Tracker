
import React, { useState } from 'react';
import { dbService } from '../services/dbService';
import { CheckCircle, AlertCircle } from 'lucide-react';

const MonthlyEntry: React.FC = () => {
  const [formData, setFormData] = useState({
    month: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`,
    total_issues: 0,
    system_bugs: 0,
    device_issues: 0,
    awareness: 0,
    help_requests: 0,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      await dbService.saveMonthlyEntry(formData);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError('Failed to save entry.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto animate-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
        <div className="p-8 bg-gradient-to-r from-indigo-50/80 to-purple-50/80 dark:from-slate-800/80 dark:to-slate-900 border-b border-slate-200 dark:border-slate-800">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Monthly Aggregate Entry</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Record summarized metrics for official monthly reporting.</p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {error && <div className="p-4 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 rounded-xl border border-rose-200 dark:border-rose-900/60 text-sm">{error}</div>}
          {success && <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-xl border border-emerald-200 dark:border-emerald-900/60 text-sm">Monthly data saved!</div>}

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Target Month</label>
              <input 
                type="month"
                value={formData.month}
                onChange={(e) => setFormData({...formData, month: e.target.value})}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Total Issues', key: 'total_issues' },
                { label: 'System Bugs', key: 'system_bugs' },
                { label: 'Device Issues', key: 'device_issues' },
                { label: 'Awareness', key: 'awareness' },
                { label: 'Help Requests', key: 'help_requests' },
              ].map(field => (
                <div key={field.key} className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">{field.label}</label>
                  <input 
                    type="number"
                    value={formData[field.key as keyof typeof formData]}
                    onChange={(e) => setFormData({...formData, [field.key]: parseInt(e.target.value) || 0})}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden text-sm"
                  />
                </div>
              ))}
            </div>
          </div>

          <button 
            type="submit"
            className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/20 transition-all cursor-pointer"
          >
            Save Monthly Summary
          </button>
        </form>
      </div>
    </div>
  );
};

export default MonthlyEntry;
