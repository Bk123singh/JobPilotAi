import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { jobApi } from '../../api/jobApi';
import { useAuthStore } from '../../store/useAuthStore';
import { useUIStore } from '../../store/useUIStore';
import {
  Search,
  Briefcase,
  MapPin,
  DollarSign,
  Bookmark,
  Sparkles,
  ShieldCheck,
  Filter,
  SlidersHorizontal,
  Clock,
  ArrowRight,
  X,
  LogIn,
  Bell,
} from 'lucide-react';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Skeleton from '../../components/common/Skeleton';
import CreateAlertModal from '../../components/alerts/CreateAlertModal';

const WORKPLACE_TYPES = [
  { id: '', label: 'All Workplaces' },
  { id: 'REMOTE', label: 'Remote Only' },
  { id: 'HYBRID', label: 'Hybrid' },
  { id: 'ONSITE', label: 'On-Site' },
];

const JobsPage = () => {
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuthStore();
  const { addToast } = useUIStore();
  const [searchParams, setSearchParams] = useSearchParams();

  const currentTab = searchParams.get('tab') === 'recommended' ? 'recommended' : 'all';

  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedWorkplace, setSelectedWorkplace] = useState('');
  const [selectedSort, setSelectedSort] = useState('newest');
  const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);

  // Query all jobs
  const { data, isLoading } = useQuery({
    queryKey: ['jobs', debouncedSearch, selectedWorkplace, selectedSort],
    queryFn: () =>
      jobApi.listJobs({
        search: debouncedSearch,
        workplaceType: selectedWorkplace,
        sortBy: selectedSort,
      }),
  });

  // Query personalized recommendations
  const { data: recData, isLoading: isRecLoading } = useQuery({
    queryKey: ['recommendedJobs'],
    queryFn: jobApi.getRecommendations,
    enabled: currentTab === 'recommended' && isAuthenticated,
  });

  const allJobs = data?.data?.jobs || [];
  const rawRecs = recData?.data?.jobs || recData?.data?.recommendations || [];
  const recommendedJobs = rawRecs.map((r) => {
    if (r.job) {
      return { ...r.job, matchScore: r.matchBreakdown || r.matchScore };
    }
    return r;
  });

  const jobs = currentTab === 'recommended' ? recommendedJobs : allJobs;
  const isDisplayLoading = currentTab === 'recommended' ? isRecLoading : isLoading;

  // Bookmark Mutation
  const saveMutation = useMutation({
    mutationFn: (id) => jobApi.toggleSaveJob(id),
    onSuccess: (res, jobId) => {
      queryClient.setQueryData(
        ['jobs', debouncedSearch, selectedWorkplace, selectedSort],
        (old) => {
          if (!old?.data?.jobs) return old;
          return {
            ...old,
            data: {
              ...old.data,
              jobs: old.data.jobs.map((j) =>
                j.id === jobId ? { ...j, isSaved: res.data?.isSaved } : j
              ),
            },
          };
        }
      );
      addToast({
        message: res.message || 'Bookmark updated',
        type: 'success',
      });
    },
    onError: () => {
      addToast({ message: 'Failed to bookmark job', type: 'error' });
    },
  });

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setDebouncedSearch(searchTerm);
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setDebouncedSearch('');
    setSelectedWorkplace('');
    setSelectedSort('newest');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
      {/* Header & Search Bar */}
      <div className="space-y-4 max-w-3xl">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Discover High-Match Opportunities
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Browse verified openings tailored to your skills with transparent match scoring.
          </p>
        </div>

        {/* Category Tabs: All Openings vs Recommended For You */}
        <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-2xl border border-slate-200/80 w-fit">
          <button
            type="button"
            onClick={() => setSearchParams({ tab: 'all' })}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 ${
              currentTab === 'all'
                ? 'bg-white text-brand-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Briefcase className="w-4 h-4 text-slate-500" />
            All Openings ({allJobs.length})
          </button>

          <button
            type="button"
            onClick={() => {
              if (!isAuthenticated) {
                addToast({ message: 'Please sign in to see personalized match recommendations', type: 'info' });
              }
              setSearchParams({ tab: 'recommended' });
            }}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 ${
              currentTab === 'recommended'
                ? 'bg-brand-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            For You (Recommended)
          </button>
        </div>

        {/* Search Input Box */}
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Input
              placeholder="Search by title, skill (e.g. React), or company..."
              leftIcon={Search}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pr-8"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  setDebouncedSearch('');
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <Button type="submit" variant="primary" className="px-5 min-h-[46px]">
            Search
          </Button>
        </form>
      </div>

      {/* Filter and Sort Toolbar (Mobile-friendly scrolling pills) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200">
        {/* Workplace Type Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
          {WORKPLACE_TYPES.map((wp) => (
            <button
              key={wp.id}
              onClick={() => setSelectedWorkplace(wp.id)}
              className={`
                px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all
                ${selectedWorkplace === wp.id
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }
              `}
            >
              {wp.label}
            </button>
          ))}
        </div>

        {/* Sort Dropdown & Alert Trigger */}
        <div className="flex items-center gap-2 self-end sm:self-auto text-xs">
          <button
            type="button"
            onClick={() => {
              if (!isAuthenticated) {
                addToast({ message: 'Please log in to create a job alert', type: 'info' });
                return;
              }
              setIsAlertModalOpen(true);
            }}
            className="px-3 py-1.5 rounded-xl text-xs font-bold border border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition inline-flex items-center gap-1.5 shadow-2xs"
            title="Create an alert for these search criteria"
          >
            <Bell className="w-3.5 h-3.5 text-indigo-600" />
            Alert from Search
          </button>

          <span className="text-slate-500 font-medium hidden sm:inline">Sort by:</span>
          <select
            value={selectedSort}
            onChange={(e) => setSelectedSort(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white text-slate-700 py-1.5 px-2.5 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-brand-500"
          >
            <option value="newest">Most Recent</option>
            <option value="salary_high">Salary: High to Low</option>
            <option value="salary_low">Salary: Low to High</option>
          </select>
        </div>
      </div>

      {/* Results Count & Active Filter Indicator */}
      <div className="flex items-center justify-between text-xs text-slate-500">
        <p>
          Showing <span className="font-bold text-slate-900">{jobs.length}</span> active positions
        </p>
        {(debouncedSearch || selectedWorkplace || selectedSort !== 'newest') && (
          <button
            onClick={handleClearFilters}
            className="text-brand-600 hover:text-brand-800 font-semibold hover:underline"
          >
            Reset all filters
          </button>
        )}
      </div>

      {/* Unauthenticated Prompt for Recommended Tab */}
      {currentTab === 'recommended' && !isAuthenticated && (
        <Card className="p-8 text-center space-y-4 max-w-md mx-auto bg-gradient-to-br from-brand-50/60 to-indigo-50/60 border-brand-200">
          <div className="w-12 h-12 rounded-2xl bg-brand-600 text-white flex items-center justify-center mx-auto shadow-sm">
            <Sparkles className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="font-bold text-base text-slate-900">Personalized Match Intelligence</h3>
            <p className="text-xs text-slate-600">
              Sign in to your candidate account to unlock real-time recommendations calculated with our 5-pillar matching engine.
            </p>
          </div>
          <Link to="/login">
            <Button variant="primary" size="sm" className="shadow-sm">
              <LogIn className="w-4 h-4 mr-1.5" /> Sign In to View
            </Button>
          </Link>
        </Card>
      )}

      {/* Loading Skeleton */}
      {isDisplayLoading && (
        <div className="space-y-4">
          <Skeleton className="h-40 w-full rounded-2xl" />
          <Skeleton className="h-40 w-full rounded-2xl" />
          <Skeleton className="h-40 w-full rounded-2xl" />
        </div>
      )}

      {/* Empty State */}
      {!isDisplayLoading && jobs.length === 0 && (
        <Card className="p-12 text-center space-y-4 max-w-lg mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center mx-auto">
            <Briefcase className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="font-bold text-lg text-slate-900">
              {currentTab === 'recommended'
                ? 'No recommended openings yet'
                : 'No jobs match your search'}
            </h3>
            <p className="text-sm text-slate-500">
              {currentTab === 'recommended'
                ? 'Add skills and experience to your candidate profile to generate tailored AI matches.'
                : 'Try adjusting your search terms or clearing workplace filters to see more results.'}
            </p>
          </div>
          {currentTab === 'recommended' ? (
            <Link to="/profile">
              <Button variant="primary" size="sm">
                Update Profile Skills
              </Button>
            </Link>
          ) : (
            <Button variant="outline" size="sm" onClick={handleClearFilters}>
              Clear All Filters
            </Button>
          )}
        </Card>
      )}

      {/* Job Cards Grid */}
      <div className="space-y-4">
        {jobs.map((job) => (
          <Card
            key={job.id}
            hover
            className="p-5 sm:p-6 transition-all duration-200 border-slate-200 hover:border-brand-300"
          >
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              {/* Left Column: Company logo, Title, Details */}
              <div className="flex items-start space-x-3.5 sm:space-x-4 flex-1">
                {job.company?.logoUrl ? (
                  <img
                    src={job.company.logoUrl}
                    alt={job.company.name}
                    className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl object-cover border border-slate-200 shadow-sm flex-shrink-0"
                  />
                ) : (
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-brand-600 to-indigo-700 text-white flex items-center justify-center font-bold text-lg shadow-sm flex-shrink-0">
                    {job.company?.name?.charAt(0) || 'C'}
                  </div>
                )}

                <div className="space-y-1 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      to={`/jobs/${job.id}`}
                      className="text-base sm:text-lg font-bold text-slate-900 hover:text-brand-600 transition"
                    >
                      {job.title}
                    </Link>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="font-semibold text-slate-700 flex items-center gap-1">
                      {job.company?.name}
                      {job.company?.isVerified && (
                        <ShieldCheck
                          className="w-3.5 h-3.5 text-emerald-600 inline"
                          title="Verified Employer"
                        />
                      )}
                    </span>
                    <span className="text-slate-300">•</span>
                    <span className="text-slate-500 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      {job.location}
                    </span>
                  </div>

                  {/* Badges row: Workplace, Salary, Level */}
                  <div className="flex flex-wrap items-center gap-2 pt-1.5">
                    <Badge variant={job.workplaceType === 'REMOTE' ? 'green' : 'brand'}>
                      {job.workplaceType}
                    </Badge>

                    {job.minSalary && job.maxSalary && (
                      <span className="inline-flex items-center text-xs font-semibold text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-full">
                        ${(job.minSalary / 1000).toFixed(0)}k - ${(job.maxSalary / 1000).toFixed(0)}k / yr
                      </span>
                    )}

                    {job.experienceLevel && (
                      <span className="text-[11px] text-slate-500 font-medium hidden sm:inline-block">
                        {job.experienceLevel}
                      </span>
                    )}
                  </div>

                  {/* Required Skills Chips */}
                  {job.requiredSkills?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-2">
                      {job.requiredSkills.map((skill) => (
                        <span
                          key={skill}
                          className="text-[11px] font-medium bg-slate-50 text-slate-600 border border-slate-200 px-2 py-0.5 rounded-md"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Actions & Deterministic Match Score */}
              <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-3 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100 flex-shrink-0">
                {/* Deterministic Match Score Pill */}
                {job.matchScore ? (
                  <div
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-bold ${
                      job.matchScore.overallScore >= 85
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                        : job.matchScore.overallScore >= 70
                        ? 'bg-brand-50 border-brand-200 text-brand-800'
                        : 'bg-amber-50 border-amber-200 text-amber-800'
                    }`}
                    title={job.matchScore.tierLabel}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    {job.matchScore.overallScore}% Match
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-50 border border-slate-200 text-slate-600 text-xs font-semibold">
                    <Sparkles className="w-3.5 h-3.5 text-slate-400" />
                    Match Preview
                  </div>
                )}

                <div className="flex items-center gap-2">
                  {isAuthenticated && (
                    <button
                      type="button"
                      onClick={() => saveMutation.mutate(job.id)}
                      className={`p-2.5 rounded-xl border transition active:scale-95 ${
                        job.isSaved
                          ? 'bg-brand-50 border-brand-300 text-brand-600'
                          : 'border-slate-200 text-slate-400 hover:text-slate-600 hover:bg-slate-50'
                      }`}
                      title={job.isSaved ? 'Remove Bookmark' : 'Save Job'}
                    >
                      <Bookmark
                        className={`w-4 h-4 ${job.isSaved ? 'fill-brand-600 text-brand-600' : ''}`}
                      />
                    </button>
                  )}

                  <Link to={`/jobs/${job.id}`}>
                    <Button variant="primary" size="sm" className="font-semibold shadow-sm text-xs">
                      View Details
                      <ArrowRight className="w-3.5 h-3.5 ml-1" />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Create Alert from Search Modal */}
      <CreateAlertModal
        isOpen={isAlertModalOpen}
        onClose={() => setIsAlertModalOpen(false)}
        initialData={{
          search: debouncedSearch || searchTerm,
          workplaceType: selectedWorkplace,
        }}
      />
    </div>
  );
};

export default JobsPage;
