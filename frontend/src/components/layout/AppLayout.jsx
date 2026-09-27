import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import MobileBottomNav from './MobileBottomNav';
import MobileDrawer from './MobileDrawer';
import Toast from '../common/Toast';

const AppLayout = () => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Top Navbar */}
      <Navbar />

      {/* Slide-out Mobile Menu */}
      <MobileDrawer />

      {/* Global Notifications */}
      <Toast />

      {/* Main Content Area (pb-20 on mobile ensures bottom navigation never covers CTAs) */}
      <main className="flex-1 pb-20 md:pb-10">
        <Outlet />
      </main>

      {/* Mobile Sticky Bottom Navigation (Hidden on md and larger) */}
      <MobileBottomNav />
    </div>
  );
};

export default AppLayout;
