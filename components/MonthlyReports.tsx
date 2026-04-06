
import React, { useState, useEffect } from 'react';
import { dbService } from '../services/dbService';
import { MonthlyEntry } from '../types';
import { Trash2, TrendingUp, TrendingDown, Minus } from 'lucide-react';

const MonthlyReports: React.FC = () => {
  const [entries, setEntries] = useState<MonthlyEntry[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<{show: boolean, id: string | null}>({ show: false, id: null });

  useEffect(() => {
    loadEntries();
  }, []);

  const loadEntries = async () => {
    const data = await dbService.getMonthlyEntries();
    setEntries(data.sort((a, b) => b.month.localeCompare(a.month)));
  };

  const handleDelete = (id: string) => {
    setShowDeleteConfirm({ show: true, id });
  };

  const confirmDelete = async () => {
    if (showDeleteConfirm.id) {
      await dbService.deleteMonthlyEntry(showDeleteConfirm.id);
      setShowDeleteConfirm({ show: false, id: null });
      loadEntries();
    }
  };

  const getComparison = (index: number, key: keyof MonthlyEntry) => {
    if (index >= entries.length - 1) return null;
    const current = entries[index][key] as number;
    const prev = entries[index + 1][key] as number;
    if (current > prev) return <TrendingUp size={14} className="text-rose-500" />;
    if (current < prev) return <TrendingDown size={14} className="text-emerald-500" />;
    return <Minus size={14} className="text-slate-400" />;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {entries.slice(0, 4).map(e => (
          <div key={e.id} className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">
              {new Date(e.month + '-01').toLocaleString('default', { month: 'long', year: 'numeric' })}
            </h4>
            <div className="grid grid-cols-2 gap-y-4">
              <div>
                <p className="text-xs text-slate-500">Total Issues</p>
                <p className="text-xl font-bold dark:text-white">{e.total_issues}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Bugs</p>
                <p className="text-xl font-bold dark:text-white">{e.system_bugs}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Device</p>
                <p className="text-xl font-bold dark:text-white">{e.device_issues}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Help Req</p>
                <p className="text-xl font-bold dark:text-white">{e.help_requests}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-200 dark:border-slate-800">
          <h3 className="font-bold text-slate-900 dark:text-white">Historical Monthly Data</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Month</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Total Issues</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">System Bugs</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Device</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Awareness</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Help</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {entries.map((e, idx) => (
                <tr key={e.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                  <td className="px-6 py-4 font-semibold text-sm dark:text-white">
                    {new Date(e.month + '-01').toLocaleString('default', { month: 'long', year: 'numeric' })}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm dark:text-slate-300 font-medium">{e.total_issues}</span>
                      {getComparison(idx, 'total_issues')}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">{e.system_bugs}</td>
                  <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">{e.device_issues}</td>
                  <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">{e.awareness}</td>
                  <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">{e.help_requests}</td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => handleDelete(e.id)}
                      className="text-slate-400 hover:text-rose-500 transition-colors p-2"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm.show && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-200">
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-full flex items-center justify-center mx-auto mb-6">
                <Trash2 size={32} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Delete Entry</h3>
              <p className="text-slate-500 dark:text-slate-400">
                Are you sure you want to delete this monthly report entry? This action cannot be undone.
              </p>
              <div className="flex gap-3 mt-8">
                <button 
                  onClick={() => setShowDeleteConfirm({ show: false, id: null })}
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

export default MonthlyReports;
