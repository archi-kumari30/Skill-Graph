import React from 'react';

const ProgressBar = ({ value, max = 5, showPercent = false, className = '', color = 'bg-indigo-600' }) => {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <div className={`w-full ${className}`}>
      <div className="flex items-center justify-between mb-1 text-xs">
        <span className="font-semibold text-slate-700">
          Level {value} / {max}
        </span>
        {showPercent && (
          <span className="text-slate-500 font-medium">{Math.round(percentage)}%</span>
        )}
      </div>
      <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200/40">
        <div
          className={`h-full ${color} rounded-full transition-all duration-500`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

export default ProgressBar;
