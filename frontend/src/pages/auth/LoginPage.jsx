import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, Lock, Sparkles, ArrowRight } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { useUIStore } from '../../store/useUIStore';
import { authApi } from '../../api/authApi';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Card from '../../components/common/Card';
import GoogleLoginButton from '../../components/auth/GoogleLoginButton';

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
        navigate(
          from === '/dashboard' || (!from.startsWith('/recruiter') && !from.startsWith('/admin'))
            ? from
            : '/dashboard',
          { replace: true }
        );
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

  return (
    <div className="min-h-[calc(100vh-10rem)] flex items-center justify-center px-4 py-8 sm:px-6">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
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

          {/* Real Google Sign In */}
          <div className="mt-4">
            <GoogleLoginButton text="signin_with" role="JOB_SEEKER" />
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
