import React, { useState, useEffect } from 'react';
import { 
  Contact, 
  UserPlus, 
  Mail, 
  Phone, 
  Edit2, 
  Trash2, 
  CheckCircle, 
  AlertCircle, 
  Calendar, 
  Target, 
  DollarSign,
  Building2
} from 'lucide-react';
import { RetentionHeader } from './RetentionHeader';
import { TeamMemberModal } from './TeamMemberModal';
import { retentionService } from '../../services/retentionService';
import { TeamSpecialist, RetentionCustomer } from '../../types/retention';

export const TeamMembers: React.FC = () => {
  const [specialists, setSpecialists] = useState<TeamSpecialist[]>([]);
  const [customers, setCustomers] = useState<RetentionCustomer[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSpecialist, setEditingSpecialist] = useState<TeamSpecialist | null>(null);

  const loadData = () => {
    setSpecialists(retentionService.getSpecialists());
    setCustomers(retentionService.getCustomers());
  };

  useEffect(() => {
    loadData();
  }, []);

  const activeCustomers = customers.filter(c => c.health !== 'Churned');

  const handleEdit = (spec: TeamSpecialist) => {
    setEditingSpecialist(spec);
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setEditingSpecialist(null);
    setIsModalOpen(true);
  };

  const handleDelete = (spec: TeamSpecialist) => {
    const assigned = activeCustomers.filter(c => c.assigned_to_id === spec.id || c.assigned_to === spec.name);
    if (assigned.length > 0) {
      alert(`Cannot delete ${spec.name}. They currently have ${assigned.length} assigned customers. Please reassign their accounts first.`);
      return;
    }

    if (confirm(`Are you sure you want to remove team member ${spec.name}?`)) {
      retentionService.deleteSpecialist(spec.id);
      loadData();
    }
  };

  return (
    <div className="space-y-6">
      <RetentionHeader />

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Contact className="text-indigo-600" size={18} />
            Retention Team Directory & Capacity Quotas
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Manage specialist profiles, assigned portfolio accounts, capacity quotas, and active status.
          </p>
        </div>

        <button
          onClick={handleCreate}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-colors self-start sm:self-auto"
        >
          <UserPlus size={15} />
          Add Team Member
        </button>
      </div>

      {/* Directory Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {specialists.map((spec) => {
          const assigned = activeCustomers.filter(c => c.assigned_to_id === spec.id || c.assigned_to === spec.name);
          const assignedCount = assigned.length;
          const quota = spec.quota_capacity || 10;
          const utilPct = Math.round((assignedCount / quota) * 100);
          const totalMrr = assigned.reduce((acc, curr) => acc + curr.mrr, 0);

          let barColor = 'bg-indigo-600';
          if (utilPct > 100) barColor = 'bg-rose-500';
          else if (utilPct >= 80) barColor = 'bg-amber-500';

          return (
            <div 
              key={spec.id}
              className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs relative flex flex-col justify-between"
            >
              <div>
                {/* Specialist Profile Top */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-sm"
                      style={{ backgroundColor: spec.avatar_color }}
                    >
                      {spec.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-slate-900 dark:text-white leading-tight">
                        {spec.name}
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">{spec.role}</p>
                      <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        spec.status === 'Active' 
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' 
                          : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                      }`}>
                        ● {spec.status}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleEdit(spec)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      title="Edit Profile & Quota"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(spec)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      title="Remove Member"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Contact Information */}
                <div className="mt-4 space-y-1.5 text-xs text-slate-600 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800/80 pt-3">
                  <div className="flex items-center gap-2">
                    <Mail size={13} className="text-slate-400 shrink-0" />
                    <span className="truncate">{spec.email || 'No email provided'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone size={13} className="text-slate-400 shrink-0" />
                    <span>{spec.phone || 'No phone provided'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar size={13} className="text-slate-400 shrink-0" />
                    <span>Member since: {spec.joined_date}</span>
                  </div>
                </div>

                {/* Quota & Utilization Bar */}
                <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-slate-600 dark:text-slate-300">Account Quota Capacity</span>
                    <span className="text-slate-900 dark:text-white font-bold">
                      {assignedCount} / {quota} ({utilPct}%)
                    </span>
                  </div>

                  <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-300 ${barColor}`} 
                      style={{ width: `${Math.min(100, utilPct)}%` }} 
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-0.5">
                    <span>Handled MRR:</span>
                    <strong className="text-emerald-600 dark:text-emerald-400 font-semibold">
                      BDT {totalMrr.toLocaleString()} / mo
                    </strong>
                  </div>
                </div>
              </div>

              {/* Bottom Assigned Accounts Preview */}
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                  Assigned Key Accounts ({assignedCount})
                </span>
                <div className="flex items-center gap-1 flex-wrap">
                  {assigned.length === 0 ? (
                    <span className="text-xs text-slate-400 italic">No active accounts assigned yet.</span>
                  ) : (
                    assigned.slice(0, 4).map(c => (
                      <span 
                        key={c.id} 
                        className="text-[10px] px-2 py-0.5 rounded-sm bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium truncate max-w-[120px]"
                        title={c.name}
                      >
                        {c.name}
                      </span>
                    ))
                  )}
                  {assigned.length > 4 && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-sm bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold">
                      +{assigned.length - 4} more
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal */}
      <TeamMemberModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingSpecialist(null);
        }}
        onSuccess={loadData}
        specialistToEdit={editingSpecialist}
      />
    </div>
  );
};
