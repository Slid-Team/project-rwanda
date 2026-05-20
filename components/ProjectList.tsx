'use client';

import Link from 'next/link';
import { ProjectWithAnalysis, formatMarketCap, getGradeColor } from '@/lib/types';

interface ProjectListProps {
  projects: ProjectWithAnalysis[];
}

export default function ProjectList({ projects }: ProjectListProps) {
  return (
    <div className="card">
      <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
        <span className="text-text-primary font-medium">Monitored Assets</span>
        <span className="text-text-secondary text-sm">{projects.length} Projects</span>
      </div>
      <div className="divide-y divide-white/5">
        {projects.map((project) => (
          <Link
            key={project.id}
            href={`/project/${project.id}`}
            className="flex items-center justify-between px-5 py-4 hover:bg-bg-surface/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-bg-surface flex items-center justify-center text-sm font-bold text-text-primary">
                {project.token.charAt(0)}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-text-primary">{project.token}</span>
                  <span className="text-text-secondary text-sm">{project.name}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-right">
                <div className="font-mono text-text-primary">{formatMarketCap(project.marketCap)}</div>
              </div>
              {project.analysis && (
                <div className="w-20 text-right">
                  <span
                    className="font-semibold"
                    style={{ color: getGradeColor(project.analysis.grade) }}
                  >
                    {project.analysis.trustScore}
                  </span>
                  <span className="text-text-secondary text-sm ml-1">
                    ({project.analysis.grade})
                  </span>
                </div>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
