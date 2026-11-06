import { countInteractions } from '../repositories/ticketRepository.js';

const percent = (part, total) => (total === 0 ? 0 : Math.round((part / total) * 1000) / 10);

export async function getSummary() {
  const { total, derivated } = await countInteractions();
  const resolvedByAI = total - derivated;
  return {
    totalInteractions: total,
    resolvedByAI,
    derivatedToTeacher: derivated,
    resolvedByAIPercent: percent(resolvedByAI, total),
    derivatedPercent: percent(derivated, total),
  };
}
