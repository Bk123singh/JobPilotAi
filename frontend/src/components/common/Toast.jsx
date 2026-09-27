import React from 'react';
import { useUIStore } from '../../store/useUIStore';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

const Toast = () => {
  const { toasts, removeToast } = useUIStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 left-4 sm:left-auto sm:w-96 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => {
        const isSuccess = toast.type === 'success';
        const isError = toast.type === 'error';

        return (
          <div
            key={toast.id}
            className={`
              pointer-events-auto flex items-center justify-between p-3.5 rounded-xl shadow-lg border text-sm
              transition-all duration-200 transform translate-y-0
              ${isSuccess ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : ''}
              ${isError ? 'bg-red-50 border-red-200 text-red-900' : ''}
              ${!isSuccess && !isError ? 'bg-white border-slate-200 text-slate-800' : ''}
            `}
          >
            <div className="flex items-center space-x-2.5">
              {isSuccess && <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />}
              {isError && <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />}
              {!isSuccess && !isError && <Info className="w-5 h-5 text-brand-600 flex-shrink-0" />}
              <span className="font-medium text-xs sm:text-sm">{toast.message}</span>
            </div>

            <button
              onClick={() => removeToast(toast.id)}
              className="ml-3 p-1 rounded-lg hover:bg-black/5 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};

export default Toast;
