import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Briefcase,
  Building2,
  MapPin,
  Calendar,
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  XCircle,
  ExternalLink,
  ShieldCheck,
  Search,
} from 'lucide-react';
import { applicationApi } from '../../api/applicationApi';
import { useUIStore } from '../../store/useUIStore';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Skeleton from '../../components/common/Skeleton';
import UpcomingInterviewsCard from '../../components/interviews/UpcomingInterviewsCard';

const PIPELINE_STAGES = ['APPLIED', 'UNDER_REVIEW', 'SHORTLISTED', 'INTERVIEW', 'OFFER'];

const getStatusBadge = (status) => {
  switch (status) {
    case 'APPLIED':
      return <Badge variant="blue">Applied</Badge>;
    case 'UNDER_REVIEW':
      return <Badge variant="yellow">Under Review</Badge>;
    case 'SHORTLISTED':
      return <Badge variant="purple">Shortlisted</Badge>;
    case 'INTERVIEW':
      return <Badge variant="green">Interviewing</Badge>;
    case 'OFFER':
      return <Badge variant="green">Offer Extended 🎉</Badge>;
    case 'REJECTED':
      return <Badge variant="gray">Not Selected</Badge>;
    case 'WITHDRAWN':
      return <Badge variant="gray">Withdrawn</Badge>;
    default:
      return <Badge variant="gray">{status}</Badge>;
  }
};

const ApplicationsPage = () => {
  const queryClient = useQueryClient();
  const { addToast } = useUIStore();
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [expandedAppId, setExpandedAppId] = useState(null);
  const [withdrawConfirmId, setWithdrawConfirmId] = useState(null);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['candidateApplications'],
    queryFn: applicationApi.getMyApplications,
  });

  const applications = data?.data?.applications || [];

  // Withdraw mutation
  const withdrawMutation = useMutation({
    mutationFn: (appId) => applicationApi.withdrawApplication(appId),
    onSuccess: () => {
      queryClient.invalidateQueries(['candidateApplications']);
      setWithdrawConfirmId(null);
      addToast({ message: 'Application has been successfully withdrawn', type: 'info' });
    },
    onError: (err) => {
      addToast({
        message: err.response?.data?.message || 'Failed to withdraw application',
        type: 'error',
      });
    },
  });

  const filteredApplications = applications.filter((app) => {
    if (activeFilter === 'ALL') return true;
    if (activeFilter === 'ACTIVE') {
      return ['APPLIED', 'UNDER_REVIEW', 'SHORTLISTED', 'INTERVIEW'].includes(app.status);
    }
    if (activeFilter === 'INTERVIEW') {
      return ['SHORTLISTED', 'INTERVIEW'].includes(app.status);
    }
    if (activeFilter === 'CONCLUDED') {
      return ['OFFER', 'REJECTED', 'WITHDRAWN'].includes(app.status);
    }
    return true;
  });

  const getStageIndex = (status) => {
    return PIPELINE_STAGES.indexOf(status);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            My Applications
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Track your job applications, interview status, and recruiter decisions in real-time.
          </p>
        </div>

        <Link to="/jobs">
          <Button variant="primary" size="sm" className="shadow-sm">
            <Search className="w-4 h-4 mr-1.5" />
            Explore More Jobs
          </Button>
        </Link>
      </div>

      {/* Upcoming Confirmed Interviews */}
      <UpcomingInterviewsCard />

      {/* Filter Tabs (Horizontal scroll on mobile, touch friendly) */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-1 no-scrollbar border-b border-slate-200">
        {[
          { id: 'ALL', label: 'All Applications', count: applications.length },
          {
            id: 'ACTIVE',
            label: 'Active Pipeline',
            count: applications.filter((a) =>
              ['APPLIED', 'UNDER_REVIEW', 'SHORTLISTED', 'INTERVIEW'].includes(a.status)
            ).length,
          },
          {
            id: 'INTERVIEW',
            label: 'Interviewing',
            count: applications.filter((a) =>
              ['SHORTLISTED', 'INTERVIEW'].includes(a.status)
            ).length,
          },
          {
            id: 'CONCLUDED',
            label: 'Concluded',
            count: applications.filter((a) =>
              ['OFFER', 'REJECTED', 'WITHDRAWN'].includes(a.status)
            ).length,
          },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveFilter(tab.id)}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              activeFilter === tab.id
                ? 'bg-brand-600 text-white shadow-sm'
                : 'bg-slate-100/70 text-slate-600 hover:bg-slate-200/70'
            }`}
          >
            {tab.label}
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded-full font-extrabold ${
                activeFilter === tab.id
                  ? 'bg-white/20 text-white'
                  : 'bg-slate-200 text-slate-600'
              }`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="space-y-4">
          <Skeleton className="h-36 w-full rounded-2xl" />
          <Skeleton className="h-36 w-full rounded-2xl" />
          <Skeleton className="h-36 w-full rounded-2xl" />
        </div>
      )}

      {/* Error state */}
      {isError && (
        <Card className="p-8 text-center space-y-3">
          <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
          <h3 className="font-bold text-slate-900">Failed to load applications</h3>
          <p className="text-xs text-slate-500">Please check your network and try again.</p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Retry
          </Button>
        </Card>
      )}

      {/* Empty State */}
      {!isLoading && !isError && filteredApplications.length === 0 && (
        <Card className="p-10 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center mx-auto shadow-sm">
            <Briefcase className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-900">No applications found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {activeFilter === 'ALL'
                ? 'You haven’t submitted any applications yet. Discover open opportunities that match your skillset.'
                : `No applications currently in the [${activeFilter.toLowerCase()}] category.`}
            </p>
          </div>
          <Link to="/jobs">
            <Button variant="primary" size="md">
              Find Jobs Now
            </Button>
          </Link>
        </Card>
      )}

      {/* Applications List */}
      {!isLoading && !isError && filteredApplications.length > 0 && (
        <div className="space-y-4">
          {filteredApplications.map((app) => {
            const isExpanded = expandedAppId === app.id;
            const currentStageIdx = getStageIndex(app.status);
            const isConcluded = ['REJECTED', 'WITHDRAWN'].includes(app.status);
            const canWithdraw = !['OFFER', 'REJECTED', 'WITHDRAWN'].includes(app.status);

            return (
              <Card
                key={app.id}
                className="p-5 sm:p-6 border-slate-200 transition hover:shadow-md space-y-4"
              >
                {/* Top row: Company, Job Title, Status Badge */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start space-x-3.5">
                    {app.job?.company?.logoUrl ? (
                      <img
                        src={app.job.company.logoUrl}
                        alt={app.job.company.name}
                        className="w-12 h-12 rounded-xl object-cover border border-slate-200 flex-shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-brand-600 text-white flex items-center justify-center font-bold text-lg flex-shrink-0">
                        {app.job?.company?.name?.charAt(0) || 'C'}
                      </div>
                    )}
                    <div>
                      <Link
                        to={`/jobs/${app.jobId}`}
                        className="text-base font-extrabold text-slate-900 hover:text-brand-600 transition line-clamp-1 inline-flex items-center gap-1.5"
                      >
                        {app.job?.title || 'Job Title'}
                        <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                      </Link>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mt-0.5">
                        <span className="font-semibold text-slate-700 flex items-center gap-1">
                          {app.job?.company?.name}
                          {app.job?.company?.isVerified && (
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                          )}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          {app.job?.location || 'Remote'}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          Applied {new Date(app.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-center">
                    {getStatusBadge(app.status)}
                  </div>
                </div>

                {/* Progress Stepper (Hidden if Rejected or Withdrawn) */}
                {!isConcluded && currentStageIdx !== -1 && (
                  <div className="pt-2 pb-1">
                    <div className="relative flex items-center justify-between w-full">
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-slate-100 w-full z-0" />
                      <div
                        className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-brand-600 z-0 transition-all duration-500"
                        style={{
                          width: `${(currentStageIdx / (PIPELINE_STAGES.length - 1)) * 100}%`,
                        }}
                      />

                      {PIPELINE_STAGES.map((stage, idx) => {
                        const isDone = currentStageIdx >= idx;
                        const isCurrent = currentStageIdx === idx;

                        return (
                          <div
                            key={stage}
                            className="relative z-10 flex flex-col items-center group cursor-default"
                          >
                            <div
                              className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${
                                isCurrent
                                  ? 'bg-brand-600 text-white ring-4 ring-brand-100 scale-110'
                                  : isDone
                                  ? 'bg-brand-600 text-white'
                                  : 'bg-slate-200 text-slate-500'
                              }`}
                            >
                              {isDone ? <CheckCircle2 className="w-3.5 h-3.5" /> : idx + 1}
                            </div>
                            <span
                              className={`text-[10px] font-semibold mt-1 hidden sm:block ${
                                isCurrent
                                  ? 'text-brand-600 font-extrabold'
                                  : isDone
                                  ? 'text-slate-700'
                                  : 'text-slate-400'
                              }`}
                            >
                              {stage.replace('_', ' ')}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Concluded Alert (if Withdrawn or Rejected) */}
                {isConcluded && (
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 flex items-center gap-2">
                    <XCircle className="w-4 h-4 text-slate-400" />
                    <span>
                      This application has been{' '}
                      <strong className="text-slate-800 lowercase">{app.status}</strong>.
                    </span>
                  </div>
                )}

                {/* Metadata & Toggle Action Footer */}
                <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-3 text-slate-500">
                    <span className="flex items-center gap-1">
                      <FileText className="w-3.5 h-3.5 text-brand-600" />
                      Resume: <strong>{app.resume?.title || 'Attached Resume'}</strong>
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {canWithdraw && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setWithdrawConfirmId(app.id)}
                        className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 text-xs font-semibold px-2 py-1 h-auto"
                      >
                        Withdraw
                      </Button>
                    )}

                    <button
                      onClick={() => setExpandedAppId(isExpanded ? null : app.id)}
                      className="inline-flex items-center gap-1 font-semibold text-brand-600 hover:text-brand-700 text-xs transition"
                    >
                      {isExpanded ? (
                        <>
                          Hide Timeline <ChevronUp className="w-3.5 h-3.5" />
                        </>
                      ) : (
                        <>
                          View Timeline ({app.statusHistory?.length || 1}){' '}
                          <ChevronDown className="w-3.5 h-3.5" />
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Expandable Status Timeline */}
                {isExpanded && (
                  <div className="mt-3 pt-3 border-t border-slate-100 bg-slate-50/70 p-4 rounded-2xl space-y-3 animate-in fade-in duration-150">
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-brand-600" />
                      Application Audit Timeline
                    </h4>

                    {app.statusHistory && app.statusHistory.length > 0 ? (
                      <div className="space-y-3 border-l-2 border-brand-200 ml-2 pl-3">
                        {app.statusHistory.map((hist, idx) => (
                          <div key={hist.id || idx} className="relative space-y-0.5">
                            <div className="absolute -left-[19px] top-1 w-2.5 h-2.5 rounded-full bg-brand-600 ring-2 ring-white" />
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-bold text-slate-900">
                                {hist.toStatus?.replace('_', ' ')}
                              </span>
                              <span className="text-[11px] text-slate-400">
                                {new Date(hist.createdAt).toLocaleString()}
                              </span>
                            </div>
                            {hist.reason && (
                              <p className="text-xs text-slate-600">{hist.reason}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500">
                        Application submitted on {new Date(app.createdAt).toLocaleDateString()}.
                      </p>
                    )}

                    {app.coverLetter && (
                      <div className="pt-2 border-t border-slate-200/70 text-xs space-y-1">
                        <span className="font-bold text-slate-700">Cover Note Attached:</span>
                        <p className="text-slate-600 italic bg-white p-2.5 rounded-xl border border-slate-200/60">
                          "{app.coverLetter}"
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Confirmation Modal for Withdrawal */}
      {withdrawConfirmId && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl border border-slate-200">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="font-extrabold text-slate-900 text-base">Withdraw Application?</h3>
              <p className="text-xs text-slate-500">
                Are you sure you want to withdraw this application? The recruiter will be notified
                and this action cannot be undone.
              </p>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <Button
                variant="outline"
                size="md"
                className="flex-1"
                onClick={() => setWithdrawConfirmId(null)}
                disabled={withdrawMutation.isLoading}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                size="md"
                className="flex-1"
                isLoading={withdrawMutation.isLoading}
                onClick={() => withdrawMutation.mutate(withdrawConfirmId)}
              >
                Yes, Withdraw
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApplicationsPage;
