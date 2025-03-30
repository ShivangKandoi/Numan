import express from 'express';
import { 
  getUserChats, 
  getChatById, 
  createChat, 
  addMessage, 
  deleteChat,
  updateChatTitle,
  updateMessage
} from '../controllers/chatController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// All chat routes are protected
router.use(protect);

// Chat routes
router.get('/', getUserChats);
router.get('/:chatId', getChatById);
router.post('/', createChat);
router.post('/:chatId/messages', addMessage);
router.put('/:chatId/messages/:messageId', updateMessage);
router.delete('/:chatId', deleteChat);
router.put('/:chatId/title', updateChatTitle);

export default router; 