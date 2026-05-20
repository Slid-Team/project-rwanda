/**
 * RWA-NDA Analyzer
 * Automated analysis pipeline for RWA projects
 */

// Grade calculation
export function calculateGrade(trustScore: number, redFlags: RedFlag[]): string {
  const highSeverityCount = redFlags.filter(f => f.severity === 'high' || f.severity === 'critical').length;

  let grade: string;
  if (trustScore >= 95) grade = 'A+';
  else if (trustScore >= 90) grade = 'A';
  else if (trustScore >= 85) grade = 'A-';
  else if (trustScore >= 80) grade = 'B+';
  else if (trustScore >= 75) grade = 'B';
  else if (trustScore >= 70) grade = 'B-';
  else if (trustScore >= 65) grade = 'C+';
  else if (trustScore >= 60) grade = 'C';
  else if (trustScore >= 50) grade = 'C-';
  else if (trustScore >= 40) grade = 'D';
  else grade = 'F';

  // Downgrade if 2+ high severity red flags
  if (highSeverityCount >= 2) {
    const gradeOrder = ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D', 'F'];
    const currentIdx = gradeOrder.indexOf(grade);
    if (currentIdx < gradeOrder.length - 1) {
      grade = gradeOrder[currentIdx + 1];
    }
  }

  return grade;
}

export function calculateTrustScore(dimensions: DimensionScore[]): number {
  return dimensions.reduce((sum, dim) => sum + (dim.score * dim.weight), 0) / 100;
}

export function getStatus(trustScore: number): string {
  if (trustScore >= 85) return 'HEALTHY';
  if (trustScore >= 70) return 'CAUTION';
  if (trustScore >= 50) return 'WARNING';
  return 'CRITICAL';
}

// Types
export interface DimensionScore {
  score: number;
  weight: number;
  grade: string;
  status: string;
  summary: string;
  findings: string[];
}

export interface RedFlag {
  id: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  title: string;
  description: string;
}

// Stablecoin Framework
export interface StablecoinData {
  totalAssets: number;
  totalLiabilities: number;
  reserveComposition: {
    treasuryBills: number;
    overnightRepo: number;
    termRepo: number;
    cashDeposits: number;
    preciousMetals: number;
    securedLoans: number;
    bitcoin: number;
    publicEquities: number;
    otherInvestments: number;
  };
  auditor: string;
  reportDate: string;
  reportingFrequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  jurisdiction: string;
}

export function analyzeStablecoin(data: StablecoinData) {
  const reserveRatio = (data.totalAssets / data.totalLiabilities) * 100;
  const netEquity = data.totalAssets - data.totalLiabilities;

  // GENIUS Act compliance calculation
  const comp = data.reserveComposition;
  const compliantAssets = comp.treasuryBills + comp.overnightRepo + comp.termRepo + comp.cashDeposits;
  const prohibitedAssets = comp.preciousMetals + comp.securedLoans + comp.bitcoin + comp.publicEquities + comp.otherInvestments;
  const totalReserves = compliantAssets + prohibitedAssets;
  const compliantPct = (compliantAssets / totalReserves) * 100;
  const prohibitedPct = (prohibitedAssets / totalReserves) * 100;

  // Dimension scores
  const dimensions = {
    geniusAct: evaluateGeniusAct(compliantPct, data.reportingFrequency),
    reserveAdequacy: evaluateReserveAdequacy(reserveRatio, netEquity),
    reserveComposition: evaluateReserveComposition(compliantPct, prohibitedPct),
    custody: evaluateCustody(data.jurisdiction, data.auditor),
    reportingAudit: evaluateReportingAudit(data.auditor, data.reportingFrequency, data.reportDate),
  };

  const allDimensions = Object.values(dimensions);
  const trustScore = calculateTrustScore(allDimensions);
  const redFlags = detectStablecoinRedFlags(data, compliantPct, reserveRatio);
  const grade = calculateGrade(trustScore, redFlags);
  const status = getStatus(trustScore);

  return {
    trustScore: Math.round(trustScore),
    grade,
    status,
    overview: {
      totalAssets: data.totalAssets,
      totalLiabilities: data.totalLiabilities,
      netEquity,
      reserveRatio: Math.round(reserveRatio * 100) / 100,
    },
    dimensions,
    redFlags,
  };
}

function evaluateGeniusAct(compliantPct: number, frequency: string): DimensionScore {
  let score = 0;
  if (compliantPct >= 100) score = 100;
  else if (compliantPct >= 90) score = 85;
  else if (compliantPct >= 80) score = 70;
  else if (compliantPct >= 70) score = 55;
  else score = 45;

  if (frequency !== 'monthly' && frequency !== 'weekly' && frequency !== 'daily') {
    score -= 10;
  }

  return {
    score,
    weight: 25,
    grade: scoreToGrade(score),
    status: compliantPct >= 100 ? 'PASS' : compliantPct >= 80 ? 'MIXED' : 'FAIL',
    summary: `${compliantPct.toFixed(1)}% GENIUS-compliant reserves. ${frequency} reporting.`,
    findings: [
      `${compliantPct.toFixed(1)}% of reserves in GENIUS-permitted assets`,
      `Reports ${frequency}`,
    ],
  };
}

function evaluateReserveAdequacy(ratio: number, buffer: number): DimensionScore {
  let score = 0;
  if (ratio >= 110) score = 98;
  else if (ratio >= 105) score = 95;
  else if (ratio >= 102) score = 90;
  else if (ratio >= 100) score = 85;
  else if (ratio >= 98) score = 60;
  else score = 40;

  return {
    score,
    weight: 25,
    grade: scoreToGrade(score),
    status: ratio >= 100 ? 'FULLY BACKED' : 'UNDER-COLLATERALIZED',
    summary: `${ratio.toFixed(2)}% backed with $${formatNumber(buffer)} equity buffer.`,
    findings: [
      `Reserve ratio: ${ratio.toFixed(2)}%`,
      `Equity buffer: $${formatNumber(buffer)}`,
    ],
  };
}

function evaluateReserveComposition(safePct: number, riskyPct: number): DimensionScore {
  let score = 0;
  if (riskyPct === 0) score = 100;
  else if (riskyPct <= 5) score = 90;
  else if (riskyPct <= 15) score = 75;
  else if (riskyPct <= 25) score = 65;
  else score = 50;

  return {
    score,
    weight: 20,
    grade: scoreToGrade(score),
    status: riskyPct === 0 ? 'PRISTINE' : riskyPct <= 10 ? 'MOSTLY SAFE' : 'MIXED',
    summary: `${safePct.toFixed(1)}% safe, ${riskyPct.toFixed(1)}% risky assets.`,
    findings: [
      `Safe assets: ${safePct.toFixed(1)}%`,
      `Risky assets: ${riskyPct.toFixed(1)}%`,
    ],
  };
}

function evaluateCustody(jurisdiction: string, auditor: string): DimensionScore {
  const safeJurisdictions = ['USA', 'UK', 'Switzerland', 'Singapore'];
  const isSafe = safeJurisdictions.some(j => jurisdiction.includes(j));

  let score = isSafe ? 90 : 65;

  return {
    score,
    weight: 15,
    grade: scoreToGrade(score),
    status: isSafe ? 'INSTITUTIONAL' : 'MIXED',
    summary: `${jurisdiction} jurisdiction. Audited by ${auditor}.`,
    findings: [
      `Jurisdiction: ${jurisdiction}`,
      `Auditor: ${auditor}`,
    ],
  };
}

function evaluateReportingAudit(auditor: string, frequency: string, reportDate: string): DimensionScore {
  const big4 = ['Deloitte', 'PwC', 'EY', 'KPMG'];
  const isBig4 = big4.some(a => auditor.includes(a));

  const daysSince = Math.floor((Date.now() - new Date(reportDate).getTime()) / (1000 * 60 * 60 * 24));

  let score = isBig4 ? 95 : 70;
  if (frequency === 'daily') score += 5;
  else if (frequency === 'weekly') score += 3;
  else if (frequency === 'quarterly') score -= 10;

  if (daysSince > 90) score -= 15;
  else if (daysSince > 30) score -= 5;

  return {
    score: Math.min(100, Math.max(0, score)),
    weight: 15,
    grade: scoreToGrade(score),
    status: isBig4 ? 'GOLD STANDARD' : 'ADEQUATE',
    summary: `${frequency} reporting by ${auditor}. ${daysSince} days since last report.`,
    findings: [
      `Auditor: ${auditor} (${isBig4 ? 'Big Four' : 'mid-tier'})`,
      `Frequency: ${frequency}`,
      `Days since report: ${daysSince}`,
    ],
  };
}

function detectStablecoinRedFlags(data: StablecoinData, compliantPct: number, reserveRatio: number): RedFlag[] {
  const flags: RedFlag[] = [];

  if (compliantPct < 80) {
    flags.push({
      id: 'genius_non_compliant',
      severity: 'high',
      category: 'Compliance',
      title: 'GENIUS Act Non-Compliant',
      description: `${(100 - compliantPct).toFixed(1)}% of reserves in prohibited assets`,
    });
  }

  if (reserveRatio < 100) {
    flags.push({
      id: 'under_collateralized',
      severity: 'critical',
      category: 'Solvency',
      title: 'Under-Collateralized',
      description: `Reserve ratio is ${reserveRatio.toFixed(2)}% (below 100%)`,
    });
  }

  if (data.reserveComposition.bitcoin > 0) {
    flags.push({
      id: 'btc_exposure',
      severity: 'medium',
      category: 'Risk',
      title: 'Bitcoin Exposure',
      description: 'Holds Bitcoin as reserve asset - volatile',
    });
  }

  return flags;
}

// Tokenized Equities Framework
export interface TokenizedEquitiesData {
  totalAssets: number;
  totalLiabilities: number;
  tokensOutstanding: number;
  tokenMarketValue: number;
  verificationAgent: string;
  verificationFrequency: 'daily' | 'weekly' | 'monthly';
  lastVerificationDate: string;
  jurisdiction: string;
  isBankruptcyRemote: boolean;
  hasSecurityInterest: boolean;
  custodians: string[];
}

export function analyzeTokenizedEquities(data: TokenizedEquitiesData) {
  const collateralRatio = (data.totalAssets / data.totalLiabilities) * 100;
  const buffer = data.totalAssets - data.totalLiabilities;

  const dimensions = {
    collateralRatio: evaluateCollateralRatio(collateralRatio, buffer),
    perTokenVerification: evaluatePerTokenVerification(),
    reportingFreshness: evaluateReportingFreshness(data.verificationAgent, data.verificationFrequency, data.lastVerificationDate),
    bankruptcyProtection: evaluateBankruptcyProtection(data.jurisdiction, data.isBankruptcyRemote, data.hasSecurityInterest),
    custodyCounterparty: evaluateCustodyCounterparty(data.custodians),
  };

  const allDimensions = Object.values(dimensions);
  const trustScore = calculateTrustScore(allDimensions);
  const redFlags = detectEquitiesRedFlags(data, collateralRatio);
  const grade = calculateGrade(trustScore, redFlags);
  const status = getStatus(trustScore);

  return {
    trustScore: Math.round(trustScore),
    grade,
    status,
    overview: {
      totalAssets: data.totalAssets,
      totalLiabilities: data.totalLiabilities,
      netEquity: buffer,
      reserveRatio: Math.round(collateralRatio * 100) / 100,
    },
    dimensions,
    redFlags,
  };
}

function evaluateCollateralRatio(ratio: number, buffer: number): DimensionScore {
  let score = 0;
  if (ratio >= 110) score = 95;
  else if (ratio >= 105) score = 90;
  else if (ratio >= 100) score = 80;
  else score = 50;

  return {
    score,
    weight: 20,
    grade: scoreToGrade(score),
    status: ratio >= 100 ? 'OVER-COLLATERALIZED' : 'UNDER-COLLATERALIZED',
    summary: `${ratio.toFixed(2)}% collateralized. $${formatNumber(buffer)} buffer.`,
    findings: [
      `Collateral ratio: ${ratio.toFixed(2)}%`,
      `Buffer: $${formatNumber(buffer)}`,
    ],
  };
}

function evaluatePerTokenVerification(): DimensionScore {
  // Most tokenized equities don't have public per-token verification
  return {
    score: 70,
    weight: 25,
    grade: 'B-',
    status: 'AGGREGATE VERIFIED',
    summary: 'Total assets verified. Per-token matching not public.',
    findings: [
      'Aggregate totals publicly verified',
      'Individual holdings not publicly disclosed',
    ],
  };
}

function evaluateReportingFreshness(agent: string, frequency: string, lastDate: string): DimensionScore {
  const daysSince = Math.floor((Date.now() - new Date(lastDate).getTime()) / (1000 * 60 * 60 * 24));

  let score = 90;
  if (frequency === 'daily') score = 95;
  else if (frequency === 'weekly') score = 85;
  else if (frequency === 'monthly') score = 70;

  if (daysSince > 7) score -= 10;
  if (daysSince > 30) score -= 20;

  return {
    score: Math.max(0, score),
    weight: 20,
    grade: scoreToGrade(score),
    status: frequency === 'daily' ? 'REAL-TIME' : 'PERIODIC',
    summary: `${frequency} verification by ${agent}. ${daysSince} days since last report.`,
    findings: [
      `Verification agent: ${agent}`,
      `Frequency: ${frequency}`,
      `Days since report: ${daysSince}`,
    ],
  };
}

function evaluateBankruptcyProtection(jurisdiction: string, isBankruptcyRemote: boolean, hasSecurityInterest: boolean): DimensionScore {
  let score = 60;
  if (isBankruptcyRemote) score += 20;
  if (hasSecurityInterest) score += 15;
  if (jurisdiction === 'USA') score += 10;

  return {
    score: Math.min(100, score),
    weight: 20,
    grade: scoreToGrade(score),
    status: isBankruptcyRemote ? 'PROTECTED' : 'MODERATE',
    summary: `${isBankruptcyRemote ? 'Bankruptcy-remote SPV.' : ''} ${jurisdiction} jurisdiction.`,
    findings: [
      `Jurisdiction: ${jurisdiction}`,
      `Bankruptcy remote: ${isBankruptcyRemote ? 'Yes' : 'No'}`,
      `Security interest: ${hasSecurityInterest ? 'Yes' : 'No'}`,
    ],
  };
}

function evaluateCustodyCounterparty(custodians: string[]): DimensionScore {
  const regulatedCustodians = ['Alpaca', 'BitGo', 'Coinbase', 'Fireblocks'];
  const hasRegulated = custodians.some(c => regulatedCustodians.some(r => c.includes(r)));

  return {
    score: hasRegulated ? 90 : 70,
    weight: 15,
    grade: hasRegulated ? 'A-' : 'B',
    status: hasRegulated ? 'INSTITUTIONAL' : 'MIXED',
    summary: `Custodians: ${custodians.join(', ')}`,
    findings: custodians.map(c => `Custodian: ${c}`),
  };
}

function detectEquitiesRedFlags(data: TokenizedEquitiesData, ratio: number): RedFlag[] {
  const flags: RedFlag[] = [];

  if (ratio < 100) {
    flags.push({
      id: 'under_collateralized',
      severity: 'critical',
      category: 'Solvency',
      title: 'Under-Collateralized',
      description: `Collateral ratio is ${ratio.toFixed(2)}%`,
    });
  }

  if (!data.isBankruptcyRemote) {
    flags.push({
      id: 'no_spv',
      severity: 'medium',
      category: 'Structure',
      title: 'No Bankruptcy Protection',
      description: 'Assets not held in bankruptcy-remote structure',
    });
  }

  return flags;
}

// Utilities
function scoreToGrade(score: number): string {
  if (score >= 95) return 'A+';
  if (score >= 90) return 'A';
  if (score >= 85) return 'A-';
  if (score >= 80) return 'B+';
  if (score >= 75) return 'B';
  if (score >= 70) return 'B-';
  if (score >= 65) return 'C+';
  if (score >= 60) return 'C';
  if (score >= 50) return 'C-';
  if (score >= 40) return 'D';
  return 'F';
}

function formatNumber(num: number): string {
  if (num >= 1e12) return `${(num / 1e12).toFixed(2)}T`;
  if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`;
  if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
  return num.toLocaleString();
}
