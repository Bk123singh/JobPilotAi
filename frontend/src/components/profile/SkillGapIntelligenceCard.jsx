import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  TrendingUp,
  Plus,
  Check,
  AlertCircle,
  Briefcase,
  ArrowRight,
  Layers,
} from 'lucide-react';
import { profileApi } from '../../api/profileApi';
import { useUIStore } from '../../store/useUIStore';
import Card from '../common/Card';
import Badge from '../common/Badge';
import Button from '../common/Button';
import Skeleton from '../common/Skeleton';

const SkillGapIntelligenceCard = () => {
  const queryClient = useQueryClient();
  const { addToast } = useUIStore();

  // 1. Fetch current profile
  const { data: profileData } = useQuery({
    queryKey: ['myProfile'],
    queryFn: profileApi.getMyProfile,
  });
  const currentSkills = profileData?.data?.profile?.skills || [];

  // 2. Fetch market skill gap intelligence
  const { data: gapData, isLoading, isError } = useQuery({
    queryKey: ['skillGapIntelligence'],
    queryFn: profileApi.getSkillGaps,
  });

  const intelligence = gapData?.data?.intelligence;

  // 3. Add skill mutation
  const addSkillMutation = useMutation({
    mutationFn: (newSkill) => {
      const updatedSkills = Array.from(new Set([...currentSkills, newSkill]));
      return profileApi.updateMyProfile({ skills: updatedSkills });
    },
    onSuccess: (_, skill) => {
      queryClient.invalidateQueries(['myProfile']);
      queryClient.invalidateQueries(['skillGapIntelligence']);
      queryClient.invalidateQueries(['recommendedJobs']);
      addToast({
        message: `Added "${skill}" to your skills! Your match score will increase across open roles.`,
        type: 'success',
      });
    },
    onError: () => {
      addToast({ message: 'Failed to update skills. Please try again.', type: 'error' });
    },
  });

  if (isLoading) {
    return <Skeleton className="h-48 w-full rounded-3xl" />;
  }

  if (isError || !intelligence) {
    return null;
  }

  const { topGaps = [], projectedBoost, summary, jobsAnalyzed } = intelligence;

  return (
    <Card className="p-6 bg-gradient-to-br from-indigo-50/40 via-white to-brand-50/40 border-brand-200/80 shadow-sm space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-brand-600 text-white flex items-center justify-center shadow-md">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-base text-slate-900">
                Market Skill Gap Intelligence
              </h3>
              <Badge variant="purple">AI Opportunity</Badge>
            </div>
            <p className="text-xs text-slate-500">
              Analyzed against {jobsAnalyzed} active hiring opportunities in your field.
            </p>
          </div>
        </div>

        {projectedBoost && (
          <div className="self-start sm:self-center px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-black flex items-center gap-1.5 shadow-2xs">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
            Projected Boost: {projectedBoost}
          </div>
        )}
      </div>

      {/* Natural language summary */}
      {summary && (
        <div className="p-3.5 bg-white rounded-2xl border border-slate-200/90 text-xs text-slate-700 leading-relaxed font-medium">
          💡 {summary}
        </div>
      )}

      {/* Skill Gaps Tray */}
      {topGaps.length > 0 ? (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-brand-600" />
              Highest In-Demand Missing Skills:
            </span>
            <span className="text-[11px] text-slate-400">1-Tap to add if you have experience</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {topGaps.map((gap, idx) => (
              <div
                key={idx}
                className="p-3 bg-white rounded-2xl border border-slate-200/80 flex items-center justify-between gap-3 shadow-2xs hover:border-brand-300 transition"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-extrabold text-slate-900 truncate">
                      {gap.skill}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.2 rounded-md ${
                        gap.demand === 'High Demand'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                      }`}
                    >
                      {gap.demand}
                    </span>
                  </div>
                  <span className="text-[11px] font-bold text-emerald-600 block">
                    {gap.averageBoost} Match Boost
                  </span>
                </div>

                <Button
                  size="sm"
                  variant="outline"
                  disabled={addSkillMutation.isLoading}
                  onClick={() => addSkillMutation.mutate(gap.skill)}
                  className="text-xs font-bold px-2.5 py-1 h-auto rounded-xl flex-shrink-0 hover:bg-brand-50 hover:text-brand-700 hover:border-brand-300"
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Add Skill
                </Button>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2 font-medium">
          <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>You currently possess all high-demand skills for active market postings!</span>
        </div>
      )}

      {/* Footer link to recommended jobs */}
      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
        <span className="text-slate-500">Discover openings matched to your current stack</span>
        <Link
          to="/jobs?tab=recommended"
          className="font-bold text-brand-600 hover:text-brand-700 inline-flex items-center gap-1"
        >
          View Recommended Jobs
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </Card>
  );
};

export default SkillGapIntelligenceCard;
