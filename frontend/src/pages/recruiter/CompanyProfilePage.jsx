import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { companyApi } from '../../api/companyApi';
import { useUIStore } from '../../store/useUIStore';
import { useAuthStore } from '../../store/useAuthStore';
import {
  Building2,
  Globe,
  MapPin,
  Users,
  Briefcase,
  CheckCircle2,
  ShieldCheck,
  Save,
  Sparkles,
  ExternalLink,
  AlertCircle,
} from 'lucide-react';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Card, { CardBody, CardHeader } from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Skeleton from '../../components/common/Skeleton';

const INDUSTRY_OPTIONS = [
  'Software & Technology',
  'Artificial Intelligence',
  'Financial Services & Fintech',
  'Healthcare & Biotechnology',
  'E-commerce & Retail',
  'Consulting & Professional Services',
  'Cybersecurity',
  'Education & EdTech',
  'Media & Entertainment',
  'Other',
];

const SIZE_OPTIONS = [
  '1-10 employees (Seed)',
  '11-50 employees (Startup)',
  '51-200 employees (Scale-up)',
  '201-500 employees (Mid-market)',
  '500+ employees (Enterprise)',
];

const CompanyProfilePage = () => {
  const queryClient = useQueryClient();
  const { addToast } = useUIStore();
  const { user } = useAuthStore();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['myCompany'],
    queryFn: companyApi.getMyCompany,
  });

  const company = data?.data?.company;

  const [formData, setFormData] = useState({
    name: '',
    industry: 'Software & Technology',
    companySize: '51-200 employees (Scale-up)',
    location: '',
    website: '',
    logoUrl: '',
    description: '',
  });

  useEffect(() => {
    if (company) {
      setFormData({
        name: company.name || '',
        industry: company.industry || 'Software & Technology',
        companySize: company.companySize || '51-200 employees (Scale-up)',
        location: company.location || '',
        website: company.website || '',
        logoUrl: company.logoUrl || '',
        description: company.description || '',
      });
    }
  }, [company]);

  const saveMutation = useMutation({
    mutationFn: (updated) => {
      if (company?.id) {
        return companyApi.updateCompany(company.id, updated);
      } else {
        return companyApi.createCompany(updated);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myCompany'] });
      addToast({ message: 'Company profile saved successfully!', type: 'success' });
    },
    onError: (err) => {
      addToast({
        message: err.response?.data?.message || 'Failed to save company profile',
        type: 'error',
      });
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      addToast({ message: 'Company name is required', type: 'error' });
      return;
    }
    saveMutation.mutate(formData);
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        <Skeleton className="h-32 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
      {/* Header Banner Card */}
      <Card className="p-6 sm:p-8 bg-gradient-to-r from-white to-brand-50/30 border-slate-200 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center space-x-4">
            {formData.logoUrl ? (
              <img
                src={formData.logoUrl}
                alt={formData.name}
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border border-slate-200 shadow-sm"
              />
            ) : (
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-brand-600 text-white flex items-center justify-center font-black text-2xl shadow-md">
                {formData.name?.charAt(0)?.toUpperCase() || 'C'}
              </div>
            )}

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
                  {formData.name || 'Company Profile'}
                </h1>
                {company?.isVerified ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-100/90 px-2.5 py-0.5 rounded-full border border-emerald-300">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    Verified Employer
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-800 bg-amber-100/80 px-2.5 py-0.5 rounded-full border border-amber-300">
                    Verification In Progress
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 pt-0.5">
                {formData.industry && (
                  <span className="flex items-center gap-1 font-medium text-slate-600">
                    <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                    {formData.industry}
                  </span>
                )}
                {formData.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    {formData.location}
                  </span>
                )}
                {formData.companySize && (
                  <span className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-slate-400" />
                    {formData.companySize}
                  </span>
                )}
              </div>
            </div>
          </div>

          {formData.website && (
            <a
              href={formData.website}
              target="_blank"
              rel="noreferrer"
              className="sm:self-center"
            >
              <Button variant="outline" size="sm" className="text-xs">
                Visit Website
                <ExternalLink className="w-3.5 h-3.5 ml-1.5" />
              </Button>
            </a>
          )}
        </div>
      </Card>

      {/* Main Profile Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="p-6 sm:p-8 space-y-6">
          <CardHeader className="p-0 pb-4 border-b border-slate-100">
            <h2 className="text-base font-bold text-slate-900">Organization Information</h2>
            <p className="text-xs text-slate-500">
              Details shown to candidates across your job postings and company showcase.
            </p>
          </CardHeader>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Company Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Acme Corporation"
              required
            />

            <div>
              <label className="block text-xs font-semibold text-slate-700 tracking-wide uppercase mb-1.5">
                Industry
              </label>
              <select
                value={formData.industry}
                onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                className="block w-full rounded-xl border border-slate-300 bg-white text-slate-900 text-sm min-h-[46px] px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                {INDUSTRY_OPTIONS.map((ind) => (
                  <option key={ind} value={ind}>
                    {ind}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 tracking-wide uppercase mb-1.5">
                Company Size
              </label>
              <select
                value={formData.companySize}
                onChange={(e) => setFormData({ ...formData, companySize: e.target.value })}
                className="block w-full rounded-xl border border-slate-300 bg-white text-slate-900 text-sm min-h-[46px] px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                {SIZE_OPTIONS.map((sz) => (
                  <option key={sz} value={sz}>
                    {sz}
                  </option>
                ))}
              </select>
            </div>

            <Input
              label="Headquarters Location"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="e.g. New York, NY / Remote"
              leftIcon={MapPin}
            />

            <Input
              label="Company Website"
              value={formData.website}
              onChange={(e) => setFormData({ ...formData, website: e.target.value })}
              placeholder="https://company.example.com"
              leftIcon={Globe}
            />

            <Input
              label="Logo Image URL"
              value={formData.logoUrl}
              onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
              placeholder="https://.../logo.png"
              helperText="Hosted via Cloudinary or external HTTPS image"
            />
          </div>

          <div className="space-y-1.5 pt-2">
            <label className="block text-xs font-semibold text-slate-700 tracking-wide uppercase">
              Company Overview & Culture
            </label>
            <textarea
              rows={5}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe your organization's mission, values, work culture, and why top talent should join..."
              className="block w-full rounded-xl border border-slate-300 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </Card>

        {/* Recruiter / Admin Association Card */}
        <Card className="p-6 space-y-4">
          <CardHeader className="p-0 pb-3 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">Recruiter Team</h3>
              <p className="text-xs text-slate-500">Authorized recruiters managing job listings for this company.</p>
            </div>
            <Badge variant="purple">Administrator</Badge>
          </CardHeader>

          <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-sm">
                {user?.fullName?.charAt(0)?.toUpperCase() || 'R'}
              </div>
              <div>
                <p className="font-bold text-sm text-slate-900">{user?.fullName}</p>
                <p className="text-xs text-slate-500">{user?.email}</p>
              </div>
            </div>

            <div className="text-right">
              <span className="text-xs font-semibold text-brand-600 block">
                {company?.recruiterRole || 'Company Admin'}
              </span>
              <span className="text-[10px] text-slate-400">Full Access</span>
            </div>
          </div>
        </Card>

        {/* Sticky Mobile Save Action Bar */}
        <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-200 shadow-sm sticky bottom-20 md:bottom-6 z-30">
          <p className="text-xs text-slate-500 hidden sm:block">
            Keep company information accurate to maintain employer verification.
          </p>
          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={saveMutation.isPending}
            className="w-full sm:w-auto font-semibold shadow-md ml-auto"
          >
            <Save className="w-4 h-4 mr-2" />
            Save Company Profile
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CompanyProfilePage;
