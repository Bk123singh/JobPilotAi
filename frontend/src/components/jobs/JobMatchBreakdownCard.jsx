import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  Briefcase,
  Layers,
  Award,
  Compass,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  LogIn,
} from 'lucide-react';
import Card from '../common/Card';
import Badge from '../common/Badge';
import Button from '../common/Button';

const getScoreColor = (score) => {
  if (score >= 85) return 'text-emerald-600 bg-emerald-50 border-emerald-200';
  if (score >= 70) return 'text-brand-600 bg-brand-50 border-brand-200';
  if (score >= 50) return 'text-amber-600 bg-amber-50 border-amber-200';
  return 'text-slate-600 bg-slate-50 border-slate-200';
};

const getBarColor = (score) => {
  if (score >= 85) return 'bg-emerald-500';
  if (score >= 70) return 'bg-brand-500';
  if (score >= 50) return 'bg-amber-500';
  return 'bg-slate-400';
};

const JobMatchBreakdownCard = ({ breakdown, isAuthenticated, isCandidate = true }) => {
  const [showFormulaDetails, setShowFormulaDetails] = useState(false);

  // If candidate is not authenticated or not a candidate account
  if (!isAuthenticated) {
    return (
      <Card className="p-6 bg-gradient-to-br from-brand-50/60 via-white to-indigo-50/40 border-brand-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-2xl bg-brand-600 text-white flex items-center justify-center shadow-md">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900">
                Personalized Job Match Engine
              </h3>
              <p className="text-xs text-slate-500">
                Sign in to see your deterministic 5-pillar compatibility score, matching skills, and missing skill gaps.
              </p>
            </div>
          </div>
          <Link to="/login">
            <Button size="sm" variant="primary" className="whitespace-nowrap shadow-sm">
              <LogIn className="w-4 h-4 mr-1.5" />
              Sign In to View Score
            </Button>
          </Link>
        </div>
      </Card>
    );
  }

  if (!isCandidate) {
    return null; // Recruiters don't need candidate self-match
  }

  if (!breakdown) {
    return null;
  }

  const { overallScore, tierLabel, tierColor, pillars = {}, skillGaps = [], explanation } = breakdown;
  const { skills, experience, semantic, projects, preferences } = pillars;

  return (
    <Card className="p-6 bg-gradient-to-br from-white via-slate-50/30 to-brand-50/20 border-slate-200 shadow-sm space-y-6">
      {/* 1. Score Overview Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div className="flex items-center space-x-4">
          {/* Radial score circle */}
          <div
            className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex flex-col items-center justify-center font-black text-xl sm:text-2xl border shadow-sm flex-shrink-0 ${getScoreColor(
              overallScore
            )}`}
          >
            <span>{overallScore}%</span>
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-extrabold text-base sm:text-lg text-slate-900">
                Job Match Score
              </h3>
              <Badge variant={tierColor || 'green'}>{tierLabel || 'Match Calculated'}</Badge>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Deterministic 5-pillar calculation based on your verified skills, experience, and preferences.
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowFormulaDetails(!showFormulaDetails)}
          className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700 transition self-start sm:self-center"
        >
          <HelpCircle className="w-3.5 h-3.5" />
          {showFormulaDetails ? 'Hide Weights' : 'How is this calculated?'}
          {showFormulaDetails ? (
            <ChevronUp className="w-3.5 h-3.5" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5" />
          )}
        </button>
      </div>

      {/* Optional Formula Explainer Accordion */}
      {showFormulaDetails && (
        <div className="p-4 rounded-2xl bg-brand-50/60 border border-brand-200/80 text-xs text-slate-700 space-y-2 animate-in fade-in duration-150">
          <p className="font-bold text-brand-900">5-Pillar Deterministic Matching Formula:</p>
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 text-[11px]">
            <div className="p-2 bg-white rounded-xl border border-brand-200">
              <span className="font-bold text-slate-900">1. Skills (40%)</span>
              <p className="text-slate-500">Required & nice-to-have technical skills match</p>
            </div>
            <div className="p-2 bg-white rounded-xl border border-brand-200">
              <span className="font-bold text-slate-900">2. Experience (20%)</span>
              <p className="text-slate-500">Years of background vs job seniority level</p>
            </div>
            <div className="p-2 bg-white rounded-xl border border-brand-200">
              <span className="font-bold text-slate-900">3. Semantic (20%)</span>
              <p className="text-slate-500">Title, headline, and domain keywords</p>
            </div>
            <div className="p-2 bg-white rounded-xl border border-brand-200">
              <span className="font-bold text-slate-900">4. Projects (10%)</span>
              <p className="text-slate-500">Portfolio & project stack alignment</p>
            </div>
            <div className="p-2 bg-white rounded-xl border border-brand-200">
              <span className="font-bold text-slate-900">5. Preferences (10%)</span>
              <p className="text-slate-500">Workplace mode, location & salary</p>
            </div>
          </div>
        </div>
      )}

      {/* 2. 5-Pillar Score Meters */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {/* Pillar 1: Skills */}
        <div className="p-3.5 bg-white rounded-2xl border border-slate-200/90 shadow-sm space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-brand-600" />
              Skills
            </span>
            <span className="text-[10px] text-slate-400 font-bold">40%</span>
          </div>
          <p className="text-lg font-black text-slate-900">{skills?.score || 0}%</p>
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div
              className={`h-2 rounded-full transition-all duration-500 ${getBarColor(
                skills?.score || 0
              )}`}
              style={{ width: `${skills?.score || 0}%` }}
            />
          </div>
        </div>

        {/* Pillar 2: Experience */}
        <div className="p-3.5 bg-white rounded-2xl border border-slate-200/90 shadow-sm space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium flex items-center gap-1">
              <Briefcase className="w-3.5 h-3.5 text-brand-600" />
              Experience
            </span>
            <span className="text-[10px] text-slate-400 font-bold">20%</span>
          </div>
          <p className="text-lg font-black text-slate-900">{experience?.score || 0}%</p>
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div
              className={`h-2 rounded-full transition-all duration-500 ${getBarColor(
                experience?.score || 0
              )}`}
              style={{ width: `${experience?.score || 0}%` }}
            />
          </div>
        </div>

        {/* Pillar 3: Semantic */}
        <div className="p-3.5 bg-white rounded-2xl border border-slate-200/90 shadow-sm space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-brand-600" />
              Semantic
            </span>
            <span className="text-[10px] text-slate-400 font-bold">20%</span>
          </div>
          <p className="text-lg font-black text-slate-900">{semantic?.score || 0}%</p>
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div
              className={`h-2 rounded-full transition-all duration-500 ${getBarColor(
                semantic?.score || 0
              )}`}
              style={{ width: `${semantic?.score || 0}%` }}
            />
          </div>
        </div>

        {/* Pillar 4: Projects */}
        <div className="p-3.5 bg-white rounded-2xl border border-slate-200/90 shadow-sm space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium flex items-center gap-1">
              <Award className="w-3.5 h-3.5 text-brand-600" />
              Projects
            </span>
            <span className="text-[10px] text-slate-400 font-bold">10%</span>
          </div>
          <p className="text-lg font-black text-slate-900">{projects?.score || 0}%</p>
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div
              className={`h-2 rounded-full transition-all duration-500 ${getBarColor(
                projects?.score || 0
              )}`}
              style={{ width: `${projects?.score || 0}%` }}
            />
          </div>
        </div>

        {/* Pillar 5: Preferences */}
        <div className="p-3.5 bg-white rounded-2xl border border-slate-200/90 shadow-sm space-y-1.5 col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium flex items-center gap-1">
              <Compass className="w-3.5 h-3.5 text-brand-600" />
              Preferences
            </span>
            <span className="text-[10px] text-slate-400 font-bold">10%</span>
          </div>
          <p className="text-lg font-black text-slate-900">{preferences?.score || 0}%</p>
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div
              className={`h-2 rounded-full transition-all duration-500 ${getBarColor(
                preferences?.score || 0
              )}`}
              style={{ width: `${preferences?.score || 0}%` }}
            />
          </div>
        </div>
      </div>

      {/* 3. Matched Skills & Skill Gaps Comparison Tray */}
      <div className="space-y-4 pt-2 border-t border-slate-100">
        {/* Matched Skills */}
        {skills?.matched && skills.matched.length > 0 && (
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Matching Skills Found ({skills.matched.length})
            </span>
            <div className="flex flex-wrap items-center gap-2">
              {skills.matched.map((skill, sIdx) => (
                <span
                  key={sIdx}
                  className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold"
                >
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  {skill}
                </span>
              ))}
              {skills?.niceToHaveMatched &&
                skills.niceToHaveMatched.map((skill, nIdx) => (
                  <span
                    key={`nice-${nIdx}`}
                    className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-xl bg-brand-50 text-brand-800 border border-brand-200 font-medium"
                  >
                    + {skill} (Bonus)
                  </span>
                ))}
            </div>
          </div>
        )}

        {/* Skill Gaps & Recommended Upskilling */}
        {skillGaps && skillGaps.length > 0 ? (
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-700 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              Skill Gaps to Close ({skillGaps.length})
            </span>
            <div className="flex flex-wrap items-center gap-2">
              {skillGaps.map((gap, gIdx) => (
                <span
                  key={gIdx}
                  className="inline-flex items-center gap-2 text-xs px-3 py-1.5 rounded-xl bg-amber-50 text-amber-900 border border-amber-200 font-semibold shadow-2xs"
                >
                  <span>{gap.skill}</span>
                  <span className="text-[10px] font-black px-1.5 py-0.5 rounded-md bg-amber-200 text-amber-800">
                    {gap.impact} boost
                  </span>
                </span>
              ))}
            </div>
          </div>
        ) : (
          <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2 font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>Zero required skill gaps! You satisfy all core technical requirements for this role.</span>
          </div>
        )}
      </div>

      {/* 4. Natural Language Match Explanation */}
      {explanation && (
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs text-slate-700 space-y-1.5">
          <span className="font-bold text-slate-900 flex items-center gap-1 text-[11px] uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-brand-600" />
            Fit Analysis Summary
          </span>
          <p className="leading-relaxed text-slate-600">{explanation}</p>
        </div>
      )}
    </Card>
  );
};

export default JobMatchBreakdownCard;
