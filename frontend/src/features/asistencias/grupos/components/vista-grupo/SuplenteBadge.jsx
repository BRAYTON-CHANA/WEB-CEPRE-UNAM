import React from 'react';

export function SuplenteBadge({ esSuplente }) {
  if (!esSuplente) return null;
  return (
    <span className="ml-1.5 inline-flex items-center px-1.5 py-0.5 rounded-md text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
      Suplente
    </span>
  );
}
