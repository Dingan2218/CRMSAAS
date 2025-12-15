import express from 'express';
import {
  getAdminDashboard,
  getSalespersonDashboard,
  getLeaderboard,
  getStatusCounts,
  getActivePopup
} from '../controllers/dashboardController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/admin', authorize('admin', 'accountant'), getAdminDashboard);
router.get('/salesperson', authorize('salesperson'), getSalespersonDashboard);
router.get('/leaderboard', getLeaderboard);
router.get('/status-counts', authorize('admin', 'accountant'), getStatusCounts);
router.get('/popup', authorize('admin'), getActivePopup);

export default router;
