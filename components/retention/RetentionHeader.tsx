import React from 'react';
import { 
  Download, 
  PhoneCall, 
  PlusCircle,
  HeartHandshake
} from 'lucide-react';
import { retentionService } from '../../services/retentionService';

interface RetentionHeaderProps {
  onOpenLogCall?: () => void;
  onOpenAddCustomer?: () => void;
}

export const RetentionHeader: React.FC<RetentionHeaderProps> = ({
  onOpenLogCall,
  onOpenAddCustomer,
}) => {
  const handleExport = () => {
    retentionService.exportFullRetentionReport();
  };

  return (
    <div className="mb-6">
      {/* Title & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-sm bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 font-mono text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
              <HeartHandshake size={12} /> Retention
            </span>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              Customer Retention & Relationship Management
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Customer portfolio health, churn prevention, monthly follow-ups, and workload balancing
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleExport}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors shadow-xs"
            title="Download full retention report in Excel"
          >
            <Download size={14} />
            Excel Export
          </button>

          {onOpenLogCall && (
            <button
              onClick={onOpenLogCall}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-600 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/80 transition-colors shadow-xs"
            >
              <PhoneCall size={14} />
              Log Call
            </button>
          )}

          {onOpenAddCustomer && (
            <button
              onClick={onOpenAddCustomer}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition-colors shadow-xs"
            >
              <PlusCircle size={14} />
              Add Customer
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
