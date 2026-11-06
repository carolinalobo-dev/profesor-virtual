import { processStudentMessage } from '../services/chatService.js';

export const handleChatMessage = async (req, res, next) => {
  try {
    const { studentName, course, message, channel } = req.body;
    const result = await processStudentMessage({ studentName, course, message, channel });
    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    return next(error);
  }
};
