import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, Lock, User, Building2, Sparkles, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { useUIStore } from '../../store/useUIStore';
import { authApi } from '../../api/authApi';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Card from '../../components/common/Card';

const registerSchema = z.object({
  fullName: z.string().trim().min(2, 'Name must be at least 2 characters'),
  email: z.string().trim().email('Please enter a valid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Za-z]/, 'Password must include at least one letter')
    .regex(/[0-9]/, 'Password must include at least one number'),
  role: z.enum(['JOB_SEEKER', 'RECRUITER']),
  companyName: z.string().optional(),
});

const RegisterPage = () => {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const { addToast } = useUIStore();
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
      role: 'JOB_SEEKER',
      companyName: '',
    },
  });

  const selectedRole = watch('role');

  const onSubmit = async (data) => {
    setIsLoading(true);
    setServerError('');
    try {
      const res = await authApi.register(data);
      const { user, accessToken, refreshToken } = res.data;

      setAuth(user, accessToken, refreshToken);
      addToast({
        message: `Welcome to JobPilot AI, ${user.fullName}!`,
        type: 'success',
      });

      if (user.role === 'RECRUITER') {
        navigate('/recruiter/dashboard', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    } catch (err) {
      const errorMsg =
        err.response?.data?.message || 'Registration failed. Please check your details.';
      setServerError(errorMsg);
      addToast({ message: errorMsg, type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-10rem)] flex items-center justify-center px-4 py-8 sm:px-6">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-brand-600 text-white shadow-lg shadow-brand-500/30 mb-2">
            <Sparkles className="w-6 h-6" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Create your account
          </h1>
          <p className="text-sm text-slate-600">
            Join the agentic AI platform transforming hiring
          </p>
        </div>

        <Card className="p-6 sm:p-8 shadow-sm">
          {/* Role Selector Tabs */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl mb-6">
            <button
              type="button"
              onClick={() => setValue('role', 'JOB_SEEKER')}
              className={`
                py-2.5 px-3 rounded-lg text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-1.5 min-h-[44px]
                ${selectedRole === 'JOB_SEEKER' ? 'bg-white text-brand-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'}
              `}
            >
              <User className="w-4 h-4" />
              Job Seeker
            </button>
            <button
              type="button"
              onClick={() => setValue('role', 'RECRUITER')}
              className={`
                py-2.5 px-3 rounded-lg text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-1.5 min-h-[44px]
                ${selectedRole === 'RECRUITER' ? 'bg-white text-brand-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'}
              `}
            >
              <Building2 className="w-4 h-4" />
              Recruiter
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {serverError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
                {serverError}
              </div>
            )}

            <Input
              label="Full Name"
              placeholder="e.g. Alex Morgan"
              leftIcon={User}
              error={errors.fullName?.message}
              {...register('fullName')}
            />

            <Input
              label="Email Address"
              type="email"
              placeholder="you@company.com"
              leftIcon={Mail}
              error={errors.email?.message}
              {...register('email')}
            />

            {selectedRole === 'RECRUITER' && (
              <Input
                label="Company Name"
                placeholder="e.g. TechCorp Solutions"
                leftIcon={Building2}
                error={errors.companyName?.message}
                {...register('companyName')}
              />
            )}

            <Input
              label="Password"
              type="password"
              placeholder="At least 8 chars (letters & numbers)"
              leftIcon={Lock}
              helperText="Must contain at least 8 characters, a letter and a number"
              error={errors.password?.message}
              {...register('password')}
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isLoading}
              className="w-full text-base font-semibold shadow-md mt-2"
            >
              Register as {selectedRole === 'JOB_SEEKER' ? 'Job Seeker' : 'Recruiter'}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </form>
        </Card>

        {/* Footer Link */}
        <p className="text-center text-sm text-slate-600">
          Already have an account?{' '}
          <Link
            to="/login"
            className="font-bold text-brand-600 hover:text-brand-700 hover:underline"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;
