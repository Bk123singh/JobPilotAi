import React, { useState } from 'react';
import {
  FileText,
  ExternalLink,
  Sparkles,
  MapPin,
  MessageSquare,
  ArrowRight,
  ArrowLeft,
  Briefcase,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Calendar,
} from 'lucide-react';
import Badge from '../common/Badge';
import Button from '../common/Button';

const KANBAN_COLUMNS = [
  { id: 'APPLIED', title: 'Applied', color: 'bg-blue-500', border: 'border-blue-200', bg: 'bg-blue-50/40' },
  { id: 'UNDER_REVIEW', title: 'Under Review', color: 'bg-amber-500', border: 'border-amber-200', bg: 'bg-amber-50/40' },
  { id: 'SHORTLISTED', title: 'Shortlisted', color: 'bg-purple-500', border: 'border-purple-200', bg: 'bg-purple-50/40' },
  { id: 'INTERVIEW', title: 'Interviewing', color: 'bg-indigo-500', border: 'border-indigo-200', bg: 'bg-indigo-50/40' },
  { id: 'OFFER', title: 'Offer Extended', color: 'bg-emerald-500', border: 'border-emerald-200', bg: 'bg-emerald-50/40' },
  { id: 'REJECTED', title: 'Rejected', color: 'bg-slate-400', border: 'border-slate-200', bg: 'bg-slate-50/40' },
];

const STAGE_ORDER = ['APPLIED', 'UNDER_REVIEW', 'SHORTLISTED', 'INTERVIEW', 'OFFER'];

const KanbanBoard = ({
  applications = [],
  onStatusChange,
  onOpenNotes,
  onScheduleInterview,
  isUpdating = false,
}) => {
  const [draggedAppId, setDraggedAppId] = useState(null);
  const [dragOverCol, setDragOverCol] = useState(null);

  // Group applications by status
  const groupedApps = KANBAN_COLUMNS.reduce((acc, col) => {
    acc[col.id] = applications.filter((app) => app.status === col.id);
    return acc;
  }, {});

  const handleDragStart = (e, appId) => {
    e.dataTransfer.setData('text/plain', appId);
    setDraggedAppId(appId);
  };

  const handleDragOver = (e, colId) => {
    e.preventDefault();
    if (dragOverCol !== colId) {
      setDragOverCol(colId);
    }
  };

  const handleDragLeave = () => {
    setDragOverCol(null);
  };

  const handleDrop = (e, targetStatus) => {
    e.preventDefault();
    setDragOverCol(null);
    const appId = e.dataTransfer.getData('text/plain') || draggedAppId;
    if (appId) {
      const app = applications.find((a) => a.id === appId);
      if (app && app.status !== targetStatus) {
        onStatusChange(appId, targetStatus);
      }
    }
    setDraggedAppId(null);
  };

  const handleStepStage = (app, direction) => {
    const currentIdx = STAGE_ORDER.indexOf(app.status);
    if (currentIdx === -1) return;
    const targetIdx = currentIdx + direction;
    if (targetIdx >= 0 && targetIdx < STAGE_ORDER.length) {
      onStatusChange(app.id, STAGE_ORDER[targetIdx]);
    }
  };

  return (
    <div className="overflow-x-auto pb-4 pt-2 -mx-4 px-4 sm:mx-0 sm:px-0">
      <div className="flex gap-4 min-w-[1200px] items-start">
        {KANBAN_COLUMNS.map((col) => {
          const colApps = groupedApps[col.id] || [];
          const isOver = dragOverCol === col.id;

          return (
            <div
              key={col.id}
              onDragOver={(e) => handleDragOver(e, col.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, col.id)}
              className={`flex-1 min-w-[260px] rounded-3xl border transition-all duration-200 ${
                isOver
                  ? 'border-brand-500 bg-brand-50/50 ring-2 ring-brand-400/20'
                  : 'border-slate-200/80 bg-slate-100/50'
              } p-3.5 flex flex-col max-h-[85vh]`}
            >
              {/* Column Header */}
              <div className="flex items-center justify-between pb-3 px-1 border-b border-slate-200/70">
                <div className="flex items-center space-x-2">
                  <div className={`w-2.5 h-2.5 rounded-full ${col.color}`} />
                  <h3 className="font-extrabold text-xs text-slate-800 tracking-wide uppercase">
                    {col.title}
                  </h3>
                </div>
                <span className="text-[11px] font-black px-2 py-0.5 rounded-full bg-white text-slate-700 shadow-2xs border border-slate-200/80">
                  {colApps.length}
                </span>
              </div>

              {/* Cards Container */}
              <div className="overflow-y-auto space-y-3 pt-3 flex-1 pr-0.5">
                {colApps.length === 0 ? (
                  <div className="py-8 text-center text-slate-400 text-xs border-2 border-dashed border-slate-200/60 rounded-2xl">
                    Drop candidate here
                  </div>
                ) : (
                  colApps.map((app) => {
                    const candidate = app.candidate || {};
                    const profile = candidate.profile || {};
                    const resume = app.resume || {};
                    const stageIdx = STAGE_ORDER.indexOf(app.status);

                    return (
                      <div
                        key={app.id}
                        draggable={!isUpdating}
                        onDragStart={(e) => handleDragStart(e, app.id)}
                        className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-sm hover:shadow-md transition-all cursor-grab active:cursor-grabbing space-y-3"
                      >
                        {/* Candidate Basic Info */}
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h4 className="font-bold text-xs sm:text-sm text-slate-900 leading-tight">
                              {profile.fullName || 'Candidate'}
                            </h4>
                            <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                              {profile.headline || 'Software Engineer'}
                            </p>
                          </div>

                          {resume.qualityScore && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-black text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-lg border border-emerald-200 flex-shrink-0">
                              <Sparkles className="w-2.5 h-2.5 text-emerald-500" />
                              {resume.qualityScore}%
                            </span>
                          )}
                        </div>

                        {/* Matched Skills */}
                        {profile.skills && profile.skills.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {profile.skills.slice(0, 3).map((skill, idx) => (
                              <span
                                key={idx}
                                className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-medium"
                              >
                                {skill}
                              </span>
                            ))}
                            {profile.skills.length > 3 && (
                              <span className="text-[10px] text-slate-400 font-medium self-center">
                                +{profile.skills.length - 3}
                              </span>
                            )}
                          </div>
                        )}

                        {/* Job opening label */}
                        <div className="flex items-center gap-1 text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                          <Briefcase className="w-3 h-3 text-brand-600 flex-shrink-0" />
                          <span className="truncate">{app.job?.title || 'Job Opening'}</span>
                        </div>

                        {/* Recruiter Note Indicator */}
                        {app.recruiterNotes && (
                          <div className="p-2 rounded-xl bg-amber-50/80 border border-amber-200 text-[10px] text-amber-900 line-clamp-2">
                            <strong>Note:</strong> {app.recruiterNotes}
                          </div>
                        )}

                        {/* Card Actions Footer */}
                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-1 text-xs">
                          {/* Resume Link */}
                          {resume.fileUrl ? (
                            <a
                              href={resume.fileUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[11px] font-bold text-brand-600 hover:underline inline-flex items-center gap-1"
                              title="View Resume"
                            >
                              <FileText className="w-3 h-3" />
                              Resume
                            </a>
                          ) : (
                            <span className="text-[10px] text-slate-400">No Resume</span>
                          )}

                          {/* Note Button */}
                          <button
                            type="button"
                            onClick={() => onOpenNotes(app)}
                            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                            title="Add/Edit Hiring Notes"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                          </button>

                          {/* Schedule Interview Button */}
                          {onScheduleInterview && (
                            <button
                              type="button"
                              onClick={() => onScheduleInterview(app)}
                              className="p-1 rounded-lg text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 transition"
                              title="Schedule Interview"
                            >
                              <Calendar className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Quick 1-tap Step Buttons (Prev/Next) */}
                          <div className="flex items-center gap-0.5">
                            {stageIdx > 0 && (
                              <button
                                type="button"
                                disabled={isUpdating}
                                onClick={() => handleStepStage(app, -1)}
                                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                                title="Move to previous stage"
                              >
                                <ArrowLeft className="w-3 h-3" />
                              </button>
                            )}

                            {stageIdx >= 0 && stageIdx < STAGE_ORDER.length - 1 && (
                              <button
                                type="button"
                                disabled={isUpdating}
                                onClick={() => handleStepStage(app, 1)}
                                className="p-1 rounded-lg text-brand-600 hover:bg-brand-50 transition font-bold"
                                title="Advance to next stage"
                              >
                                <ArrowRight className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default KanbanBoard;
