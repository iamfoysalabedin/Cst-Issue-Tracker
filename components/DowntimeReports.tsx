
import React, { useState, useEffect } from 'react';
import { dbService } from '../services/dbService';
import { SystemDowntime } from '../types';
import { SYSTEMS } from '../constants';
import { Trash2, AlertTriangle, Calendar, Filter } from 'lucide-react';

const DowntimeReports: React.FC = () => {
  const [data, setData] = useState<SystemDowntime[]>([]);
  const [systemFilter, setSystemFilter] = useState('All');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<{show: boolean, id: string | null}>({ show: false, id: null });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const records = await dbService.getDowntime();
    setData(records.sort((a, b) => b.date.localeCompare(a.date)));
  };

  const handleDelete = (id: string) => {
    setShowDeleteConfirm({ show: true, id });
  };

  const confirmDelete = async () => {
    if (showDeleteConfirm.id) {
      await dbService.deleteDowntime(showDeleteConfirm.id);
      setShowDeleteConfirm({ show: false, id: null });
      loadData();
    }
  };

  const filteredData = data.filter(d => {
    const matchesSystem = systemFilter === 'All' || d.system_name === systemFilter;
    const matchesFrom = fromDate ? d.date >= fromDate : true;
    const matchesTo = toDate ? d.date <= toDate : true;
    return matchesSystem && matchesFrom && matchesTo;
  });

  const totalDowntime = filteredData.reduce((acc, curr) => acc + curr.duration_minutes, 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Metrics Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase mb-1">Total Downtime</p>
          <div className="flex items-end gap-2">
            <h3 className="text-3xl font-bold text-rose-600">{totalDowntime}</h3>
            <span className="text-sm font-medium text-slate-500 mb-1">Minutes</span>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase mb-1">Total Incidents</p>
          <h3 className="text-3xl font-bold dark:text-white">{filteredData.length}</h3>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase mb-1">Average Duration</p>
          <h3 className="text-3xl font-bold dark:text-white">
            {filteredData.length > 0 ? (totalDowntime / filteredData.length).toFixed(1) : 0} <span className="text-sm font-medium text-slate-500">m</span>
          </h3>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          <Filter size={16} className="text-slate-400" />
          <select 
            value={systemFilter}
            onChange={(e) => setSystemFilter(e.target.value)}
            className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm dark:text-white outline-none focus:ring-2 focus:ring-rose-500"
          >
            <option value="All">All Systems</option>
            {SYSTEMS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <Calendar size={16} className="text-slate-400" />
          <input 
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm dark:text-white"
          />
          <span className="text-slate-400">to</span>
          <input 
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm dark:text-white"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Date</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">System</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Start Time</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">End Time</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Duration</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {filteredData.length > 0 ? filteredData.map(d => (
                <tr key={d.id} className="hover:bg-rose-50/10 dark:hover:bg-rose-900/5 transition-colors">
                  <td className="px-6 py-4 text-sm font-semibold dark:text-white">{new Date(d.date).toLocaleDateString(undefined, { dateStyle: 'medium' })}</td>
                  <td className="px-6 py-4">
                    <span className="text-xs px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-md font-bold">
                      {d.system_name}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">{d.start_time}</td>
                  <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">{d.end_time}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-rose-600">{d.duration_minutes} min</span>
                      {d.duration_minutes > 120 && <AlertTriangle size={14} className="text-rose-500" />}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => handleDelete(d.id)}
                      className="p-2 text-slate-400 hover:text-rose-600 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">No downtime incidents recorded for this period.</td>
                </tr>
              )}
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
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Delete Record</h3>
              <p className="text-slate-500 dark:text-slate-400">
                Are you sure you want to delete this downtime record? This action cannot be undone.
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

export default DowntimeReports;
