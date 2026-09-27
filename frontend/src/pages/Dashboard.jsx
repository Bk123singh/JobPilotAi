import React from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../store/useAuthStore';
import { interviewApi } from '../api/interviewApi';
import {
  Sparkles,
  FileText,
  Briefcase,
  Target,
  CheckCircle2,
  Clock,
  ArrowRight,
  TrendingUp,
  PlusCircle,
  Building2,
  Calendar,
} from 'lucide-react';
import Card, { CardBody, CardHeader } from '../components/common/Card';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import UpcomingInterviewsCard from '../components/interviews/UpcomingInterviewsCard';

const Dashboard = () => {
  const { user } = useAuthStore();
  const location = useLocation();

  if (user?.role === 'ADMIN' && !location.pathname.startsWith('/recruiter')) {
    return <Navigate to="/admin" replace />;
  }

  const isRecruiter = user?.role === 'RECRUITER' || (user?.role === 'ADMIN' && location.pathname.startsWith('/recruiter'));

  const { data: interviewData } = useQuery({
    queryKey: isRecruiter ? ['recruiterInterviews'] : ['candidateInterviews'],
    queryFn: isRecruiter
      ? interviewApi.getRecruiterInterviews
      : interviewApi.getCandidateInterviews,
    enabled: !!user && user.role !== 'ADMIN',
  });

  const scheduledInterviewsCount =
    interviewData?.data?.interviews?.filter((i) => i.status === 'SCHEDULED')?.length || 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-brand-600 to-indigo-700 rounded-3xl p-6 sm:p-8 text-white shadow-lg shadow-brand-500/10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="brand" className="bg-white/20 text-white border-white/30 text-xs">
                {isRecruiter ? 'Recruiter Console' : 'Candidate Workspace'}
              </Badge>
              {!user?.isEmailVerified && (
                <span className="text-xs bg-amber-400 text-slate-900 font-semibold px-2.5 py-0.5 rounded-full">
                  Verification Pending
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Welcome back, {user?.fullName || 'User'}!
            </h1>
            <p className="text-brand-100 text-sm max-w-xl">
              {isRecruiter
                ? `Manage your active openings for ${user?.company?.name || 'your company'} and review matching applicants.`
                : 'Track your applications, upload tailored resumes, and discover high-match positions.'}
            </p>
          </div>

          <div className="flex flex-wrap gap-2 sm:self-center">
            {isRecruiter ? (
              <Link to="/recruiter/jobs/create">
                <Button variant="secondary" className="bg-white text-brand-700 hover:bg-brand-50 font-semibold shadow-sm">
                  <PlusCircle className="w-4 h-4 mr-2 text-brand-600" />
                  Post New Job
                </Button>
              </Link>
            ) : (
              <Link to="/resumes">
                <Button variant="secondary" className="bg-white text-brand-700 hover:bg-brand-50 font-semibold shadow-sm">
                  <FileText className="w-4 h-4 mr-2 text-brand-600" />
                  Manage Resumes
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        <Card className="p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-slate-500 uppercase">
              {isRecruiter ? 'Active Jobs' : 'Applications'}
            </p>
            <div className="w-8 h-8 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center">
              <Briefcase className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">0</p>
          <p className="text-[11px] text-slate-500 mt-1">Updated just now</p>
        </Card>

        <Card className="p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-slate-500 uppercase">
              {isRecruiter ? 'Candidates in Pipeline' : 'Saved Jobs'}
            </p>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <Target className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">0</p>
          <p className="text-[11px] text-slate-500 mt-1">In review</p>
        </Card>

        <Card className="p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-slate-500 uppercase">
              {isRecruiter ? 'Interviews Set' : 'Interviews'}
            </p>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">
            {scheduledInterviewsCount}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">Upcoming</p>
        </Card>

        <Card className="p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-slate-500 uppercase">
              {isRecruiter ? 'Offers Sent' : 'Avg Match Score'}
            </p>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">
            {isRecruiter ? '0' : '92%'}
          </p>
          <p className="text-[11px] text-emerald-600 font-medium mt-1">Deterministic AI</p>
        </Card>
      </div>

      {/* Upcoming Interviews Section */}
      <UpcomingInterviewsCard isRecruiter={isRecruiter} />

      {/* Two Column Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Main Action Area */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-lg text-slate-900">
                {isRecruiter ? 'Job Postings & Candidates' : 'Recommended Next Steps'}
              </h2>
              <Badge variant="brand">Phase 1 & 2 Active</Badge>
            </div>

            <div className="space-y-3">
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <p className="font-semibold text-sm text-slate-800">
                    {isRecruiter ? '1. Configure Company Profile' : '1. Complete Your Candidate Profile'}
                  </p>
                  <p className="text-xs text-slate-500">
                    Add skills, experience, and career preferences to empower the matching engine.
                  </p>
                </div>
                <Link to={isRecruiter ? '/recruiter/company' : '/profile'}>
                  <Button variant="outline" size="sm" className="w-full sm:w-auto text-xs">
                    Edit Profile
                  </Button>
                </Link>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <p className="font-semibold text-sm text-slate-800">
                    {isRecruiter ? '2. Publish Your First Opening' : '2. Upload Your Resume'}
                  </p>
                  <p className="text-xs text-slate-500">
                    {isRecruiter
                      ? 'Specify required skills and salary range to attract qualified applicants.'
                      : 'Securely upload your PDF or DOCX resume with Cloudinary storage.'}
                  </p>
                </div>
                <Link to={isRecruiter ? '/recruiter/jobs/create' : '/resumes'}>
                  <Button variant="outline" size="sm" className="w-full sm:w-auto text-xs">
                    Get Started
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        </div>

        {/* Right 1 Col: Account Details & Session Info */}
        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="font-bold text-base text-slate-900 mb-3">Account Information</h3>
            <div className="space-y-3 text-xs">
              <div>
                <p className="text-slate-400 font-semibold uppercase">Email</p>
                <p className="font-medium text-slate-800 text-sm mt-0.5">{user?.email}</p>
              </div>
              <div>
                <p className="text-slate-400 font-semibold uppercase">Role</p>
                <Badge variant={isRecruiter ? 'purple' : 'brand'} className="mt-1">
                  {user?.role}
                </Badge>
              </div>
              <div>
                <p className="text-slate-400 font-semibold uppercase">Email Verification</p>
                <p className="font-medium text-slate-700 mt-0.5 flex items-center gap-1">
                  {user?.isEmailVerified ? (
                    <span className="text-emerald-600 flex items-center gap-1 font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                    </span>
                  ) : (
                    <span className="text-amber-600 font-medium">Pending confirmation</span>
                  )}
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
