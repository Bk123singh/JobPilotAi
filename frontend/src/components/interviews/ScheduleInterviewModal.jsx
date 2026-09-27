import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Calendar,
  Clock,
  Video,
  FileText,
  X,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Link as LinkIcon,
} from 'lucide-react';
import { interviewApi } from '../../api/interviewApi';
import { useUIStore } from '../../store/useUIStore';
import Button from '../common/Button';
import Input from '../common/Input';
import Badge from '../common/Badge';

const INTERVIEW_TYPES = [
  { id: 'SCREENING', label: 'Screening Call', defaultDuration: 30 },
  { id: 'TECHNICAL', label: 'Technical Interview', defaultDuration: 60 },
  { id: 'BEHAVIORAL', label: 'Behavioral Round', defaultDuration: 45 },
  { id: 'SYSTEM_DESIGN', label: 'System Design', defaultDuration: 60 },
  { id: 'FINAL_ROUND', label: 'Final Executive Round', defaultDuration: 45 },
];

const DURATION_OPTIONS = [30, 45, 60, 90];

const ScheduleInterviewModal = ({ isOpen, onClose, application, onSuccess }) => {
  const queryClient = useQueryClient();
  const { addToast } = useUIStore();

  const candidateName =
    application?.candidate?.profile?.fullName || application?.candidate?.email || 'Candidate';
  const jobTitle = application?.job?.title || 'Open Position';

  // Format default time to tomorrow at 10:00 AM local
  const getDefaultDateTime = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);
    return tomorrow.toISOString().slice(0, 16);
  };

  const generateDefaultMeetingUrl = () => {
    const code1 = Math.random().toString(36).substring(2, 5);
    const code2 = Math.random().toString(36).substring(2, 6);
    return `https://meet.google.com/jp-${code1}-${code2}`;
  };

  const [formData, setFormData] = useState({
    interviewType: 'TECHNICAL',
    title: `Interview: ${jobTitle}`,
    scheduledAt: getDefaultDateTime(),
    durationMinutes: 60,
    meetingUrl: generateDefaultMeetingUrl(),
    notes: 'Please review the system architecture requirements and prepare code samples.',
  });

  const scheduleMutation = useMutation({
    mutationFn: (data) => interviewApi.scheduleInterview(data),
    onSuccess: (res) => {
      queryClient.invalidateQueries(['recruiterInterviews']);
      queryClient.invalidateQueries(['recruiterApplications']);
      queryClient.invalidateQueries(['candidateApplications']);
      addToast({
        message: res.message || 'Interview scheduled successfully and applicant notified!',
        type: 'success',
      });
      if (onSuccess) onSuccess(res.data);
      onClose();
    },
    onError: (err) => {
      addToast({
        message: err.response?.data?.message || 'Failed to schedule interview',
        type: 'error',
      });
    },
  });

  if (!isOpen || !application) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.scheduledAt) {
      addToast({ message: 'Please select a date and time', type: 'error' });
      return;
    }

    scheduleMutation.mutate({
      applicationId: application.id,
      interviewType: formData.interviewType,
      type: formData.interviewType,
      title: formData.title || `Interview: ${jobTitle}`,
      scheduledAt: new Date(formData.scheduledAt).toISOString(),
      durationMinutes: Number(formData.durationMinutes),
      meetingUrl: formData.meetingUrl,
      notes: formData.notes,
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in">
      <div className="bg-white rounded-3xl p-5 sm:p-6 max-w-lg w-full space-y-5 shadow-2xl border border-slate-200 my-8">
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Calendar className="w-4 h-4" />
              </div>
              <h3 className="font-extrabold text-slate-900 text-lg">Schedule Interview</h3>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              For <span className="font-bold text-slate-800">{candidateName}</span> &bull; {jobTitle}
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
          {/* Interview Type Selector */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">
              Interview Stage / Type
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
              {INTERVIEW_TYPES.map((type) => (
                <button
                  key={type.id}
                  type="button"
                  onClick={() =>
                    setFormData({
                      ...formData,
                      interviewType: type.id,
                      durationMinutes: type.defaultDuration,
                      title: `${type.label}: ${jobTitle}`,
                    })
                  }
                  className={`
                    p-2 rounded-xl text-xs font-semibold border text-left transition
                    ${
                      formData.interviewType === type.id
                        ? 'border-indigo-600 bg-indigo-50/70 text-indigo-900 shadow-xs'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }
                  `}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <Input
            label="Interview Title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="e.g. Technical System Architecture Round"
            required
          />

          {/* Date & Time Picker */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1">
                Date & Time
              </label>
              <input
                type="datetime-local"
                value={formData.scheduledAt}
                onChange={(e) => setFormData({ ...formData, scheduledAt: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
                required
              />
            </div>

            {/* Duration Pills */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1">
                Duration
              </label>
              <div className="flex gap-1.5">
                {DURATION_OPTIONS.map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => setFormData({ ...formData, durationMinutes: mins })}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold border transition ${
                      formData.durationMinutes === mins
                        ? 'bg-brand-600 border-brand-600 text-white'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {mins}m
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Meeting URL */}
          <Input
            label="Meeting Video Call URL"
            leftIcon={Video}
            value={formData.meetingUrl}
            onChange={(e) => setFormData({ ...formData, meetingUrl: e.target.value })}
            placeholder="https://meet.google.com/..."
            required
          />

          {/* Notes & Instructions */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide">
              Preparation Notes / Instructions for Candidate
            </label>
            <textarea
              rows={3}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Candidate preparation tips, topics to cover, or required materials..."
              className="w-full p-3 text-xs sm:text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={scheduleMutation.isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={scheduleMutation.isLoading}
              className="shadow-sm"
            >
              Confirm & Schedule Interview
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ScheduleInterviewModal;
