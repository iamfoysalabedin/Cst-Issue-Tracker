import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  BadgeDollarSign, 
  PlusCircle 
} from 'lucide-react';

interface SalesHeaderProps {
  totalCount?: number;
}

export const SalesHeader: React.FC<SalesHeaderProps> = () => {
  const location = useLocation();
  const isAddSalesPage = location.pathname === '/sales/add';

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs p-5 mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Left Branding */}
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-emerald-600/20 shrink-0">
            <BadgeDollarSign size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                Sales Management
              </h1>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Track client orders, multi-product line items, SaaS packages, and revenue performance
            </p>
          </div>
        </div>

        {/* Action Button */}
        {!isAddSalesPage && (
          <div className="flex items-center gap-2">
            <NavLink
              to="/sales/add"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors"
            >
              <PlusCircle size={14} />
              <span>+ New Sale Entry</span>
            </NavLink>
          </div>
        )}
      </div>
    </div>
  );
};
