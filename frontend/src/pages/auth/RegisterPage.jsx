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
import GoogleAuthModal from '../../components/auth/GoogleAuthModal';

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
  const [isGoogleModalOpen, setIsGoogleModalOpen] = useState(false);

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

          {/* Social Divider */}
          <div className="mt-6 relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-slate-400 font-medium">or continue with</span>
            </div>
          </div>

          {/* Google Sign In Button */}
          <div className="mt-4">
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={() => setIsGoogleModalOpen(true)}
              disabled={isLoading}
              className="w-full border-slate-300 hover:bg-slate-50 text-slate-700 font-medium"
            >
              <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              Sign up with Google
            </Button>
          </div>
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

        {/* Google Authentication Dialog */}
        <GoogleAuthModal
          isOpen={isGoogleModalOpen}
          onClose={() => setIsGoogleModalOpen(false)}
          defaultRole={selectedRole}
        />
      </div>
    </div>
  );
};

export default RegisterPage;
