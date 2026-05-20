#!/usr/bin/env node
/**
 * Send alerts to subscribers
 *
 * Usage:
 *   node send-alert.js rating_change tether-usdt C B+ "Improved transparency reporting"
 *   node send-alert.js new_report circle-usdc A 2026-05-20
 *   node send-alert.js red_flag tether-usdt "50-Day Data Gap" "Quarterly reporting creates significant data staleness"
 */

import { sendAlert } from './bot.js';

const [,, type, projectId, ...args] = process.argv;

if (!type || !projectId) {
  console.log(`
Usage:
  node send-alert.js rating_change <projectId> <oldGrade> <newGrade> <summary>
  node send-alert.js new_report <projectId> <grade> <reportDate>
  node send-alert.js red_flag <projectId> <title> <description>

Examples:
  node send-alert.js rating_change tether-usdt C B+ "Improved transparency"
  node send-alert.js new_report circle-usdc A 2026-05-20
  node send-alert.js red_flag tether-usdt "Data Gap" "50 days since last report"
  `);
  process.exit(1);
}

let alert;

switch (type) {
  case 'rating_change':
    alert = {
      type: 'rating_change',
      oldGrade: args[0],
      newGrade: args[1],
      summary: args[2] || ''
    };
    break;
  case 'new_report':
    alert = {
      type: 'new_report',
      grade: args[0],
      reportDate: args[1]
    };
    break;
  case 'red_flag':
    alert = {
      type: 'red_flag',
      title: args[0],
      description: args[1] || ''
    };
    break;
  default:
    console.error(`Unknown alert type: ${type}`);
    process.exit(1);
}

console.log(`Sending ${type} alert for ${projectId}...`);
await sendAlert(projectId, alert);
console.log('Done!');
process.exit(0);
