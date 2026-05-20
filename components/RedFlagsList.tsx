'use client';

import { RedFlag, RedFlagSeverity } from '@/lib/types';

interface RedFlagsListProps {
  redFlags: RedFlag[];
}

const SEVERITY_STYLES: Record<RedFlagSeverity, { bg: string; text: string; icon: string }> = {
  critical: {
    bg: 'bg-red-500/20',
    text: 'text-red-400',
    icon: '!!',
  },
  high: {
    bg: 'bg-accent-red/20',
    text: 'text-accent-red',
    icon: '!',
  },
  medium: {
    bg: 'bg-accent-orange/20',
    text: 'text-accent-orange',
    icon: '!',
  },
  low: {
    bg: 'bg-accent-gold/20',
    text: 'text-accent-gold',
    icon: 'i',
  },
};

export default function RedFlagsList({ redFlags }: RedFlagsListProps) {
  if (redFlags.length === 0) {
    return (
      <div className="card p-6">
        <h3 className="text-lg font-semibold mb-4 text-text-primary">Red Flags</h3>
        <div className="flex items-center gap-3 p-4 bg-accent-green/10 rounded-lg border border-accent-green/20">
          <div className="w-8 h-8 rounded-full bg-accent-green/20 flex items-center justify-center">
            <span className="text-accent-green font-bold">&#10003;</span>
          </div>
          <div>
            <p className="text-accent-green font-medium">No Red Flags Detected</p>
            <p className="text-sm text-text-secondary">This project has no significant concerns.</p>
          </div>
        </div>
      </div>
    );
  }

  // Sort by severity (critical first)
  const sortedFlags = [...redFlags].sort((a, b) => {
    const order: Record<RedFlagSeverity, number> = { critical: 0, high: 1, medium: 2, low: 3 };
    return order[a.severity] - order[b.severity];
  });

  return (
    <div className="card p-6">
      <h3 className="text-lg font-semibold mb-4 text-text-primary">
        Red Flags <span className="text-text-secondary font-normal">({redFlags.length})</span>
      </h3>
      <div className="space-y-3">
        {sortedFlags.map((flag, index) => {
          const style = SEVERITY_STYLES[flag.severity];
          return (
            <div
              key={index}
              className={`p-4 rounded-lg border ${style.bg} border-white/5`}
            >
              <div className="flex items-start gap-3">
                <div className={`w-8 h-8 rounded-full ${style.bg} flex items-center justify-center flex-shrink-0`}>
                  <span className={`${style.text} font-bold text-sm`}>{style.icon}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className={`${style.text} font-semibold`}>{flag.title}</span>
                    <span className={`px-2 py-0.5 rounded text-xs uppercase font-medium ${style.bg} ${style.text}`}>
                      {flag.severity}
                    </span>
                    <span className="px-2 py-0.5 rounded text-xs bg-bg-surface text-text-secondary">
                      {flag.category}
                    </span>
                  </div>
                  <p className="text-sm text-text-secondary">{flag.description}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
