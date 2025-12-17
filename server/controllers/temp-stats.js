import { Company, User, SuperAdminMessage } from '../models/index.js';
import bcrypt from 'bcryptjs';

// Previous functions remain the same...
// (createPopup, getPopups, togglePopup, deletePopup, createCompany, etc.)

// @desc    Get subscription statistics
// @route   GET /api/super-admin/stats
// @access  Super Admin
export const getStats = async (req, res) => {
    try {
        const [totalCompanies, trialCompanies, activeCompanies, expiredCompanies] = await Promise.all([
            Company.count(),
            Company.count({ where: { subscriptionStatus: 'trial' } }),
            Company.count({ where: { subscriptionStatus: 'active' } }),
            Company.count({ where: { subscriptionStatus: 'expired' } })
        ]);

        const totalUsers = await User.count();

        res.status(200).json({
            success: true,
            data: {
                totalCompanies,
                trial: trialCompanies,
                active: activeCompanies,
                expired: expiredCompanies,
                totalUsers
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
