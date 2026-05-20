'use client';

import Link from 'next/link';
import { ProjectWithAnalysis, formatMarketCap, getGradeColor, STATUS_COLORS, AnalysisStatus } from '@/lib/types';

interface ProjectTableProps {
  projects: ProjectWithAnalysis[];
}

export default function ProjectTable({ projects }: ProjectTableProps) {
  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10">
              <th className="text-left px-6 py-4 text-text-secondary font-medium text-sm">Project</th>
              <th className="text-left px-6 py-4 text-text-secondary font-medium text-sm">Token</th>
              <th className="text-right px-6 py-4 text-text-secondary font-medium text-sm">Market Cap</th>
              <th className="text-center px-6 py-4 text-text-secondary font-medium text-sm">Trust Score</th>
              <th className="text-center px-6 py-4 text-text-secondary font-medium text-sm">Status</th>
              <th className="text-center px-6 py-4 text-text-secondary font-medium text-sm">Red Flags</th>
              <th className="text-right px-6 py-4 text-text-secondary font-medium text-sm">Last Analysis</th>
            </tr>
          </thead>
          <tbody>
            {projects.map((project) => (
              <Link
                key={project.id}
                href={`/project/${project.id}`}
                className="contents"
              >
                <tr className="border-b border-white/5 hover:bg-bg-surface/50 cursor-pointer transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-bg-surface flex items-center justify-center text-lg font-bold">
                        {project.token.charAt(0)}
                      </div>
                      <div>
                        <div className="font-semibold text-text-primary">{project.name}</div>
                        <div className="text-sm text-text-secondary">{project.chains.slice(0, 3).join(', ')}{project.chains.length > 3 ? '...' : ''}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-bg-surface rounded text-sm font-mono">
                      {project.token}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right font-mono text-text-primary">
                    {formatMarketCap(project.marketCap)}
                  </td>
                  <td className="px-6 py-4 text-center">
                    {project.analysis ? (
                      <div className="flex items-center justify-center gap-2">
                        <span
                          className="text-xl font-bold"
                          style={{ color: getGradeColor(project.analysis.grade) }}
                        >
                          {project.analysis.trustScore}
                        </span>
                        <span
                          className="text-sm font-semibold"
                          style={{ color: getGradeColor(project.analysis.grade) }}
                        >
                          ({project.analysis.grade})
                        </span>
                      </div>
                    ) : (
                      <span className="text-text-secondary">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center">
                    {project.analysis ? (
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium status-${project.analysis.status.toLowerCase()}`}
                      >
                        {project.analysis.status}
                      </span>
                    ) : (
                      <span className="text-text-secondary">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center">
                    {project.analysis ? (
                      <span
                        className={`font-semibold ${
                          project.analysis.redFlags.length === 0
                            ? 'text-accent-green'
                            : project.analysis.redFlags.length <= 2
                              ? 'text-accent-orange'
                              : 'text-accent-red'
                        }`}
                      >
                        {project.analysis.redFlags.length}
                      </span>
                    ) : (
                      <span className="text-text-secondary">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right text-sm text-text-secondary">
                    {project.lastAnalysis}
                  </td>
                </tr>
              </Link>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
