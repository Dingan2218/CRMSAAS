import express from 'express';
import {
  uploadLeads,
  getAllLeads,
  getMyLeads,
  getLead,
  updateLead,
  addActivity,
  deleteLead,
  getCountries,
  getProducts,
  getStaleLeads,
  redistributeLeads,
  createLead,
  assignLeads
} from '../controllers/leadController.js';
import { protect, authorize } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = express.Router();

router.use(protect);

router.post('/upload', authorize('admin', 'accountant'), upload.single('file'), uploadLeads);
router.post('/', authorize('admin', 'accountant', 'salesperson'), createLead);
router.get('/countries', getCountries);
router.get('/products', getProducts);
router.get('/stale', authorize('admin', 'accountant'), getStaleLeads);
router.post('/redistribute', authorize('admin', 'accountant'), redistributeLeads);
router.post('/assign', authorize('admin', 'accountant'), assignLeads);
router.get('/', authorize('admin', 'accountant'), getAllLeads);
router.get('/my-leads', authorize('salesperson'), getMyLeads);

router
  .route('/:id')
  .get(getLead)
  .put(updateLead)
  .delete(authorize('admin', 'accountant'), deleteLead);

router.post('/:id/activity', addActivity);

export default router;
