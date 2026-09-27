import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, Lock, Sparkles, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { useUIStore } from '../../store/useUIStore';
import { authApi } from '../../api/authApi';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Card, { CardBody } from '../../components/common/Card';

const loginSchema = z.object({
  email: z.string().trim().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { setAuth } = useAuthStore();
  const { addToast } = useUIStore();
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState('');

  const from = location.state?.from?.pathname || '/dashboard';

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data) => {
    setIsLoading(true);
    setServerError('');
    try {
      const res = await authApi.login(data);
      const { user, accessToken, refreshToken } = res.data;

      setAuth(user, accessToken, refreshToken);
      addToast({ message: `Welcome back, ${user.fullName || 'User'}!`, type: 'success' });

      if (user.role === 'ADMIN') {
        navigate(from.startsWith('/admin') ? from : '/admin', { replace: true });
      } else if (user.role === 'RECRUITER') {
        navigate(from.startsWith('/recruiter') ? from : '/recruiter/dashboard', { replace: true });
      } else {
        navigate(from === '/dashboard' || (!from.startsWith('/recruiter') && !from.startsWith('/admin')) ? from : '/dashboard', { replace: true });
      }
    } catch (err) {
      const errorMsg =
        err.response?.data?.message || 'Invalid email or password. Please try again.';
      setServerError(errorMsg);
      addToast({ message: errorMsg, type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  // Demo account quick fill for testing
  const fillDemoCandidate = () => {
    setValue('email', 'alex.seeker@example.com');
    setValue('password', 'Password123');
  };

  const fillDemoRecruiter = () => {
    setValue('email', 'sarah.recruiter@techcorp.com');
    setValue('password', 'Password123');
  };

  // Simulate Google Sign-In for testing/dev
  const handleGoogleLoginMock = async () => {
    setIsLoading(true);
    try {
      // Mock Google JWT for dev testing
      const mockPayload = {
        email: 'google.user@example.com',
        name: 'Google Candidate',
        sub: 'google_sub_123456789',
        picture: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100',
      };
      const mockToken = `mock.${btoa(JSON.stringify(mockPayload))}.signature`;
      const res = await authApi.googleAuth({ credential: mockToken, role: 'JOB_SEEKER' });
      const { user, accessToken, refreshToken } = res.data;
      setAuth(user, accessToken, refreshToken);
      addToast({ message: `Signed in with Google as ${user.fullName}!`, type: 'success' });
      navigate('/dashboard', { replace: true });
    } catch (err) {
      addToast({ message: 'Google sign-in failed', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-10rem)] flex items-center justify-center px-4 py-8 sm:px-6">
      <div className="w-full max-w-md space-y-6">
        {/* Mobile-first Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-brand-600 text-white shadow-lg shadow-brand-500/30 mb-2">
            <Sparkles className="w-6 h-6" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Sign in to JobPilot AI
          </h1>
          <p className="text-sm text-slate-600">
            Access your job matches, applications, and pipelines
          </p>
        </div>

        {/* Demo Quick-Fill Bar */}
        <div className="p-3 bg-brand-50/60 border border-brand-200/60 rounded-xl space-y-2 text-xs">
          <p className="font-semibold text-brand-800 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-brand-600" />
            Quick Demo Autofill (1-Tap):
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={fillDemoCandidate}
              className="flex-1 py-1.5 px-2.5 rounded-lg bg-white border border-brand-200 text-brand-700 font-medium hover:bg-brand-50 active:scale-95 transition text-[11px]"
            >
              Candidate
            </button>
            <button
              type="button"
              onClick={fillDemoRecruiter}
              className="flex-1 py-1.5 px-2.5 rounded-lg bg-white border border-brand-200 text-brand-700 font-medium hover:bg-brand-50 active:scale-95 transition text-[11px]"
            >
              Recruiter
            </button>
          </div>
        </div>

        <Card className="p-6 sm:p-8 shadow-sm">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {serverError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
                {serverError}
              </div>
            )}

            <Input
              label="Email Address"
              type="email"
              placeholder="you@example.com"
              leftIcon={Mail}
              error={errors.email?.message}
              {...register('email')}
            />

            <div className="space-y-1">
              <Input
                label="Password"
                type="password"
                placeholder="••••••••"
                leftIcon={Lock}
                error={errors.password?.message}
                {...register('password')}
              />
              <div className="text-right">
                <Link
                  to="/forgot-password"
                  className="text-xs font-semibold text-brand-600 hover:text-brand-700 hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isLoading}
              className="w-full text-base font-semibold shadow-md"
            >
              Sign In
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
              onClick={handleGoogleLoginMock}
              disabled={isLoading}
              className="w-full border-slate-300 hover:bg-slate-50 text-slate-700"
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
              Sign in with Google
            </Button>
          </div>
        </Card>

        {/* Footer Link */}
        <p className="text-center text-sm text-slate-600">
          Don&apos;t have an account?{' '}
          <Link
            to="/register"
            className="font-bold text-brand-600 hover:text-brand-700 hover:underline"
          >
            Create free account
          </Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
