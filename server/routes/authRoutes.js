import express from 'express';
import { register, login, loginByPhone, getMe, changePassword, updateProfile } from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/login-phone', loginByPhone);
router.get('/me', protect, getMe);
router.put('/password', protect, changePassword);
router.put('/profile', protect, updateProfile);

export default router;
