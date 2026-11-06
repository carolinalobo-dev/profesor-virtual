import { getSummary } from '../services/analyticsService.js';

export const summaryHandler = async (_req, res, next) => {
  try {
    return res.status(200).json({ success: true, data: await getSummary() });
  } catch (error) {
    return next(error);
  }
};
