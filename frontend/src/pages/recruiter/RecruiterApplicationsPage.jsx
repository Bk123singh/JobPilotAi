import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Users,
  Briefcase,
  Search,
  Filter,
  FileText,
  ExternalLink,
  Sparkles,
  MapPin,
  Mail,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  Clock,
  ChevronRight,
  Plus,
  Kanban,
  List,
  Calendar,
} from 'lucide-react';
import { applicationApi } from '../../api/applicationApi';
import { jobApi } from '../../api/jobApi';
import { useUIStore } from '../../store/useUIStore';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Skeleton from '../../components/common/Skeleton';
import KanbanBoard from '../../components/recruiter/KanbanBoard';
import ScheduleInterviewModal from '../../components/interviews/ScheduleInterviewModal';
import UpcomingInterviewsCard from '../../components/interviews/UpcomingInterviewsCard';

const STATUS_OPTIONS = [
  { value: 'APPLIED', label: 'Applied', color: 'blue' },
  { value: 'UNDER_REVIEW', label: 'Under Review', color: 'yellow' },
  { value: 'SHORTLISTED', label: 'Shortlisted', color: 'purple' },
  { value: 'INTERVIEW', label: 'Interviewing', color: 'green' },
  { value: 'OFFER', label: 'Offer Extended', color: 'green' },
  { value: 'REJECTED', label: 'Rejected', color: 'gray' },
];

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

const RecruiterApplicationsPage = () => {
  const queryClient = useQueryClient();
  const { addToast } = useUIStore();

  const [selectedJobId, setSelectedJobId] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('kanban');
  const [activeCandidateForNote, setActiveCandidateForNote] = useState(null);
  const [activeCandidateForInterview, setActiveCandidateForInterview] = useState(null);
  const [showUpcomingInterviews, setShowUpcomingInterviews] = useState(false);
  const [noteText, setNoteText] = useState('');

  // 1. Fetch Recruiter's Jobs for filter dropdown
  const { data: jobsData } = useQuery({
    queryKey: ['recruiterJobs'],
    queryFn: jobApi.listRecruiterJobs,
  });
  const recruiterJobs = jobsData?.data?.jobs || [];

  // 2. Fetch Recruiter's Applications
  const {
    data: applicationsData,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['recruiterApplications', selectedJobId, selectedStatus],
    queryFn: () =>
      applicationApi.getRecruiterApplications({
        jobId: selectedJobId || undefined,
        status: selectedStatus || undefined,
      }),
  });

  const applications = applicationsData?.data?.applications || [];

  // 3. Status Transition Mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ appId, status, notes }) =>
      applicationApi.updateApplicationStatus(appId, { status, notes }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['recruiterApplications'] });
      addToast({ message: 'Candidate status updated successfully', type: 'success' });
      setActiveCandidateForNote(null);
    },
    onError: (err) => {
      addToast({
        message: err.response?.data?.message || 'Failed to update candidate status',
        type: 'error',
      });
    },
  });

  // Client-side search filtering by candidate name or headline
  const filteredApplications = applications.filter((app) => {
    if (!searchTerm.trim()) return true;
    const name = app.candidate?.profile?.fullName || '';
    const headline = app.candidate?.profile?.headline || '';
    const email = app.candidate?.email || '';
    const query = searchTerm.toLowerCase();
    return (
      name.toLowerCase().includes(query) ||
      headline.toLowerCase().includes(query) ||
      email.toLowerCase().includes(query)
    );
  });

  const handleStatusChange = (appId, newStatus) => {
    updateStatusMutation.mutate({ appId, status: newStatus });
  };

  const handleSaveNotes = (e) => {
    e.preventDefault();
    if (!activeCandidateForNote) return;
    updateStatusMutation.mutate({
      appId: activeCandidateForNote.id,
      status: activeCandidateForNote.status,
      notes: noteText,
    });
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-brand-600 uppercase tracking-wider">
            Hiring Pipeline
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Candidate Applications
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Review applicant profiles, verify resume quality, and transition candidate pipeline stages.
          </p>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 self-start sm:self-center">
          {/* View Mode Toggle: Kanban vs List */}
          <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200">
            <button
              type="button"
              onClick={() => setViewMode('kanban')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                viewMode === 'kanban'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Kanban className="w-3.5 h-3.5 text-brand-600" />
              Kanban
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                viewMode === 'list'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              List
            </button>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowUpcomingInterviews(!showUpcomingInterviews)}
            className={`text-xs font-bold ${
              showUpcomingInterviews
                ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                : 'text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Calendar className="w-4 h-4 mr-1.5 text-indigo-600" />
            {showUpcomingInterviews ? 'Hide Interviews' : 'Interviews'}
          </Button>

          <Link to="/recruiter/jobs/create">
            <Button variant="primary" size="sm" className="shadow-sm">
              <Plus className="w-4 h-4 mr-1.5" />
              Post New Job
            </Button>
          </Link>
        </div>
      </div>

      {/* Upcoming Interviews Collapsible Card */}
      {showUpcomingInterviews && (
        <div className="animate-in fade-in">
          <UpcomingInterviewsCard isRecruiter={true} title="Recruiter Scheduled Interviews" />
        </div>
      )}

      {/* Filter and Search Bar */}
      <Card className="p-4 sm:p-5 border-slate-200 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Search box */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search candidate name or skill..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white"
            />
          </div>

          {/* Job Filter Dropdown */}
          <div>
            <select
              value={selectedJobId}
              onChange={(e) => setSelectedJobId(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white text-slate-700"
            >
              <option value="">All Job Openings</option>
              {recruiterJobs.map((job) => (
                <option key={job.id} value={job.id}>
                  {job.title}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter Dropdown */}
          <div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white text-slate-700"
            >
              <option value="">All Pipeline Stages</option>
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="space-y-4">
          <Skeleton className="h-40 w-full rounded-2xl" />
          <Skeleton className="h-40 w-full rounded-2xl" />
          <Skeleton className="h-40 w-full rounded-2xl" />
        </div>
      )}

      {/* Error State */}
      {isError && (
        <Card className="p-8 text-center space-y-3">
          <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
          <h3 className="font-bold text-slate-900">Failed to load candidate applications</h3>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Retry
          </Button>
        </Card>
      )}

      {/* Empty State */}
      {!isLoading && !isError && filteredApplications.length === 0 && (
        <Card className="p-12 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center mx-auto shadow-sm">
            <Users className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-900">No applications found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {selectedJobId || selectedStatus || searchTerm
                ? 'No candidates matched your search filters. Try adjusting your search query.'
                : 'Candidates who apply for your active openings will show up here in your pipeline.'}
            </p>
          </div>
        </Card>
      )}

      {/* Applications Pipeline Content (Kanban Board vs. List View) */}
      {!isLoading && !isError && filteredApplications.length > 0 && (
        viewMode === 'kanban' ? (
          <KanbanBoard
            applications={filteredApplications}
            onStatusChange={handleStatusChange}
            onOpenNotes={(cand) => {
              setActiveCandidateForNote(cand);
              setNoteText(cand.recruiterNotes || '');
            }}
            onScheduleInterview={(cand) => setActiveCandidateForInterview(cand)}
            isUpdating={updateStatusMutation.isPending}
          />
        ) : (
          <div className="space-y-4">
          {filteredApplications.map((app) => {
            const candidate = app.candidate || {};
            const profile = candidate.profile || {};
            const resume = app.resume || {};

            return (
              <Card
                key={app.id}
                className="p-5 sm:p-6 border-slate-200 shadow-sm space-y-4 hover:border-brand-300 transition"
              >
                {/* Header: Candidate info + Status select */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-extrabold text-base sm:text-lg text-slate-900">
                        {profile.fullName || candidate.email || 'Candidate'}
                      </h3>
                      {getStatusBadge(app.status)}
                      {resume.qualityScore && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          <Sparkles className="w-3 h-3 text-emerald-500" />
                          {resume.qualityScore}% Match Score
                        </span>
                      )}
                    </div>

                    <p className="text-xs sm:text-sm font-medium text-slate-600">
                      {profile.headline || 'Job Applicant'} &bull;{' '}
                      <span className="text-slate-400">Applied for:</span>{' '}
                      <strong className="text-slate-800">{app.job?.title}</strong>
                    </p>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 pt-1">
                      {profile.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          {profile.location}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        {candidate.email}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        Applied {new Date(app.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {/* Move Stage Quick Action */}
                  <div className="flex items-center gap-2 self-start sm:self-center">
                    <span className="text-xs font-semibold text-slate-500">Stage:</span>
                    <select
                      value={app.status}
                      disabled={updateStatusMutation.isLoading}
                      onChange={(e) => handleStatusChange(app.id, e.target.value)}
                      className="rounded-xl border border-slate-300 text-xs font-bold py-1.5 px-3 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                    >
                      {STATUS_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Candidate Skills */}
                {profile.skills && profile.skills.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Candidate Skills:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {profile.skills.map((skill, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 text-xs font-medium"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Cover Note (if provided) */}
                {app.coverLetter && (
                  <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-200/70 text-xs space-y-1">
                    <span className="font-bold text-slate-700 text-[11px]">Candidate Cover Note:</span>
                    <p className="text-slate-600 italic">"{app.coverLetter}"</p>
                  </div>
                )}

                {/* Recruiter Notes display */}
                {app.recruiterNotes && (
                  <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-200/70 text-xs space-y-1">
                    <span className="font-bold text-amber-800 text-[11px] flex items-center gap-1">
                      <MessageSquare className="w-3 h-3 text-amber-600" />
                      Hiring Team Notes:
                    </span>
                    <p className="text-amber-900">{app.recruiterNotes}</p>
                  </div>
                )}

                {/* Footer details & Action buttons */}
                <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-3 text-slate-500">
                    <span className="flex items-center gap-1">
                      <FileText className="w-3.5 h-3.5 text-brand-600" />
                      {resume.title || 'Resume'} (v{resume.version || 1})
                    </span>
                    {resume.fileUrl && (
                      <a
                        href={resume.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="font-bold text-brand-600 hover:underline inline-flex items-center gap-1"
                      >
                        View Resume <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setActiveCandidateForInterview(app)}
                      className="text-xs font-semibold text-indigo-700 hover:bg-indigo-50 hover:border-indigo-300"
                    >
                      <Calendar className="w-3.5 h-3.5 mr-1 text-indigo-600" />
                      Schedule Interview
                    </Button>

                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setActiveCandidateForNote(app);
                        setNoteText(app.recruiterNotes || '');
                      }}
                      className="text-xs font-semibold text-slate-600 hover:text-slate-900"
                    >
                      <MessageSquare className="w-3.5 h-3.5 mr-1" />
                      {app.recruiterNotes ? 'Edit Notes' : 'Add Note'}
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
          </div>
        )
      )}

      {/* Recruiter Notes Modal */}
      {activeCandidateForNote && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-slate-900 text-base">Hiring Team Notes</h3>
              <button
                onClick={() => setActiveCandidateForNote(null)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                Close
              </button>
            </div>
            <p className="text-xs text-slate-500">
              Private notes visible only to recruiters and hiring managers reviewing this candidate.
            </p>
            <form onSubmit={handleSaveNotes} className="space-y-4">
              <textarea
                rows={4}
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Enter observations, interview feedback, or next steps..."
                className="w-full text-xs sm:text-sm p-3.5 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
              />
              <div className="flex items-center justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  type="button"
                  onClick={() => setActiveCandidateForNote(null)}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  type="submit"
                  isLoading={updateStatusMutation.isPending}
                  disabled={updateStatusMutation.isPending}
                >
                  Save Notes
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Schedule Interview Modal */}
      {activeCandidateForInterview && (
        <ScheduleInterviewModal
          isOpen={!!activeCandidateForInterview}
          application={activeCandidateForInterview}
          onClose={() => setActiveCandidateForInterview(null)}
        />
      )}
    </div>
  );
};

export default RecruiterApplicationsPage;
