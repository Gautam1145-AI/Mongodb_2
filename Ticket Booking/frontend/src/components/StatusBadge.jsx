import React from 'react';

export default function StatusBadge({ status, type = 'booking' }) {
  const getStyles = () => {
    switch (status) {
      case 'CONFIRMED':
      case 'PUBLISHED':
      case 'AVAILABLE':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'HELD':
      case 'PENDING':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'CANCELLED':
      case 'EXPIRED':
      case 'BOOKED':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      case 'DRAFT':
        return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
      default:
        return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    }
  };

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${getStyles()}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {status}
    </span>
  );
}

