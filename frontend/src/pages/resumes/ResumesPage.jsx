import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { resumeApi } from '../../api/resumeApi';
import { useUIStore } from '../../store/useUIStore';
import {
  FileText,
  UploadCloud,
  Star,
  Shield,
  Eye,
  Trash2,
  Edit2,
  CheckCircle2,
  Lock,
  Globe,
  Plus,
  X,
  Clock,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Card, { CardBody, CardHeader } from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Skeleton from '../../components/common/Skeleton';
import { openResumeFile } from '../../utils/fileViewer';

const ResumesPage = () => {
  const queryClient = useQueryClient();
  const { addToast } = useUIStore();

  const [showUploadModal, setShowUploadModal] = useState(false);
  const [editingResume, setEditingResume] = useState(null);

  // Upload Form State
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadVisibility, setUploadVisibility] = useState('APPLICATION_ONLY');
  const [uploadIsPrimary, setUploadIsPrimary] = useState(false);
  const [autoFillProfile, setAutoFillProfile] = useState(true);
  const [selectedFile, setSelectedFile] = useState(null);

  // Fetch Resumes
  const { data, isLoading } = useQuery({
    queryKey: ['myResumes'],
    queryFn: resumeApi.getResumes,
  });

  const resumes = data?.data?.resumes || [];

  // Upload Mutation
  const uploadMutation = useMutation({
    mutationFn: (newResume) => resumeApi.uploadResume(newResume),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myResumes'] });
      queryClient.invalidateQueries({ queryKey: ['myProfile'] });
      addToast({
        message: autoFillProfile
          ? 'Resume uploaded & profile auto-filled successfully!'
          : 'Resume uploaded successfully!',
        type: 'success',
      });
      setShowUploadModal(false);
      setUploadTitle('');
      setSelectedFile(null);
      setUploadVisibility('APPLICATION_ONLY');
    },
    onError: (err) => {
      addToast({
        message: err.response?.data?.message || 'Failed to upload resume',
        type: 'error',
      });
    },
  });

  // Autofill Profile Mutation
  const autofillMutation = useMutation({
    mutationFn: (id) => resumeApi.autofillProfile(id, 'MERGE'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myProfile'] });
      queryClient.invalidateQueries({ queryKey: ['myResumes'] });
      addToast({
        message: 'Profile successfully updated with resume details!',
        type: 'success',
      });
    },
    onError: (err) => {
      addToast({
        message: err.response?.data?.message || 'Failed to auto-fill profile from resume',
        type: 'error',
      });
    },
  });

  // Set Primary Mutation
  const primaryMutation = useMutation({
    mutationFn: (id) => resumeApi.setPrimary(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myResumes'] });
      addToast({ message: 'Primary resume updated', type: 'success' });
    },
    onError: () => {
      addToast({ message: 'Failed to set primary resume', type: 'error' });
    },
  });

  // Update Mutation (Title / Visibility)
  const updateMutation = useMutation({
    mutationFn: ({ id, updateData }) => resumeApi.updateResume(id, updateData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myResumes'] });
      addToast({ message: 'Resume settings updated', type: 'success' });
      setEditingResume(null);
    },
    onError: () => {
      addToast({ message: 'Failed to update resume', type: 'error' });
    },
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: (id) => resumeApi.deleteResume(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myResumes'] });
      addToast({ message: 'Resume deleted successfully', type: 'success' });
    },
    onError: () => {
      addToast({ message: 'Failed to delete resume', type: 'error' });
    },
  });

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        addToast({ message: 'File size exceeds the 5MB limit', type: 'error' });
        return;
      }
      setSelectedFile(file);
      if (!uploadTitle) {
        setUploadTitle(file.name.replace(/\.[^/.]+$/, ''));
      }
    }
  };

  const handleViewResume = (resume) => {
    const url = resume.secureViewUrl || resume.fileUrl;
    if (!url) {
      addToast({ message: 'No file available for preview', type: 'error' });
      return;
    }
    openResumeFile(url);
  };

  const handleUploadSubmit = (e) => {
    e.preventDefault();
    if (!uploadTitle.trim()) {
      addToast({ message: 'Please provide a resume title', type: 'error' });
      return;
    }

    if (selectedFile) {
      const reader = new FileReader();
      reader.onload = () => {
        uploadMutation.mutate({
          title: uploadTitle.trim(),
          visibility: uploadVisibility,
          isPrimary: uploadIsPrimary,
          fileSize: selectedFile.size,
          fileType: selectedFile.type || 'application/pdf',
          fileUrl: reader.result,
          autoFillProfile,
        });
      };
      reader.readAsDataURL(selectedFile);
    } else {
      uploadMutation.mutate({
        title: uploadTitle.trim(),
        visibility: uploadVisibility,
        isPrimary: uploadIsPrimary,
        fileSize: 1024 * 55,
        fileType: 'application/pdf',
        fileUrl: '',
        autoFillProfile,
      });
    }
  };

  const handleUpdateSubmit = (e) => {
    e.preventDefault();
    if (!editingResume) return;

    updateMutation.mutate({
      id: editingResume.id,
      updateData: {
        title: editingResume.title,
        visibility: editingResume.visibility,
      },
    });
  };

  const getVisibilityBadge = (visibility) => {
    switch (visibility) {
      case 'APPLICATION_ONLY':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand-700 bg-brand-50 border border-brand-200 px-2 py-0.5 rounded-full">
            <Eye className="w-3 h-3 text-brand-600" />
            Application Only
          </span>
        );
      case 'RECRUITER_VISIBLE':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
            <Globe className="w-3 h-3 text-emerald-600" />
            Recruiter Discoverable
          </span>
        );
      case 'PRIVATE':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-700 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full">
            <Lock className="w-3 h-3 text-slate-500" />
            Private (Only You)
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
              Resume Management
            </h1>
            <Badge variant="brand">{resumes.length} Uploaded</Badge>
          </div>
          <p className="text-sm text-slate-600">
            Upload multiple tailored resumes. Your primary resume is attached by default to 1-tap applications.
          </p>
        </div>

        <Button
          variant="primary"
          size="lg"
          onClick={() => setShowUploadModal(true)}
          className="shadow-sm font-semibold sm:self-center"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Upload New Resume
        </Button>
      </div>

      {/* Upload Modal / Drawer */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-slate-900/60 backdrop-blur-sm overflow-hidden animate-in fade-in duration-150">
          <div className="w-full max-w-xl bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 flex flex-col max-h-[92vh] sm:max-h-[88vh] overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Modal Header (Sticky) */}
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100 bg-white flex-shrink-0">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center flex-shrink-0">
                  <UploadCloud className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-bold text-base sm:text-lg text-slate-900 leading-tight">Upload New Resume</h2>
                  <p className="text-xs text-slate-500 hidden sm:block">Upload a document to match jobs or auto-fill your profile.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowUploadModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleUploadSubmit} className="flex flex-col flex-1 overflow-hidden min-h-0">
              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-4.5 overscroll-contain">
                {/* File Dropzone */}
                <div className="border-2 border-dashed border-slate-300 hover:border-brand-500 rounded-2xl p-4 sm:p-5 text-center cursor-pointer bg-slate-50/60 hover:bg-brand-50/20 transition-all">
                  <input
                    type="file"
                    id="resumeUploadInput"
                    accept=".pdf,.doc,.docx"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <label htmlFor="resumeUploadInput" className="cursor-pointer block space-y-1.5">
                    <FileText className="w-8 h-8 text-brand-600 mx-auto" />
                    <div>
                      <span className="font-bold text-sm text-brand-600 hover:underline">
                        Click to choose file
                      </span>{' '}
                      <span className="text-slate-500 text-sm">or drag here</span>
                    </div>
                    <p className="text-xs text-slate-400">PDF, DOC, DOCX (Max 5MB)</p>
                    {selectedFile && (
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold mt-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="truncate max-w-[200px] sm:max-w-[320px]">{selectedFile.name}</span> ({(selectedFile.size / 1024).toFixed(1)} KB)
                      </div>
                    )}
                  </label>
                </div>

                <Input
                  label="Resume Label / Title"
                  placeholder="e.g. Senior Full-Stack Engineer (Frontend Focus)"
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  required
                />

                {/* Privacy Setting Selector */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700 tracking-wide uppercase">
                    Privacy & Visibility
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                    <label
                      className={`p-2.5 rounded-xl border flex flex-col justify-between cursor-pointer transition ${
                        uploadVisibility === 'APPLICATION_ONLY'
                          ? 'bg-brand-50/80 border-brand-400 text-brand-900 shadow-xs'
                          : 'border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <input
                          type="radio"
                          name="visibility"
                          value="APPLICATION_ONLY"
                          checked={uploadVisibility === 'APPLICATION_ONLY'}
                          onChange={() => setUploadVisibility('APPLICATION_ONLY')}
                          className="text-brand-600 mt-0.5"
                        />
                        <span className="font-bold text-xs">Application Only</span>
                      </div>
                      <span className="text-[11px] text-slate-500 leading-tight">
                        Only for openings you explicitly apply to.
                      </span>
                    </label>

                    <label
                      className={`p-2.5 rounded-xl border flex flex-col justify-between cursor-pointer transition ${
                        uploadVisibility === 'RECRUITER_VISIBLE'
                          ? 'bg-brand-50/80 border-brand-400 text-brand-900 shadow-xs'
                          : 'border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <input
                          type="radio"
                          name="visibility"
                          value="RECRUITER_VISIBLE"
                          checked={uploadVisibility === 'RECRUITER_VISIBLE'}
                          onChange={() => setUploadVisibility('RECRUITER_VISIBLE')}
                          className="text-brand-600 mt-0.5"
                        />
                        <span className="font-bold text-xs">Discoverable</span>
                      </div>
                      <span className="text-[11px] text-slate-500 leading-tight">
                        Verified recruiters can discover your profile.
                      </span>
                    </label>

                    <label
                      className={`p-2.5 rounded-xl border flex flex-col justify-between cursor-pointer transition ${
                        uploadVisibility === 'PRIVATE'
                          ? 'bg-brand-50/80 border-brand-400 text-brand-900 shadow-xs'
                          : 'border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <input
                          type="radio"
                          name="visibility"
                          value="PRIVATE"
                          checked={uploadVisibility === 'PRIVATE'}
                          onChange={() => setUploadVisibility('PRIVATE')}
                          className="text-brand-600 mt-0.5"
                        />
                        <span className="font-bold text-xs">Private</span>
                      </div>
                      <span className="text-[11px] text-slate-500 leading-tight">
                        Only you can access this resume.
                      </span>
                    </label>
                  </div>
                </div>

                {/* Auto-fill Profile Checkbox */}
                <div className="flex items-start space-x-2.5 p-3 rounded-xl bg-brand-50/60 border border-brand-200/80">
                  <input
                    type="checkbox"
                    id="autoFillProfileCheck"
                    checked={autoFillProfile}
                    onChange={(e) => setAutoFillProfile(e.target.checked)}
                    className="w-4 h-4 text-brand-600 rounded mt-0.5 flex-shrink-0 cursor-pointer"
                  />
                  <label htmlFor="autoFillProfileCheck" className="text-xs cursor-pointer">
                    <span className="font-bold text-brand-900 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-brand-600" />
                      Auto-fill Profile Sections (Recommended)
                    </span>
                    <span className="text-slate-500 block mt-0.5 text-[11px] leading-relaxed">
                      Extracts your skills, work experience, education, projects, and contact info into your profile automatically.
                    </span>
                  </label>
                </div>

                {/* Set as Primary Checkbox */}
                <div className="flex items-center space-x-2 pt-0.5">
                  <input
                    type="checkbox"
                    id="primaryCheck"
                    checked={uploadIsPrimary}
                    onChange={(e) => setUploadIsPrimary(e.target.checked)}
                    className="w-4 h-4 text-brand-600 rounded cursor-pointer"
                  />
                  <label htmlFor="primaryCheck" className="text-xs font-semibold text-slate-700 cursor-pointer">
                    Set as my primary default resume
                  </label>
                </div>
              </div>

              {/* Modal Footer (Sticky) */}
              <div className="flex items-center justify-end gap-2.5 p-3.5 sm:p-4 border-t border-slate-100 bg-slate-50 flex-shrink-0">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setShowUploadModal(false)}
                  className="min-h-[38px]"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  isLoading={uploadMutation.isPending}
                  className="min-h-[38px] px-5 shadow-sm"
                >
                  Upload Resume
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Resume Title & Privacy Modal */}
      {editingResume && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm overflow-hidden animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100 flex-shrink-0">
              <h3 className="font-bold text-base text-slate-900">Edit Resume Details</h3>
              <button
                type="button"
                onClick={() => setEditingResume(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateSubmit} className="flex flex-col flex-1 overflow-hidden min-h-0">
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
                <Input
                  label="Resume Title"
                  value={editingResume.title}
                  onChange={(e) =>
                    setEditingResume({ ...editingResume, title: e.target.value })
                  }
                  required
                />

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700 uppercase">
                    Visibility
                  </label>
                  <select
                    value={editingResume.visibility}
                    onChange={(e) =>
                      setEditingResume({ ...editingResume, visibility: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-300 p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    <option value="APPLICATION_ONLY">Application Only</option>
                    <option value="RECRUITER_VISIBLE">Recruiter Discoverable</option>
                    <option value="PRIVATE">Private</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 p-3.5 sm:p-4 border-t border-slate-100 bg-slate-50 flex-shrink-0">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditingResume(null)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  isLoading={updateMutation.isPending}
                >
                  Save Changes
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="space-y-4">
          <Skeleton className="h-36 w-full rounded-2xl" />
          <Skeleton className="h-36 w-full rounded-2xl" />
        </div>
      )}

      {/* Resumes List */}
      {!isLoading && resumes.length === 0 && (
        <Card className="p-12 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center mx-auto">
            <FileText className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="font-bold text-lg text-slate-900">No resumes uploaded yet</h3>
            <p className="text-sm text-slate-500 max-w-sm mx-auto">
              Upload your first resume in PDF or DOCX format to begin matching with high-fit roles.
            </p>
          </div>
          <Button variant="primary" onClick={() => setShowUploadModal(true)}>
            <Plus className="w-4 h-4 mr-1" />
            Upload Your First Resume
          </Button>
        </Card>
      )}

      <div className="space-y-4">
        {resumes.map((resume) => (
          <Card key={resume.id} hover className="p-5 sm:p-6 transition-all">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              {/* Left Column: Icon and Info */}
              <div className="flex items-start space-x-3.5">
                <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <FileText className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-bold text-base text-slate-900 leading-tight">
                      {resume.title}
                    </h3>
                    {resume.isPrimary && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded-full border border-amber-300">
                        <Star className="w-3 h-3 fill-amber-600 text-amber-600" />
                        Primary Resume
                      </span>
                    )}
                    <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                      v{resume.version}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    {getVisibilityBadge(resume.visibility)}
                    <span className="text-xs text-slate-400">
                      Uploaded {new Date(resume.createdAt).toLocaleDateString()}
                    </span>
                    <span className="text-xs text-slate-400">
                      • {(resume.fileSize / 1024).toFixed(0)} KB
                    </span>
                  </div>

                  {/* Quality Score Indicator */}
                  {resume.qualityScore && (
                    <div className="pt-2 flex items-center gap-2 text-xs">
                      <span className="font-medium text-slate-500">Quality Score:</span>
                      <span className="font-bold text-emerald-600 flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5" />
                        {resume.qualityScore}% (ATS-Ready)
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Actions (Mobile-friendly touch buttons) */}
              <div className="flex flex-wrap items-center gap-2 self-start sm:self-center border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100 w-full sm:w-auto justify-end">
                {!resume.isPrimary && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => primaryMutation.mutate(resume.id)}
                    isLoading={primaryMutation.isPending}
                    className="text-xs font-semibold min-h-[38px]"
                  >
                    <Star className="w-3.5 h-3.5 mr-1 text-slate-400" />
                    Make Primary
                  </Button>
                )}

                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => autofillMutation.mutate(resume.id)}
                  isLoading={autofillMutation.isPending && autofillMutation.variables === resume.id}
                  className="text-xs font-semibold min-h-[38px] bg-brand-50 hover:bg-brand-100 text-brand-700 border-brand-200"
                  title="Auto-fill candidate profile with details from this resume"
                >
                  <Sparkles className="w-3.5 h-3.5 mr-1 text-brand-600" />
                  Auto-Fill Profile
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleViewResume(resume)}
                  className="text-xs min-h-[38px]"
                >
                  <ExternalLink className="w-3.5 h-3.5 mr-1 text-slate-400" />
                  View File
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditingResume(resume)}
                  className="text-slate-500 hover:text-slate-800 p-2 min-h-[38px]"
                  title="Edit Resume Title & Visibility"
                >
                  <Edit2 className="w-4 h-4" />
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (window.confirm(`Delete "${resume.title}"?`)) {
                      deleteMutation.mutate(resume.id);
                    }
                  }}
                  className="text-slate-400 hover:text-red-600 p-2 min-h-[38px]"
                  title="Delete Resume"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ResumesPage;
