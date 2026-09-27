import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { profileApi } from '../../api/profileApi';
import { useUIStore } from '../../store/useUIStore';
import {
  User,
  Sparkles,
  Briefcase,
  GraduationCap,
  FolderGit2,
  Sliders,
  Save,
  Plus,
  Trash2,
  ExternalLink,
  MapPin,
  Mail,
  Phone,
  Globe,
  Github,
  Linkedin,
  CheckCircle2,
  AlertCircle,
  X,
} from 'lucide-react';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Card, { CardBody, CardHeader } from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Skeleton from '../../components/common/Skeleton';
import SkillGapIntelligenceCard from '../../components/profile/SkillGapIntelligenceCard';

const POPULAR_SKILLS = [
  'JavaScript',
  'TypeScript',
  'React',
  'Node.js',
  'Express',
  'PostgreSQL',
  'Python',
  'Tailwind CSS',
  'Docker',
  'AWS',
  'Next.js',
  'GraphQL',
  'MongoDB',
  'Git',
];

const ProfilePage = () => {
  const queryClient = useQueryClient();
  const { addToast } = useUIStore();

  const [activeTab, setActiveTab] = useState('general');
  const [skillInput, setSkillInput] = useState('');
  const [newExp, setNewExp] = useState({
    company: '',
    title: '',
    location: '',
    startDate: '',
    endDate: '',
    current: false,
    description: '',
  });
  const [showAddExp, setShowAddExp] = useState(false);

  const [newEdu, setNewEdu] = useState({
    institution: '',
    degree: '',
    fieldOfStudy: '',
    startDate: '',
    endDate: '',
    current: false,
    description: '',
  });
  const [showAddEdu, setShowAddEdu] = useState(false);

  const [newProj, setNewProj] = useState({
    title: '',
    description: '',
    url: '',
    technologies: [],
  });
  const [showAddProj, setShowAddProj] = useState(false);
  const [projTechInput, setProjTechInput] = useState('');

  // Fetch profile
  const { data, isLoading, isError } = useQuery({
    queryKey: ['myProfile'],
    queryFn: profileApi.getMyProfile,
  });

  const [formData, setFormData] = useState({
    fullName: '',
    headline: '',
    phone: '',
    location: '',
    bio: '',
    website: '',
    githubUrl: '',
    linkedinUrl: '',
    skills: [],
    education: [],
    experience: [],
    projects: [],
    certifications: [],
    careerPreferences: {
      desiredRoles: [],
      preferredLocations: [],
      remotePreference: 'ANY',
      minExpectedSalary: 0,
      currency: 'USD',
    },
  });

  useEffect(() => {
    if (data?.data?.profile) {
      const p = data.data.profile;
      setFormData({
        fullName: p.fullName || '',
        headline: p.headline || '',
        phone: p.phone || '',
        location: p.location || '',
        bio: p.bio || '',
        website: p.website || '',
        githubUrl: p.githubUrl || '',
        linkedinUrl: p.linkedinUrl || '',
        skills: p.skills || [],
        education: p.education || [],
        experience: p.experience || [],
        projects: p.projects || [],
        certifications: p.certifications || [],
        careerPreferences: p.careerPreferences || {
          desiredRoles: [],
          preferredLocations: [],
          remotePreference: 'ANY',
          minExpectedSalary: 0,
          currency: 'USD',
        },
      });
    }
  }, [data]);

  // Save mutation
  const updateMutation = useMutation({
    mutationFn: (updated) => profileApi.updateMyProfile(updated),
    onSuccess: (res) => {
      queryClient.setQueryData(['myProfile'], res);
      addToast({ message: 'Profile saved successfully!', type: 'success' });
    },
    onError: (err) => {
      addToast({
        message: err.response?.data?.message || 'Failed to update profile',
        type: 'error',
      });
    },
  });

  const handleSave = (e) => {
    if (e) e.preventDefault();
    updateMutation.mutate(formData);
  };

  // Skill handlers
  const handleAddSkill = (skillToAdd) => {
    const s = (skillToAdd || skillInput).trim();
    if (!s) return;
    if (!formData.skills.some((item) => item.toLowerCase() === s.toLowerCase())) {
      setFormData((prev) => ({
        ...prev,
        skills: [...prev.skills, s],
      }));
    }
    setSkillInput('');
  };

  const handleRemoveSkill = (skillToRemove) => {
    setFormData((prev) => ({
      ...prev,
      skills: prev.skills.filter((s) => s !== skillToRemove),
    }));
  };

  // Experience handlers
  const handleAddExperience = () => {
    if (!newExp.company || !newExp.title) {
      addToast({ message: 'Company and Job Title are required', type: 'error' });
      return;
    }
    setFormData((prev) => ({
      ...prev,
      experience: [...prev.experience, { ...newExp, id: 'exp-' + Date.now() }],
    }));
    setNewExp({
      company: '',
      title: '',
      location: '',
      startDate: '',
      endDate: '',
      current: false,
      description: '',
    });
    setShowAddExp(false);
  };

  const handleRemoveExperience = (id) => {
    setFormData((prev) => ({
      ...prev,
      experience: prev.experience.filter((e) => e.id !== id),
    }));
  };

  // Education handlers
  const handleAddEducation = () => {
    if (!newEdu.institution || !newEdu.degree) {
      addToast({ message: 'Institution and Degree are required', type: 'error' });
      return;
    }
    setFormData((prev) => ({
      ...prev,
      education: [...prev.education, { ...newEdu, id: 'edu-' + Date.now() }],
    }));
    setNewEdu({
      institution: '',
      degree: '',
      fieldOfStudy: '',
      startDate: '',
      endDate: '',
      current: false,
      description: '',
    });
    setShowAddEdu(false);
  };

  const handleRemoveEducation = (id) => {
    setFormData((prev) => ({
      ...prev,
      education: prev.education.filter((e) => e.id !== id),
    }));
  };

  // Project handlers
  const handleAddProject = () => {
    if (!newProj.title) {
      addToast({ message: 'Project title is required', type: 'error' });
      return;
    }
    setFormData((prev) => ({
      ...prev,
      projects: [...prev.projects, { ...newProj, id: 'proj-' + Date.now() }],
    }));
    setNewProj({ title: '', description: '', url: '', technologies: [] });
    setShowAddProj(false);
  };

  const handleRemoveProject = (id) => {
    setFormData((prev) => ({
      ...prev,
      projects: prev.projects.filter((p) => p.id !== id),
    }));
  };

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        <Skeleton className="h-32 w-full rounded-2xl" />
        <Skeleton className="h-12 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  const profile = data?.data?.profile;
  const completeness = profile?.completenessScore || 0;
  const suggestions = profile?.suggestions || [];

  const tabs = [
    { id: 'general', label: 'Basic Info', icon: User },
    { id: 'skills', label: 'Skills', icon: Sparkles },
    { id: 'experience', label: 'Experience', icon: Briefcase },
    { id: 'education', label: 'Education', icon: GraduationCap },
    { id: 'projects', label: 'Projects', icon: FolderGit2 },
    { id: 'preferences', label: 'Preferences', icon: Sliders },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
      {/* Profile Header & Completeness Card */}
      <Card className="p-6 bg-gradient-to-r from-white to-slate-50 border-slate-200 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-brand-600 to-indigo-700 text-white flex items-center justify-center font-black text-2xl shadow-md">
              {formData.fullName?.charAt(0)?.toUpperCase() || 'C'}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
                  {formData.fullName || 'Your Name'}
                </h1>
                <Badge variant="brand">Job Seeker</Badge>
              </div>
              <p className="text-sm text-slate-600 font-medium">
                {formData.headline || 'Add a professional headline below'}
              </p>
              {formData.location && (
                <p className="text-xs text-slate-500 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  {formData.location}
                </p>
              )}
            </div>
          </div>

          {/* Completeness Meter */}
          <div className="sm:text-right space-y-2 max-w-xs sm:self-center">
            <div className="flex items-center sm:justify-end gap-2">
              <span className="text-xs font-semibold text-slate-500 uppercase">
                Profile Completeness:
              </span>
              <span className="text-sm font-extrabold text-brand-600">
                {completeness}%
              </span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
              <div
                className="bg-brand-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${completeness}%` }}
              />
            </div>
            {suggestions.length > 0 && (
              <p className="text-[11px] text-amber-700 font-medium truncate">
                💡 Tip: {suggestions[0]}
              </p>
            )}
          </div>
        </div>
      </Card>

      {/* Mobile-Friendly Segmented Tab Navigation */}
      <div className="flex overflow-x-auto no-scrollbar gap-1.5 p-1 bg-slate-100 rounded-2xl border border-slate-200/80">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all min-h-[44px]
                ${isActive ? 'bg-white text-brand-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'}
              `}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Panels */}
      <form onSubmit={handleSave} className="space-y-6">
        {/* 1. BASIC INFO TAB */}
        {activeTab === 'general' && (
          <Card className="p-6 space-y-4">
            <CardHeader className="p-0 pb-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900">Personal & Contact Details</h2>
                <p className="text-xs text-slate-500">Provide accurate information for recruiters to connect.</p>
              </div>
            </CardHeader>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Full Name"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                placeholder="Alex Seeker"
                required
              />

              <Input
                label="Professional Headline"
                value={formData.headline}
                onChange={(e) => setFormData({ ...formData, headline: e.target.value })}
                placeholder="Full-Stack JavaScript Engineer"
              />

              <Input
                label="Phone Number"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+1 (555) 000-0000"
                leftIcon={Phone}
              />

              <Input
                label="Location (City, State / Remote)"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="San Francisco, CA"
                leftIcon={MapPin}
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 tracking-wide uppercase">
                Short Bio / Summary
              </label>
              <textarea
                rows={4}
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                placeholder="Summarize your professional background, strengths, and what drives you..."
                className="block w-full rounded-xl border border-slate-300 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <Input
                label="Personal Website / Portfolio"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                placeholder="https://myportfolio.dev"
                leftIcon={Globe}
              />
              <Input
                label="GitHub URL"
                value={formData.githubUrl}
                onChange={(e) => setFormData({ ...formData, githubUrl: e.target.value })}
                placeholder="https://github.com/username"
                leftIcon={Github}
              />
              <Input
                label="LinkedIn Profile"
                value={formData.linkedinUrl}
                onChange={(e) => setFormData({ ...formData, linkedinUrl: e.target.value })}
                placeholder="https://linkedin.com/in/username"
                leftIcon={Linkedin}
              />
            </div>
          </Card>
        )}

        {/* 2. SKILLS TAB */}
        {activeTab === 'skills' && (
          <div className="space-y-6">
            {/* Market Skill Gap Intelligence Card with 1-tap Boost */}
            <SkillGapIntelligenceCard />

            <Card className="p-6 space-y-6">
              <CardHeader className="p-0 pb-4 border-b border-slate-100">
                <h2 className="text-base font-bold text-slate-900">Skills & Tech Stack</h2>
                <p className="text-xs text-slate-500">
                  Skills directly drive the 40% deterministic Job Match Score calculation.
                </p>
              </CardHeader>

              {/* Input with Add button */}
              <div className="flex gap-2">
                <div className="flex-1">
                  <Input
                    placeholder="Type a skill (e.g. Docker, GraphQL) and press Enter"
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddSkill();
                      }
                    }}
                  />
                </div>
                <Button
                  type="button"
                  variant="primary"
                  onClick={() => handleAddSkill()}
                  className="px-5 self-center min-h-[46px]"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add
                </Button>
              </div>

              {/* Current Skills List */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-slate-700 uppercase">
                  Your Skills ({formData.skills.length})
                </p>
                {formData.skills.length === 0 ? (
                  <div className="p-6 text-center border-2 border-dashed border-slate-200 rounded-xl">
                    <p className="text-sm text-slate-500">No skills added yet. Select from below or type your own.</p>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {formData.skills.map((skill) => (
                      <span
                        key={skill}
                        className="inline-flex items-center px-3 py-1.5 rounded-xl bg-brand-50 text-brand-700 text-xs sm:text-sm font-semibold border border-brand-200 shadow-sm"
                      >
                        {skill}
                        <button
                          type="button"
                          onClick={() => handleRemoveSkill(skill)}
                          className="ml-2 text-brand-400 hover:text-brand-800"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Popular Skills Quick-Add Tray */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <p className="text-xs font-bold text-slate-700 uppercase">Popular Skills to Add (1-Tap):</p>
                <div className="flex flex-wrap gap-1.5">
                  {POPULAR_SKILLS.filter(
                    (s) => !formData.skills.some((item) => item.toLowerCase() === s.toLowerCase())
                  ).map((skill) => (
                    <button
                      key={skill}
                      type="button"
                      onClick={() => handleAddSkill(skill)}
                      className="inline-flex items-center text-xs font-medium px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-brand-50 hover:border-brand-300 hover:text-brand-700 transition"
                    >
                      <Plus className="w-3 h-3 mr-1 text-slate-400" />
                      {skill}
                    </button>
                  ))}
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* 3. EXPERIENCE TAB */}
        {activeTab === 'experience' && (
          <Card className="p-6 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-base font-bold text-slate-900">Work Experience</h2>
                <p className="text-xs text-slate-500">List previous positions, achievements, and impact.</p>
              </div>
              {!showAddExp && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddExp(true)}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Position
                </Button>
              )}
            </div>

            {/* New Experience Form */}
            {showAddExp && (
              <div className="p-4 sm:p-6 bg-slate-50 rounded-2xl border border-brand-200 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm text-slate-900">Add New Position</h3>
                  <button
                    type="button"
                    onClick={() => setShowAddExp(false)}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Company Name"
                    placeholder="e.g. Acme Corp"
                    value={newExp.company}
                    onChange={(e) => setNewExp({ ...newExp, company: e.target.value })}
                  />
                  <Input
                    label="Job Title"
                    placeholder="e.g. Senior Software Engineer"
                    value={newExp.title}
                    onChange={(e) => setNewExp({ ...newExp, title: e.target.value })}
                  />
                  <Input
                    label="Location"
                    placeholder="e.g. New York, NY (Remote)"
                    value={newExp.location}
                    onChange={(e) => setNewExp({ ...newExp, location: e.target.value })}
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      label="Start Date"
                      placeholder="e.g. 2022-01"
                      value={newExp.startDate}
                      onChange={(e) => setNewExp({ ...newExp, startDate: e.target.value })}
                    />
                    <Input
                      label="End Date"
                      placeholder="e.g. Present"
                      disabled={newExp.current}
                      value={newExp.current ? 'Present' : newExp.endDate}
                      onChange={(e) => setNewExp({ ...newExp, endDate: e.target.value })}
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="expCurrent"
                    checked={newExp.current}
                    onChange={(e) => setNewExp({ ...newExp, current: e.target.checked })}
                    className="w-4 h-4 text-brand-600 rounded"
                  />
                  <label htmlFor="expCurrent" className="text-xs font-semibold text-slate-700">
                    I currently work here
                  </label>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-700 tracking-wide uppercase">
                    Description & Key Accomplishments
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Describe your responsibilities, metrics improved, and tech stack utilized..."
                    value={newExp.description}
                    onChange={(e) => setNewExp({ ...newExp, description: e.target.value })}
                    className="block w-full rounded-xl border border-slate-300 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAddExp(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    onClick={handleAddExperience}
                  >
                    Add Position
                  </Button>
                </div>
              </div>
            )}

            {/* List of Experiences */}
            <div className="space-y-4">
              {formData.experience.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-6">
                  No experience records added yet. Click &quot;Add Position&quot; to begin.
                </p>
              ) : (
                formData.experience.map((exp) => (
                  <div
                    key={exp.id}
                    className="p-4 rounded-xl border border-slate-200 hover:border-slate-300 transition bg-white flex flex-col sm:flex-row sm:items-start justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <h3 className="font-bold text-sm text-slate-900">{exp.title}</h3>
                      <p className="text-xs font-semibold text-brand-600">{exp.company}</p>
                      <p className="text-xs text-slate-500">
                        {exp.startDate} – {exp.current ? 'Present' : exp.endDate || 'N/A'}{' '}
                        {exp.location && `• ${exp.location}`}
                      </p>
                      {exp.description && (
                        <p className="text-xs text-slate-600 mt-2 leading-relaxed whitespace-pre-line">
                          {exp.description}
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveExperience(exp.id)}
                      className="text-slate-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-slate-50 self-end sm:self-start"
                      title="Remove"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </Card>
        )}

        {/* 4. EDUCATION TAB */}
        {activeTab === 'education' && (
          <Card className="p-6 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-base font-bold text-slate-900">Education & Degrees</h2>
                <p className="text-xs text-slate-500">Degrees, colleges, and certifications.</p>
              </div>
              {!showAddEdu && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddEdu(true)}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Degree
                </Button>
              )}
            </div>

            {showAddEdu && (
              <div className="p-4 sm:p-6 bg-slate-50 rounded-2xl border border-brand-200 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="School / University"
                    placeholder="e.g. Stanford University"
                    value={newEdu.institution}
                    onChange={(e) => setNewEdu({ ...newEdu, institution: e.target.value })}
                  />
                  <Input
                    label="Degree"
                    placeholder="e.g. B.S. / M.S."
                    value={newEdu.degree}
                    onChange={(e) => setNewEdu({ ...newEdu, degree: e.target.value })}
                  />
                  <Input
                    label="Field of Study"
                    placeholder="e.g. Computer Science"
                    value={newEdu.fieldOfStudy}
                    onChange={(e) => setNewEdu({ ...newEdu, fieldOfStudy: e.target.value })}
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      label="Start Year"
                      placeholder="e.g. 2018"
                      value={newEdu.startDate}
                      onChange={(e) => setNewEdu({ ...newEdu, startDate: e.target.value })}
                    />
                    <Input
                      label="End Year"
                      placeholder="e.g. 2022"
                      value={newEdu.endDate}
                      onChange={(e) => setNewEdu({ ...newEdu, endDate: e.target.value })}
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAddEdu(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    onClick={handleAddEducation}
                  >
                    Add Degree
                  </Button>
                </div>
              </div>
            )}

            <div className="space-y-4">
              {formData.education.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-6">
                  No education records added yet. Click &quot;Add Degree&quot; to begin.
                </p>
              ) : (
                formData.education.map((edu) => (
                  <div
                    key={edu.id}
                    className="p-4 rounded-xl border border-slate-200 hover:border-slate-300 transition bg-white flex flex-col sm:flex-row sm:items-start justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <h3 className="font-bold text-sm text-slate-900">{edu.degree}</h3>
                      <p className="text-xs font-semibold text-brand-600">{edu.institution}</p>
                      <p className="text-xs text-slate-500">
                        {edu.fieldOfStudy && `${edu.fieldOfStudy} • `}
                        {edu.startDate} – {edu.endDate || 'Present'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveEducation(edu.id)}
                      className="text-slate-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-slate-50 self-end sm:self-start"
                      title="Remove"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </Card>
        )}

        {/* 5. PROJECTS TAB */}
        {activeTab === 'projects' && (
          <Card className="p-6 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-base font-bold text-slate-900">Portfolio & Projects</h2>
                <p className="text-xs text-slate-500">
                  Real projects contribute 10% to the deterministic Job Match Score.
                </p>
              </div>
              {!showAddProj && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddProj(true)}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Project
                </Button>
              )}
            </div>

            {showAddProj && (
              <div className="p-4 sm:p-6 bg-slate-50 rounded-2xl border border-brand-200 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Project Title"
                    placeholder="e.g. AI-Powered Search Tool"
                    value={newProj.title}
                    onChange={(e) => setNewProj({ ...newProj, title: e.target.value })}
                  />
                  <Input
                    label="Project URL / GitHub Link"
                    placeholder="https://github.com/myusername/project"
                    value={newProj.url}
                    onChange={(e) => setNewProj({ ...newProj, url: e.target.value })}
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-700 tracking-wide uppercase">
                    Description
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Briefly summarize what you built and the impact..."
                    value={newProj.description}
                    onChange={(e) => setNewProj({ ...newProj, description: e.target.value })}
                    className="block w-full rounded-xl border border-slate-300 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAddProj(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    onClick={handleAddProject}
                  >
                    Add Project
                  </Button>
                </div>
              </div>
            )}

            <div className="space-y-4">
              {formData.projects.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-6">
                  No projects added yet. Click &quot;Add Project&quot; to showcase your code.
                </p>
              ) : (
                formData.projects.map((proj) => (
                  <div
                    key={proj.id}
                    className="p-4 rounded-xl border border-slate-200 hover:border-slate-300 transition bg-white flex flex-col sm:flex-row sm:items-start justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-sm text-slate-900">{proj.title}</h3>
                        {proj.url && (
                          <a
                            href={proj.url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-brand-600 hover:text-brand-800"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">{proj.description}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveProject(proj.id)}
                      className="text-slate-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-slate-50 self-end sm:self-start"
                      title="Remove"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </Card>
        )}

        {/* 6. CAREER PREFERENCES TAB */}
        {activeTab === 'preferences' && (
          <Card className="p-6 space-y-6">
            <CardHeader className="p-0 pb-4 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900">Career & Job Preferences</h2>
              <p className="text-xs text-slate-500">
                These preferences contribute 10% to matching and power automated recommendation alerts.
              </p>
            </CardHeader>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 tracking-wide uppercase mb-1.5">
                  Remote Preference
                </label>
                <select
                  value={formData.careerPreferences?.remotePreference || 'ANY'}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      careerPreferences: {
                        ...formData.careerPreferences,
                        remotePreference: e.target.value,
                      },
                    })
                  }
                  className="block w-full rounded-xl border border-slate-300 bg-white text-slate-900 text-sm min-h-[46px] px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  <option value="REMOTE">Fully Remote Only</option>
                  <option value="HYBRID">Hybrid (Remote + Office)</option>
                  <option value="ONSITE">On-Site Only</option>
                  <option value="ANY">Flexible / Any Workplace Type</option>
                </select>
              </div>

              <div>
                <Input
                  label="Minimum Target Base Salary (Annual USD)"
                  type="number"
                  placeholder="e.g. 120000"
                  value={formData.careerPreferences?.minExpectedSalary || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      careerPreferences: {
                        ...formData.careerPreferences,
                        minExpectedSalary: parseInt(e.target.value, 10) || 0,
                      },
                    })
                  }
                />
              </div>
            </div>
          </Card>
        )}

        {/* Action Save Bar */}
        <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-200 shadow-sm sticky bottom-20 md:bottom-6 z-30">
          <p className="text-xs text-slate-500 hidden sm:block">
            Always remember to save your changes before leaving this page.
          </p>
          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={updateMutation.isPending}
            className="w-full sm:w-auto font-semibold shadow-md ml-auto"
          >
            <Save className="w-4 h-4 mr-2" />
            Save Profile Changes
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ProfilePage;
