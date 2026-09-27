import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { useUIStore } from '../../store/useUIStore';
import {
  Sparkles,
  Menu,
  LogOut,
  User,
  Briefcase,
  PlusCircle,
  LayoutDashboard,
  Shield,
  Bell,
} from 'lucide-react';
import Button from '../common/Button';
import Badge from '../common/Badge';
import NotificationBell from '../notifications/NotificationBell';

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuthStore();
  const { toggleMobileDrawer } = useUIStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const isRecruiter = user?.role === 'RECRUITER';
  const isAdmin = user?.role === 'ADMIN';

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <div className="flex items-center space-x-3">
            <button
              onClick={toggleMobileDrawer}
              className="md:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition"
              aria-label="Open menu"
            >
              <Menu className="w-6 h-6" />
            </button>

            <Link to="/" className="flex items-center space-x-2.5">
              <div className="w-9 h-9 rounded-xl bg-brand-600 text-white flex items-center justify-center shadow-md shadow-brand-500/20">
                <Sparkles className="w-5 h-5" />
              </div>
              <span className="font-extrabold text-xl tracking-tight text-slate-900">
                JobPilot<span className="text-brand-600">AI</span>
              </span>
            </Link>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1">
            <Link
              to="/jobs"
              className="px-3.5 py-2 rounded-xl text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"
            >
              Find Jobs
            </Link>

            {isAuthenticated && !isRecruiter && !isAdmin && (
              <>
                <Link
                  to="/applications"
                  className="px-3.5 py-2 rounded-xl text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"
                >
                  My Applications
                </Link>
                <Link
                  to="/alerts"
                  className="px-3.5 py-2 rounded-xl text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"
                >
                  Job Alerts
                </Link>
                <Link
                  to="/resumes"
                  className="px-3.5 py-2 rounded-xl text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"
                >
                  My Resumes
                </Link>
                <Link
                  to="/profile"
                  className="px-3.5 py-2 rounded-xl text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"
                >
                  My Profile
                </Link>
              </>
            )}

            {isAuthenticated && isAdmin && (
              <>
                <Link
                  to="/admin"
                  className="px-3.5 py-2 rounded-xl text-sm font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 transition inline-flex items-center gap-1.5 shadow-2xs"
                >
                  <Shield className="w-4 h-4 text-indigo-600" />
                  Admin Console
                </Link>
              </>
            )}

            {isAuthenticated && isRecruiter && (
              <>
                <Link
                  to="/recruiter/dashboard"
                  className="px-3.5 py-2 rounded-xl text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"
                >
                  Recruiter Hub
                </Link>
                <Link
                  to="/recruiter/applications"
                  className="px-3.5 py-2 rounded-xl text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"
                >
                  Applicants
                </Link>
                <Link
                  to="/recruiter/company"
                  className="px-3.5 py-2 rounded-xl text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"
                >
                  Company Profile
                </Link>
                <Link
                  to="/recruiter/jobs/create"
                  className="px-3.5 py-2 rounded-xl text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition inline-flex items-center gap-1.5"
                >
                  <PlusCircle className="w-4 h-4 text-brand-600" />
                  Post a Job
                </Link>
              </>
            )}
          </nav>

          {/* Right Action Area */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {isAuthenticated ? (
              <div className="flex items-center space-x-2">
                <NotificationBell />

                <Link
                  to={isAdmin ? '/admin' : isRecruiter ? '/recruiter/dashboard' : '/dashboard'}
                  className="hidden sm:inline-flex items-center space-x-2 px-3 py-1.5 rounded-xl border border-slate-200 hover:border-slate-300 bg-slate-50 transition"
                >
                  <div className="w-7 h-7 rounded-lg bg-brand-100 text-brand-700 flex items-center justify-center font-bold text-xs">
                    {user?.fullName?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-semibold text-slate-900 leading-none truncate max-w-[120px]">
                      {user?.fullName || 'My Account'}
                    </p>
                    <Badge variant={isRecruiter ? 'purple' : 'brand'} size="sm" className="mt-0.5 text-[10px] px-1.5 py-0">
                      {isRecruiter ? 'Recruiter' : isAdmin ? 'Admin' : 'Candidate'}
                    </Badge>
                  </div>
                </Link>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  className="text-slate-500 hover:text-red-600 px-2.5"
                  title="Log out"
                >
                  <LogOut className="w-5 h-5" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link to="/login">
                  <Button variant="ghost" size="sm">
                    Sign in
                  </Button>
                </Link>
                <Link to="/register">
                  <Button variant="primary" size="sm">
                    Get Started
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
