import React from 'react';

/**
 * Reusable animated shimmer skeleton placeholder component.
 * Variants: 'card' | 'table-row' | 'text' | 'avatar' | 'metric'
 */
const LoadingSkeleton = ({ variant = 'card', count = 1, className = '' }) => {
  const items = Array.from({ length: count }, (_, idx) => idx);

  switch (variant) {
    case 'avatar':
      return (
        <div className={`flex items-center gap-3 animate-pulse ${className}`}>
          {items.map((i) => (
            <div key={i} className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700" />
          ))}
        </div>
      );

    case 'text':
      return (
        <div className={`space-y-2 animate-pulse ${className}`}>
          {items.map((i) => (
            <div
              key={i}
              className="h-4 bg-slate-200 dark:bg-slate-700 rounded"
              style={{ width: `${Math.max(45, 100 - (i % 3) * 20)}%` }}
            />
          ))}
        </div>
      );

    case 'table-row':
      return (
        <tbody className={`divide-y divide-slate-100 animate-pulse ${className}`}>
          {items.map((i) => (
            <tr key={i} className="h-14">
              <td className="px-4 py-3">
                <div className="h-4 w-32 bg-slate-200 dark:bg-slate-700 rounded" />
              </td>
              <td className="px-4 py-3">
                <div className="h-4 w-20 bg-slate-200 dark:bg-slate-700 rounded" />
              </td>
              <td className="px-4 py-3">
                <div className="h-4 w-24 bg-slate-200 dark:bg-slate-700 rounded" />
              </td>
              <td className="px-4 py-3">
                <div className="h-6 w-16 bg-slate-200 dark:bg-slate-700 rounded-full" />
              </td>
            </tr>
          ))}
        </tbody>
      );

    case 'metric':
      return (
        <div className={`grid grid-cols-1 md:grid-cols-4 gap-4 animate-pulse ${className}`}>
          {items.map((i) => (
            <div key={i} className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-100 shadow-sm space-y-3">
              <div className="h-4 w-24 bg-slate-200 dark:bg-slate-700 rounded" />
              <div className="h-8 w-16 bg-slate-300 dark:bg-slate-600 rounded" />
              <div className="h-3 w-32 bg-slate-200 dark:bg-slate-700 rounded" />
            </div>
          ))}
        </div>
      );

    case 'card':
    default:
      return (
        <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse ${className}`}>
          {items.map((i) => (
            <div
              key={i}
              className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm space-y-4"
            >
              <div className="flex items-center justify-between">
                <div className="h-5 w-32 bg-slate-200 dark:bg-slate-700 rounded" />
                <div className="h-6 w-14 bg-slate-200 dark:bg-slate-700 rounded-full" />
              </div>
              <div className="h-4 w-full bg-slate-200 dark:bg-slate-700 rounded" />
              <div className="h-4 w-3/4 bg-slate-200 dark:bg-slate-700 rounded" />
              <div className="pt-2 flex items-center justify-between">
                <div className="h-4 w-20 bg-slate-200 dark:bg-slate-700 rounded" />
                <div className="h-8 w-24 bg-slate-200 dark:bg-slate-700 rounded" />
              </div>
            </div>
          ))}
        </div>
      );
  }
};

export default LoadingSkeleton;
