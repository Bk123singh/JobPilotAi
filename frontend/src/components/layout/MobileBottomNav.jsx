import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { Briefcase, Bookmark, FileText, User, Sparkles, LayoutDashboard, PlusCircle } from 'lucide-react';

const MobileBottomNav = () => {
  const { user, isAuthenticated } = useAuthStore();
  const isRecruiter = user?.role === 'RECRUITER';

  const navItemClass = ({ isActive }) => `
    flex flex-col items-center justify-center flex-1 h-full py-1.5 transition-colors
    ${isActive ? 'text-brand-600 font-semibold' : 'text-slate-500 hover:text-slate-700'}
  `;

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur border-t border-slate-200 h-16 px-2 flex items-center justify-around shadow-lg">
      <NavLink to="/jobs" className={navItemClass}>
        <Briefcase className="w-5 h-5 mb-0.5" />
        <span className="text-[11px] leading-tight">Jobs</span>
      </NavLink>

      {isAuthenticated && !isRecruiter && (
        <>
          <NavLink to="/saved-jobs" className={navItemClass}>
            <Bookmark className="w-5 h-5 mb-0.5" />
            <span className="text-[11px] leading-tight">Saved</span>
          </NavLink>
          <NavLink to="/applications" className={navItemClass}>
            <FileText className="w-5 h-5 mb-0.5" />
            <span className="text-[11px] leading-tight">Applied</span>
          </NavLink>
          <NavLink to="/dashboard" className={navItemClass}>
            <User className="w-5 h-5 mb-0.5" />
            <span className="text-[11px] leading-tight">Profile</span>
          </NavLink>
        </>
      )}

      {isAuthenticated && isRecruiter && (
        <>
          <NavLink to="/recruiter/dashboard" className={navItemClass}>
            <LayoutDashboard className="w-5 h-5 mb-0.5" />
            <span className="text-[11px] leading-tight">Overview</span>
          </NavLink>
          <NavLink to="/recruiter/jobs/create" className={navItemClass}>
            <PlusCircle className="w-5 h-5 mb-0.5 text-brand-600" />
            <span className="text-[11px] leading-tight font-medium text-brand-600">Post Job</span>
          </NavLink>
          <NavLink to="/recruiter/applications" className={navItemClass}>
            <FileText className="w-5 h-5 mb-0.5" />
            <span className="text-[11px] leading-tight">Pipeline</span>
          </NavLink>
        </>
      )}

      {!isAuthenticated && (
        <>
          <NavLink to="/register" className={navItemClass}>
            <Sparkles className="w-5 h-5 mb-0.5 text-brand-600" />
            <span className="text-[11px] leading-tight text-brand-600">Join Free</span>
          </NavLink>
          <NavLink to="/login" className={navItemClass}>
            <User className="w-5 h-5 mb-0.5" />
            <span className="text-[11px] leading-tight">Sign In</span>
          </NavLink>
        </>
      )}
    </nav>
  );
};

export default MobileBottomNav;
