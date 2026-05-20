'use client';

import { AnalysisStatus, getGradeColor } from '@/lib/types';

interface TrustScoreBadgeProps {
  score: number;
  grade: string;
  status: AnalysisStatus;
  size?: 'sm' | 'md' | 'lg';
}

export default function TrustScoreBadge({
  score,
  grade,
  status,
  size = 'md'
}: TrustScoreBadgeProps) {
  const gradeColor = getGradeColor(grade);

  const sizeClasses = {
    sm: {
      container: 'w-16 h-16',
      score: 'text-xl',
      grade: 'text-xs',
    },
    md: {
      container: 'w-24 h-24',
      score: 'text-3xl',
      grade: 'text-sm',
    },
    lg: {
      container: 'w-32 h-32',
      score: 'text-4xl',
      grade: 'text-base',
    },
  };

  const statusClasses: Record<AnalysisStatus, string> = {
    HEALTHY: 'status-healthy',
    CAUTION: 'status-caution',
    WARNING: 'status-warning',
    CRITICAL: 'status-critical',
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className={`${sizeClasses[size].container} rounded-full flex flex-col items-center justify-center`}
        style={{
          background: `conic-gradient(${gradeColor} ${score}%, var(--bg-surface) ${score}%)`,
          padding: '4px',
        }}
      >
        <div className="w-full h-full rounded-full bg-bg-card flex flex-col items-center justify-center">
          <span className={`${sizeClasses[size].score} font-bold`} style={{ color: gradeColor }}>
            {score}
          </span>
          <span className={`${sizeClasses[size].grade} font-semibold`} style={{ color: gradeColor }}>
            {grade}
          </span>
        </div>
      </div>
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusClasses[status]}`}>
        {status}
      </span>
    </div>
  );
}
