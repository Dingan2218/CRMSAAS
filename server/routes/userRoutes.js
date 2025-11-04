import express from 'express';
import {
  getSalespeople,
  createSalesperson,
  updateSalesperson,
  deactivateSalesperson,
  getSalespersonPerformance
} from '../controllers/userController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router
  .route('/salespeople')
  .get(authorize('admin', 'accountant'), getSalespeople)
  .post(authorize('admin', 'accountant'), createSalesperson);

router
  .route('/salespeople/:id')
  .put(authorize('admin', 'accountant'), updateSalesperson)
  .delete(authorize('admin', 'accountant'), deactivateSalesperson);

router.get('/salespeople/:id/performance', getSalespersonPerformance);

export default router;
