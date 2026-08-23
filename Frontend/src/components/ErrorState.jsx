import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

const ErrorState = ({ message = 'An error occurred while loading content.', onRetry }) => {
  return (
    <div className="flex flex-col items-center justify-center border border-rose-100 rounded-xl p-8 bg-rose-50/20 text-center shadow-sm w-full">
      <div className="w-12 h-12 rounded-lg bg-rose-50 flex items-center justify-center text-rose-500 mb-4 border border-rose-100/50">
        <AlertTriangle className="w-6 h-6" />
      </div>
      <h3 className="text-base font-semibold text-rose-800 mb-1">Data Fetch Failure</h3>
      <p className="text-sm text-rose-600 max-w-sm mb-5 leading-relaxed">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-lg text-sm font-medium shadow-sm transition-all"
        >
          <RefreshCw className="w-4 h-4 mr-1.5" />
          Try Again
        </button>
      )}
    </div>
  );
};

export default ErrorState;
