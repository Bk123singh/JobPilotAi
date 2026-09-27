import React from 'react';

const Badge = ({ children, variant = 'slate', size = 'sm', className = '' }) => {
  const variants = {
    slate: 'bg-slate-100 text-slate-700 border-slate-200',
    gray: 'bg-slate-100 text-slate-700 border-slate-200',
    brand: 'bg-brand-50 text-brand-700 border-brand-200',
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    green: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    yellow: 'bg-amber-50 text-amber-700 border-amber-200',
    red: 'bg-red-50 text-red-700 border-red-200',
    purple: 'bg-purple-50 text-purple-700 border-purple-200',
  };

  const sizes = {
    sm: 'text-xs px-2.5 py-0.5 rounded-full',
    md: 'text-xs px-3 py-1 rounded-full font-medium',
  };

  return (
    <span
      className={`inline-flex items-center font-medium border ${variants[variant] || variants.slate} ${sizes[size]} ${className}`}
    >
      {children}
    </span>
  );
};

export default Badge;
