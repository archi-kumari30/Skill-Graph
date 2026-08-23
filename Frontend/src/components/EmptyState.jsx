import React from 'react';
import { Plus } from 'lucide-react';

const EmptyState = ({ title, description, icon: Icon, actionLabel, onAction }) => {
  return (
    <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-xl p-8 bg-white text-center shadow-sm">
      {Icon && (
        <div className="w-12 h-12 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 mb-4 border border-indigo-100">
          <Icon className="w-6 h-6" />
        </div>
      )}
      <h3 className="text-base font-semibold text-slate-800 mb-1">{title}</h3>
      <p className="text-sm text-slate-500 max-w-xs sm:max-w-sm mb-5 leading-relaxed">{description}</p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          {actionLabel}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
