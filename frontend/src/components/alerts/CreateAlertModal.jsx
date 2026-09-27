import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Bell,
  Sparkles,
  MapPin,
  DollarSign,
  Briefcase,
  X,
  Sliders,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { alertApi } from '../../api/alertApi';
import { useUIStore } from '../../store/useUIStore';
import Button from '../common/Button';
import Input from '../common/Input';
import Badge from '../common/Badge';

const WORKPLACE_OPTIONS = [
  { id: '', label: 'Any Workplace' },
  { id: 'REMOTE', label: 'Remote Only' },
  { id: 'HYBRID', label: 'Hybrid' },
  { id: 'ONSITE', label: 'On-Site' },
];

const FREQUENCY_OPTIONS = [
  { id: 'DAILY', label: 'Daily Digest', desc: 'Summary of top matches once a day' },
  { id: 'WEEKLY', label: 'Weekly Digest', desc: 'Curated weekly rollup on Mondays' },
  { id: 'INSTANT', label: 'Instant Alert', desc: 'Notify immediately when matched' },
];

const MATCH_THRESHOLDS = [70, 75, 80, 85, 90];

const CreateAlertModal = ({ isOpen, onClose, initialData = null, onSuccess }) => {
  const queryClient = useQueryClient();
  const { addToast } = useUIStore();

  const [formData, setFormData] = useState({
    title: '',
    keywords: '',
    location: '',
    workplaceType: '',
    minSalary: '',
    frequency: 'DAILY',
    minMatchScore: 75,
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title || (initialData.search ? `Alert: ${initialData.search}` : 'New Job Alert'),
        keywords: Array.isArray(initialData.keywords)
          ? initialData.keywords.join(', ')
          : initialData.search || initialData.keywords || '',
        location: initialData.location || '',
        workplaceType: initialData.workplaceType || '',
        minSalary: initialData.minSalary || '',
        frequency: initialData.frequency || 'DAILY',
        minMatchScore: initialData.minMatchScore || 75,
      });
    } else {
      setFormData({
        title: 'Senior Full-Stack & React Roles',
        keywords: 'React, Node.js, JavaScript',
        location: 'Remote',
        workplaceType: 'REMOTE',
        minSalary: '120000',
        frequency: 'DAILY',
        minMatchScore: 75,
      });
    }
  }, [initialData, isOpen]);

  const createMutation = useMutation({
    mutationFn: (data) => alertApi.createAlert(data),
    onSuccess: (res) => {
      queryClient.invalidateQueries(['jobAlerts']);
      addToast({
        message: `Job alert "${res.data?.alert?.title}" activated! Found ${res.data?.alert?.matchesFoundCount || 0} initial matches.`,
        type: 'success',
      });
      if (onSuccess) onSuccess(res.data);
      onClose();
    },
    onError: (err) => {
      addToast({
        message: err.response?.data?.message || 'Failed to create job alert',
        type: 'error',
      });
    },
  });

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.keywords.trim()) {
      addToast({ message: 'Title and keywords are required', type: 'error' });
      return;
    }

    createMutation.mutate({
      title: formData.title.trim(),
      keywords: formData.keywords,
      location: formData.location.trim() || undefined,
      workplaceType: formData.workplaceType || undefined,
      minSalary: formData.minSalary ? Number(formData.minSalary) : undefined,
      frequency: formData.frequency,
      minMatchScore: Number(formData.minMatchScore),
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in">
      <div className="bg-white rounded-3xl p-5 sm:p-6 max-w-lg w-full space-y-5 shadow-2xl border border-slate-200 my-8">
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-brand-600 text-white flex items-center justify-center shadow-xs">
                <Bell className="w-4 h-4" />
              </div>
              <h3 className="font-extrabold text-slate-900 text-lg">Create Job Alert</h3>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Receive AI-matched job notifications whenever positions meet your criteria.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <Input
            label="Alert Name"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="e.g. Senior Frontend Architecture"
            required
          />

          {/* Keywords / Skills */}
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide">
              Keywords or Skills (Comma separated)
            </label>
            <Input
              value={formData.keywords}
              onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
              placeholder="e.g. React, Node.js, GraphQL, Docker"
              required
            />
            <span className="text-[11px] text-slate-400">
              Matched against job titles, requirements, and tech stack tags.
            </span>
          </div>

          {/* Workplace Selector */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide">
              Workplace Type
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              {WORKPLACE_OPTIONS.map((wp) => (
                <button
                  key={wp.id}
                  type="button"
                  onClick={() => setFormData({ ...formData, workplaceType: wp.id })}
                  className={`
                    p-2 rounded-xl text-xs font-semibold border text-center transition
                    ${
                      formData.workplaceType === wp.id
                        ? 'border-brand-600 bg-brand-50 text-brand-700 shadow-2xs'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }
                  `}
                >
                  {wp.label}
                </button>
              ))}
            </div>
          </div>

          {/* Minimum Salary & Location */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Minimum Salary (USD / yr)"
              type="number"
              leftIcon={DollarSign}
              value={formData.minSalary}
              onChange={(e) => setFormData({ ...formData, minSalary: e.target.value })}
              placeholder="e.g. 120000"
            />
            <Input
              label="Location / Region (Optional)"
              leftIcon={MapPin}
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="e.g. United States or Remote"
            />
          </div>

          {/* Minimum Match Score Threshold */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-brand-600" />
                Minimum AI Match Score
              </label>
              <span className="text-xs font-bold text-brand-600">
                {formData.minMatchScore}% Match or Higher
              </span>
            </div>
            <div className="flex gap-1.5">
              {MATCH_THRESHOLDS.map((score) => (
                <button
                  key={score}
                  type="button"
                  onClick={() => setFormData({ ...formData, minMatchScore: score })}
                  className={`flex-1 py-1.5 rounded-xl text-xs font-bold border transition ${
                    formData.minMatchScore === score
                      ? 'bg-emerald-600 border-emerald-600 text-white shadow-2xs'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {score}%
                </button>
              ))}
            </div>
          </div>

          {/* Alert Frequency */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide">
              Digest Delivery Frequency
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {FREQUENCY_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setFormData({ ...formData, frequency: opt.id })}
                  className={`p-2 rounded-xl text-xs font-semibold border text-center transition ${
                    formData.frequency === opt.id
                      ? 'bg-indigo-50 border-indigo-500 text-indigo-900 shadow-2xs'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={createMutation.isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={createMutation.isLoading}
              className="shadow-sm"
            >
              Activate Job Alert
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateAlertModal;
