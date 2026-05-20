import { Project, Analysis, ProjectWithAnalysis, formatMarketCap } from '@/lib/types';
import projectsData from '@/data/projects.json';
import fs from 'fs';
import path from 'path';
import Link from 'next/link';
import Image from 'next/image';
import { getOndoTokens, getDisplayTokens } from '@/lib/ondo';

async function getProjectsWithAnalyses(): Promise<ProjectWithAnalysis[]> {
  const projects = projectsData as Project[];

  const projectsWithAnalyses = projects.map((project) => {
    const analysisDir = path.join(process.cwd(), 'data', 'analyses');
    const analysisFile = `${project.id}-${project.lastAnalysis}.json`;
    const analysisPath = path.join(analysisDir, analysisFile);

    let analysis: Analysis | null = null;
    try {
      const analysisContent = fs.readFileSync(analysisPath, 'utf-8');
      analysis = JSON.parse(analysisContent) as Analysis;
    } catch {
      // Analysis file not found
    }

    return { ...project, analysis };
  });

  return projectsWithAnalyses;
}

export default async function Home() {
  const projects = await getProjectsWithAnalyses();
  const ondoTokens = await getOndoTokens();
  const displayTokens = getDisplayTokens(ondoTokens, 4);

  const totalMarketCap = projects.reduce((sum, p) => sum + p.marketCap, 0);
  // Token count: USDT (1) + USDC (1) + Ondo GM tokens
  const tokenCount = 2 + ondoTokens.length;

  return (
    <div>
      {/* Hero Section - VP Left, Assets Right */}
      <section className="min-h-[calc(100vh-48px)] flex items-center">
        <div className="max-w-[1200px] mx-auto px-6 w-full">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left: Value Proposition */}
            <div>
              <h1 className="text-[48px] sm:text-[64px] font-semibold text-text-primary tracking-tight leading-[1.05]">
                Trust Layer for
              </h1>
              <h1 className="text-[48px] sm:text-[64px] font-semibold text-text-primary tracking-tight leading-[1.05]">
                <span className="bg-gradient-to-r from-[#0071E3] to-[#34C759] bg-clip-text text-transparent">Real World Assets</span>
              </h1>
              <p className="mt-6 text-[19px] text-text-secondary leading-relaxed max-w-[480px]">
                Building the universal trust layer for Real World Assets — accessible to everyone.
              </p>

              {/* Stats Row */}
              <div className="flex gap-10 mt-10">
                <div>
                  <p className="text-[36px] font-black text-text-primary tracking-tight">{formatMarketCap(totalMarketCap)}</p>
                  <p className="text-text-secondary text-sm mt-1">Assets Under Monitor</p>
                </div>
                <div>
                  <p className="text-[36px] font-black text-text-primary tracking-tight">{tokenCount}</p>
                  <p className="text-text-secondary text-sm mt-1">Tokens Tracking</p>
                </div>
                <div>
                  <p className="text-[36px] font-black text-text-primary tracking-tight">227</p>
                  <p className="text-text-secondary text-sm mt-1">Reports Analyzed</p>
                </div>
              </div>

              {/* Telegram CTA */}
              <div className="mt-10">
                <a
                  href="https://t.me/rwa_nda_bot"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-3 px-6 py-3.5 bg-[#0088cc] text-white font-semibold rounded-full hover:bg-[#0077b5] transition-colors"
                >
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .37z"/>
                  </svg>
                  Get Alerts on Telegram
                </a>
                <p className="text-text-tertiary text-sm mt-3">Get notified on new reports & rating changes</p>
              </div>
            </div>

            {/* Right: Assets List by Category */}
            <div className="space-y-6">
              {/* Stablecoins */}
              <div>
                <h3 className="text-sm font-semibold text-text-tertiary uppercase tracking-wide mb-3">Stablecoins</h3>
                <div className="space-y-3">
                  {projects.filter(p => p.type === 'stablecoin').map((project) => (
                    <Link
                      key={project.id}
                      href={`/project/${project.id}`}
                      className="card p-4 block hover:scale-[1.01] transition-transform duration-300"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <Image
                            src={project.logoUrl}
                            alt={project.name}
                            width={44}
                            height={44}
                            className="rounded-full"
                          />
                          <div>
                            <p className="font-semibold text-text-primary">{project.name}</p>
                            <p className="text-text-secondary text-sm">{project.token}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-6">
                          {project.analysis && (
                            <p className="text-[28px] font-black tracking-tight" style={{
                              color: project.analysis.grade.startsWith('A') || project.analysis.grade.startsWith('B') ? '#34C759' :
                                     project.analysis.grade.startsWith('C') ? '#FF9500' : '#FF3B30'
                            }}>
                              {project.analysis.grade}
                            </p>
                          )}
                          <div className="text-right">
                            <p className="text-text-primary font-medium">{formatMarketCap(project.marketCap)}</p>
                            <p className="text-text-tertiary text-xs">Market Cap</p>
                          </div>
                          <svg className="w-5 h-5 text-text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Tokenized Equities */}
              <div>
                <h3 className="text-sm font-semibold text-text-tertiary uppercase tracking-wide mb-3">Tokenized Equities</h3>
                <div className="space-y-3">
                  {projects.filter(p => p.type === 'ondo-gm').map((project) => (
                    <Link
                      key={project.id}
                      href={`/project/${project.id}`}
                      className="card p-4 block hover:scale-[1.01] transition-transform duration-300"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <Image
                            src={project.logoUrl}
                            alt={project.name}
                            width={44}
                            height={44}
                            className="rounded-full"
                          />
                          <div>
                            <p className="font-semibold text-text-primary">{project.name}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <div className="flex -space-x-2">
                                {displayTokens.map((token, idx) => (
                                  <Image
                                    key={token.symbol}
                                    src={token.logoURI}
                                    alt={token.symbol}
                                    width={20}
                                    height={20}
                                    className="rounded-full border-2 border-white"
                                    style={{ zIndex: displayTokens.length - idx }}
                                  />
                                ))}
                              </div>
                              <span className="text-text-secondary text-xs">
                                +{ondoTokens.length - 4} more
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-6">
                          {project.analysis && (
                            <p className="text-[28px] font-black tracking-tight" style={{
                              color: project.analysis.grade.startsWith('A') || project.analysis.grade.startsWith('B') ? '#34C759' :
                                     project.analysis.grade.startsWith('C') ? '#FF9500' : '#FF3B30'
                            }}>
                              {project.analysis.grade}
                            </p>
                          )}
                          <div className="text-right">
                            <p className="text-text-primary font-medium">{formatMarketCap(project.marketCap)}</p>
                            <p className="text-text-tertiary text-xs">Market Cap</p>
                          </div>
                          <svg className="w-5 h-5 text-text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Skeleton */}
              <div className="card p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gray-200 animate-pulse"></div>
                    <div>
                      <div className="h-5 w-28 bg-gray-200 rounded animate-pulse"></div>
                      <div className="h-4 w-16 bg-gray-100 rounded mt-2 animate-pulse"></div>
                    </div>
                  </div>
                  <div className="flex items-center gap-8">
                    <div className="h-8 w-10 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-5 w-16 bg-gray-100 rounded animate-pulse"></div>
                  </div>
                </div>
              </div>
              <p className="text-center text-text-tertiary text-sm">More projects on the way</p>
            </div>
          </div>
        </div>
      </section>

      {/* Methodology Section */}
      <section className="py-24 border-t border-gray-200">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="text-center mb-16">
            <p className="text-[#0071E3] font-semibold text-sm uppercase tracking-wide mb-3">Our Methodology</p>
            <h2 className="text-[40px] font-semibold text-text-primary tracking-tight">
              The New Standard for RWA Trust
            </h2>
            <p className="mt-4 text-text-secondary text-lg max-w-[640px] mx-auto">
              Category-specific frameworks designed to evaluate what actually matters for each asset type.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Stablecoin Framework */}
            <div className="card p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="flex -space-x-2">
                  <Image src="/logos/usdt.png" alt="USDT" width={40} height={40} className="rounded-full border-2 border-white" />
                  <Image src="/logos/usdc.png" alt="USDC" width={40} height={40} className="rounded-full border-2 border-white" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-text-primary">Stablecoins</h3>
                  <p className="text-text-secondary text-sm">USDT, USDC, and fiat-backed tokens</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded bg-[#34C759]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-[#34C759] text-xs font-bold">1</span>
                  </div>
                  <div>
                    <p className="font-medium text-text-primary">GENIUS Act Compliance</p>
                    <p className="text-text-secondary text-sm">Permitted vs prohibited reserve assets under US law</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded bg-[#34C759]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-[#34C759] text-xs font-bold">2</span>
                  </div>
                  <div>
                    <p className="font-medium text-text-primary">Reserve Adequacy</p>
                    <p className="text-text-secondary text-sm">Total backing ratio and equity buffer</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded bg-[#34C759]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-[#34C759] text-xs font-bold">3</span>
                  </div>
                  <div>
                    <p className="font-medium text-text-primary">Reserve Composition</p>
                    <p className="text-text-secondary text-sm">Quality and liquidity of underlying assets</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded bg-[#34C759]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-[#34C759] text-xs font-bold">4</span>
                  </div>
                  <div>
                    <p className="font-medium text-text-primary">Custody & Jurisdiction</p>
                    <p className="text-text-secondary text-sm">Legal protections and regulatory oversight</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded bg-[#34C759]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-[#34C759] text-xs font-bold">5</span>
                  </div>
                  <div>
                    <p className="font-medium text-text-primary">Reporting & Audit</p>
                    <p className="text-text-secondary text-sm">Frequency, auditor tier, and data freshness</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Tokenized Equities Framework */}
            <div className="card p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="flex -space-x-2">
                  {displayTokens.slice(0, 3).map((token, idx) => (
                    <Image
                      key={token.symbol}
                      src={token.logoURI}
                      alt={token.symbol}
                      width={40}
                      height={40}
                      className="rounded-full border-2 border-white"
                      style={{ zIndex: 3 - idx }}
                    />
                  ))}
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-text-primary">Tokenized Equities</h3>
                  <p className="text-text-secondary text-sm">Stocks, ETFs, and securities on-chain</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded bg-[#FF9500]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-[#FF9500] text-xs font-bold">1</span>
                  </div>
                  <div>
                    <p className="font-medium text-text-primary">Collateral Ratio</p>
                    <p className="text-text-secondary text-sm">Total backing percentage and buffer amount</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded bg-[#FF9500]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-[#FF9500] text-xs font-bold">2</span>
                  </div>
                  <div>
                    <p className="font-medium text-text-primary">Per-Token Verification</p>
                    <p className="text-text-secondary text-sm">Can each token be matched to actual shares?</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded bg-[#FF9500]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-[#FF9500] text-xs font-bold">3</span>
                  </div>
                  <div>
                    <p className="font-medium text-text-primary">Reporting Freshness</p>
                    <p className="text-text-secondary text-sm">How often are holdings independently verified?</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded bg-[#FF9500]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-[#FF9500] text-xs font-bold">4</span>
                  </div>
                  <div>
                    <p className="font-medium text-text-primary">Bankruptcy Protection</p>
                    <p className="text-text-secondary text-sm">What happens to assets if issuer fails?</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded bg-[#FF9500]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-[#FF9500] text-xs font-bold">5</span>
                  </div>
                  <div>
                    <p className="font-medium text-text-primary">Custody & Counterparty</p>
                    <p className="text-text-secondary text-sm">Who holds the stocks? Are they regulated?</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Trust Statement */}
          <div className="mt-12 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gray-100">
              <svg className="w-4 h-4 text-[#34C759]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span className="text-text-secondary text-sm">Every analysis is recorded on-chain for permanent, tamper-proof transparency</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
