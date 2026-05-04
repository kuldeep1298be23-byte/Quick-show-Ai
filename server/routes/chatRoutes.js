import express from 'express';
import { chatWithAI } from '../controllers/chatController.js';
import { protectUser } from '../middleware/auth.js';

const chatRouter = express.Router();

chatRouter.post('/message', protectUser, chatWithAI);

export default chatRouter;
