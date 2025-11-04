import express from 'express';
import {
  getAdminDashboard,
  getSalespersonDashboard,
  getLeaderboard
} from '../controllers/dashboardController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/admin', authorize('admin', 'accountant'), getAdminDashboard);
router.get('/salesperson', authorize('salesperson'), getSalespersonDashboard);
router.get('/leaderboard', getLeaderboard);

export default router;
