
import React, { useState, useEffect } from 'react';
import { dbService } from '../services/dbService';
import { SettingItem } from '../types';
import { Clock, Activity } from 'lucide-react';

const DowntimeEntry: React.FC = () => {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    system_name: '',
    start_time: '09:00',
    end_time: '10:00',
    duration_minutes: 60,
  });

  const [systemOptions, setSystemOptions] = useState<SettingItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    loadOptions();
  }, []);

  const loadOptions = async () => {
    const systems = await dbService.getSettingsByCategory('system_name');
    setSystemOptions(systems);
    if (systems.length > 0) {
      setFormData(prev => ({ ...prev, system_name: systems[0].name }));
    }
  };

  useEffect(() => {
    const start = new Date(`${formData.date}T${formData.start_time}`);
    const end = new Date(`${formData.date}T${formData.end_time}`);
    let diff = (end.getTime() - start.getTime()) / (1000 * 60);
    if (diff < 0) diff += 1440; // Handles overnight downtime
    setFormData(prev => ({ ...prev, duration_minutes: Math.round(diff) }));
  }, [formData.start_time, formData.end_time, formData.date]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.system_name) return;
    setIsLoading(true);
    try {
      await dbService.saveDowntime(formData);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto animate-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
        <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold dark:text-white">Log Downtime</h2>
            <p className="text-slate-500 text-sm mt-1">Record service interruptions for analysis.</p>
          </div>
          <div className="w-12 h-12 bg-rose-50 dark:bg-rose-900/20 text-rose-600 rounded-2xl flex items-center justify-center">
            <Activity size={24} />
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {success && <div className="p-4 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100 text-sm">Downtime entry recorded!</div>}

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Incident Date</label>
              <input 
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({...formData, date: e.target.value})}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl dark:text-white"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Impacted System</label>
              <select 
                value={formData.system_name}
                onChange={(e) => setFormData({...formData, system_name: e.target.value})}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl dark:text-white"
              >
                {systemOptions.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Start Time</label>
                <input 
                  type="time"
                  value={formData.start_time}
                  onChange={(e) => setFormData({...formData, start_time: e.target.value})}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl dark:text-white"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">End Time</label>
                <input 
                  type="time"
                  value={formData.end_time}
                  onChange={(e) => setFormData({...formData, end_time: e.target.value})}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl dark:text-white"
                />
              </div>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <span className="text-sm font-medium text-slate-500">Calculated Duration</span>
              <span className="text-lg font-bold text-rose-600">{formData.duration_minutes} minutes</span>
            </div>
          </div>

          <button 
            type="submit"
            disabled={isLoading || !formData.system_name}
            className="w-full py-4 bg-rose-600 text-white font-bold rounded-xl shadow-lg hover:bg-rose-700 transition-colors flex items-center justify-center gap-2"
          >
            {isLoading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Log Incident'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default DowntimeEntry;
