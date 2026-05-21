/**
 * Telegram Alert Integration
 * Sends alerts to subscribers via the RWA-NDA Telegram bot
 */

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_API = `https://api.telegram.org/bot${BOT_TOKEN}`;

// Project metadata
const PROJECTS: Record<string, { name: string; token: string }> = {
  'tether-usdt': { name: 'Tether', token: 'USDT' },
  'circle-usdc': { name: 'Circle', token: 'USDC' },
  'ondo-gm': { name: 'Ondo Global Markets', token: 'GM Tokens' },
};

const GRADE_EMOJI: Record<string, string> = {
  'A+': '🟢', 'A': '🟢', 'A-': '🟢',
  'B+': '🟢', 'B': '🟢', 'B-': '🟢',
  'C+': '🟠', 'C': '🟠', 'C-': '🟠',
  'D': '🔴', 'F': '🔴',
};

interface RatingChangeAlert {
  type: 'rating_change';
  oldGrade: string;
  newGrade: string;
  summary: string;
}

interface NewReportAlert {
  type: 'new_report';
  grade: string;
  reportDate: string;
}

interface RedFlagAlert {
  type: 'red_flag';
  title: string;
  description: string;
}

type AlertType = RatingChangeAlert | NewReportAlert | RedFlagAlert;

export async function sendTelegramAlert(projectId: string, alert: AlertType) {
  if (!BOT_TOKEN) {
    console.log('[TELEGRAM] Bot token not configured, skipping alert');
    return;
  }

  const project = PROJECTS[projectId];
  if (!project) {
    console.error(`[TELEGRAM] Unknown project: ${projectId}`);
    return;
  }

  // Get subscribers for this project
  const subscribers = await getProjectSubscribers(projectId);
  if (subscribers.length === 0) {
    console.log(`[TELEGRAM] No subscribers for ${projectId}`);
    return;
  }

  // Build message
  const message = buildAlertMessage(projectId, project, alert);

  // Send to all subscribers
  let successCount = 0;
  for (const chatId of subscribers) {
    try {
      await sendMessage(chatId, message);
      successCount++;
    } catch (err) {
      console.error(`[TELEGRAM] Failed to send to ${chatId}:`, err);
    }
  }

  console.log(`[TELEGRAM] Alert sent to ${successCount}/${subscribers.length} subscribers for ${projectId}`);
}

function buildAlertMessage(projectId: string, project: { name: string; token: string }, alert: AlertType): string {
  let message = '';

  if (alert.type === 'rating_change') {
    const oldEmoji = GRADE_EMOJI[alert.oldGrade] || '⚪';
    const newEmoji = GRADE_EMOJI[alert.newGrade] || '⚪';

    message = `*🔔 Rating Change Alert*\n\n` +
      `*${project.name}* (${project.token})\n\n` +
      `${oldEmoji} ${alert.oldGrade} → ${newEmoji} ${alert.newGrade}\n\n` +
      `${alert.summary}\n\n` +
      `[View Full Analysis](https://project-rwanda.vercel.app/project/${projectId})`;
  } else if (alert.type === 'new_report') {
    message = `*📊 New Analysis Report*\n\n` +
      `*${project.name}* (${project.token})\n\n` +
      `Grade: ${GRADE_EMOJI[alert.grade] || '⚪'} ${alert.grade}\n` +
      `Report Date: ${alert.reportDate}\n\n` +
      `[View Analysis](https://project-rwanda.vercel.app/project/${projectId})`;
  } else if (alert.type === 'red_flag') {
    message = `*⚠️ Red Flag Detected*\n\n` +
      `*${project.name}* (${project.token})\n\n` +
      `${alert.title}\n` +
      `${alert.description}\n\n` +
      `[View Details](https://project-rwanda.vercel.app/project/${projectId})`;
  }

  return message;
}

async function sendMessage(chatId: number | string, text: string) {
  const response = await fetch(`${TELEGRAM_API}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: 'Markdown',
      disable_web_page_preview: true,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Telegram API error: ${JSON.stringify(error)}`);
  }

  return response.json();
}

async function getProjectSubscribers(projectId: string): Promise<number[]> {
  // In production, fetch from Supabase
  // For now, read from local subscriptions file (via bot)

  try {
    // Option 1: Fetch from Supabase
    // const { data } = await supabase
    //   .from('subscriptions')
    //   .select('chat_id')
    //   .eq('project_id', projectId);
    // return data?.map(d => d.chat_id) || [];

    // Option 2: Read from local file (for demo)
    const fs = await import('fs');
    const path = await import('path');
    const subsPath = path.join(process.cwd(), 'telegram-bot', 'subscriptions.json');

    if (fs.existsSync(subsPath)) {
      const subs = JSON.parse(fs.readFileSync(subsPath, 'utf-8'));
      return subs.projects[projectId] || [];
    }
  } catch (err) {
    console.error('[TELEGRAM] Error reading subscribers:', err);
  }

  return [];
}
