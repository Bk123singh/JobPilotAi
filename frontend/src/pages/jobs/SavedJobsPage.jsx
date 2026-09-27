import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { jobApi } from '../../api/jobApi';
import { useUIStore } from '../../store/useUIStore';
import {
  Bookmark,
  Briefcase,
  MapPin,
  Sparkles,
  ArrowRight,
  Trash2,
  ShieldCheck,
} from 'lucide-react';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Skeleton from '../../components/common/Skeleton';

const SavedJobsPage = () => {
  const queryClient = useQueryClient();
  const { addToast } = useUIStore();

  const { data, isLoading } = useQuery({
    queryKey: ['savedJobs'],
    queryFn: jobApi.listSavedJobs,
  });

  const jobs = data?.data?.jobs || [];

  const unsaveMutation = useMutation({
    mutationFn: (id) => jobApi.toggleSaveJob(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savedJobs'] });
      addToast({ message: 'Job removed from bookmarks', type: 'info' });
    },
  });

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-4">
        <Skeleton className="h-32 w-full rounded-2xl" />
        <Skeleton className="h-32 w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Saved Jobs</h1>
          <p className="text-sm text-slate-600">Your bookmarked career opportunities.</p>
        </div>
        <Badge variant="brand">{jobs.length} Saved</Badge>
      </div>

      {jobs.length === 0 ? (
        <Card className="p-12 text-center space-y-4 max-w-md mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center mx-auto">
            <Bookmark className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="font-bold text-lg text-slate-900">No saved jobs yet</h3>
            <p className="text-sm text-slate-500">
              Bookmark interesting opportunities while browsing to review and apply later.
            </p>
          </div>
          <Link to="/jobs">
            <Button variant="primary">Explore Jobs</Button>
          </Link>
        </Card>
      ) : (
        <div className="space-y-4">
          {jobs.map((job) => (
            <Card key={job.id} hover className="p-5 sm:p-6 transition-all border-slate-200">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="flex items-start space-x-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center font-bold text-lg flex-shrink-0">
                    {job.company?.name?.charAt(0) || 'C'}
                  </div>
                  <div className="space-y-1">
                    <Link
                      to={`/jobs/${job.id}`}
                      className="font-bold text-base text-slate-900 hover:text-brand-600"
                    >
                      {job.title}
                    </Link>
                    <p className="text-xs text-slate-500 flex items-center gap-1">
                      {job.company?.name} • <MapPin className="w-3 h-3 text-slate-400" />{' '}
                      {job.location}
                    </p>
                    <div className="flex items-center gap-2 pt-1">
                      <Badge variant={job.workplaceType === 'REMOTE' ? 'green' : 'brand'}>
                        {job.workplaceType}
                      </Badge>
                      {job.minSalary && job.maxSalary && (
                        <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-full">
                          ${(job.minSalary / 1000).toFixed(0)}k - ${(job.maxSalary / 1000).toFixed(0)}k
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <button
                    onClick={() => unsaveMutation.mutate(job.id)}
                    className="p-2 text-slate-400 hover:text-red-600 rounded-lg hover:bg-slate-50"
                    title="Remove Bookmark"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <Link to={`/jobs/${job.id}`}>
                    <Button variant="primary" size="sm" className="text-xs font-semibold">
                      View Job
                      <ArrowRight className="w-3.5 h-3.5 ml-1" />
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default SavedJobsPage;
