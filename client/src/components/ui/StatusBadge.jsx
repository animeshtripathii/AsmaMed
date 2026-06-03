import React from 'react';

const StatusBadge = ({ status }) => {
  const normalized = (status || '').toLowerCase();
  
  let badgeClass = 'bg-gray-50 text-gray-700 border border-gray-200';
  let dotClass = 'bg-gray-400';

  if (normalized === 'pending') {
    badgeClass = 'bg-amber-50 text-amber-800 border border-amber-200';
    dotClass = 'bg-amber-500';
  } else if (normalized === 'approved') {
    badgeClass = 'bg-purple-50 text-purple-700 border border-purple-200';
    dotClass = 'bg-purple-650 bg-purple-600';
  } else if (normalized === 'rejected') {
    badgeClass = 'bg-red-50 text-red-700 border border-red-200';
    dotClass = 'bg-red-500';
  } else if (normalized === 'fulfilled') {
    badgeClass = 'bg-blue-50 text-blue-700 border border-blue-200';
    dotClass = 'bg-blue-600';
  }

  return (
    <span
      className={`
        inline-flex items-center rounded-full px-2.5 py-0.5
        text-xs font-semibold capitalize font-sans
        ${badgeClass}
      `}
    >
      <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${dotClass}`} />
      <span>{status}</span>
    </span>
  );
};

export default StatusBadge;

