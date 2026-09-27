import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import {
  X,
  FileText,
  Sparkles,
  CheckCircle,
  AlertCircle,
  Upload,
  Send,
  Building2,
  MapPin,
  ArrowRight,
} from 'lucide-react';
import { resumeApi } from '../../api/resumeApi';
import { applicationApi } from '../../api/applicationApi';
import Button from '../common/Button';
import Badge from '../common/Badge';

const COVER_NOTE_TEMPLATES = [
  {
    label: 'Standard Pitch',
    text: "Hello hiring team, I am very excited to apply for this opening. My background and core skills strongly align with your technical requirements, and I am eager to contribute to your team's mission.",
  },
  {
    label: 'Skill Focused',
    text: 'Hi there, reviewing your tech stack and job criteria, my hands-on production experience with scalable systems and modern web architecture makes me an excellent match for this role. I would love the opportunity to discuss further.',
  },
  {
    label: 'Enthusiastic & Ready',
    text: 'I have been following your team and products with great admiration. I am immediately available and ready to hit the ground running, bringing strong problem-solving skills and dedication.',
  },
];

const ApplyModal = ({ job, isOpen, onClose }) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedResumeId, setSelectedResumeId] = useState('');
  const [coverLetter, setCoverLetter] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  // Fetch candidate's resumes
  const { data: resumesData, isLoading: resumesLoading } = useQuery({
    queryKey: ['resumes'],
    queryFn: resumeApi.getResumes,
    enabled: isOpen,
  });

  const resumes = resumesData?.data?.resumes || [];

  // Automatically select primary resume or first resume once resumes are loaded
  useEffect(() => {
    if (resumes.length > 0 && !selectedResumeId) {
      const primary = resumes.find((r) => r.isPrimary) || resumes[0];
      if (primary) {
        setSelectedResumeId(primary.id);
      }
    }
  }, [resumes, selectedResumeId]);

  // Reset modal state on open
  useEffect(() => {
    if (isOpen) {
      setIsSuccess(false);
      setErrorMessage('');
    }
  }, [isOpen, job?.id]);

  // Apply mutation
  const applyMutation = useMutation({
    mutationFn: (payload) => applicationApi.applyJob(job.id, payload),
    onSuccess: () => {
      setIsSuccess(true);
      queryClient.invalidateQueries({ queryKey: ['candidateApplications'] });
      queryClient.invalidateQueries({ queryKey: ['job', job.id] });
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
    },
    onError: (err) => {
      setErrorMessage(
        err.response?.data?.message || 'Failed to submit application. Please try again.'
      );
    },
  });

  if (!isOpen || !job) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMessage('');
    if (!selectedResumeId) {
      setErrorMessage('Please select a resume to attach to your application.');
      return;
    }

    applyMutation.mutate({
      resumeId: selectedResumeId,
      coverLetter: coverLetter.trim(),
    });
  };

  const handleApplyTemplate = (text) => {
    setCoverLetter(text);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full sm:max-w-xl rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div>
            <span className="text-xs font-bold text-brand-600 uppercase tracking-wider">
              Job Application
            </span>
            <h2 className="text-lg font-extrabold text-slate-900 line-clamp-1">{job.title}</h2>
            <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
              <span className="flex items-center gap-1 font-semibold text-slate-700">
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                {job.company?.name || 'Company'}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                {job.location || 'Remote'}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-200/60 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {isSuccess ? (
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle className="w-10 h-10" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-black text-slate-900">Application Submitted!</h3>
                <p className="text-sm text-slate-600 max-w-sm mx-auto">
                  Your resume and application details have been safely sent to{' '}
                  <span className="font-semibold text-slate-900">{job.company?.name}</span>. You
                  can track its status anytime in your portal.
                </p>
              </div>

              <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
                <Button
                  variant="primary"
                  className="w-full sm:w-auto"
                  onClick={() => {
                    onClose();
                    navigate('/applications');
                  }}
                >
                  View My Applications
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
                <Button
                  variant="outline"
                  className="w-full sm:w-auto"
                  onClick={onClose}
                >
                  Continue Job Browsing
                </Button>
              </div>
            </div>
          ) : (
            <form id="apply-form" onSubmit={handleSubmit} className="space-y-6">
              {errorMessage && (
                <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-500" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* 1. Resume Selection */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-brand-600" />
                    Attach Resume <span className="text-rose-500">*</span>
                  </label>
                  <Link
                    to="/resumes"
                    className="text-xs font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1"
                  >
                    Manage Resumes
                  </Link>
                </div>

                {resumesLoading ? (
                  <div className="p-4 border border-slate-200 rounded-2xl text-center text-xs text-slate-400">
                    Loading your saved resumes...
                  </div>
                ) : resumes.length === 0 ? (
                  <div className="p-5 border-2 border-dashed border-slate-200 rounded-2xl text-center space-y-3 bg-slate-50/50">
                    <div className="w-10 h-10 rounded-xl bg-brand-100 text-brand-600 flex items-center justify-center mx-auto">
                      <Upload className="w-5 h-5" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-slate-800">No resumes uploaded yet</p>
                      <p className="text-[11px] text-slate-500">
                        Upload your resume first to apply for positions with 1 tap.
                      </p>
                    </div>
                    <Link to="/resumes">
                      <Button size="sm" variant="primary">
                        Upload Resume Now
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {resumes.map((r) => (
                      <label
                        key={r.id}
                        onClick={() => setSelectedResumeId(r.id)}
                        className={`flex items-center justify-between p-3.5 rounded-2xl border cursor-pointer transition-all ${
                          selectedResumeId === r.id
                            ? 'border-brand-600 bg-brand-50/50 ring-2 ring-brand-600/20'
                            : 'border-slate-200 hover:border-slate-300 bg-white'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <input
                            type="radio"
                            name="resumeSelection"
                            checked={selectedResumeId === r.id}
                            onChange={() => setSelectedResumeId(r.id)}
                            className="text-brand-600 focus:ring-brand-500 h-4 w-4"
                          />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-slate-900">{r.title}</span>
                              {r.isPrimary && <Badge variant="blue">Primary</Badge>}
                            </div>
                            <span className="text-[11px] text-slate-400">Version {r.version}</span>
                          </div>
                        </div>

                        {r.qualityScore && (
                          <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            <Sparkles className="w-3 h-3 text-emerald-500" />
                            {r.qualityScore}/100
                          </div>
                        )}
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* 2. Cover Letter / Candidate Note */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Note to Hiring Manager <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <span className="text-[11px] text-slate-400 font-medium">
                    {coverLetter.length} / 3000
                  </span>
                </div>

                {/* Quick 1-tap Templates */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Templates:</span>
                  {COVER_NOTE_TEMPLATES.map((tmpl, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleApplyTemplate(tmpl.text)}
                      className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900 transition font-medium"
                    >
                      {tmpl.label}
                    </button>
                  ))}
                </div>

                <textarea
                  rows={4}
                  value={coverLetter}
                  onChange={(e) => setCoverLetter(e.target.value.slice(0, 3000))}
                  placeholder="Introduce yourself or highlight why your specific experience makes you a stellar fit..."
                  className="w-full text-xs sm:text-sm p-3.5 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent resize-none"
                />
              </div>
            </form>
          )}
        </div>

        {/* Footer actions */}
        {!isSuccess && (
          <div className="p-4 sm:p-6 border-t border-slate-100 bg-slate-50/70 flex items-center justify-end gap-3">
            <Button variant="outline" size="md" onClick={onClose} disabled={applyMutation.isPending}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="md"
              type="submit"
              form="apply-form"
              isLoading={applyMutation.isPending}
              disabled={resumes.length === 0 || applyMutation.isPending}
              className="shadow-md font-bold px-6"
            >
              <Send className="w-4 h-4 mr-1.5" />
              Submit Application
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ApplyModal;
