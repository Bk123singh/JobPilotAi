import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { jobApi } from '../../api/jobApi';
import { useUIStore } from '../../store/useUIStore';
import {
  Briefcase,
  MapPin,
  DollarSign,
  Plus,
  Sparkles,
  CheckCircle2,
  X,
  ArrowRight,
} from 'lucide-react';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Card, { CardBody, CardHeader } from '../../components/common/Card';

const POPULAR_SKILLS = [
  'JavaScript',
  'TypeScript',
  'React',
  'Node.js',
  'Express',
  'PostgreSQL',
  'Python',
  'Docker',
  'AWS',
  'Tailwind CSS',
  'GraphQL',
  'Kubernetes',
];

const CreateJobPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { addToast } = useUIStore();

  const [formData, setFormData] = useState({
    title: '',
    workplaceType: 'REMOTE',
    location: '',
    jobType: 'FULL_TIME',
    experienceLevel: 'Mid-Senior Level (3-5 years)',
    minSalary: '',
    maxSalary: '',
    currency: 'USD',
    description: '',
    requiredSkills: [],
    niceToHaveSkills: [],
  });

  const [reqSkillInput, setReqSkillInput] = useState('');
  const [niceSkillInput, setNiceSkillInput] = useState('');

  const createMutation = useMutation({
    mutationFn: (data) => jobApi.createJob(data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      addToast({ message: 'Job opening posted successfully!', type: 'success' });
      navigate('/jobs/' + res.data.job.id);
    },
    onError: (err) => {
      addToast({
        message: err.response?.data?.message || 'Failed to post job opening',
        type: 'error',
      });
    },
  });

  const handleAddReqSkill = (skillToAdd) => {
    const s = (skillToAdd || reqSkillInput).trim();
    if (!s) return;
    if (!formData.requiredSkills.includes(s)) {
      setFormData({ ...formData, requiredSkills: [...formData.requiredSkills, s] });
    }
    setReqSkillInput('');
  };

  const handleRemoveReqSkill = (skill) => {
    setFormData({
      ...formData,
      requiredSkills: formData.requiredSkills.filter((s) => s !== skill),
    });
  };

  const handleAddNiceSkill = () => {
    const s = niceSkillInput.trim();
    if (!s) return;
    if (!formData.niceToHaveSkills.includes(s)) {
      setFormData({ ...formData, niceToHaveSkills: [...formData.niceToHaveSkills, s] });
    }
    setNiceSkillInput('');
  };

  const handleRemoveNiceSkill = (skill) => {
    setFormData({
      ...formData,
      niceToHaveSkills: formData.niceToHaveSkills.filter((s) => s !== skill),
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      addToast({ message: 'Job title is required', type: 'error' });
      return;
    }
    if (formData.requiredSkills.length === 0) {
      addToast({ message: 'Please add at least one required skill', type: 'error' });
      return;
    }
    if (!formData.description.trim() || formData.description.length < 20) {
      addToast({ message: 'Description must be at least 20 characters', type: 'error' });
      return;
    }

    createMutation.mutate({
      ...formData,
      minSalary: formData.minSalary ? parseInt(formData.minSalary, 10) : null,
      maxSalary: formData.maxSalary ? parseInt(formData.maxSalary, 10) : null,
    });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Post a New Opportunity
        </h1>
        <p className="text-sm text-slate-600">
          Target qualified candidates with structured skills and transparent match scoring.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="p-6 sm:p-8 space-y-6">
          <CardHeader className="p-0 pb-4 border-b border-slate-100">
            <h2 className="text-base font-bold text-slate-900">Core Job Details</h2>
          </CardHeader>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <Input
                label="Job Title"
                placeholder="e.g. Senior Full-Stack Engineer"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 tracking-wide uppercase mb-1.5">
                Workplace Type
              </label>
              <select
                value={formData.workplaceType}
                onChange={(e) => setFormData({ ...formData, workplaceType: e.target.value })}
                className="block w-full rounded-xl border border-slate-300 bg-white text-slate-900 text-sm min-h-[46px] px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="REMOTE">Fully Remote</option>
                <option value="HYBRID">Hybrid</option>
                <option value="ONSITE">On-Site</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 tracking-wide uppercase mb-1.5">
                Job Type
              </label>
              <select
                value={formData.jobType}
                onChange={(e) => setFormData({ ...formData, jobType: e.target.value })}
                className="block w-full rounded-xl border border-slate-300 bg-white text-slate-900 text-sm min-h-[46px] px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="FULL_TIME">Full-Time</option>
                <option value="PART_TIME">Part-Time</option>
                <option value="CONTRACT">Contract</option>
                <option value="INTERNSHIP">Internship</option>
              </select>
            </div>

            <Input
              label="Location"
              placeholder="e.g. San Francisco, CA / Remote (US)"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              leftIcon={MapPin}
              required
            />

            <div>
              <label className="block text-xs font-semibold text-slate-700 tracking-wide uppercase mb-1.5">
                Experience Level
              </label>
              <select
                value={formData.experienceLevel}
                onChange={(e) => setFormData({ ...formData, experienceLevel: e.target.value })}
                className="block w-full rounded-xl border border-slate-300 bg-white text-slate-900 text-sm min-h-[46px] px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="Entry Level (0-2 years)">Entry Level (0-2 years)</option>
                <option value="Mid Level (2-4 years)">Mid Level (2-4 years)</option>
                <option value="Mid-Senior Level (3-5 years)">Mid-Senior Level (3-5 years)</option>
                <option value="Senior Level (5+ years)">Senior Level (5+ years)</option>
                <option value="Lead / Staff (7+ years)">Lead / Staff (7+ years)</option>
              </select>
            </div>

            <Input
              label="Minimum Salary (Annual USD)"
              type="number"
              placeholder="e.g. 120000"
              value={formData.minSalary}
              onChange={(e) => setFormData({ ...formData, minSalary: e.target.value })}
            />

            <Input
              label="Maximum Salary (Annual USD)"
              type="number"
              placeholder="e.g. 160000"
              value={formData.maxSalary}
              onChange={(e) => setFormData({ ...formData, maxSalary: e.target.value })}
            />
          </div>
        </Card>

        {/* Required Skills Card */}
        <Card className="p-6 sm:p-8 space-y-4">
          <CardHeader className="p-0 pb-3 border-b border-slate-100">
            <h2 className="text-base font-bold text-slate-900">Required Skills (Pillar 1: 40%)</h2>
            <p className="text-xs text-slate-500">
              Essential technical competencies used to calculate the candidate match score.
            </p>
          </CardHeader>

          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                placeholder="Type required skill (e.g. React) and press Enter"
                value={reqSkillInput}
                onChange={(e) => setReqSkillInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddReqSkill();
                  }
                }}
              />
            </div>
            <Button
              type="button"
              variant="primary"
              onClick={() => handleAddReqSkill()}
              className="px-5 self-center min-h-[46px]"
            >
              <Plus className="w-4 h-4 mr-1" />
              Add
            </Button>
          </div>

          <div className="flex flex-wrap gap-2">
            {formData.requiredSkills.map((skill) => (
              <span
                key={skill}
                className="inline-flex items-center px-3 py-1.5 rounded-xl bg-brand-50 text-brand-700 text-xs sm:text-sm font-semibold border border-brand-200"
              >
                {skill}
                <button
                  type="button"
                  onClick={() => handleRemoveReqSkill(skill)}
                  className="ml-2 text-brand-400 hover:text-brand-800"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            ))}
          </div>

          {/* Quick-add chips */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5">
            <span className="font-semibold text-slate-600 block">Popular Skills to Add:</span>
            <div className="flex flex-wrap gap-1.5">
              {POPULAR_SKILLS.filter((s) => !formData.requiredSkills.includes(s)).map((skill) => (
                <button
                  key={skill}
                  type="button"
                  onClick={() => handleAddReqSkill(skill)}
                  className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-brand-50 hover:text-brand-700 text-xs font-medium transition"
                >
                  + {skill}
                </button>
              ))}
            </div>
          </div>
        </Card>

        {/* Job Description Card */}
        <Card className="p-6 sm:p-8 space-y-4">
          <CardHeader className="p-0 pb-3 border-b border-slate-100">
            <h2 className="text-base font-bold text-slate-900">Job Description & Responsibilities</h2>
          </CardHeader>

          <div className="space-y-1.5">
            <textarea
              rows={8}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Outline the role responsibilities, team structure, qualifications, and day-to-day impact..."
              className="block w-full rounded-xl border border-slate-300 p-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              required
            />
          </div>
        </Card>

        {/* Sticky Mobile Publish Bar */}
        <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-200 shadow-sm sticky bottom-20 md:bottom-6 z-30">
          <p className="text-xs text-slate-500 hidden sm:block">
            Your job posting will be published immediately and discoverable by candidates.
          </p>
          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={createMutation.isPending}
            className="w-full sm:w-auto font-bold shadow-md ml-auto"
          >
            Publish Job Opening
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CreateJobPage;
