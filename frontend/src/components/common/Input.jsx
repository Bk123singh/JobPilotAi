import React, { forwardRef } from 'react';

const Input = forwardRef(
  (
    {
      label,
      error,
      helperText,
      leftIcon: LeftIcon,
      rightIcon: RightIcon,
      className = '',
      id,
      name,
      type = 'text',
      ...props
    },
    ref
  ) => {
    const inputId = id || name;

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-semibold text-slate-700 tracking-wide uppercase"
          >
            {label}
          </label>
        )}

        <div className="relative rounded-xl shadow-sm">
          {LeftIcon && (
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <LeftIcon className="w-5 h-5" />
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            name={name}
            type={type}
            className={`
              block w-full rounded-xl border bg-white text-slate-900 placeholder-slate-400
              text-sm min-h-[46px] px-3.5 py-2.5 transition-colors duration-150
              focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500
              ${LeftIcon ? 'pl-11' : ''}
              ${RightIcon ? 'pr-11' : ''}
              ${error ? 'border-red-500 text-red-900 focus:ring-red-500 focus:border-red-500' : 'border-slate-300 hover:border-slate-400'}
              ${className}
            `}
            {...props}
          />

          {RightIcon && (
            <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400">
              <RightIcon className="w-5 h-5" />
            </div>
          )}
        </div>

        {error && <p className="text-xs text-red-600 font-medium pl-1">{error}</p>}
        {helperText && !error && (
          <p className="text-xs text-slate-500 pl-1">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
