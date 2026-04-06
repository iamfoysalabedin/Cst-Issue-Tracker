
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
        <div className="bg-slate-900 p-8 text-white border-b border-slate-800">
          <h2 className="text-2xl font-bold">Monthly Aggregate Entry</h2>
          <p className="opacity-60 text-sm mt-1">Record summarized metrics for official monthly reporting.</p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {error && <div className="p-4 bg-rose-50 text-rose-600 rounded-xl border border-rose-100 text-sm">{error}</div>}
          {success && <div className="p-4 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100 text-sm">Monthly data saved!</div>}

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Target Month</label>
              <input 
                type="month"
                value={formData.month}
                onChange={(e) => setFormData({...formData, month: e.target.value})}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl dark:text-white"
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
                    // Fix: Corrected the typo 'key4' to 'keyof typeof formData' for proper type-safe indexing
                    value={formData[field.key as keyof typeof formData]}
                    onChange={(e) => setFormData({...formData, [field.key]: parseInt(e.target.value) || 0})}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl dark:text-white"
                  />
                </div>
              ))}
            </div>
          </div>

          <button 
            type="submit"
            className="w-full py-4 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-bold rounded-xl shadow-lg hover:opacity-90 transition-opacity"
          >
            Save Monthly Summary
          </button>
        </form>
      </div>
    </div>
  );
};

export default MonthlyEntry;
