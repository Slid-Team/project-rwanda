import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Project } from '@/lib/types';
import projectsData from '@/data/projects.json';
import LiveStatus from '@/components/LiveStatus';
import { formatMarketCap } from '@/lib/types';
import { getOndoTokens, getDisplayTokens } from '@/lib/ondo';
import fs from 'fs';
import path from 'path';

interface PageProps {
  params: Promise<{ id: string }>;
}

interface StablecoinAnalysis {
  projectId: string;
  analysisDate: string;
  reportDate: string;
  lastCirculationUpdate: string;
  auditor: string;
  auditorTier: string;
  auditStandard: string;
  dataSource: string;
  trustScore: number;
  grade: string;
  status: string;
  overview: {
    totalAssets: number;
    totalLiabilities: number;
    netEquity: number;
    reserveRatio: number;
  };
  dimensions: {
    geniusAct: {
      score: number;
      grade?: string;
      status: string;
      compliantPct: number;
      nonCompliantPct: number;
      summary: string;
      permittedAssets: Array<{ name: string; pct: number }>;
      prohibitedAssets: Array<{ name: string; pct: number; usd: number }>;
      findings: string[];
    };
    reserveAdequacy: {
      score: number;
      grade?: string;
      status: string;
      ratio: number;
      buffer: number;
      summary: string;
      findings: string[];
    };
    reserveComposition: {
      score: number;
      grade?: string;
      status: string;
      summary: string;
      breakdown: Record<string, { pct: number; usd: number; tier: string }>;
      findings: string[];
      fundStructure?: {
        name: string;
        type: string;
        manager: string;
        dailyReporting: boolean;
      };
    };
    custody: {
      score: number;
      grade?: string;
      status: string;
      summary: string;
      issuer: string;
      jurisdiction: string;
      treasuryCustodian: string;
      findings: string[];
    };
    reportingAudit: {
      score: number;
      grade?: string;
      status: string;
      frequency: string;
      auditor: string;
      daysSinceReport: number;
      summary: string;
      findings: string[];
    };
    // Tokenized Equities dimensions
    collateralRatio?: {
      score: number;
      grade?: string;
      status: string;
      ratio: number;
      buffer: number;
      summary: string;
      findings: string[];
    };
    perTokenVerification?: {
      score: number;
      grade?: string;
      status: string;
      summary: string;
      findings: string[];
    };
    reportingFreshness?: {
      score: number;
      grade?: string;
      status: string;
      frequency: string;
      verificationAgent: string;
      summary: string;
      findings: string[];
    };
    bankruptcyProtection?: {
      score: number;
      grade?: string;
      status: string;
      issuer: string;
      jurisdiction: string;
      summary: string;
      findings: string[];
    };
    custodyCounterparty?: {
      score: number;
      grade?: string;
      status: string;
      summary: string;
      findings: string[];
    };
  };
  redFlags: Array<{
    severity: string;
    category: string;
    title: string;
    description: string;
  }>;
  observations?: Array<{
    id: string;
    severity: string;
    category: string;
    title: string;
    description: string;
  }>;
  issuanceRedemption?: {
    '7day': { issued: number; redeemed: number; netChange: number };
    '30day': { issued: number; redeemed: number; netChange: number };
    '365day': { issued: number; redeemed: number; netChange: number };
  };
  stressTest: {
    scenario30pctDrop: { loss: number; newRatio: number; summary: string; result?: string };
    scenario50pctDrop: { loss: number; newRatio: number; summary: string; result?: string };
  };
  summary: string;
}

async function getProject(id: string): Promise<Project | null> {
  const projects = projectsData as Project[];
  return projects.find((p) => p.id === id) || null;
}

async function getAnalysis(project: Project): Promise<StablecoinAnalysis | null> {
  const analysisDir = path.join(process.cwd(), 'data', 'analyses');
  const analysisFile = `${project.id}-${project.lastAnalysis}.json`;
  const analysisPath = path.join(analysisDir, analysisFile);

  try {
    const analysisContent = fs.readFileSync(analysisPath, 'utf-8');
    return JSON.parse(analysisContent) as StablecoinAnalysis;
  } catch {
    return null;
  }
}

function formatLargeNumber(num: number): string {
  if (num >= 1e12) return `$${(num / 1e12).toFixed(2)}T`;
  if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
  if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
  return `$${num.toLocaleString()}`;
}

function getDimensionGradeColor(grade: string): string {
  if (grade.startsWith('A')) return '#34C759';
  if (grade.startsWith('B')) return '#34C759';
  if (grade.startsWith('C')) return '#FF9500';
  if (grade.startsWith('D')) return '#FF3B30';
  return '#FF3B30';
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'FAIL': return 'text-accent-red';
    case 'PASS':
    case 'FULLY BACKED':
    case 'PRISTINE':
    case 'INSTITUTIONAL':
    case 'GOLD STANDARD':
    case 'OVER-COLLATERALIZED': return 'text-accent-green';
    case 'MIXED': return 'text-accent-orange';
    case 'ADEQUATE': return 'text-accent-orange';
    default: return 'text-text-secondary';
  }
}

export default async function ProjectPage({ params }: PageProps) {
  const { id } = await params;
  const project = await getProject(id);

  if (!project) {
    notFound();
  }

  const analysis = await getAnalysis(project);
  const ondoTokens = project.type === 'ondo-gm' ? await getOndoTokens() : [];
  const displayTokens = getDisplayTokens(ondoTokens, 6);

  const gradeColor = analysis
    ? (analysis.grade === 'A' || analysis.grade === 'A+' || analysis.grade === 'A-') ? '#34C759'
    : (analysis.grade === 'B' || analysis.grade === 'B+' || analysis.grade === 'B-') ? '#34C759'
    : (analysis.grade === 'C' || analysis.grade === 'C+' || analysis.grade === 'C-') ? '#FF9500'
    : '#FF3B30'
    : '#86868B';

  return (
    <div className="bg-white min-h-screen">
      {/* Data Freshness Warning */}
      {analysis && analysis.dimensions?.reportingAudit?.daysSinceReport > 30 && (
        <div className="bg-amber-50 border-b border-amber-200">
          <div className="max-w-[1200px] mx-auto px-6 py-3 flex items-center gap-2 text-amber-800 text-sm">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            Report data is {analysis.dimensions.reportingAudit.daysSinceReport} days old (last report: {analysis.reportDate})
          </div>
        </div>
      )}

      {/* Hero Header */}
      <section className="pt-8 pb-6">
        <div className="max-w-[1200px] mx-auto px-6">
          <Link
            href="/"
            className="text-accent-blue text-sm hover:underline inline-flex items-center gap-1 mb-6"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Overview
          </Link>

          <div className="flex items-start justify-between">
            <div className="flex items-center gap-5">
              <Image
                src={project.logoUrl}
                alt={project.token}
                width={72}
                height={72}
                className="rounded-2xl"
              />
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-[40px] font-bold text-text-primary tracking-tight">
                    {project.name}
                  </h1>
                  <span className="px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-text-secondary">
                    {project.type === 'stablecoin' ? 'Stablecoin' : project.type === 'ondo-gm' ? 'Equity RWA' : 'RWA'}
                  </span>
                </div>
                <p className="text-text-secondary text-lg">{project.token}</p>
              </div>
            </div>
            {analysis && (
              <div className="text-right text-sm">
                <div className="flex items-center justify-end gap-2 text-text-secondary mb-1">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-green opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-accent-green"></span>
                  </span>
                  <span>Last updated <span className="font-medium text-text-primary">{new Date(analysis.analysisDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span></span>
                </div>
                <p className="text-text-tertiary text-xs">
                  Source: <a href={analysis.dataSource} target="_blank" rel="noopener noreferrer" className="text-accent-blue hover:underline">{new URL(analysis.dataSource).hostname}</a>
                </p>
                <p className="text-text-tertiary text-xs">
                  Report: {analysis.reportDate} · {analysis.auditor}
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Overview Stats */}
      {analysis && (
        <section className="py-6 bg-bg-secondary">
          <div className="max-w-[1200px] mx-auto px-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <div>
                <p className="text-[28px] font-black text-text-primary">{formatLargeNumber(analysis.overview.totalAssets)}</p>
                <p className="text-text-secondary text-sm">Total Assets</p>
              </div>
              <div>
                <p className="text-[28px] font-black text-text-primary">{formatLargeNumber(analysis.overview.totalLiabilities)}</p>
                <p className="text-text-secondary text-sm">Total Liabilities</p>
              </div>
              <div>
                <p className="text-[28px] font-black text-accent-green">{analysis.overview.reserveRatio}%</p>
                <p className="text-text-secondary text-sm">Reserve Ratio</p>
              </div>
              <div>
                <p className="text-[28px] font-black text-text-primary">{formatLargeNumber(analysis.overview.netEquity)}</p>
                <p className="text-text-secondary text-sm">Equity Buffer</p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* S&P-Style Grade */}
      {analysis && (
        <section className="py-12">
          <div className="max-w-[1200px] mx-auto px-6 text-center">
            <p className="text-text-tertiary text-sm uppercase tracking-widest mb-2">
              {project.type === 'stablecoin' ? 'Stablecoin' : project.type === 'ondo-gm' ? 'Equity RWA' : 'RWA'} Rating
            </p>
            <p className="text-[120px] font-black tracking-tight leading-none" style={{ color: gradeColor }}>
              {analysis.grade}
            </p>
            <div className="mt-6 max-w-[600px] mx-auto">
              {analysis.summary.split('. ').filter(s => s.trim()).map((sentence, idx) => (
                <p key={idx} className="text-text-secondary text-base leading-relaxed mb-1">
                  {sentence.trim()}{!sentence.trim().endsWith('.') ? '.' : ''}
                </p>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 5 Dimensions - Stablecoin */}
      {analysis && project.type === 'stablecoin' && analysis.dimensions.geniusAct && (
        <section className="py-8">
          <div className="max-w-[1200px] mx-auto px-6">
            <h2 className="text-2xl font-bold text-text-primary mb-6">Analysis Dimensions</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* GENIUS Act */}
              <div className="card p-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-text-primary">GENIUS Act Compliance</h3>
                  <span className="text-xl font-black" style={{ color: getDimensionGradeColor(analysis.dimensions.geniusAct.grade || 'C') }}>
                    {analysis.dimensions.geniusAct.grade || '—'}
                  </span>
                </div>
                <p className={`text-sm font-medium mb-2 ${getStatusColor(analysis.dimensions.geniusAct.status)}`}>
                  {analysis.dimensions.geniusAct.status}
                </p>
                <p className="text-text-secondary text-sm mb-4">{analysis.dimensions.geniusAct.summary}</p>
                <div className="flex gap-4 text-sm">
                  <div>
                    <span className="text-accent-green font-semibold">{analysis.dimensions.geniusAct.compliantPct}%</span>
                    <span className="text-text-tertiary ml-1">compliant</span>
                  </div>
                  <div>
                    <span className="text-accent-red font-semibold">{analysis.dimensions.geniusAct.nonCompliantPct}%</span>
                    <span className="text-text-tertiary ml-1">prohibited</span>
                  </div>
                </div>
              </div>

              {/* Reserve Adequacy */}
              <div className="card p-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-text-primary">Reserve Adequacy</h3>
                  <span className="text-xl font-black" style={{ color: getDimensionGradeColor(analysis.dimensions.reserveAdequacy.grade || 'C') }}>
                    {analysis.dimensions.reserveAdequacy.grade || '—'}
                  </span>
                </div>
                <p className={`text-sm font-medium mb-2 ${getStatusColor(analysis.dimensions.reserveAdequacy.status)}`}>
                  {analysis.dimensions.reserveAdequacy.status}
                </p>
                <p className="text-text-secondary text-sm mb-4">{analysis.dimensions.reserveAdequacy.summary}</p>
                <div className="text-sm">
                  <span className="text-accent-green font-semibold">{analysis.dimensions.reserveAdequacy.ratio}%</span>
                  <span className="text-text-tertiary ml-1">backed</span>
                </div>
              </div>

              {/* Reserve Composition */}
              <div className="card p-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-text-primary">Reserve Composition</h3>
                  <span className="text-xl font-black" style={{ color: getDimensionGradeColor(analysis.dimensions.reserveComposition.grade || 'C') }}>
                    {analysis.dimensions.reserveComposition.grade || '—'}
                  </span>
                </div>
                <p className={`text-sm font-medium mb-2 ${getStatusColor(analysis.dimensions.reserveComposition.status)}`}>
                  {analysis.dimensions.reserveComposition.status}
                </p>
                <p className="text-text-secondary text-sm">{analysis.dimensions.reserveComposition.summary}</p>
                {analysis.dimensions.reserveComposition.fundStructure && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <p className="text-xs text-text-tertiary uppercase tracking-wide mb-2">Fund Structure</p>
                    <p className="text-sm text-text-primary font-medium">{analysis.dimensions.reserveComposition.fundStructure.name}</p>
                    <p className="text-xs text-text-secondary">{analysis.dimensions.reserveComposition.fundStructure.type}</p>
                    <p className="text-xs text-text-tertiary mt-1">Managed by {analysis.dimensions.reserveComposition.fundStructure.manager}</p>
                  </div>
                )}
              </div>

              {/* Custody */}
              <div className="card p-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-text-primary">Custody & Jurisdiction</h3>
                  <span className="text-xl font-black" style={{ color: getDimensionGradeColor(analysis.dimensions.custody.grade || 'C') }}>
                    {analysis.dimensions.custody.grade || '—'}
                  </span>
                </div>
                <p className={`text-sm font-medium mb-2 ${getStatusColor(analysis.dimensions.custody.status)}`}>
                  {analysis.dimensions.custody.status}
                </p>
                <p className="text-text-secondary text-sm mb-4">{analysis.dimensions.custody.summary}</p>
                <div className="text-sm text-text-tertiary">
                  <p>Issuer: {analysis.dimensions.custody.issuer}</p>
                  <p>Jurisdiction: {analysis.dimensions.custody.jurisdiction}</p>
                </div>
              </div>

              {/* Reporting */}
              <div className="card p-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-text-primary">Reporting & Audit</h3>
                  <span className="text-xl font-black" style={{ color: getDimensionGradeColor(analysis.dimensions.reportingAudit.grade || 'C') }}>
                    {analysis.dimensions.reportingAudit.grade || '—'}
                  </span>
                </div>
                <p className={`text-sm font-medium mb-2 ${getStatusColor(analysis.dimensions.reportingAudit.status)}`}>
                  {analysis.dimensions.reportingAudit.status}
                </p>
                <p className="text-text-secondary text-sm mb-4">{analysis.dimensions.reportingAudit.summary}</p>
                <div className="text-sm text-text-tertiary">
                  <p>Auditor: {analysis.dimensions.reportingAudit.auditor}</p>
                  <p>Frequency: {analysis.dimensions.reportingAudit.frequency}</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 5 Dimensions - Tokenized Equities (Ondo GM) */}
      {analysis && project.type === 'ondo-gm' && analysis.dimensions.collateralRatio && (
        <section className="py-8">
          <div className="max-w-[1200px] mx-auto px-6">
            <h2 className="text-2xl font-bold text-text-primary mb-6">Analysis Dimensions</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Collateral Ratio */}
              <div className="card p-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-text-primary">Collateral Ratio</h3>
                  <span className="text-xl font-black" style={{ color: getDimensionGradeColor(analysis.dimensions.collateralRatio.grade || 'C') }}>
                    {analysis.dimensions.collateralRatio.grade || '—'}
                  </span>
                </div>
                <p className={`text-sm font-medium mb-2 ${getStatusColor(analysis.dimensions.collateralRatio.status)}`}>
                  {analysis.dimensions.collateralRatio.status}
                </p>
                <p className="text-text-secondary text-sm mb-4">{analysis.dimensions.collateralRatio.summary}</p>
                <div className="text-sm">
                  <span className="text-accent-green font-semibold">{analysis.dimensions.collateralRatio.ratio}%</span>
                  <span className="text-text-tertiary ml-1">collateralized</span>
                </div>
              </div>

              {/* Per-Token Verification */}
              <div className="card p-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-text-primary">Per-Token Verification</h3>
                  <span className="text-xl font-black" style={{ color: getDimensionGradeColor(analysis.dimensions.perTokenVerification.grade || 'C') }}>
                    {analysis.dimensions.perTokenVerification.grade || '—'}
                  </span>
                </div>
                <p className={`text-sm font-medium mb-2 ${getStatusColor(analysis.dimensions.perTokenVerification.status)}`}>
                  {analysis.dimensions.perTokenVerification.status}
                </p>
                <p className="text-text-secondary text-sm">{analysis.dimensions.perTokenVerification.summary}</p>
              </div>

              {/* Reporting Freshness */}
              <div className="card p-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-text-primary">Reporting Freshness</h3>
                  <span className="text-xl font-black" style={{ color: getDimensionGradeColor(analysis.dimensions.reportingFreshness.grade || 'C') }}>
                    {analysis.dimensions.reportingFreshness.grade || '—'}
                  </span>
                </div>
                <p className={`text-sm font-medium mb-2 ${getStatusColor(analysis.dimensions.reportingFreshness.status)}`}>
                  {analysis.dimensions.reportingFreshness.status}
                </p>
                <p className="text-text-secondary text-sm mb-4">{analysis.dimensions.reportingFreshness.summary}</p>
                <div className="text-sm text-text-tertiary">
                  <p>Verifier: {analysis.dimensions.reportingFreshness.verificationAgent}</p>
                  <p>Frequency: {analysis.dimensions.reportingFreshness.frequency}</p>
                </div>
              </div>

              {/* Bankruptcy Protection */}
              <div className="card p-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-text-primary">Bankruptcy Protection</h3>
                  <span className="text-xl font-black" style={{ color: getDimensionGradeColor(analysis.dimensions.bankruptcyProtection.grade || 'C') }}>
                    {analysis.dimensions.bankruptcyProtection.grade || '—'}
                  </span>
                </div>
                <p className={`text-sm font-medium mb-2 ${getStatusColor(analysis.dimensions.bankruptcyProtection.status)}`}>
                  {analysis.dimensions.bankruptcyProtection.status}
                </p>
                <p className="text-text-secondary text-sm mb-4">{analysis.dimensions.bankruptcyProtection.summary}</p>
                <div className="text-sm text-text-tertiary">
                  <p>Issuer: {analysis.dimensions.bankruptcyProtection.issuer}</p>
                  <p>Jurisdiction: {analysis.dimensions.bankruptcyProtection.jurisdiction}</p>
                </div>
              </div>

              {/* Custody & Counterparty */}
              <div className="card p-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-text-primary">Custody & Counterparty</h3>
                  <span className="text-xl font-black" style={{ color: getDimensionGradeColor(analysis.dimensions.custodyCounterparty.grade || 'C') }}>
                    {analysis.dimensions.custodyCounterparty.grade || '—'}
                  </span>
                </div>
                <p className={`text-sm font-medium mb-2 ${getStatusColor(analysis.dimensions.custodyCounterparty.status)}`}>
                  {analysis.dimensions.custodyCounterparty.status}
                </p>
                <p className="text-text-secondary text-sm">{analysis.dimensions.custodyCounterparty.summary}</p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Red Flags */}
      {analysis && analysis.redFlags.length > 0 && (
        <section className="py-8">
          <div className="max-w-[1200px] mx-auto px-6">
            <h2 className="text-2xl font-bold text-text-primary mb-6">
              Red Flags
              <span className="ml-2 text-lg font-normal text-text-secondary">({analysis.redFlags.length})</span>
            </h2>
            <div className="space-y-3">
              {analysis.redFlags.map((flag, idx) => (
                <div key={idx} className="card p-4 flex items-start gap-4">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold uppercase ${
                    flag.severity === 'high' ? 'bg-red-100 text-accent-red' :
                    flag.severity === 'medium' ? 'bg-orange-100 text-accent-orange' :
                    'bg-yellow-100 text-yellow-600'
                  }`}>
                    {flag.severity}
                  </span>
                  <div>
                    <p className="font-medium text-text-primary">{flag.title}</p>
                    <p className="text-text-secondary text-sm mt-1">{flag.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Observations (for Circle - info level notes) */}
      {analysis && analysis.observations && analysis.observations.length > 0 && (
        <section className="py-8">
          <div className="max-w-[1200px] mx-auto px-6">
            <h2 className="text-2xl font-bold text-text-primary mb-6">
              Observations
              <span className="ml-2 text-lg font-normal text-text-secondary">({analysis.observations.length})</span>
            </h2>
            <div className="space-y-3">
              {analysis.observations.map((obs, idx) => (
                <div key={idx} className="card p-4 flex items-start gap-4">
                  <span className="px-2.5 py-1 rounded-full text-xs font-semibold uppercase bg-blue-50 text-accent-blue">
                    info
                  </span>
                  <div>
                    <p className="font-medium text-text-primary">{obs.title}</p>
                    <p className="text-text-secondary text-sm mt-1">{obs.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Issuance & Redemption */}
      {analysis && analysis.issuanceRedemption && (
        <section className="py-8">
          <div className="max-w-[1200px] mx-auto px-6">
            <h2 className="text-2xl font-bold text-text-primary mb-6">Issuance & Redemption Flow</h2>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="card p-6">
                <p className="text-text-tertiary text-sm mb-2">7-Day</p>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-text-secondary text-sm">Issued</span>
                    <span className="text-accent-green font-medium">{formatLargeNumber(analysis.issuanceRedemption['7day'].issued)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-secondary text-sm">Redeemed</span>
                    <span className="text-accent-red font-medium">{formatLargeNumber(analysis.issuanceRedemption['7day'].redeemed)}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-gray-100">
                    <span className="text-text-primary font-medium">Net</span>
                    <span className={`font-bold ${analysis.issuanceRedemption['7day'].netChange >= 0 ? 'text-accent-green' : 'text-accent-red'}`}>
                      {analysis.issuanceRedemption['7day'].netChange >= 0 ? '+' : ''}{formatLargeNumber(analysis.issuanceRedemption['7day'].netChange)}
                    </span>
                  </div>
                </div>
              </div>
              <div className="card p-6">
                <p className="text-text-tertiary text-sm mb-2">30-Day</p>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-text-secondary text-sm">Issued</span>
                    <span className="text-accent-green font-medium">{formatLargeNumber(analysis.issuanceRedemption['30day'].issued)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-secondary text-sm">Redeemed</span>
                    <span className="text-accent-red font-medium">{formatLargeNumber(analysis.issuanceRedemption['30day'].redeemed)}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-gray-100">
                    <span className="text-text-primary font-medium">Net</span>
                    <span className={`font-bold ${analysis.issuanceRedemption['30day'].netChange >= 0 ? 'text-accent-green' : 'text-accent-red'}`}>
                      {analysis.issuanceRedemption['30day'].netChange >= 0 ? '+' : ''}{formatLargeNumber(analysis.issuanceRedemption['30day'].netChange)}
                    </span>
                  </div>
                </div>
              </div>
              <div className="card p-6">
                <p className="text-text-tertiary text-sm mb-2">365-Day</p>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-text-secondary text-sm">Issued</span>
                    <span className="text-accent-green font-medium">{formatLargeNumber(analysis.issuanceRedemption['365day'].issued)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-secondary text-sm">Redeemed</span>
                    <span className="text-accent-red font-medium">{formatLargeNumber(analysis.issuanceRedemption['365day'].redeemed)}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-gray-100">
                    <span className="text-text-primary font-medium">Net</span>
                    <span className={`font-bold ${analysis.issuanceRedemption['365day'].netChange >= 0 ? 'text-accent-green' : 'text-accent-red'}`}>
                      {analysis.issuanceRedemption['365day'].netChange >= 0 ? '+' : ''}{formatLargeNumber(analysis.issuanceRedemption['365day'].netChange)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Stress Test */}
      {analysis && analysis.stressTest && (
        <section className="py-8">
          <div className="max-w-[1200px] mx-auto px-6">
            <h2 className="text-2xl font-bold text-text-primary mb-6">Stress Test Scenarios</h2>
            {analysis.stressTest.scenario30pctDrop.result === 'NOT_APPLICABLE' ? (
              <div className="card p-6 bg-green-50 border-green-200">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">🛡️</span>
                  <h3 className="font-semibold text-accent-green">No Stress Test Required</h3>
                </div>
                <p className="text-text-secondary text-sm">{analysis.stressTest.scenario30pctDrop.summary}</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                <div className="card p-6">
                  <h3 className="font-semibold text-text-primary mb-2">30% Drop in Risky Assets</h3>
                  <p className="text-accent-orange text-2xl font-bold mb-2">{analysis.stressTest.scenario30pctDrop.newRatio}%</p>
                  <p className="text-text-secondary text-sm">{analysis.stressTest.scenario30pctDrop.summary}</p>
                  <p className="text-text-tertiary text-sm mt-2">
                    Est. loss: {formatLargeNumber(analysis.stressTest.scenario30pctDrop.loss)}
                  </p>
                </div>
                <div className="card p-6">
                  <h3 className="font-semibold text-text-primary mb-2">50% Drop in Risky Assets</h3>
                  <p className="text-accent-red text-2xl font-bold mb-2">{analysis.stressTest.scenario50pctDrop.newRatio}%</p>
                  <p className="text-text-secondary text-sm">{analysis.stressTest.scenario50pctDrop.summary}</p>
                  <p className="text-text-tertiary text-sm mt-2">
                    Est. loss: {formatLargeNumber(analysis.stressTest.scenario50pctDrop.loss)}
                  </p>
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Subscribe CTA */}
      <section className="py-12">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="card p-8 bg-gradient-to-r from-[#0071E3]/5 to-[#34C759]/5 border-[#0071E3]/20">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-[#0088cc] flex items-center justify-center">
                  <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .37z"/>
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-text-primary">Get Alerts for {project.name}</h3>
                  <p className="text-text-secondary">Instant notifications when ratings change or new reports are published.</p>
                </div>
              </div>
              <a
                href={`https://t.me/rwa_nda_bot?start=${project.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#0088cc] text-white font-semibold rounded-full hover:bg-[#0077b5] transition-colors"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .37z"/>
                </svg>
                Subscribe on Telegram
              </a>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
