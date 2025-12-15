import { Company, User, SuperAdminMessage } from '../models/index.js';
import bcrypt from 'bcryptjs';

// @desc    Create a system-wide popup
// @route   POST /api/super-admin/messages
// @access  Super Admin
export const createPopup = async (req, res) => {
    try {
        const { title, content, type, targetCompanyId } = req.body;
        if (!title || !content) {
            return res.status(400).json({ success: false, message: 'Please provide title and content' });
        }

        const popup = await SuperAdminMessage.create({
            title,
            content,
            isActive: true,
            type: type || 'all',
            targetCompanyId: type === 'specific' ? targetCompanyId : null
        });

        res.status(201).json({ success: true, data: popup });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get all system-wide popups
// @route   GET /api/super-admin/messages
// @access  Super Admin
export const getPopups = async (req, res) => {
    try {
        const popups = await SuperAdminMessage.findAll({
            order: [['createdAt', 'DESC']]
        });
        res.status(200).json({ success: true, data: popups });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Toggle popup status
// @route   PUT /api/super-admin/messages/:id
// @access  Super Admin
export const togglePopup = async (req, res) => {
    try {
        const { id } = req.params;
        const msg = await SuperAdminMessage.findByPk(id);
        if (!msg) {
            return res.status(404).json({ success: false, message: 'Message not found' });
        }

        msg.isActive = !msg.isActive;
        await msg.save();

        res.status(200).json({ success: true, data: msg });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Delete popup
// @route   DELETE /api/super-admin/messages/:id
// @access  Super Admin
export const deletePopup = async (req, res) => {
    try {
        await SuperAdminMessage.destroy({ where: { id: req.params.id } });
        res.status(200).json({ success: true, message: 'Deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Create a new company and its admin
// @route   POST /api/super-admin/companies
// @access  Super Admin
export const createCompany = async (req, res) => {
    try {
        const { companyName, adminName, adminEmail, adminPassword, adminPhone, logoUrl, primaryColor, maxUsers } = req.body;

        // Validation
        if (!companyName || !adminName || !adminEmail || !adminPassword) {
            return res.status(400).json({ success: false, message: 'Please provide all required fields' });
        }

        // Check if user already exists
        const userExists = await User.findOne({ where: { email: adminEmail } });
        if (userExists) {
            return res.status(400).json({ success: false, message: 'User with this email already exists' });
        }

        // Create Company
        const company = await Company.create({
            name: companyName,
            subscriptionStatus: 'trial',
            logoUrl: logoUrl,
            primaryColor: primaryColor || '#DC2626',
            maxUsers: maxUsers || 5, // Default 5
            trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) // 14 days trial
        });

        // Create Admin User for this Company
        // Note: User model has hooks to hash password
        const adminUser = await User.create({
            name: adminName,
            email: adminEmail,
            password: adminPassword,
            role: 'admin',
            phone: adminPhone,
            companyId: company.id,
            monthlyTarget: 0,
            weeklyTarget: 0
        });

        res.status(201).json({
            success: true,
            message: 'Company and Admin created successfully',
            data: {
                company: {
                    id: company.id,
                    name: company.name
                },
                admin: {
                    id: adminUser.id,
                    name: adminUser.name,
                    email: adminUser.email
                }
            }
        });

    } catch (error) {
        console.error('Create Company Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Update company subscription
// @route   PUT /api/super-admin/companies/:id/subscription
// @access  Super Admin
export const updateCompanySubscription = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body; // 'trial', 'active', 'expired'

        const company = await Company.findByPk(id);
        if (!company) {
            return res.status(404).json({ success: false, message: 'Company not found' });
        }

        company.subscriptionStatus = status;
        await company.save();

        res.status(200).json({ success: true, message: `Subscription updated to ${status}` });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Update company user limit
// @route   PUT /api/super-admin/companies/:id/limit
// @access  Super Admin
export const updateCompanyLimit = async (req, res) => {
    try {
        const { id } = req.params;
        const { maxUsers } = req.body;

        const company = await Company.findByPk(id);
        if (!company) {
            return res.status(404).json({ success: false, message: 'Company not found' });
        }

        company.maxUsers = parseInt(maxUsers, 10);
        await company.save();

        res.status(200).json({ success: true, message: `Limit updated to ${company.maxUsers}` });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Update company details
// @route   PUT /api/super-admin/companies/:id
// @access  Super Admin
export const updateCompany = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, logoUrl, primaryColor } = req.body;

        const company = await Company.findByPk(id);
        if (!company) {
            return res.status(404).json({ success: false, message: 'Company not found' });
        }

        company.name = name || company.name;
        company.logoUrl = logoUrl !== undefined ? logoUrl : company.logoUrl;
        company.primaryColor = primaryColor || company.primaryColor;

        await company.save();

        res.status(200).json({ success: true, message: 'Company updated', data: company });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get all companies
// @route   GET /api/super-admin/companies
// @access  Super Admin
export const getCompanies = async (req, res) => {
    try {
        const companies = await Company.findAll({
            include: [
                {
                    model: User,
                    as: 'users',
                    where: { role: 'admin' }, // Only fetch the main admins to keep it light
                    attributes: ['id', 'name', 'email', 'phone'],
                    required: false // Include companies even if they don't have an admin (broken state but good to know)
                }
            ],
            order: [['createdAt', 'DESC']]
        });

        res.status(200).json({ success: true, data: companies });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
