import React, { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { useUIStore } from '../../store/useUIStore';
import {
  X,
  Sparkles,
  Briefcase,
  FileText,
  Bookmark,
  User,
  LayoutDashboard,
  PlusCircle,
  LogOut,
  ShieldCheck,
} from 'lucide-react';
import Button from '../common/Button';

const MobileDrawer = () => {
  const { mobileDrawerOpen, setMobileDrawerOpen } = useUIStore();
  const { user, isAuthenticated, logout } = useAuthStore();
  const location = useLocation();

  const isRecruiter = user?.role === 'RECRUITER';
  const isAdmin = user?.role === 'ADMIN';

  // Close drawer on route change
  useEffect(() => {
    setMobileDrawerOpen(false);
  }, [location.pathname, setMobileDrawerOpen]);

  if (!mobileDrawerOpen) return null;

  return (
    <div className="fixed inset-0 z-50 md:hidden flex">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={() => setMobileDrawerOpen(false)}
      />

      {/* Drawer panel */}
      <div className="relative w-4/5 max-w-sm bg-white h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-left duration-200">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-brand-600 text-white flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <span className="font-bold text-lg text-slate-900">
              JobPilot<span className="text-brand-600">AI</span>
            </span>
          </div>
          <button
            onClick={() => setMobileDrawerOpen(false)}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Card if Authenticated */}
        {isAuthenticated && (
          <div className="p-4 bg-slate-50 border-b border-slate-100">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-brand-100 text-brand-700 flex items-center justify-center font-bold text-sm">
                {user?.fullName?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <div className="truncate">
                <p className="font-semibold text-sm text-slate-900 truncate">{user?.fullName}</p>
                <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                <span className="inline-block mt-1 text-[10px] font-semibold uppercase px-2 py-0.5 rounded-md bg-brand-50 text-brand-700 border border-brand-200">
                  {user?.role}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Navigation List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-1">
          <Link
            to="/jobs"
            className="flex items-center space-x-3 px-3.5 py-3 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-100"
          >
            <Briefcase className="w-5 h-5 text-slate-400" />
            <span>Find Jobs</span>
          </Link>

          {isAuthenticated && !isRecruiter && !isAdmin && (
            <>
              <Link
                to="/dashboard"
                className="flex items-center space-x-3 px-3.5 py-3 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                <LayoutDashboard className="w-5 h-5 text-slate-400" />
                <span>Dashboard</span>
              </Link>
              <Link
                to="/applications"
                className="flex items-center space-x-3 px-3.5 py-3 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                <FileText className="w-5 h-5 text-slate-400" />
                <span>My Applications</span>
              </Link>
              <Link
                to="/resumes"
                className="flex items-center space-x-3 px-3.5 py-3 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                <FileText className="w-5 h-5 text-slate-400" />
                <span>My Resumes</span>
              </Link>
              <Link
                to="/profile"
                className="flex items-center space-x-3 px-3.5 py-3 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                <User className="w-5 h-5 text-slate-400" />
                <span>My Profile</span>
              </Link>
              <Link
                to="/saved-jobs"
                className="flex items-center space-x-3 px-3.5 py-3 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                <Bookmark className="w-5 h-5 text-slate-400" />
                <span>Saved Jobs</span>
              </Link>
            </>
          )}

          {isAuthenticated && isRecruiter && (
            <>
              <Link
                to="/recruiter/dashboard"
                className="flex items-center space-x-3 px-3.5 py-3 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                <LayoutDashboard className="w-5 h-5 text-slate-400" />
                <span>Recruiter Dashboard</span>
              </Link>
              <Link
                to="/recruiter/company"
                className="flex items-center space-x-3 px-3.5 py-3 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                <Building2 className="w-5 h-5 text-slate-400" />
                <span>Company Profile</span>
              </Link>
              <Link
                to="/recruiter/jobs/create"
                className="flex items-center space-x-3 px-3.5 py-3 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                <PlusCircle className="w-5 h-5 text-brand-600" />
                <span className="font-semibold text-brand-600">Post a New Job</span>
              </Link>
              <Link
                to="/recruiter/applications"
                className="flex items-center space-x-3 px-3.5 py-3 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                <FileText className="w-5 h-5 text-slate-400" />
                <span>Candidate Pipeline</span>
              </Link>
            </>
          )}

          {isAdmin && (
            <Link
              to="/admin"
              className="flex items-center space-x-3 px-3.5 py-3 rounded-xl text-sm font-medium text-purple-700 hover:bg-purple-50"
            >
              <ShieldCheck className="w-5 h-5 text-purple-600" />
              <span>Admin Console</span>
            </Link>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-100">
          {isAuthenticated ? (
            <Button
              variant="outline"
              className="w-full text-red-600 border-red-200 hover:bg-red-50"
              onClick={async () => {
                setMobileDrawerOpen(false);
                await logout();
              }}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          ) : (
            <div className="space-y-2">
              <Link to="/login" className="block w-full">
                <Button variant="outline" className="w-full">
                  Sign In
                </Button>
              </Link>
              <Link to="/register" className="block w-full">
                <Button variant="primary" className="w-full">
                  Create Account
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MobileDrawer;
