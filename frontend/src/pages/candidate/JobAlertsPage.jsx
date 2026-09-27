import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Bell,
  Sparkles,
  Plus,
  Trash2,
  Play,
  CheckCircle2,
  AlertCircle,
  MapPin,
  DollarSign,
  Briefcase,
  Mail,
  Clock,
  ArrowRight,
  Sliders,
  ExternalLink,
} from 'lucide-react';
import { alertApi } from '../../api/alertApi';
import { useUIStore } from '../../store/useUIStore';
import Card, { CardHeader } from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Skeleton from '../../components/common/Skeleton';
import CreateAlertModal from '../../components/alerts/CreateAlertModal';

const JobAlertsPage = () => {
  const queryClient = useQueryClient();
  const { addToast } = useUIStore();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [digestResults, setDigestResults] = useState(null);

  // 1. Fetch user job alerts
  const { data: alertsData, isLoading: alertsLoading } = useQuery({
    queryKey: ['jobAlerts'],
    queryFn: alertApi.getUserAlerts,
  });
  const alerts = alertsData?.data?.alerts || [];

  // 2. Fetch notification preferences
  const { data: prefsData, isLoading: prefsLoading } = useQuery({
    queryKey: ['notificationPreferences'],
    queryFn: alertApi.getPreferences,
  });
  const preferences = prefsData?.data?.preferences || {
    emailNotifications: true,
    matchAlerts: true,
    applicationUpdates: true,
    interviewReminders: true,
    minMatchScore: 75,
  };

  // 3. Toggle active mutation
  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, isActive }) => alertApi.updateAlert(id, { isActive }),
    onSuccess: (_, { isActive }) => {
      queryClient.invalidateQueries(['jobAlerts']);
      addToast({
        message: isActive ? 'Job alert activated' : 'Job alert paused',
        type: 'info',
      });
    },
    onError: () => {
      addToast({ message: 'Failed to update alert state', type: 'error' });
    },
  });

  // 4. Delete alert mutation
  const deleteMutation = useMutation({
    mutationFn: (id) => alertApi.deleteAlert(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['jobAlerts']);
      addToast({ message: 'Job alert deleted successfully', type: 'success' });
    },
    onError: () => {
      addToast({ message: 'Failed to delete job alert', type: 'error' });
    },
  });

  // 5. Test Digest trigger mutation
  const triggerDigestMutation = useMutation({
    mutationFn: (id) => alertApi.triggerAlertDigest(id),
    onSuccess: (res) => {
      queryClient.invalidateQueries(['jobAlerts']);
      queryClient.invalidateQueries(['notifications']);
      setDigestResults(res.data);
      addToast({
        message: `Digest executed! Discovered ${res.data?.matchesCount || 0} matching opening(s).`,
        type: 'success',
      });
    },
    onError: () => {
      addToast({ message: 'Failed to trigger digest', type: 'error' });
    },
  });

  // 6. Update preferences mutation
  const updatePrefsMutation = useMutation({
    mutationFn: (newPrefs) => alertApi.updatePreferences(newPrefs),
    onSuccess: () => {
      queryClient.invalidateQueries(['notificationPreferences']);
      addToast({ message: 'Notification preferences saved', type: 'success' });
    },
    onError: () => {
      addToast({ message: 'Failed to update preferences', type: 'error' });
    },
  });

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Job Alerts & AI Digest
            </h1>
            <Badge variant="purple">Phase 13</Badge>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Automate personalized opportunity discovery with criteria-based alerts and 5-pillar matching.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => setIsCreateOpen(true)}
          className="shadow-sm self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Create New Alert
        </Button>
      </div>

      {/* Main Grid: Alerts List & Preferences Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Alerts List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Bell className="w-4 h-4 text-brand-600" />
              Active Job Alert Subscriptions ({alerts.length})
            </h2>
            <span className="text-xs text-slate-400">Evaluated continuously</span>
          </div>

          {alertsLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-32 w-full rounded-2xl" />
              <Skeleton className="h-32 w-full rounded-2xl" />
            </div>
          ) : alerts.length === 0 ? (
            <Card className="p-10 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center mx-auto">
                <Bell className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-base text-slate-900">No active job alerts</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Set up a search alert with your preferred skills, location, and salary to automatically receive matching jobs.
                </p>
              </div>
              <Button variant="primary" size="sm" onClick={() => setIsCreateOpen(true)}>
                <Plus className="w-4 h-4 mr-1" /> Create Your First Alert
              </Button>
            </Card>
          ) : (
            <div className="space-y-3">
              {alerts.map((alert) => (
                <Card
                  key={alert.id}
                  className={`p-4 sm:p-5 border transition-all ${
                    alert.isActive
                      ? 'border-slate-200 bg-white hover:border-brand-300'
                      : 'border-slate-100 bg-slate-50/60 opacity-75'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="space-y-1.5 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-extrabold text-sm sm:text-base text-slate-900">
                          {alert.title}
                        </h3>
                        <Badge variant={alert.isActive ? 'green' : 'gray'}>
                          {alert.isActive ? 'Active' : 'Paused'}
                        </Badge>
                        <Badge variant="purple">{alert.frequency}</Badge>
                      </div>

                      {/* Keywords Chips */}
                      {alert.keywords && alert.keywords.length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-0.5">
                          {alert.keywords.map((kw, idx) => (
                            <span
                              key={idx}
                              className="text-[11px] font-semibold bg-brand-50 text-brand-700 border border-brand-200/80 px-2 py-0.5 rounded-lg"
                            >
                              {kw}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Criteria Details */}
                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 pt-1">
                        {alert.workplaceType && (
                          <span className="flex items-center gap-1">
                            <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                            {alert.workplaceType}
                          </span>
                        )}
                        {alert.minSalary && (
                          <span className="flex items-center gap-1 font-medium text-slate-700">
                            <DollarSign className="w-3.5 h-3.5 text-slate-400" />
                            ${(alert.minSalary / 1000).toFixed(0)}k+ / yr
                          </span>
                        )}
                        {alert.minMatchScore && (
                          <span className="flex items-center gap-1 font-bold text-emerald-600">
                            <Sparkles className="w-3 h-3 text-emerald-500" />
                            &ge; {alert.minMatchScore}% Match
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Right side stats & toggle */}
                    <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 flex-shrink-0">
                      <div className="flex items-center gap-1.5 text-xs">
                        <span className="font-bold text-slate-900">
                          {alert.matchesFoundCount || 0}
                        </span>
                        <span className="text-slate-400">matches found</span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {/* Run Test Digest Button */}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => triggerDigestMutation.mutate(alert.id)}
                          isLoading={triggerDigestMutation.isLoading}
                          className="text-xs text-brand-600 hover:bg-brand-50 hover:border-brand-300"
                          title="Run immediate match evaluation"
                        >
                          <Play className="w-3 h-3 mr-1 fill-brand-600 text-brand-600" />
                          Run Digest
                        </Button>

                        {/* Active Switch */}
                        <button
                          type="button"
                          onClick={() =>
                            toggleActiveMutation.mutate({
                              id: alert.id,
                              isActive: !alert.isActive,
                            })
                          }
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition ${
                            alert.isActive
                              ? 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-200'
                              : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200'
                          }`}
                        >
                          {alert.isActive ? 'Pause' : 'Resume'}
                        </button>

                        {/* Delete Button */}
                        <button
                          type="button"
                          onClick={() => deleteMutation.mutate(alert.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                          title="Delete alert"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* Digest Results Dialog Preview */}
          {digestResults && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <h4 className="font-extrabold text-xs text-emerald-950 uppercase tracking-wide">
                    Live Match Digest Results ({digestResults.matchesCount} Found)
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={() => setDigestResults(null)}
                  className="text-xs font-bold text-emerald-700 hover:text-emerald-900"
                >
                  Dismiss
                </button>
              </div>

              {digestResults.topMatches?.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {digestResults.topMatches.map((m, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-white rounded-xl border border-emerald-100 shadow-2xs flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0">
                        <Link
                          to={`/jobs/${m.job.id}`}
                          className="font-bold text-xs text-slate-900 hover:text-brand-600 truncate block"
                        >
                          {m.job.title}
                        </Link>
                        <p className="text-[11px] text-slate-500 truncate">
                          {m.job.company?.name || 'Company'} &bull; {m.job.location}
                        </p>
                      </div>
                      <span className="text-xs font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md flex-shrink-0">
                        {m.overallScore}%
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-emerald-800">
                  No active openings currently meet the strict match threshold for this alert. Lower the threshold to see more openings.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Right 1 Col: Candidate Notification Preferences Card */}
        <div className="space-y-4">
          <Card className="p-5 border-slate-200 space-y-4 shadow-sm">
            <CardHeader className="p-0 pb-3 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-sm text-slate-900">
                  Delivery Preferences
                </h3>
                <p className="text-[11px] text-slate-500">Manage channels and notification cadence.</p>
              </div>
              <Sliders className="w-4 h-4 text-brand-600" />
            </CardHeader>

            <div className="space-y-3 text-xs">
              {/* Email Notifications Toggle */}
              <div className="flex items-center justify-between py-1">
                <div>
                  <span className="font-bold text-slate-800 block">Email Digest</span>
                  <span className="text-[11px] text-slate-400">Send digests to your email address</span>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.emailNotifications}
                  onChange={(e) =>
                    updatePrefsMutation.mutate({
                      ...preferences,
                      emailNotifications: e.target.checked,
                    })
                  }
                  className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500 cursor-pointer"
                />
              </div>

              {/* Match Alerts Toggle */}
              <div className="flex items-center justify-between py-1 border-t border-slate-100">
                <div>
                  <span className="font-bold text-slate-800 block">AI Match Alerts</span>
                  <span className="text-[11px] text-slate-400">Notify on high-compatibility openings</span>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.matchAlerts}
                  onChange={(e) =>
                    updatePrefsMutation.mutate({
                      ...preferences,
                      matchAlerts: e.target.checked,
                    })
                  }
                  className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500 cursor-pointer"
                />
              </div>

              {/* Application Updates Toggle */}
              <div className="flex items-center justify-between py-1 border-t border-slate-100">
                <div>
                  <span className="font-bold text-slate-800 block">Application Updates</span>
                  <span className="text-[11px] text-slate-400">Status changes and recruiter messages</span>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.applicationUpdates}
                  onChange={(e) =>
                    updatePrefsMutation.mutate({
                      ...preferences,
                      applicationUpdates: e.target.checked,
                    })
                  }
                  className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500 cursor-pointer"
                />
              </div>

              {/* Interview Reminders Toggle */}
              <div className="flex items-center justify-between py-1 border-t border-slate-100">
                <div>
                  <span className="font-bold text-slate-800 block">Interview Reminders</span>
                  <span className="text-[11px] text-slate-400">Upcoming calendar reminders</span>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.interviewReminders}
                  onChange={(e) =>
                    updatePrefsMutation.mutate({
                      ...preferences,
                      interviewReminders: e.target.checked,
                    })
                  }
                  className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500 cursor-pointer"
                />
              </div>

              {/* Global Min Match Score Threshold */}
              <div className="pt-2 border-t border-slate-100 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800">Global Match Cutoff</span>
                  <span className="font-bold text-brand-600">
                    {preferences.minMatchScore || 70}%
                  </span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="95"
                  step="5"
                  value={preferences.minMatchScore || 70}
                  onChange={(e) =>
                    updatePrefsMutation.mutate({
                      ...preferences,
                      minMatchScore: Number(e.target.value),
                    })
                  }
                  className="w-full accent-brand-600 cursor-pointer"
                />
                <span className="text-[10px] text-slate-400 block">
                  Jobs scoring below this threshold will not trigger match alerts.
                </span>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Create Alert Modal */}
      <CreateAlertModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
      />
    </div>
  );
};

export default JobAlertsPage;
