import React from 'react';

const LoadingSpinner = ({ message = 'Loading resource details...' }) => (
  <div className="flex flex-col items-center justify-center py-12 w-full">
    <div className="w-10 h-10 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin mb-4" />
    <p className="text-sm font-medium text-slate-500 animate-pulse">{message}</p>
  </div>
);

export default LoadingSpinner;
