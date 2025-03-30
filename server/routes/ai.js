import express from 'express';
import { generateResponse, streamAIResponse } from '../controllers/aiController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// AI routes are protected
router.use(protect);

router.post('/generate', generateResponse);
router.post('/stream', streamAIResponse);

export default router; 