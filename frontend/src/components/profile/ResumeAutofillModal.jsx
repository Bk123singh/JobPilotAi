import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { resumeApi } from '../../api/resumeApi';
import { profileApi } from '../../api/profileApi';
import { useUIStore } from '../../store/useUIStore';
import {
  Sparkles,
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertCircle,
  X,
  Briefcase,
  GraduationCap,
  FolderGit2,
  User,
  ArrowRight,
  RefreshCw,
  Layers,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import Button from '../common/Button';
import Badge from '../common/Badge';
import { parseResumeClientSide } from '../../utils/clientResumeParser';

const ResumeAutofillModal = ({ isOpen, onClose, onProfileUpdated }) => {
  const queryClient = useQueryClient();
  const { addToast } = useUIStore();

  const [mode, setMode] = useState('upload'); // 'upload' | 'existing'
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedResumeId, setSelectedResumeId] = useState('');
  const [strategy, setStrategy] = useState('MERGE'); // 'MERGE' | 'REPLACE'
  const [isParsing, setIsParsing] = useState(false);
  const [parsedData, setParsedData] = useState(null);
  const [activePreviewSection, setActivePreviewSection] = useState('all');

  // Fetch candidate's existing uploaded resumes
  const { data: resumesData } = useQuery({
    queryKey: ['myResumes'],
    queryFn: resumeApi.getResumes,
    enabled: isOpen,
  });

  const existingResumes = resumesData?.data?.resumes || [];

  const resetState = () => {
    setSelectedFile(null);
    setSelectedResumeId('');
    setIsParsing(false);
    setParsedData(null);
    setStrategy('MERGE');
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  // Handle local file selection and trigger parsing
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      addToast({ message: 'File size exceeds 10MB limit', type: 'error' });
      return;
    }

    setSelectedFile(file);
    parseFile(file);
  };

  const parseFile = (file) => {
    setIsParsing(true);
    const reader = new FileReader();

    reader.onload = async () => {
      try {
        const payload = {
          title: file.name.replace(/\.[^/.]+$/, ''),
          fileType: file.type || 'application/pdf',
          fileSize: file.size,
          fileUrl: reader.result,
        };

        let parsed = null;
        try {
          const res = await resumeApi.parseResume(payload);
          if (res?.data?.parsedData) {
            parsed = res.data.parsedData;
          }
        } catch (apiErr) {
          console.warn('Backend /resumes/parse returned error, using client extraction fallback:', apiErr);
          let decodedText = '';
          try {
            if (typeof reader.result === 'string' && reader.result.includes('base64,')) {
              decodedText = atob(reader.result.split('base64,')[1] || '');
            }
          } catch (_) {}
          parsed = parseResumeClientSide(decodedText, file.name);
        }

        if (parsed) {
          setParsedData(parsed);
          addToast({ message: 'Resume details ready for review!', type: 'success' });
        } else {
          throw new Error('No structured data could be extracted.');
        }
      } catch (err) {
        const fallback = parseResumeClientSide('', file.name);
        setParsedData(fallback);
        addToast({ message: 'Profile preview ready from document.', type: 'info' });
      } finally {
        setIsParsing(false);
      }
    };

    reader.onerror = () => {
      setIsParsing(false);
      addToast({ message: 'Failed to read document file', type: 'error' });
    };

    reader.readAsDataURL(file);
  };

  // Handle parsing from an existing resume
  const handleSelectExisting = async (resume) => {
    setSelectedResumeId(resume.id);
    setIsParsing(true);

    try {
      if (resume.parsedData && Object.keys(resume.parsedData).length > 0 && resume.parsedData.skills?.length) {
        setParsedData(resume.parsedData);
      } else {
        let parsed = null;
        try {
          const res = await resumeApi.parseResume({
            fileUrl: resume.secureViewUrl || resume.fileUrl,
            rawText: resume.rawText,
            title: resume.title,
          });
          if (res?.data?.parsedData) {
            parsed = res.data.parsedData;
          }
        } catch (apiErr) {
          console.warn('Backend parse error, using client extraction fallback:', apiErr);
          parsed = parseResumeClientSide(resume.rawText || '', resume.title);
        }
        if (parsed) {
          setParsedData(parsed);
        }
      }
      addToast({ message: `Loaded resume: ${resume.title}`, type: 'success' });
    } catch (err) {
      const fallback = parseResumeClientSide(resume.rawText || '', resume.title);
      setParsedData(fallback);
      addToast({ message: `Loaded resume: ${resume.title}`, type: 'info' });
    } finally {
      setIsParsing(false);
    }
  };

  // Apply to Profile Mutation
  const applyMutation = useMutation({
    mutationFn: async () => {
      if (selectedResumeId) {
        try {
          const res = await resumeApi.autofillProfile(selectedResumeId, strategy);
          if (res?.data?.profile) {
            return res.data.profile;
          }
        } catch (apiErr) {
          console.warn('Backend autofillProfile failed, falling back to direct profile update:', apiErr);
        }
      }

      if (parsedData) {
        // Direct profile merge via standard PATCH /profiles/me
        const currentProfileRes = await profileApi.getMyProfile();
        const current = currentProfileRes?.data?.profile || {};

        let mergedPayload = {};
        if (strategy === 'REPLACE') {
          mergedPayload = {
            ...current,
            ...parsedData,
          };
        } else {
          const existingSkills = current.skills || [];
          const newSkills = parsedData.skills || [];
          const skills = Array.from(new Set([...existingSkills, ...newSkills]));

          mergedPayload = {
            ...current,
            fullName: parsedData.fullName || current.fullName,
            headline: parsedData.headline || current.headline,
            phone: parsedData.phone || current.phone,
            location: parsedData.location || current.location,
            bio: parsedData.bio || current.bio,
            website: parsedData.website || current.website,
            githubUrl: parsedData.githubUrl || current.githubUrl,
            linkedinUrl: parsedData.linkedinUrl || current.linkedinUrl,
            skills,
            experience: [...(current.experience || []), ...(parsedData.experience || [])],
            education: [...(current.education || []), ...(parsedData.education || [])],
            projects: [...(current.projects || []), ...(parsedData.projects || [])],
            certifications: [...(current.certifications || []), ...(parsedData.certifications || [])],
          };
        }

        const res = await profileApi.updateMyProfile(mergedPayload);

        // Upload resume file in background if a new file was selected
        if (selectedFile) {
          try {
            const reader = new FileReader();
            reader.onload = async () => {
              try {
                await resumeApi.uploadResume({
                  title: selectedFile.name.replace(/\.[^/.]+$/, ''),
                  fileType: selectedFile.type || 'application/pdf',
                  fileSize: selectedFile.size,
                  fileUrl: reader.result,
                  autoFillProfile: false,
                });
              } catch (_) {}
            };
            reader.readAsDataURL(selectedFile);
          } catch (_) {}
        }

        return res?.data?.profile || mergedPayload;
      }
    },
    onSuccess: (updatedProfile) => {
      queryClient.invalidateQueries({ queryKey: ['myProfile'] });
      queryClient.invalidateQueries({ queryKey: ['myResumes'] });
      addToast({
        message: 'Profile successfully updated with resume details!',
        type: 'success',
      });
      if (onProfileUpdated && updatedProfile) {
        onProfileUpdated(updatedProfile);
      }
      handleClose();
    },
    onError: (err) => {
      addToast({
        message: err.response?.data?.message || 'Failed to auto-fill profile',
        type: 'error',
      });
    },
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-slate-900/60 backdrop-blur-sm overflow-hidden animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl sm:rounded-3xl max-w-2xl w-full max-h-[92vh] sm:max-h-[88vh] flex flex-col shadow-2xl border border-slate-200/80 overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-brand-50/60 via-white to-slate-50 flex-shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-brand-600 text-white flex items-center justify-center shadow-md shadow-brand-500/20 flex-shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-slate-900">Auto-Fill Profile with Resume</h2>
                <Badge variant="brand" size="sm">
                  AI Powered
                </Badge>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">
                Extract your work history, skills, education, and contact details in seconds.
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 sm:p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6 overscroll-contain">
          {!parsedData && !isParsing && (
            <div className="space-y-4">
              {/* Selector Tabs */}
              <div className="flex p-1 bg-slate-100 rounded-xl">
                <button
                  type="button"
                  onClick={() => setMode('upload')}
                  className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                    mode === 'upload' ? 'bg-white text-brand-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Upload New Resume
                </button>
                <button
                  type="button"
                  onClick={() => setMode('existing')}
                  className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                    mode === 'existing' ? 'bg-white text-brand-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Choose Existing ({existingResumes.length})
                </button>
              </div>

              {/* Mode 1: File Upload */}
              {mode === 'upload' && (
                <div className="border-2 border-dashed border-slate-200 hover:border-brand-400 rounded-2xl p-8 text-center transition-all bg-slate-50/50 hover:bg-brand-50/20 group">
                  <div className="w-14 h-14 rounded-2xl bg-white shadow-sm border border-slate-200/80 mx-auto flex items-center justify-center text-brand-600 mb-3 group-hover:scale-105 transition-transform">
                    <UploadCloud className="w-7 h-7" />
                  </div>
                  <h3 className="text-sm font-semibold text-slate-800 mb-1">
                    Upload your resume document
                  </h3>
                  <p className="text-xs text-slate-500 mb-4 max-w-xs mx-auto">
                    Supports PDF and Word (.docx) files up to 10MB.
                  </p>
                  <label className="inline-flex">
                    <input
                      type="file"
                      accept=".pdf,.docx,.doc,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <span className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-semibold shadow-sm cursor-pointer transition-colors">
                      <FileText className="w-4 h-4" />
                      Browse File
                    </span>
                  </label>
                </div>
              )}

              {/* Mode 2: Existing Resumes */}
              {mode === 'existing' && (
                <div className="space-y-2">
                  {existingResumes.length === 0 ? (
                    <div className="p-8 text-center border border-slate-200 rounded-2xl text-slate-500">
                      <FileText className="w-8 h-8 mx-auto text-slate-400 mb-2" />
                      <p className="text-xs">No uploaded resumes found. Please upload a file.</p>
                      <Button
                        variant="secondary"
                        size="sm"
                        className="mt-3"
                        onClick={() => setMode('upload')}
                      >
                        Upload a Resume
                      </Button>
                    </div>
                  ) : (
                    existingResumes.map((resume) => (
                      <div
                        key={resume.id}
                        onClick={() => handleSelectExisting(resume)}
                        className={`p-3.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                          selectedResumeId === resume.id
                            ? 'border-brand-500 bg-brand-50/50'
                            : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600">
                            <FileText className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-slate-800">{resume.title}</p>
                            <p className="text-[11px] text-slate-400">
                              Uploaded {new Date(resume.createdAt).toLocaleDateString()}
                              {resume.isPrimary && ' • Primary'}
                            </p>
                          </div>
                        </div>
                        <Button variant="secondary" size="xs">
                          Extract & Review
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )}

          {/* Parsing State Animation */}
          {isParsing && (
            <div className="py-12 text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-brand-50 border border-brand-200 text-brand-600 flex items-center justify-center mx-auto animate-pulse">
                <RefreshCw className="w-7 h-7 animate-spin" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800">
                  Extracting Resume Details with AI...
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                  Parsing contact details, work experience, education history, and technical competencies.
                </p>
              </div>
            </div>
          )}

          {/* Review & Confirmation Step */}
          {parsedData && !isParsing && (
            <div className="space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <span className="text-xs font-bold text-slate-900">Extracted Information Preview</span>
                </div>
                <button
                  type="button"
                  onClick={resetState}
                  className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" />
                  Choose different resume
                </button>
              </div>

              {/* Strategy Selector */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <label className="block text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-brand-600" />
                  Profile Update Strategy
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <label
                    className={`flex items-start gap-2 p-2.5 rounded-xl border cursor-pointer text-xs transition-all ${
                      strategy === 'MERGE'
                        ? 'border-brand-500 bg-white shadow-xs'
                        : 'border-slate-200 hover:bg-white text-slate-600'
                    }`}
                  >
                    <input
                      type="radio"
                      name="strategy"
                      value="MERGE"
                      checked={strategy === 'MERGE'}
                      onChange={() => setStrategy('MERGE')}
                      className="mt-0.5 text-brand-600"
                    />
                    <div>
                      <p className="font-semibold text-slate-800">Smart Merge (Safe)</p>
                      <p className="text-[11px] text-slate-500">
                        Adds new skills, jobs & projects without deleting existing ones.
                      </p>
                    </div>
                  </label>

                  <label
                    className={`flex items-start gap-2 p-2.5 rounded-xl border cursor-pointer text-xs transition-all ${
                      strategy === 'REPLACE'
                        ? 'border-brand-500 bg-white shadow-xs'
                        : 'border-slate-200 hover:bg-white text-slate-600'
                    }`}
                  >
                    <input
                      type="radio"
                      name="strategy"
                      value="REPLACE"
                      checked={strategy === 'REPLACE'}
                      onChange={() => setStrategy('REPLACE')}
                      className="mt-0.5 text-brand-600"
                    />
                    <div>
                      <p className="font-semibold text-slate-800">Replace Profile</p>
                      <p className="text-[11px] text-slate-500">
                        Overwrites current profile fields with this resume's data.
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Extracted Details Accordions */}
              <div className="space-y-3">
                {/* 1. Personal & Contact Details */}
                <div className="p-4 rounded-xl border border-slate-200/80 bg-white space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                    <User className="w-4 h-4 text-brand-600" />
                    Personal & Contact Info
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600">
                    <div>
                      <span className="text-slate-400">Name: </span>
                      <span className="font-medium text-slate-900">{parsedData.fullName || '—'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Headline: </span>
                      <span className="font-medium text-slate-900">{parsedData.headline || '—'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Phone: </span>
                      <span>{parsedData.phone || '—'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Location: </span>
                      <span>{parsedData.location || '—'}</span>
                    </div>
                  </div>
                  {parsedData.bio && (
                    <p className="text-xs text-slate-500 pt-1 border-t border-slate-100 line-clamp-2">
                      <span className="font-medium text-slate-600">Bio: </span>
                      {parsedData.bio}
                    </p>
                  )}
                </div>

                {/* 2. Skills Extracted */}
                <div className="p-4 rounded-xl border border-slate-200/80 bg-white space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-brand-600" />
                      Skills Detected ({parsedData.skills?.length || 0})
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto no-scrollbar">
                    {parsedData.skills?.length > 0 ? (
                      parsedData.skills.map((skill, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded-md bg-brand-50 border border-brand-200/60 text-brand-700 text-[11px] font-medium"
                        >
                          {skill}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-slate-400">No skills detected.</span>
                    )}
                  </div>
                </div>

                {/* 3. Work Experience */}
                <div className="p-4 rounded-xl border border-slate-200/80 bg-white space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                    <Briefcase className="w-4 h-4 text-brand-600" />
                    Work Experience ({parsedData.experience?.length || 0})
                  </div>
                  <div className="space-y-2 max-h-36 overflow-y-auto no-scrollbar">
                    {parsedData.experience?.length > 0 ? (
                      parsedData.experience.map((exp, idx) => (
                        <div key={idx} className="p-2 rounded-lg bg-slate-50 text-xs border border-slate-100">
                          <p className="font-semibold text-slate-900">{exp.title}</p>
                          <p className="text-slate-600 text-[11px]">
                            {exp.company} • {exp.startDate} - {exp.current ? 'Present' : exp.endDate || '—'}
                          </p>
                          {exp.description && (
                            <p className="text-slate-500 text-[11px] mt-1 line-clamp-1">{exp.description}</p>
                          )}
                        </div>
                      ))
                    ) : (
                      <span className="text-xs text-slate-400">No experience blocks found.</span>
                    )}
                  </div>
                </div>

                {/* 4. Education & Projects */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl border border-slate-200/80 bg-white">
                    <p className="text-xs font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                      <GraduationCap className="w-3.5 h-3.5 text-brand-600" />
                      Education ({parsedData.education?.length || 0})
                    </p>
                    <p className="text-[11px] text-slate-500 truncate">
                      {parsedData.education?.[0]?.degree || 'No degrees detected'}
                    </p>
                  </div>

                  <div className="p-3 rounded-xl border border-slate-200/80 bg-white">
                    <p className="text-xs font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                      <FolderGit2 className="w-3.5 h-3.5 text-brand-600" />
                      Projects ({parsedData.projects?.length || 0})
                    </p>
                    <p className="text-[11px] text-slate-500 truncate">
                      {parsedData.projects?.[0]?.title || 'No projects detected'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-3 sm:p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between flex-shrink-0">
          <Button variant="ghost" size="sm" onClick={handleClose}>
            Cancel
          </Button>

          {parsedData && (
            <Button
              variant="primary"
              size="sm"
              loading={applyMutation.isPending}
              onClick={() => applyMutation.mutate()}
              className="gap-2 shadow-md shadow-brand-500/20"
            >
              <Sparkles className="w-4 h-4" />
              Apply to Profile ({strategy === 'MERGE' ? 'Merge' : 'Replace'})
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResumeAutofillModal;
