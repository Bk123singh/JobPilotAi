import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { useUIStore } from '../../store/useUIStore';
import { authApi } from '../../api/authApi';
import { Loader2 } from 'lucide-react';

const GoogleLoginButton = ({ text = 'signin_with', role = 'JOB_SEEKER' }) => {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const { addToast } = useUIStore();
  const [isLoading, setIsLoading] = useState(false);
  const [isScriptReady, setIsScriptReady] = useState(false);
  const containerRef = useRef(null);
  const roleRef = useRef(role);

  // Keep latest role in ref to avoid re-initializing on role switch
  useEffect(() => {
    roleRef.current = role;
  }, [role]);

  // Handle genuine credential returned by Google Identity Services
  const handleCredentialResponse = async (response) => {
    if (!response?.credential) return;

    setIsLoading(true);
    try {
      const res = await authApi.googleAuth({
        credential: response.credential,
        role: roleRef.current,
      });

      const { user, accessToken, refreshToken } = res.data;
      setAuth(user, accessToken, refreshToken);

      addToast({
        message: `Welcome, ${user.fullName || 'User'}!`,
        type: 'success',
      });

      if (user.role === 'ADMIN') {
        navigate('/admin', { replace: true });
      } else if (user.role === 'RECRUITER') {
        navigate('/recruiter/dashboard', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    } catch (err) {
      const errorMsg =
        err.response?.data?.message || 'Google authentication failed. Please try again.';
      addToast({ message: errorMsg, type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId) {
      console.warn('VITE_GOOGLE_CLIENT_ID is not configured.');
      return;
    }

    let intervalId = null;

    const setupGoogleButton = () => {
      if (!window.google?.accounts?.id || !containerRef.current) return false;

      try {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: handleCredentialResponse,
          auto_select: false,
          cancel_on_tap_outside: true,
        });

        // Determine container width (min 240, max 400 per Google GIS specification)
        const containerWidth = containerRef.current.offsetWidth || 380;
        const buttonWidth = Math.min(Math.max(containerWidth, 240), 400);

        containerRef.current.innerHTML = '';
        window.google.accounts.id.renderButton(containerRef.current, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          text: text === 'signup_with' ? 'signup_with' : 'signin_with',
          shape: 'rectangular',
          logo_alignment: 'left',
          width: buttonWidth,
        });

        setIsScriptReady(true);
        return true;
      } catch (e) {
        console.error('Failed to initialize Google Sign In:', e);
        return false;
      }
    };

    if (!setupGoogleButton()) {
      // Poll briefly if Google client script is still loading asynchronously
      intervalId = setInterval(() => {
        if (setupGoogleButton()) {
          clearInterval(intervalId);
        }
      }, 200);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [text]);

  const handleFallbackClick = () => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!window.google?.accounts?.id) {
      addToast({
        message: 'Google Sign-In is initializing or blocked by an ad-blocker. Please check your browser extensions.',
        type: 'error',
      });
      return;
    }
    if (clientId) {
      window.google.accounts.id.prompt();
    }
  };

  return (
    <div className="w-full relative">
      {isLoading && (
        <div className="absolute inset-0 bg-white/80 backdrop-blur-[1px] flex items-center justify-center rounded-lg z-10">
          <Loader2 className="w-5 h-5 text-brand-600 animate-spin mr-2" />
          <span className="text-xs font-semibold text-slate-700">Verifying Google Account...</span>
        </div>
      )}

      {/* Real Google Button Container */}
      <div
        ref={containerRef}
        className={`flex justify-center w-full min-h-[44px] transition-opacity ${
          isScriptReady ? 'opacity-100' : 'opacity-0 h-0 overflow-hidden'
        }`}
      />

      {/* Native-styled fallback if script is loading or blocked */}
      {!isScriptReady && (
        <button
          type="button"
          onClick={handleFallbackClick}
          disabled={isLoading}
          className="w-full py-2.5 px-4 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-medium text-sm flex items-center justify-center transition shadow-sm"
        >
          <svg className="w-4 h-4 mr-2 shrink-0" viewBox="0 0 24 24">
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
          {text === 'signup_with' ? 'Sign up with Google' : 'Sign in with Google'}
        </button>
      )}
    </div>
  );
};

export default GoogleLoginButton;
