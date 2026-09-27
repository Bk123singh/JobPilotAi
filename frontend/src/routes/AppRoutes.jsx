import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from '../components/layout/AppLayout';
import ProtectedRoute from './ProtectedRoute';
import RoleRoute from './RoleRoute';

// Pages
import Home from '../pages/Home';
import LoginPage from '../pages/auth/LoginPage';
import RegisterPage from '../pages/auth/RegisterPage';
import Dashboard from '../pages/Dashboard';
import ProfilePage from '../pages/profile/ProfilePage';
import ResumesPage from '../pages/resumes/ResumesPage';
import CompanyProfilePage from '../pages/recruiter/CompanyProfilePage';
import JobsPage from '../pages/jobs/JobsPage';
import JobDetailPage from '../pages/jobs/JobDetailPage';
import SavedJobsPage from '../pages/jobs/SavedJobsPage';
import CreateJobPage from '../pages/recruiter/CreateJobPage';
import ApplicationsPage from '../pages/applications/ApplicationsPage';
import RecruiterApplicationsPage from '../pages/recruiter/RecruiterApplicationsPage';
import JobAlertsPage from '../pages/candidate/JobAlertsPage';
import AdminDashboardPage from '../pages/admin/AdminDashboardPage';
import NotFound from '../pages/NotFound';

// Placeholders for subsequent phases (to keep navigation clean & error-free)
const PlaceholderPage = ({ title, description }) => (
  <div className="max-w-4xl mx-auto px-4 py-8">
    <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 text-center space-y-3">
      <h2 className="text-xl font-bold text-slate-900">{title}</h2>
      <p className="text-sm text-slate-500 max-w-md mx-auto">{description}</p>
      <div className="inline-block mt-2 px-3 py-1 rounded-full text-xs font-semibold bg-brand-50 text-brand-700 border border-brand-200">
        Ready for upcoming phase implementation
      </div>
    </div>
  </div>
);

const AppRoutes = () => {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/jobs" element={<JobsPage />} />
        <Route path="/jobs/:id" element={<JobDetailPage />} />

        {/* Authenticated Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        {/* Candidate Portal Routes */}
        <Route
          path="/applications"
          element={
            <ProtectedRoute>
              <ApplicationsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/resumes"
          element={
            <ProtectedRoute>
              <ResumesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/saved-jobs"
          element={
            <ProtectedRoute>
              <SavedJobsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/alerts"
          element={
            <ProtectedRoute>
              <JobAlertsPage />
            </ProtectedRoute>
          }
        />

        {/* Recruiter Portal Routes */}
        <Route
          path="/recruiter/dashboard"
          element={
            <RoleRoute allowedRoles={['RECRUITER', 'ADMIN']}>
              <Dashboard />
            </RoleRoute>
          }
        />
        <Route
          path="/recruiter/jobs/create"
          element={
            <RoleRoute allowedRoles={['RECRUITER', 'ADMIN']}>
              <CreateJobPage />
            </RoleRoute>
          }
        />
        <Route
          path="/recruiter/applications"
          element={
            <RoleRoute allowedRoles={['RECRUITER', 'ADMIN']}>
              <RecruiterApplicationsPage />
            </RoleRoute>
          }
        />
        <Route
          path="/recruiter/company"
          element={
            <RoleRoute allowedRoles={['RECRUITER', 'ADMIN']}>
              <CompanyProfilePage />
            </RoleRoute>
          }
        />

        {/* Admin Platform Console */}
        <Route
          path="/admin"
          element={
            <RoleRoute allowedRoles={['ADMIN']}>
              <AdminDashboardPage />
            </RoleRoute>
          }
        />
        <Route
          path="/admin/dashboard"
          element={<Navigate to="/admin" replace />}
        />

        {/* 404 Catch All */}
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
};

export default AppRoutes;
