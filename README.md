# Project RWANDA

**Revealing What RWA Projects Won't Disclose**

> The AI-powered Trust Layer for Real World Assets -- bringing S&P-grade transparency to crypto's $323B stablecoin market and beyond.

[![Live Demo](https://img.shields.io/badge/Live-rwanda.vercel.app-blue)](https://rwanda.vercel.app)
[![Solidity](https://img.shields.io/badge/Solidity-0.8.20-363636)](contracts/RWANDARegistry.sol)
[![Next.js](https://img.shields.io/badge/Next.js-16-000000)](https://nextjs.org)

---

## The Problem

Stablecoins are crypto's first killer product -- $323B market cap, $46T annual volume (surpassing Visa + Mastercard combined). The US passed the GENIUS Act recognizing stablecoins as strategic dollar infrastructure.

But here's the dirty secret: **the trust foundation of every RWA token is an audit report that almost nobody reads.**

- The CFTC found Tether held adequate reserves for only **27.6% of a 26-month period** ($41M fine)
- It took Tether **10 years** to obtain a Big Four audit
- When retail investors notice a de-peg, the bank run is already underway -- institutions with dedicated analysts always move first

**RWA has an Oracle Problem**: the bridge between off-chain assets and on-chain tokens depends on audit reports that are complex, infrequent, and favor institutions over retail.

## The Solution

**RWANDA** is an autonomous AI Agent system that continuously monitors, analyzes, and grades RWA projects -- making institutional-grade due diligence accessible to everyone.

Think of it as **the S&P of Real World Assets**, but AI-native and on-chain.

### How It Works

```
Fetch --> Analyze --> Record --> Alert
```

1. **Fetch** -- AI Agent periodically crawls audit reports, attestations, and on-chain data from RWA issuers
2. **Analyze** -- Category-specific evaluation frameworks score each project across multiple dimensions
3. **Record** -- Results are written to an on-chain registry (Solidity smart contract) for immutability
4. **Alert** -- Dashboard updates in real-time; Telegram bot pushes instant notifications on grade changes

### Category-Specific Frameworks

Different RWA categories require fundamentally different evaluation criteria:

**Stablecoins** (USDT, USDC):
- GENIUS Act Compliance -- Does the reserve meet new US regulatory standards?
- Reserve Adequacy -- Total assets vs. total liabilities ratio
- Reserve Composition -- % in T-Bills vs. risky assets (crypto, precious metals, secured loans)
- Custody & Jurisdiction -- Where are assets held? Under what legal framework?
- Reporting & Audit Quality -- Big Four? ISAE 3000R? How frequently?

**Tokenized Equities** (Ondo GM):
- Collateral Ratio -- Per-token backing verification
- Verification Frequency -- Daily attestation vs. quarterly reports
- Bankruptcy Remoteness -- Is the SPV structure legally isolated?
- Custody & Counterparty -- Who holds the underlying securities?
- Reporting Freshness -- How stale is the latest verification?

Each dimension produces a weighted score, aggregated into a letter grade (A+ to F) that anyone can understand.

## What's Live Right Now

RWANDA is **deployed and functional**:

- **$270B+** in RWA assets monitored
- **267 tokens** tracked across stablecoin and tokenized equity categories
- **277 audit reports** analyzed
- **3 projects** with full analysis: Tether USDT (Grade C), Circle USDC (Grade A), Ondo GM (Grade B+)
- **Automated cron jobs** running on Vercel (daily/monthly/quarterly per project)
- **Telegram alert bot** for real-time grade change notifications
- **On-chain registry** smart contract for immutable trust records

## Architecture

```
rwa-nda/
+-- app/                    # Next.js 16 App Router
|   +-- page.tsx            # Dashboard -- project overview + trust scores
|   +-- project/[id]/       # Deep-dive analysis per project
|   +-- api/cron/analyze/   # Automated analysis pipeline (Vercel Cron)
+-- components/             # React components
|   +-- ProjectTable.tsx    # Main project listing with grades
|   +-- TrustScoreRadar.tsx # Radar chart (Chart.js) for dimensions
|   +-- ReserveComposition  # Reserve breakdown visualization
|   +-- RedFlagsList.tsx    # Severity-coded red flag display
|   +-- AlertCTA.tsx        # Telegram subscription CTA
+-- contracts/
|   +-- RWANDARegistry.sol  # On-chain trust score registry (Solidity 0.8.20)
+-- data/
|   +-- projects.json       # Project metadata
|   +-- analyses/           # Analysis results (JSON)
+-- lib/
|   +-- analyzer.ts         # Core analysis engine + grading logic
|   +-- types.ts            # TypeScript type definitions
|   +-- supabase.ts         # Database integration
|   +-- telegram.ts         # Telegram alert system
|   +-- ondo.ts             # Ondo token list fetcher
+-- telegram-bot/
|   +-- bot.js              # Telegram bot (subscribe/check/alerts)
|   +-- send-alert.js       # Push alert dispatcher
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16, React 19, Tailwind CSS 4 |
| AI Engine | Anthropic Claude API (analysis pipeline) |
| Database | Supabase (PostgreSQL) |
| On-Chain | Solidity 0.8.20 (trust record registry) |
| Automation | Vercel Cron Jobs |
| Alerts | Telegram Bot API |
| Charts | Chart.js + react-chartjs-2 |
| Deployment | Vercel |

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
git clone https://github.com/your-repo/rwa-nda.git
cd rwa-nda
npm install
```

### Environment Variables

Copy `.env.example` and fill in your keys:

```bash
cp .env.example .env
```

| Variable | Description |
|----------|------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key |
| `CRON_SECRET` | Secret for Vercel Cron authentication |
| `TELEGRAM_BOT_TOKEN` | Telegram bot token from @BotFather |

### Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the dashboard.

### Telegram Bot

```bash
cd telegram-bot
cp .env.example .env   # Add your TELEGRAM_BOT_TOKEN
npm install
npm start
```

Commands: `/start`, `/subscribe`, `/check <project>`, `/list`

### Cron Jobs (Production)

Automated analysis runs on Vercel Cron:

| Project | Schedule | Endpoint |
|---------|----------|----------|
| Ondo GM | Daily | `/api/cron/analyze?project=ondo-gm` |
| Circle USDC | Monthly | `/api/cron/analyze?project=circle-usdc` |
| Tether USDT | Quarterly | `/api/cron/analyze?project=tether-usdt` |

Schedules align with each project's actual reporting frequency.

## Vision

**Phase 1: Trust Layer** (Now) -- The first place retail investors check before trusting an RWA token.

**Phase 2: De Facto Standard** -- RWA projects seek RWANDA certification; exchanges require RWANDA grades for listing.

**Phase 3: RWA Infrastructure** -- S&P stopped at ratings. RWANDA leverages its trust layer to become the issuance infrastructure itself -- every RWA issued through RWANDA.

## AI Collaboration

This project was built during the SEABW 2026 "Play to Build" AI Hackathon (24-hour vibe coding challenge). The entire codebase -- from smart contracts to the analysis engine to the frontend -- was developed in collaboration with AI coding tools. Commit history reflects AI-assisted development throughout.

## License

MIT
