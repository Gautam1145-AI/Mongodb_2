import React from 'react';
import { Loader2 } from 'lucide-react';

export default function LoadingSpinner({ message = 'Loading...', size = 'default' }) {
  const iconSize = size === 'large' ? 'w-10 h-10' : size === 'small' ? 'w-4 h-4' : 'w-6 h-6';

  return (
    <div className="flex flex-col items-center justify-center py-12 gap-3 text-slate-400">
      <Loader2 className={`${iconSize} animate-spin text-indigo-500`} />
      {message && <p className="text-sm font-medium animate-pulse">{message}</p>}
    </div>
  );
}

