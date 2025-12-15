import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import {
  getAdminActivePopups,
  dismissPopup,
  completePopup,
  listPopups,
  createPopup,
  updatePopup,
  setPopupActive,
  deletePopup
} from '../controllers/popupController.js';

const router = express.Router();

router.use(protect);

// Company Admin endpoints
router.get('/admin/popups', authorize('admin'), getAdminActivePopups);
router.post('/admin/popups/:id/dismiss', authorize('admin'), dismissPopup);
router.post('/admin/popups/:id/complete', authorize('admin'), completePopup);

// Super Admin management endpoints
router.get('/super/popups', authorize('super_admin'), listPopups);
router.post('/super/popups', authorize('super_admin'), createPopup);
router.put('/super/popups/:id', authorize('super_admin'), updatePopup);
router.patch('/super/popups/:id/active', authorize('super_admin'), setPopupActive);
router.delete('/super/popups/:id', authorize('super_admin'), deletePopup);

export default router;
