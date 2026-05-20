import { NextRequest, NextResponse } from 'next/server';
import { saveAnalysis, getLatestAnalysis, updateProjectLastAnalysis } from '@/lib/supabase';
import { analyzeStablecoin, analyzeTokenizedEquities, StablecoinData, TokenizedEquitiesData } from '@/lib/analyzer';
import { sendTelegramAlert } from '@/lib/telegram';

// Vercel Cron authentication
const CRON_SECRET = process.env.CRON_SECRET;

export async function GET(request: NextRequest) {
  // Verify cron secret in production
  if (process.env.NODE_ENV === 'production') {
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  const searchParams = request.nextUrl.searchParams;
  const projectId = searchParams.get('project');

  if (!projectId) {
    return NextResponse.json({ error: 'Missing project parameter' }, { status: 400 });
  }

  console.log(`[CRON] Starting analysis for ${projectId}`);

  try {
    let result;
    const today = new Date().toISOString().split('T')[0];

    switch (projectId) {
      case 'tether-usdt':
        result = await analyzeTether();
        break;
      case 'circle-usdc':
        result = await analyzeCircle();
        break;
      case 'ondo-gm':
        result = await analyzeOndo();
        break;
      default:
        return NextResponse.json({ error: 'Unknown project' }, { status: 400 });
    }

    // Get previous analysis for comparison
    const previousAnalysis = await getLatestAnalysis(projectId);
    const gradeChanged = previousAnalysis && previousAnalysis.grade !== result.grade;

    // Save to Supabase
    await saveAnalysis({
      project_id: projectId,
      analysis_date: today,
      report_date: result.reportDate,
      trust_score: result.trustScore,
      grade: result.grade,
      status: result.status,
      data: result,
    });

    // Update project's lastAnalysis
    await updateProjectLastAnalysis(projectId, today);

    console.log(`[CRON] Analysis complete for ${projectId}: ${result.grade} (${result.trustScore})`);

    // Send Telegram alerts if grade changed
    if (gradeChanged) {
      await sendTelegramAlert(projectId, {
        type: 'rating_change',
        oldGrade: previousAnalysis.grade,
        newGrade: result.grade,
        summary: `Trust score: ${result.trustScore}. ${result.redFlags.length} red flags.`,
      });
    }

    // Send new report alert
    await sendTelegramAlert(projectId, {
      type: 'new_report',
      grade: result.grade,
      reportDate: result.reportDate,
    });

    // Return result with change detection
    return NextResponse.json({
      success: true,
      projectId,
      analysisDate: today,
      trustScore: result.trustScore,
      grade: result.grade,
      status: result.status,
      gradeChanged,
      previousGrade: previousAnalysis?.grade || null,
      redFlagsCount: result.redFlags.length,
    });

  } catch (error) {
    console.error(`[CRON] Error analyzing ${projectId}:`, error);
    return NextResponse.json({
      error: 'Analysis failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

// Tether USDT Analysis
async function analyzeTether() {
  // Fetch data from Tether transparency page
  // In production, this would scrape/fetch from https://tether.to/en/transparency/
  const data: StablecoinData = await fetchTetherData();
  const result = analyzeStablecoin(data);

  return {
    ...result,
    projectId: 'tether-usdt',
    analysisDate: new Date().toISOString().split('T')[0],
    reportDate: data.reportDate,
    auditor: 'BDO Italia',
    auditorTier: 'mid-tier',
    auditStandard: 'ISAE 3000R',
    dataSource: 'https://tether.to/en/transparency/?tab=reports',
  };
}

async function fetchTetherData(): Promise<StablecoinData> {
  // Mock data based on latest Tether report
  // In production: fetch and parse from actual source
  return {
    totalAssets: 191767741495,
    totalLiabilities: 183535531717,
    reserveComposition: {
      treasuryBills: 117100000000,  // 61.04%
      overnightRepo: 19340000000,   // 10.08%
      termRepo: 4740000000,          // 2.47%
      cashDeposits: 115000000,       // 0.06%
      preciousMetals: 19800000000,  // 10.34% - PROHIBITED
      securedLoans: 15800000000,    // 8.25% - PROHIBITED
      bitcoin: 6600000000,           // 3.45% - PROHIBITED
      publicEquities: 3400000000,   // 1.78% - PROHIBITED
      otherInvestments: 4900000000, // 2.53% - PROHIBITED
    },
    auditor: 'BDO Italia',
    reportDate: '2026-03-31',
    reportingFrequency: 'quarterly',
    jurisdiction: 'El Salvador',
  };
}

// Circle USDC Analysis
async function analyzeCircle() {
  const data: StablecoinData = await fetchCircleData();
  const result = analyzeStablecoin(data);

  return {
    ...result,
    projectId: 'circle-usdc',
    analysisDate: new Date().toISOString().split('T')[0],
    reportDate: data.reportDate,
    auditor: 'Deloitte & Touche LLP',
    auditorTier: 'big4',
    auditStandard: 'AICPA Attestation',
    dataSource: 'https://www.circle.com/transparency',
  };
}

async function fetchCircleData(): Promise<StablecoinData> {
  // Mock data based on latest Circle report
  return {
    totalAssets: 77100000000,
    totalLiabilities: 76800000000,
    reserveComposition: {
      treasuryBills: 57825000000,    // 75%
      overnightRepo: 11565000000,    // 15%
      termRepo: 0,
      cashDeposits: 7710000000,       // 10% (SII + FDIC)
      preciousMetals: 0,
      securedLoans: 0,
      bitcoin: 0,
      publicEquities: 0,
      otherInvestments: 0,
    },
    auditor: 'Deloitte & Touche LLP',
    reportDate: '2026-05-18',
    reportingFrequency: 'weekly',
    jurisdiction: 'USA',
  };
}

// Ondo Global Markets Analysis
async function analyzeOndo() {
  const data: TokenizedEquitiesData = await fetchOndoData();
  const result = analyzeTokenizedEquities(data);

  return {
    ...result,
    projectId: 'ondo-gm',
    category: 'tokenized-equities',
    analysisDate: new Date().toISOString().split('T')[0],
    reportDate: data.lastVerificationDate,
    auditor: 'Ankura Trust Company, LLC',
    auditorTier: 'independent-trust',
    auditStandard: 'Daily Attestation',
    dataSource: 'https://app.ondo.finance',
  };
}

async function fetchOndoData(): Promise<TokenizedEquitiesData> {
  // Mock data based on latest Ondo attestation
  return {
    totalAssets: 1148750666.88,
    totalLiabilities: 1036334649.61,
    tokensOutstanding: 8015980.93,
    tokenMarketValue: 998043765.97,
    verificationAgent: 'Ankura Trust Company, LLC',
    verificationFrequency: 'daily',
    lastVerificationDate: new Date().toISOString().split('T')[0],
    jurisdiction: 'British Virgin Islands',
    isBankruptcyRemote: true,
    hasSecurityInterest: true,
    custodians: ['Alpaca Securities LLC', 'BitGo'],
  };
}

// Allow manual trigger via POST (for testing)
export async function POST(request: NextRequest) {
  return GET(request);
}
