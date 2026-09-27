import React from 'react';

const Card = ({ children, className = '', hover = false, ...props }) => {
  return (
    <div
      className={`
        bg-white rounded-2xl border border-slate-200/80 shadow-sm
        transition-all duration-200
        ${hover ? 'hover:shadow-md hover:border-slate-300' : ''}
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader = ({ children, className = '' }) => (
  <div className={`p-4 sm:p-6 border-b border-slate-100 ${className}`}>{children}</div>
);

export const CardBody = ({ children, className = '' }) => (
  <div className={`p-4 sm:p-6 ${className}`}>{children}</div>
);

export const CardFooter = ({ children, className = '' }) => (
  <div className={`p-4 sm:p-6 bg-slate-50/50 rounded-b-2xl border-t border-slate-100 ${className}`}>
    {children}
  </div>
);

export default Card;
