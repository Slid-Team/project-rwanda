import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_API = `https://api.telegram.org/bot${BOT_TOKEN}`;

// Project metadata
const PROJECTS: Record<string, { id: string; name: string; token: string; type: string }> = {
  'tether-usdt': { id: 'tether-usdt', name: 'Tether', token: 'USDT', type: 'Stablecoin' },
  'circle-usdc': { id: 'circle-usdc', name: 'Circle', token: 'USDC', type: 'Stablecoin' },
  'ondo-gm': { id: 'ondo-gm', name: 'Ondo Global Markets', token: 'GM Tokens', type: 'Tokenized Equities' },
};

const GRADE_EMOJI: Record<string, string> = {
  'A+': '🟢', 'A': '🟢', 'A-': '🟢',
  'B+': '🟢', 'B': '🟢', 'B-': '🟢',
  'C+': '🟠', 'C': '🟠', 'C-': '🟠',
  'D': '🔴', 'F': '🔴',
};

interface TelegramUpdate {
  message?: {
    chat: { id: number };
    text?: string;
    from?: { first_name?: string };
  };
  callback_query?: {
    id: string;
    from: { id: number };
    message: { chat: { id: number } };
    data: string;
  };
}

// In-memory subscriptions (for demo - use Supabase in production)
let subscriptions: { users: Record<string, string[]>; projects: Record<string, number[]> } = {
  users: {},
  projects: {}
};

export async function POST(request: NextRequest) {
  if (!BOT_TOKEN) {
    return NextResponse.json({ error: 'Bot token not configured' }, { status: 500 });
  }

  try {
    const update: TelegramUpdate = await request.json();

    // Handle callback queries (button presses)
    if (update.callback_query) {
      await handleCallbackQuery(update.callback_query);
      return NextResponse.json({ ok: true });
    }

    // Handle messages
    if (update.message?.text) {
      const chatId = update.message.chat.id;
      const text = update.message.text;
      const firstName = update.message.from?.first_name || 'there';

      if (text === '/start') {
        await handleStart(chatId, firstName);
      } else if (text === '/subscribe') {
        await handleSubscribe(chatId);
      } else if (text.startsWith('/subscribe ')) {
        const projectId = text.replace('/subscribe ', '').trim();
        await subscribeToProject(chatId, projectId);
      } else if (text === '/unsubscribe') {
        await handleUnsubscribe(chatId);
      } else if (text.startsWith('/unsubscribe ')) {
        const projectId = text.replace('/unsubscribe ', '').trim();
        await unsubscribeFromProject(chatId, projectId);
      } else if (text === '/status') {
        await handleStatus(chatId);
      } else if (text === '/list') {
        await handleList(chatId);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[TELEGRAM WEBHOOK] Error:', error);
    return NextResponse.json({ ok: true }); // Always return 200 to Telegram
  }
}

async function sendMessage(chatId: number, text: string, options: Record<string, unknown> = {}) {
  await fetch(`${TELEGRAM_API}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: 'Markdown',
      disable_web_page_preview: true,
      ...options,
    }),
  });
}

async function answerCallbackQuery(callbackQueryId: string, text?: string) {
  await fetch(`${TELEGRAM_API}/answerCallbackQuery`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      callback_query_id: callbackQueryId,
      text,
    }),
  });
}

async function handleStart(chatId: number, firstName: string) {
  const message = `*Welcome to RWA-NDA Alert Bot* 👋

Hi ${firstName}! Get instant notifications for Real World Asset trust ratings.

*Available Projects:*
- Tether (USDT) - Stablecoin
- Circle (USDC) - Stablecoin
- Ondo Global Markets (GM Tokens) - Tokenized Equities

*Commands:*
/subscribe - Subscribe to project alerts
/unsubscribe - Unsubscribe from alerts
/status - View your subscriptions
/list - List all monitored projects`;

  await sendMessage(chatId, message);
}

async function handleSubscribe(chatId: number) {
  const keyboard = {
    inline_keyboard: Object.entries(PROJECTS).map(([id, project]) => ([
      { text: `${project.name} (${project.token})`, callback_data: `sub_${id}` }
    ]))
  };

  await sendMessage(chatId, '*Select a project to subscribe:*', { reply_markup: keyboard });
}

async function handleUnsubscribe(chatId: number) {
  const userSubs = subscriptions.users[chatId.toString()] || [];

  if (userSubs.length === 0) {
    await sendMessage(chatId, "You don't have any active subscriptions.");
    return;
  }

  const keyboard = {
    inline_keyboard: userSubs.map(projectId => {
      const project = PROJECTS[projectId];
      return [{ text: `❌ ${project?.name || projectId}`, callback_data: `unsub_${projectId}` }];
    })
  };

  await sendMessage(chatId, '*Select a project to unsubscribe:*', { reply_markup: keyboard });
}

async function handleStatus(chatId: number) {
  const userSubs = subscriptions.users[chatId.toString()] || [];

  if (userSubs.length === 0) {
    await sendMessage(chatId, "You don't have any active subscriptions.\n\nUse /subscribe to get started!");
    return;
  }

  let message = '*Your Subscriptions:*\n\n';
  for (const projectId of userSubs) {
    const project = PROJECTS[projectId];
    if (project) {
      message += `✅ ${project.name} (${project.token})\n`;
    }
  }

  await sendMessage(chatId, message);
}

async function handleList(chatId: number) {
  let message = '*Monitored Projects:*\n\n';

  for (const [id, project] of Object.entries(PROJECTS)) {
    const analysis = getLatestAnalysis(id);
    const grade = analysis?.grade || '—';
    const emoji = GRADE_EMOJI[grade] || '⚪';
    message += `${emoji} *${project.name}* (${project.token})\n`;
    message += `   Type: ${project.type}\n`;
    message += `   Grade: ${grade}\n\n`;
  }

  await sendMessage(chatId, message);
}

async function handleCallbackQuery(query: { id: string; from: { id: number }; message: { chat: { id: number } }; data: string }) {
  const chatId = query.message.chat.id;
  const data = query.data;

  if (data.startsWith('sub_')) {
    const projectId = data.replace('sub_', '');
    await subscribeToProject(chatId, projectId);
    await answerCallbackQuery(query.id, 'Subscribed!');
  } else if (data.startsWith('unsub_')) {
    const projectId = data.replace('unsub_', '');
    await unsubscribeFromProject(chatId, projectId);
    await answerCallbackQuery(query.id, 'Unsubscribed!');
  }
}

async function subscribeToProject(chatId: number, projectId: string) {
  const project = PROJECTS[projectId];
  if (!project) {
    await sendMessage(chatId, `Unknown project: ${projectId}`);
    return;
  }

  // Add to subscriptions
  const chatIdStr = chatId.toString();
  if (!subscriptions.users[chatIdStr]) {
    subscriptions.users[chatIdStr] = [];
  }
  if (!subscriptions.users[chatIdStr].includes(projectId)) {
    subscriptions.users[chatIdStr].push(projectId);
  }
  if (!subscriptions.projects[projectId]) {
    subscriptions.projects[projectId] = [];
  }
  if (!subscriptions.projects[projectId].includes(chatId)) {
    subscriptions.projects[projectId].push(chatId);
  }

  await sendMessage(chatId, `*Subscribed to ${project.name}*\n\nYou'll receive alerts for rating changes and new reports.`);

  // Send latest report
  await sendLatestReport(chatId, projectId);
}

async function unsubscribeFromProject(chatId: number, projectId: string) {
  const project = PROJECTS[projectId];
  const chatIdStr = chatId.toString();

  // Remove from subscriptions
  if (subscriptions.users[chatIdStr]) {
    subscriptions.users[chatIdStr] = subscriptions.users[chatIdStr].filter(id => id !== projectId);
  }
  if (subscriptions.projects[projectId]) {
    subscriptions.projects[projectId] = subscriptions.projects[projectId].filter(id => id !== chatId);
  }

  await sendMessage(chatId, `*Unsubscribed from ${project?.name || projectId}*\n\nYou will no longer receive alerts for this project.`);
}

async function sendLatestReport(chatId: number, projectId: string) {
  const project = PROJECTS[projectId];
  const analysis = getLatestAnalysis(projectId);

  if (!analysis || !project) {
    return;
  }

  const emoji = GRADE_EMOJI[analysis.grade] || '⚪';

  let message = `📊 *Latest Report: ${project.name}*\n\n`;
  message += `${emoji} Grade: ${analysis.grade}\n`;
  message += `Reserve Ratio: ${analysis.overview?.reserveRatio || 'N/A'}%\n`;
  message += `Total Assets: $${formatNumber(analysis.overview?.totalAssets)}\n`;
  message += `Report Date: ${analysis.reportDate}\n`;
  message += `Auditor: ${analysis.auditor}\n`;

  if (analysis.redFlags && analysis.redFlags.length > 0) {
    message += `\n⚠️ ${analysis.redFlags.length} red flag(s) detected\n`;
  }

  message += `\n[View Full Analysis](https://project-rwanda.vercel.app/project/${projectId})`;

  await sendMessage(chatId, message);
}

function getLatestAnalysis(projectId: string) {
  try {
    const analysesDir = path.join(process.cwd(), 'data', 'analyses');
    const files = fs.readdirSync(analysesDir)
      .filter(f => f.startsWith(projectId) && f.endsWith('.json'))
      .sort()
      .reverse();

    if (files.length === 0) return null;

    const content = fs.readFileSync(path.join(analysesDir, files[0]), 'utf-8');
    return JSON.parse(content);
  } catch {
    return null;
  }
}

function formatNumber(num: number | undefined): string {
  if (!num) return 'N/A';
  if (num >= 1e12) return (num / 1e12).toFixed(2) + 'T';
  if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
  if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
  return num.toLocaleString();
}

// GET endpoint to set webhook
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');

  if (action === 'setWebhook') {
    const webhookUrl = `https://project-rwanda.vercel.app/api/telegram/webhook`;
    const response = await fetch(`${TELEGRAM_API}/setWebhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: webhookUrl }),
    });
    const result = await response.json();
    return NextResponse.json(result);
  }

  if (action === 'deleteWebhook') {
    const response = await fetch(`${TELEGRAM_API}/deleteWebhook`);
    const result = await response.json();
    return NextResponse.json(result);
  }

  if (action === 'getWebhookInfo') {
    const response = await fetch(`${TELEGRAM_API}/getWebhookInfo`);
    const result = await response.json();
    return NextResponse.json(result);
  }

  return NextResponse.json({
    message: 'RWA-NDA Telegram Bot Webhook',
    actions: ['setWebhook', 'deleteWebhook', 'getWebhookInfo']
  });
}
