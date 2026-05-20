// Project types
export type ProjectType = 'stablecoin' | 'ondo-gm';

export interface Project {
  id: string;
  name: string;
  token: string;
  website: string;
  description: string;
  marketCap: number;
  totalSupply: number;
  chains: string[];
  lastAnalysis: string;
  logoUrl: string;
  type: ProjectType;
}

// Analysis types
export type AnalysisStatus = 'HEALTHY' | 'CAUTION' | 'WARNING' | 'CRITICAL';

export interface DimensionScore {
  score: number;
  weight: number;
  findings: string[];
}

export interface Dimensions {
  reserveTransparency: DimensionScore;
  auditQuality: DimensionScore;
  regulatoryCompliance: DimensionScore;
  redemptionReliability: DimensionScore;
  teamReputation: DimensionScore;
  onChainHealth: DimensionScore;
}

export interface ReserveComposition {
  cashAndCashEquivalents: number;
  treasuryBills: number;
  commercialPaper: number;
  corporateBonds: number;
  securedLoans: number;
  other: number;
}

export type RedFlagSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface RedFlag {
  severity: RedFlagSeverity;
  category: string;
  title: string;
  description: string;
}

export interface Analysis {
  projectId: string;
  analysisDate: string;
  reportDate: string;
  trustScore: number;
  grade: string;
  status: AnalysisStatus;
  dimensions: Dimensions;
  reserveComposition: ReserveComposition;
  redFlags: RedFlag[];
  summary: string;
}

// Combined project with analysis
export interface ProjectWithAnalysis extends Project {
  analysis: Analysis | null;
}

// Dimension display names
export const DIMENSION_LABELS: Record<keyof Dimensions, string> = {
  reserveTransparency: 'Reserve Transparency',
  auditQuality: 'Audit Quality',
  regulatoryCompliance: 'Regulatory Compliance',
  redemptionReliability: 'Redemption Reliability',
  teamReputation: 'Team Reputation',
  onChainHealth: 'On-Chain Health',
};

// Status colors
export const STATUS_COLORS: Record<AnalysisStatus, string> = {
  HEALTHY: '#4CAF50',
  CAUTION: '#FF9800',
  WARNING: '#FF5252',
  CRITICAL: '#D32F2F',
};

// Grade colors
export function getGradeColor(grade: string): string {
  if (grade.startsWith('A')) return '#4CAF50';
  if (grade.startsWith('B')) return '#8BC34A';
  if (grade.startsWith('C')) return '#FF9800';
  if (grade.startsWith('D')) return '#FF5252';
  return '#D32F2F';
}

// Format large numbers
export function formatMarketCap(value: number): string {
  if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
  if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
  return `$${value.toLocaleString()}`;
}
