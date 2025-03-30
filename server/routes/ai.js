import express from 'express';
import { generateResponse } from '../controllers/aiController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// AI routes are protected
router.use(protect);

router.post('/generate', generateResponse);

export default router; 