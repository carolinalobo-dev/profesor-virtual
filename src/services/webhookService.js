import { config } from '../config/env.js';

// Notifica a Make/Zapier. Nunca debe romper el flujo principal: si falla, solo se registra.
export function notifyTicketCreated(ticket) {
  if (!config.ticketWebhookUrl) return;
  fetch(config.ticketWebhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ event: 'ticket.created', ticket }),
    signal: AbortSignal.timeout(5000),
  }).catch((error) => console.error('Webhook fallido:', error.message));
}
