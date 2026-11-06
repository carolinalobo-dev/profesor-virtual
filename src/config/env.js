import dotenv from 'dotenv';

dotenv.config();

const toInt = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
};

export const config = {
  port: toInt(process.env.PORT, 3000),
  openaiApiKey: process.env.OPENAI_API_KEY ?? '',
  openaiModel: process.env.OPENAI_MODEL ?? 'gpt-4o-mini',
  openaiTimeoutMs: toInt(process.env.OPENAI_TIMEOUT_MS, 10000),
  openaiMaxRetries: toInt(process.env.OPENAI_MAX_RETRIES, 2),
  ticketWebhookUrl: process.env.TICKET_WEBHOOK_URL ?? '',
  dataFile: process.env.DATA_FILE ?? 'data/db.json',
};
