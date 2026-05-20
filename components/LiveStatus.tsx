'use client';

interface LiveStatusProps {
  analysisDate?: string; // e.g., "2026-05-20"
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function LiveStatus({ analysisDate }: LiveStatusProps) {
  if (!analysisDate) return null;

  return (
    <div className="flex items-center gap-2 text-xs text-text-secondary">
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-green opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2 w-2 bg-accent-green"></span>
      </span>
      <span>Last updated <span className="font-medium text-text-primary">{formatDate(analysisDate)}</span></span>
    </div>
  );
}
