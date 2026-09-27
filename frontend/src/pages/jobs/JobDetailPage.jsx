import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { jobApi } from '../../api/jobApi';
import { useAuthStore } from '../../store/useAuthStore';
import { useUIStore } from '../../store/useUIStore';
import {
  Briefcase,
  MapPin,
  DollarSign,
  Clock,
  Building2,
  ShieldCheck,
  Sparkles,
  Bookmark,
  Share2,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Users,
  Calendar,
} from 'lucide-react';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Skeleton from '../../components/common/Skeleton';
import ApplyModal from '../../components/applications/ApplyModal';
import JobMatchBreakdownCard from '../../components/jobs/JobMatchBreakdownCard';

const JobDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isAuthenticated, user } = useAuthStore();
  const { addToast } = useUIStore();
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['job', id],
    queryFn: () => jobApi.getJob(id),
  });

  const job = data?.data?.job;

  const saveMutation = useMutation({
    mutationFn: () => jobApi.toggleSaveJob(id),
    onSuccess: (res) => {
      queryClient.setQueryData(['job', id], (old) => {
        if (!old?.data?.job) return old;
        return {
          ...old,
          data: {
            ...old.data,
            job: { ...old.data.job, isSaved: res.data?.isSaved },
          },
        };
      });
      addToast({ message: res.message || 'Bookmark updated', type: 'success' });
    },
  });

  const handleShareClick = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      addToast({ message: 'Job link copied to clipboard!', type: 'success' });
    } else {
      addToast({ message: window.location.href, type: 'info' });
    }
  };

  const handleApplyClick = () => {
    if (!isAuthenticated) {
      navigate(`/login?redirect=/jobs/${id}`);
      return;
    }
    if (user?.role === 'RECRUITER') {
      addToast({ message: 'Recruiter accounts cannot submit candidate applications', type: 'info' });
      return;
    }
    setIsApplyModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        <Skeleton className="h-40 w-full rounded-3xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  if (isError || !job) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
          <Briefcase className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Job Opening Not Found</h2>
        <p className="text-sm text-slate-500">
          This opening might have been closed, expired, or removed.
        </p>
        <Link to="/jobs">
          <Button variant="primary">Return to Jobs</Button>
        </Link>
      </div>
    );
  }

  const formatSalary = (min, max) => {
    if (!min && !max) return null;
    if (min && max) {
      return `$${(min / 1000).toFixed(0)}k - $${(max / 1000).toFixed(0)}k / yr`;
    }
    return `$${((min || max) / 1000).toFixed(0)}k / yr`;
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center text-xs font-semibold text-slate-500 hover:text-slate-800 transition"
      >
        <ArrowLeft className="w-4 h-4 mr-1" />
        Back to search
      </button>

      {/* Already Applied Status Banner */}
      {job.hasApplied && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-emerald-900">Application Submitted</p>
              <p className="text-xs text-emerald-700">
                You applied for this position
                {job.appliedApplication?.createdAt
                  ? ` on ${new Date(job.appliedApplication.createdAt).toLocaleDateString()}`
                  : ''}
                . Current Status:{' '}
                <span className="font-bold uppercase tracking-wider text-emerald-800">
                  {job.appliedApplication?.status || 'APPLIED'}
                </span>
              </p>
            </div>
          </div>
          <Link to="/applications">
            <Button
              size="sm"
              variant="outline"
              className="border-emerald-300 text-emerald-800 hover:bg-emerald-100 whitespace-nowrap"
            >
              View My Applications
            </Button>
          </Link>
        </div>
      )}

      {/* Header Banner Card */}
      <Card className="p-6 sm:p-8 bg-gradient-to-r from-white to-slate-50 border-slate-200 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
          <div className="flex items-start space-x-4">
            {job.company?.logoUrl ? (
              <img
                src={job.company.logoUrl}
                alt={job.company.name}
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border border-slate-200 shadow-sm flex-shrink-0"
              />
            ) : (
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-brand-600 to-indigo-700 text-white flex items-center justify-center font-bold text-2xl shadow-md flex-shrink-0">
                {job.company?.name?.charAt(0) || 'C'}
              </div>
            )}

            <div className="space-y-1.5">
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight leading-tight">
                {job.title}
              </h1>

              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="font-bold text-slate-800 flex items-center gap-1">
                  {job.company?.name}
                  {job.company?.isVerified && (
                    <ShieldCheck className="w-4 h-4 text-emerald-600" title="Verified Employer" />
                  )}
                </span>
                <span className="text-slate-300">•</span>
                <span className="text-slate-500 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  {job.location || 'Remote'}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-2">
                <Badge variant={job.workplaceType === 'REMOTE' ? 'green' : 'brand'}>
                  {job.workplaceType}
                </Badge>

                {formatSalary(job.minSalary, job.maxSalary) && (
                  <span className="inline-flex items-center text-xs font-semibold text-slate-800 bg-slate-100 px-3 py-1 rounded-full">
                    {formatSalary(job.minSalary, job.maxSalary)}
                  </span>
                )}

                <span className="text-xs text-slate-500 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-full">
                  {job.experienceLevel || 'Entry-Mid Level'}
                </span>

                {job.jobType && (
                  <span className="text-xs text-slate-500 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-full">
                    {job.jobType.replace('_', ' ')}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Desktop Right Actions */}
          <div className="hidden sm:flex flex-col items-end gap-3 flex-shrink-0">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleShareClick}
                className="p-2.5 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 transition active:scale-95"
                title="Share Job"
              >
                <Share2 className="w-4 h-4" />
              </button>

              {isAuthenticated && user?.role === 'JOB_SEEKER' && (
                <button
                  type="button"
                  onClick={() => saveMutation.mutate()}
                  className={`p-2.5 rounded-xl border transition active:scale-95 ${
                    job.isSaved
                      ? 'bg-brand-50 border-brand-300 text-brand-600'
                      : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                  }`}
                  title={job.isSaved ? 'Bookmarked' : 'Bookmark Job'}
                >
                  <Bookmark
                    className={`w-4 h-4 ${job.isSaved ? 'fill-brand-600 text-brand-600' : ''}`}
                  />
                </button>
              )}
            </div>

            {/* Apply Action Buttons */}
            {job.hasApplied ? (
              <Button
                size="lg"
                variant="outline"
                disabled
                className="bg-emerald-50 border-emerald-300 text-emerald-700 font-bold px-6 cursor-default opacity-100"
              >
                <CheckCircle2 className="w-5 h-5 mr-1.5 text-emerald-600" />
                Applied
              </Button>
            ) : user?.role === 'RECRUITER' ? (
              <Link to="/recruiter/applications">
                <Button size="lg" variant="outline" className="font-semibold px-6">
                  Manage Applications
                </Button>
              </Link>
            ) : (
              <Button
                size="lg"
                variant="primary"
                onClick={handleApplyClick}
                className="shadow-md font-semibold px-6"
              >
                Apply for Position
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* 5-Pillar Deterministic Match Score Breakdown & Skill Gap Card */}
      <JobMatchBreakdownCard
        breakdown={job.matchBreakdown}
        isAuthenticated={isAuthenticated}
        isCandidate={user?.role === 'JOB_SEEKER'}
      />

      {/* Main Details Body */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Description & Skills */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6 sm:p-8 space-y-6">
            <div className="space-y-3">
              <h2 className="font-bold text-lg text-slate-900">About the Role</h2>
              <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-line space-y-3">
                {job.description}
              </div>
            </div>

            {/* Required Skills */}
            {job.requiredSkills?.length > 0 && (
              <div className="space-y-3 pt-4 border-t border-slate-100">
                <h3 className="font-bold text-base text-slate-900">Required Core Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {job.requiredSkills.map((skill) => (
                    <span
                      key={skill}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-50 text-brand-700 font-semibold text-xs sm:text-sm border border-brand-200"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-brand-600" />
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Nice to Have Skills */}
            {job.niceToHaveSkills?.length > 0 && (
              <div className="space-y-3 pt-2">
                <h3 className="font-bold text-sm text-slate-700">Nice to Have Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {job.niceToHaveSkills.map((skill) => (
                    <span
                      key={skill}
                      className="inline-flex items-center px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-medium border border-slate-200"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* Right 1 Col: Job Overview & Company Card */}
        <div className="space-y-6">
          {/* Job Snapshot */}
          <Card className="p-6 space-y-4">
            <h3 className="font-bold text-base text-slate-900">Job Snapshot</h3>
            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Workplace</span>
                <span className="font-semibold text-slate-800">{job.workplaceType}</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Location</span>
                <span className="font-semibold text-slate-800">{job.location || 'Remote'}</span>
              </div>
              {job.jobType && (
                <div className="flex items-center justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500 font-medium">Employment</span>
                  <span className="font-semibold text-slate-800">
                    {job.jobType.replace('_', ' ')}
                  </span>
                </div>
              )}
              {job.experienceLevel && (
                <div className="flex items-center justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500 font-medium">Experience</span>
                  <span className="font-semibold text-slate-800">{job.experienceLevel}</span>
                </div>
              )}
              {formatSalary(job.minSalary, job.maxSalary) && (
                <div className="flex items-center justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500 font-medium">Offered Salary</span>
                  <span className="font-semibold text-slate-800">
                    {formatSalary(job.minSalary, job.maxSalary)}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Applications</span>
                <span className="font-semibold text-slate-800">
                  {job._count?.applications || 0} candidates
                </span>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-slate-500 font-medium">Posted</span>
                <span className="font-semibold text-slate-800">
                  {new Date(job.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </Card>

          {/* Company Card */}
          <Card className="p-6 space-y-4">
            <h3 className="font-bold text-base text-slate-900">Company Overview</h3>
            <div className="space-y-3 text-xs">
              <div>
                <p className="text-slate-400 font-semibold uppercase">Company</p>
                <p className="font-semibold text-slate-800 text-sm mt-0.5">{job.company?.name}</p>
              </div>

              {job.company?.industry && (
                <div>
                  <p className="text-slate-400 font-semibold uppercase">Industry</p>
                  <p className="font-medium text-slate-700 mt-0.5">{job.company?.industry}</p>
                </div>
              )}

              {job.company?.location && (
                <div>
                  <p className="text-slate-400 font-semibold uppercase">Headquarters</p>
                  <p className="font-medium text-slate-700 mt-0.5">{job.company?.location}</p>
                </div>
              )}

              {job.company?.website && (
                <div>
                  <p className="text-slate-400 font-semibold uppercase">Website</p>
                  <a
                    href={job.company.website}
                    target="_blank"
                    rel="noreferrer"
                    className="font-semibold text-brand-600 hover:underline inline-flex items-center gap-1 mt-0.5"
                  >
                    Visit website
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Sticky Bottom Bar on Mobile */}
      <div className="sm:hidden fixed bottom-16 left-0 right-0 z-30 bg-white/95 backdrop-blur border-t border-slate-200 p-3 flex items-center justify-between gap-3 shadow-lg">
        {isAuthenticated && user?.role === 'JOB_SEEKER' && (
          <button
            type="button"
            onClick={() => saveMutation.mutate()}
            className="p-3 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50"
            title="Bookmark"
          >
            <Bookmark className={`w-5 h-5 ${job.isSaved ? 'fill-brand-600 text-brand-600' : ''}`} />
          </button>
        )}
        <button
          type="button"
          onClick={handleShareClick}
          className="p-3 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50"
          title="Share"
        >
          <Share2 className="w-5 h-5" />
        </button>
        {job.hasApplied ? (
          <Button
            variant="outline"
            size="lg"
            disabled
            className="flex-1 font-bold bg-emerald-50 border-emerald-300 text-emerald-700 opacity-100 cursor-default"
          >
            <CheckCircle2 className="w-4 h-4 mr-1.5 text-emerald-600" />
            Applied
          </Button>
        ) : (
          <Button
            variant="primary"
            size="lg"
            onClick={handleApplyClick}
            className="flex-1 font-bold shadow-md"
          >
            Apply Now
          </Button>
        )}
      </div>

      {/* Apply Modal */}
      <ApplyModal
        job={job}
        isOpen={isApplyModalOpen}
        onClose={() => setIsApplyModalOpen(false)}
      />
    </div>
  );
};

export default JobDetailPage;
