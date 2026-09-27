import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Calendar,
  Clock,
  Video,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Building2,
  User,
  ChevronRight,
  MoreVertical,
  CalendarCheck2,
} from 'lucide-react';
import { interviewApi } from '../../api/interviewApi';
import { useAuthStore } from '../../store/useAuthStore';
import { useUIStore } from '../../store/useUIStore';
import Card, { CardHeader } from '../common/Card';
import Badge from '../common/Badge';
import Button from '../common/Button';
import Skeleton from '../common/Skeleton';

// Format Google Calendar URL
const createGoogleCalendarUrl = (interview) => {
  const typeLabel = (interview.type || interview.interviewType || 'Technical').replace('_', ' ');
  const jobTitle = interview.application?.job?.title || interview.job?.title || 'Job Opening';
  const companyName = interview.application?.job?.company?.name || interview.job?.company?.name || 'Company';
  const title = encodeURIComponent(interview.title || `${typeLabel} Interview: ${jobTitle}`);
  const details = encodeURIComponent(
    `JobPilot AI Interview\nCompany: ${companyName}\nRole: ${jobTitle}\nMeeting Link: ${interview.meetingUrl || ''}\nNotes: ${interview.notes || ''}`
  );
  const location = encodeURIComponent(interview.meetingUrl || 'Remote Video Call');

  const start = new Date(interview.scheduledAt);
  const end = new Date(start.getTime() + (interview.durationMinutes || 45) * 60 * 1000);

  const formatGCalDate = (d) =>
    d.toISOString().replace(/-|:|\.\d+/g, '');

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${formatGCalDate(start)}/${formatGCalDate(end)}&details=${details}&location=${location}`;
};

// Calculate friendly human readable countdown
const getCountdownLabel = (scheduledDateStr) => {
  const target = new Date(scheduledDateStr);
  const now = new Date();
  const diffMs = target.getTime() - now.getTime();
  const diffMins = Math.round(diffMs / (1000 * 60));
  const diffHours = Math.round(diffMs / (1000 * 60 * 60));
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (diffMs < 0 && Math.abs(diffMins) < 90) {
    return { text: 'In Progress Now', color: 'bg-emerald-500 text-white animate-pulse' };
  }
  if (diffMs < 0) {
    return { text: 'Completed / Past', color: 'bg-slate-100 text-slate-500' };
  }
  if (diffHours < 1) {
    return { text: `Starting in ${diffMins} mins!`, color: 'bg-rose-500 text-white font-black animate-pulse' };
  }
  if (diffHours <= 12) {
    return { text: `Today at ${target.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`, color: 'bg-amber-100 text-amber-900 border border-amber-300' };
  }
  if (diffDays === 1) {
    return { text: `Tomorrow at ${target.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`, color: 'bg-indigo-50 text-indigo-700 border border-indigo-200' };
  }
  return { text: `In ${diffDays} days (${target.toLocaleDateString()})`, color: 'bg-slate-100 text-slate-700 border border-slate-200' };
};

const UpcomingInterviewsCard = ({ isRecruiter = false, title = 'Upcoming Interviews' }) => {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const { addToast } = useUIStore();
  const [activeMenuId, setActiveMenuId] = useState(null);

  const recruiterMode = isRecruiter || user?.role === 'RECRUITER' || user?.role === 'ADMIN';

  const { data, isLoading, isError } = useQuery({
    queryKey: recruiterMode ? ['recruiterInterviews'] : ['candidateInterviews'],
    queryFn: recruiterMode
      ? interviewApi.getRecruiterInterviews
      : interviewApi.getCandidateInterviews,
    enabled: !!user,
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }) => interviewApi.updateInterview(id, { status }),
    onSuccess: (res) => {
      queryClient.invalidateQueries(['recruiterInterviews']);
      queryClient.invalidateQueries(['candidateInterviews']);
      queryClient.invalidateQueries(['recruiterApplications']);
      addToast({ message: 'Interview status updated', type: 'success' });
      setActiveMenuId(null);
    },
    onError: () => {
      addToast({ message: 'Failed to update interview', type: 'error' });
    },
  });

  const interviews = data?.data?.interviews || [];
  const upcomingList = interviews.filter((item) => item.status === 'SCHEDULED');

  if (isLoading) {
    return <Skeleton className="h-44 w-full rounded-3xl" />;
  }

  if (isError) {
    return null;
  }

  return (
    <Card className="p-5 sm:p-6 border-indigo-100/80 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-sm">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-base text-slate-900">{title}</h3>
            <p className="text-xs text-slate-500">
              {recruiterMode
                ? 'Interviews scheduled with candidates across your openings.'
                : 'Confirmed interview sessions with hiring teams.'}
            </p>
          </div>
        </div>

        <Badge variant={upcomingList.length > 0 ? 'brand' : 'gray'}>
          {upcomingList.length} Scheduled
        </Badge>
      </div>

      {/* Empty State */}
      {upcomingList.length === 0 ? (
        <div className="py-8 text-center space-y-2 border-2 border-dashed border-slate-200/80 rounded-2xl">
          <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <CalendarCheck2 className="w-5 h-5" />
          </div>
          <p className="text-xs font-semibold text-slate-700">No upcoming interviews</p>
          <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
            {recruiterMode
              ? 'Advance candidates to the INTERVIEW stage or click "Schedule Interview" from the applicant board.'
              : 'As recruiters review your profile, scheduled interview invites will appear here.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {upcomingList.map((interview) => {
            const app = interview.application || {};
            const job = app.job || interview.job || {};
            const company = job.company || interview.company || {};
            const candidate = app.candidate || interview.candidate || {};
            const countdown = getCountdownLabel(interview.scheduledAt);
            const dateObj = new Date(interview.scheduledAt);
            const interviewTypeLabel = (interview.type || interview.interviewType || 'TECHNICAL').replace('_', ' ');
            const displayTitle = interview.title || `${interviewTypeLabel} Interview`;

            return (
              <div
                key={interview.id}
                className="p-4 rounded-2xl border border-slate-200 bg-white hover:border-indigo-300 transition shadow-2xs space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-extrabold text-sm text-slate-900">
                        {displayTitle}
                      </span>
                      <Badge variant="purple" className="text-[10px]">
                        {interviewTypeLabel}
                      </Badge>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
                      {recruiterMode ? (
                        <span className="flex items-center gap-1 font-semibold text-slate-800">
                          <User className="w-3.5 h-3.5 text-brand-600" />
                          {candidate.profile?.fullName || candidate.email}
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 font-semibold text-slate-800">
                          <Building2 className="w-3.5 h-3.5 text-brand-600" />
                          {company.name || 'Hiring Company'}
                        </span>
                      )}
                      <span className="text-slate-300">&bull;</span>
                      <span className="text-slate-500">{job.title || 'Role'}</span>
                    </div>
                  </div>

                  {/* Countdown Badge */}
                  <span
                    className={`inline-flex items-center gap-1 text-[11px] font-black px-2.5 py-1 rounded-full self-start sm:self-auto ${countdown.color}`}
                  >
                    <Clock className="w-3 h-3" />
                    {countdown.text}
                  </span>
                </div>

                {/* Date, Time & Duration Row */}
                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 bg-slate-50/80 p-2.5 rounded-xl border border-slate-100">
                  <div className="flex items-center gap-1.5 font-medium text-slate-700">
                    <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                    {dateObj.toLocaleDateString(undefined, {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </div>
                  <div className="flex items-center gap-1.5 font-medium text-slate-700">
                    <Clock className="w-3.5 h-3.5 text-indigo-600" />
                    {dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    <span className="text-slate-400">({interview.durationMinutes} mins)</span>
                  </div>
                </div>

                {/* Candidate Notes if provided */}
                {interview.notes && (
                  <p className="text-xs text-slate-600 bg-indigo-50/40 p-2 rounded-xl border border-indigo-100/60 leading-relaxed">
                    <strong className="text-indigo-900 font-semibold">Notes:</strong>{' '}
                    {interview.notes}
                  </p>
                )}

                {/* Action Buttons: Join Meeting + Add to Google Calendar */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <div className="flex flex-wrap items-center gap-2">
                    {interview.meetingUrl && (
                      <a
                        href={interview.meetingUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 text-xs font-bold transition shadow-xs"
                      >
                        <Video className="w-3.5 h-3.5" />
                        Join Video Meeting
                      </a>
                    )}

                    <a
                      href={createGoogleCalendarUrl(interview)}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900 text-xs font-semibold transition"
                    >
                      <CalendarCheck2 className="w-3.5 h-3.5 text-brand-600" />
                      Add to Calendar
                    </a>
                  </div>

                  {recruiterMode && (
                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          updateStatusMutation.mutate({
                            id: interview.id,
                            status: 'COMPLETED',
                          })
                        }
                        className="text-xs text-emerald-700 hover:bg-emerald-50 hover:border-emerald-300"
                        title="Mark interview as completed"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                        Complete
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          updateStatusMutation.mutate({
                            id: interview.id,
                            status: 'CANCELLED',
                          })
                        }
                        className="text-xs text-rose-600 hover:bg-rose-50"
                        title="Cancel this interview"
                      >
                        Cancel
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
};

export default UpcomingInterviewsCard;
