import TelegramBot from 'node-telegram-bot-api';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
if (!TOKEN) {
  console.error('TELEGRAM_BOT_TOKEN is not set in .env file');
  process.exit(1);
}

const bot = new TelegramBot(TOKEN, { polling: true });

// Project metadata
const PROJECTS = {
  'tether-usdt': { name: 'Tether', token: 'USDT', type: 'Stablecoin' },
  'circle-usdc': { name: 'Circle', token: 'USDC', type: 'Stablecoin' },
  'ondo-gm': { name: 'Ondo Global Markets', token: 'GM Tokens', type: 'Tokenized Equities' }
};

// Subscriptions storage
const SUBS_FILE = path.join(__dirname, 'subscriptions.json');

// Analysis data path
const DATA_DIR = path.join(__dirname, '..', 'data');
const PROJECTS_FILE = path.join(DATA_DIR, 'projects.json');

// Load latest analysis for a project
function getLatestAnalysis(projectId) {
  try {
    const projectsData = JSON.parse(fs.readFileSync(PROJECTS_FILE, 'utf-8'));
    const project = projectsData.find(p => p.id === projectId);
    if (!project) return null;

    const analysisFile = path.join(DATA_DIR, 'analyses', `${projectId}-${project.lastAnalysis}.json`);
    if (fs.existsSync(analysisFile)) {
      return JSON.parse(fs.readFileSync(analysisFile, 'utf-8'));
    }
  } catch (err) {
    console.error('Error loading analysis:', err);
  }
  return null;
}

// Format large numbers
function formatNumber(num) {
  if (num >= 1e12) return `$${(num / 1e12).toFixed(2)}T`;
  if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
  if (num >= 1e6) return `$${(num / 1e6).toFixed(1)}M`;
  return `$${num.toLocaleString()}`;
}

// Grade emoji mapping
const GRADE_EMOJI = {
  'A+': '🟢', 'A': '🟢', 'A-': '🟢',
  'B+': '🟢', 'B': '🟢', 'B-': '🟢',
  'C+': '🟠', 'C': '🟠', 'C-': '🟠',
  'D': '🔴', 'F': '🔴'
};

// Send latest report to user
async function sendLatestReport(chatId, projectId) {
  const project = PROJECTS[projectId];
  const analysis = getLatestAnalysis(projectId);

  if (!analysis) {
    return;
  }

  const emoji = GRADE_EMOJI[analysis.grade] || '⚪';

  let message = `📊 *Latest Report: ${project.name}*\n\n`;
  message += `${emoji} *Grade: ${analysis.grade}*\n`;
  message += `Reserve Ratio: ${analysis.overview.reserveRatio}%\n`;
  message += `Total Assets: ${formatNumber(analysis.overview.totalAssets)}\n`;
  message += `Report Date: ${analysis.reportDate}\n`;
  message += `Auditor: ${analysis.auditor}\n\n`;

  // Add key findings based on project type
  if (analysis.dimensions.geniusAct) {
    // Stablecoin
    message += `*Key Metrics:*\n`;
    message += `• GENIUS Act: ${analysis.dimensions.geniusAct.compliantPct}% compliant\n`;
    message += `• Reserve: ${analysis.dimensions.reserveAdequacy.status}\n`;
    message += `• Composition: ${analysis.dimensions.reserveComposition.status}\n`;
  } else if (analysis.dimensions.collateralRatio) {
    // Tokenized Equities
    message += `*Key Metrics:*\n`;
    message += `• Collateral: ${analysis.dimensions.collateralRatio.ratio}%\n`;
    message += `• Verification: ${analysis.dimensions.perTokenVerification.status}\n`;
    message += `• Reporting: ${analysis.dimensions.reportingFreshness.frequency}\n`;
  }

  // Red flags count
  if (analysis.redFlags && analysis.redFlags.length > 0) {
    message += `\n⚠️ ${analysis.redFlags.length} red flag(s) detected\n`;
  }

  message += `\n[View Full Analysis](https://rwa-nda.vercel.app/project/${projectId})`;

  await bot.sendMessage(chatId, message, {
    parse_mode: 'Markdown',
    disable_web_page_preview: true
  });
}

function loadSubscriptions() {
  try {
    if (fs.existsSync(SUBS_FILE)) {
      return JSON.parse(fs.readFileSync(SUBS_FILE, 'utf-8'));
    }
  } catch (err) {
    console.error('Error loading subscriptions:', err);
  }
  return { users: {}, projects: {} };
}

function saveSubscriptions(subs) {
  fs.writeFileSync(SUBS_FILE, JSON.stringify(subs, null, 2));
}

let subscriptions = loadSubscriptions();

// /start command - with optional project parameter
bot.onText(/\/start(?:\s+(.+))?/, (msg, match) => {
  const chatId = msg.chat.id;
  const projectId = match[1];

  if (projectId && PROJECTS[projectId]) {
    // Subscribe to specific project
    subscribeUser(chatId, projectId);
    const project = PROJECTS[projectId];

    bot.sendMessage(chatId,
      `*Subscribed to ${project.name} (${project.token})*\n\n` +
      `You'll receive alerts when:\n` +
      `- Trust rating changes\n` +
      `- New analysis report is published\n` +
      `- Red flags are detected\n\n` +
      `Use /status to check your subscriptions.`,
      { parse_mode: 'Markdown' }
    );

    // Send latest report immediately
    setTimeout(() => sendLatestReport(chatId, projectId), 500);
  } else {
    // Welcome message
    bot.sendMessage(chatId,
      `*Welcome to RWA-NDA Alert Bot*\n\n` +
      `Get instant notifications for Real World Asset trust ratings.\n\n` +
      `*Available Projects:*\n` +
      Object.entries(PROJECTS).map(([id, p]) =>
        `- ${p.name} (${p.token}) - ${p.type}`
      ).join('\n') +
      `\n\n*Commands:*\n` +
      `/subscribe - Subscribe to project alerts\n` +
      `/unsubscribe - Unsubscribe from alerts\n` +
      `/status - View your subscriptions\n` +
      `/list - List all monitored projects`,
      { parse_mode: 'Markdown' }
    );
  }
});

// /subscribe command
bot.onText(/\/subscribe/, (msg) => {
  const chatId = msg.chat.id;

  const keyboard = Object.entries(PROJECTS).map(([id, p]) => [{
    text: `${p.name} (${p.token})`,
    callback_data: `sub_${id}`
  }]);

  bot.sendMessage(chatId, '*Select a project to subscribe:*', {
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: keyboard
    }
  });
});

// /unsubscribe command
bot.onText(/\/unsubscribe/, (msg) => {
  const chatId = msg.chat.id;
  const userSubs = subscriptions.users[chatId] || [];

  if (userSubs.length === 0) {
    bot.sendMessage(chatId, 'You have no active subscriptions.');
    return;
  }

  const keyboard = userSubs.map(id => [{
    text: `${PROJECTS[id]?.name || id}`,
    callback_data: `unsub_${id}`
  }]);

  bot.sendMessage(chatId, '*Select a project to unsubscribe:*', {
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: keyboard
    }
  });
});

// /status command
bot.onText(/\/status/, (msg) => {
  const chatId = msg.chat.id;
  const userSubs = subscriptions.users[chatId] || [];

  if (userSubs.length === 0) {
    bot.sendMessage(chatId,
      '*No active subscriptions*\n\nUse /subscribe to get alerts.',
      { parse_mode: 'Markdown' }
    );
    return;
  }

  const subList = userSubs.map(id => {
    const p = PROJECTS[id];
    return p ? `- ${p.name} (${p.token})` : `- ${id}`;
  }).join('\n');

  bot.sendMessage(chatId,
    `*Your Subscriptions (${userSubs.length})*\n\n${subList}`,
    { parse_mode: 'Markdown' }
  );
});

// /list command
bot.onText(/\/list/, (msg) => {
  const chatId = msg.chat.id;

  const projectList = Object.entries(PROJECTS).map(([id, p]) => {
    const subCount = subscriptions.projects[id]?.length || 0;
    return `*${p.name}* (${p.token})\n   Type: ${p.type}\n   Subscribers: ${subCount}`;
  }).join('\n\n');

  bot.sendMessage(chatId,
    `*Monitored Projects*\n\n${projectList}`,
    { parse_mode: 'Markdown' }
  );
});

// Handle callback queries (button clicks)
bot.on('callback_query', (query) => {
  const chatId = query.message.chat.id;
  const data = query.data;

  if (data.startsWith('sub_')) {
    const projectId = data.replace('sub_', '');
    subscribeUser(chatId, projectId);
    const project = PROJECTS[projectId];

    bot.answerCallbackQuery(query.id, { text: `Subscribed to ${project.name}` });
    bot.editMessageText(
      `*Subscribed to ${project.name}*\n\nYou'll receive alerts for rating changes and new reports.`,
      { chat_id: chatId, message_id: query.message.message_id, parse_mode: 'Markdown' }
    );

    // Send latest report immediately
    setTimeout(() => sendLatestReport(chatId, projectId), 500);
  }

  if (data.startsWith('unsub_')) {
    const projectId = data.replace('unsub_', '');
    unsubscribeUser(chatId, projectId);
    const project = PROJECTS[projectId];

    bot.answerCallbackQuery(query.id, { text: `Unsubscribed from ${project?.name || projectId}` });
    bot.editMessageText(
      `*Unsubscribed from ${project?.name || projectId}*`,
      { chat_id: chatId, message_id: query.message.message_id, parse_mode: 'Markdown' }
    );
  }
});

// Helper functions
function subscribeUser(chatId, projectId) {
  // Add to user's subscriptions
  if (!subscriptions.users[chatId]) {
    subscriptions.users[chatId] = [];
  }
  if (!subscriptions.users[chatId].includes(projectId)) {
    subscriptions.users[chatId].push(projectId);
  }

  // Add to project's subscribers
  if (!subscriptions.projects[projectId]) {
    subscriptions.projects[projectId] = [];
  }
  if (!subscriptions.projects[projectId].includes(chatId)) {
    subscriptions.projects[projectId].push(chatId);
  }

  saveSubscriptions(subscriptions);
}

function unsubscribeUser(chatId, projectId) {
  // Remove from user's subscriptions
  if (subscriptions.users[chatId]) {
    subscriptions.users[chatId] = subscriptions.users[chatId].filter(id => id !== projectId);
  }

  // Remove from project's subscribers
  if (subscriptions.projects[projectId]) {
    subscriptions.projects[projectId] = subscriptions.projects[projectId].filter(id => id !== chatId);
  }

  saveSubscriptions(subscriptions);
}

// Export function to send alerts (can be called from external scripts)
export async function sendAlert(projectId, alert) {
  const subscribers = subscriptions.projects[projectId] || [];
  const project = PROJECTS[projectId];

  if (subscribers.length === 0) {
    console.log(`No subscribers for ${projectId}`);
    return;
  }

  let message = '';

  if (alert.type === 'rating_change') {
    const oldEmoji = GRADE_EMOJI[alert.oldGrade] || '⚪';
    const newEmoji = GRADE_EMOJI[alert.newGrade] || '⚪';

    message = `*Rating Change Alert*\n\n` +
      `*${project.name}* (${project.token})\n\n` +
      `${oldEmoji} ${alert.oldGrade} → ${newEmoji} ${alert.newGrade}\n\n` +
      `${alert.summary}\n\n` +
      `[View Full Analysis](https://rwa-nda.vercel.app/project/${projectId})`;
  } else if (alert.type === 'new_report') {
    message = `*New Report Available*\n\n` +
      `*${project.name}* (${project.token})\n\n` +
      `Grade: ${GRADE_EMOJI[alert.grade] || '⚪'} ${alert.grade}\n` +
      `Report Date: ${alert.reportDate}\n\n` +
      `[View Analysis](https://rwa-nda.vercel.app/project/${projectId})`;
  } else if (alert.type === 'red_flag') {
    message = `*Red Flag Detected*\n\n` +
      `*${project.name}* (${project.token})\n\n` +
      `⚠️ ${alert.title}\n` +
      `${alert.description}\n\n` +
      `[View Details](https://rwa-nda.vercel.app/project/${projectId})`;
  }

  // Send to all subscribers
  for (const chatId of subscribers) {
    try {
      await bot.sendMessage(chatId, message, {
        parse_mode: 'Markdown',
        disable_web_page_preview: true
      });
    } catch (err) {
      console.error(`Failed to send to ${chatId}:`, err.message);
    }
  }

  console.log(`Alert sent to ${subscribers.length} subscribers for ${projectId}`);
}

console.log('RWA-NDA Alert Bot is running...');
