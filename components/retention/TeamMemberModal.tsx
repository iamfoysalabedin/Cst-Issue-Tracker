import React, { useState, useEffect } from 'react';
import { X, UserPlus, Mail, Phone, Target, ShieldCheck } from 'lucide-react';
import { TeamSpecialist } from '../../types/retention';
import { retentionService } from '../../services/retentionService';

interface TeamMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  specialistToEdit?: TeamSpecialist | null;
}

export const TeamMemberModal: React.FC<TeamMemberModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  specialistToEdit,
}) => {
  const [name, setName] = useState('');
  const [role, setRole] = useState('Retention Specialist');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [quota, setQuota] = useState('10');
  const [status, setStatus] = useState<'Active' | 'On Leave'>('Active');
  const [avatarColor, setAvatarColor] = useState('#4f46e5');

  useEffect(() => {
    if (specialistToEdit) {
      setName(specialistToEdit.name);
      setRole(specialistToEdit.role);
      setEmail(specialistToEdit.email);
      setPhone(specialistToEdit.phone);
      setQuota(String(specialistToEdit.quota_capacity));
      setStatus(specialistToEdit.status);
      setAvatarColor(specialistToEdit.avatar_color);
    } else {
      setName('');
      setRole('Retention Specialist');
      setEmail('');
      setPhone('');
      setQuota('10');
      setStatus('Active');
      setAvatarColor('#4f46e5');
    }
  }, [specialistToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Name is required');
      return;
    }

    retentionService.saveSpecialist({
      id: specialistToEdit?.id,
      name: name.trim(),
      role: role.trim(),
      email: email.trim(),
      phone: phone.trim(),
      quota_capacity: Number(quota) || 10,
      status: status,
      avatar_color: avatarColor,
    });

    onSuccess();
    onClose();
  };

  const presetColors = ['#4f46e5', '#059669', '#9333ea', '#d97706', '#0284c7', '#e11d48', '#0d9488'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-lg overflow-hidden my-6">
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600 rounded-lg text-white">
              <UserPlus size={20} />
            </div>
            <div>
              <h3 className="font-bold text-base">
                {specialistToEdit ? 'Edit Specialist Profile & Quota' : 'Add Team Member'}
              </h3>
              <p className="text-xs text-slate-300">Retention specialist profile and target workload capacity</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
              Full Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Fuad Hasan"
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-hidden text-slate-900 dark:text-white font-medium"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Designation / Role *
              </label>
              <input
                type="text"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="e.g. Senior Specialist"
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-hidden text-slate-900 dark:text-white"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Target Account Quota *
              </label>
              <div className="relative">
                <Target size={15} className="absolute left-3 top-3 text-slate-400" />
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={quota}
                  onChange={(e) => setQuota(e.target.value)}
                  placeholder="10"
                  className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-hidden text-slate-900 dark:text-white font-bold"
                  required
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail size={15} className="absolute left-3 top-3 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="fuad@inovace.com"
                  className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-hidden text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Phone Number
              </label>
              <div className="relative">
                <Phone size={15} className="absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+880 1711-..."
                  className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-hidden text-slate-900 dark:text-white"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Work Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-hidden text-slate-900 dark:text-white"
              >
                <option value="Active" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Active</option>
                <option value="On Leave" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">On Leave</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Color Tag
              </label>
              <div className="flex items-center gap-2 pt-1">
                {presetColors.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setAvatarColor(color)}
                    className={`w-6 h-6 rounded-full transition-transform ${
                      avatarColor === color ? 'scale-125 ring-2 ring-indigo-500' : 'opacity-80 hover:opacity-100'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
            >
              <ShieldCheck size={16} />
              {specialistToEdit ? 'Save Changes' : 'Create Specialist'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
