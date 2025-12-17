import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import {
    createCompany, getCompanies, updateCompanySubscription,
    createPopup, getPopups, togglePopup, deletePopup, updateCompanyLimit, updateCompany, deleteCompany
} from '../controllers/superAdminController.js';

const router = express.Router();

// Protect all routes
router.use(protect);
router.use(authorize('super_admin'));

router.route('/companies')
    .get(getCompanies)
    .post(createCompany);

router.route('/companies/:id')
    .put(updateCompany)
    .delete(deleteCompany);

router.route('/companies/:id/subscription')
    .put(updateCompanySubscription);

router.route('/companies/:id/limit')
    .put(updateCompanyLimit);

router.route('/messages')
    .get(getPopups)
    .post(createPopup);

router.route('/messages/:id')
    .put(togglePopup)
    .delete(deletePopup);

export default router;
