import jwt from 'jsonwebtoken';
import { User, Company } from '../models/index.js';
import { Op } from 'sequelize';

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

// @desc    Login user by phone
// @route   POST /api/auth/login-phone
// @access  Public
export const loginByPhone = async (req, res) => {
  try {
    console.info('[AUTH] POST /auth/login-phone - start');
    const { phone, password } = req.body;

    if (!phone || !password) {
      console.warn('[AUTH] /auth/login-phone - missing phone or password');
      return res.status(400).json({
        success: false,
        message: 'Please provide phone and password'
      });
    }

    // Normalize phone: trim and try both raw and digits-only to be lenient
    const normalized = String(phone).trim();
    const digitsOnly = normalized.replace(/[^0-9]/g, '');

    console.info('[AUTH] /auth/login-phone - lookup by phone variants', { normalized, digitsOnly });
    const user = await User.findOne({
      where: {
        [Op.or]: [
          { phone: normalized },
          { phone: digitsOnly }
        ]
      }
    });
    console.info('[AUTH] /auth/login-phone - user found:', Boolean(user));
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    if (!user.isActive) {
      console.warn('[AUTH] /auth/login-phone - user inactive', { userId: user.id });
      return res.status(401).json({ success: false, message: 'Account is deactivated. Please contact admin.' });
    }

    console.info('[AUTH] /auth/login-phone - comparing password', { userId: user.id });
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    console.info('[AUTH] /auth/login-phone - generating token', { userId: user.id });
    const token = generateToken(user.id);

    res.status(200).json({
      success: true,
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        monthlyTarget: user.monthlyTarget,
        weeklyTarget: user.weeklyTarget,
        token
      }
    });
  } catch (error) {
    console.error('[AUTH] /auth/login-phone - error', { message: error.message, stack: error.stack });
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public (Admin only in production)
export const register = async (req, res) => {
  try {
    const { name, email, password, role, phone, monthlyTarget, weeklyTarget } = req.body;

    // Check if user exists
    const userExists = await User.findOne({ where: { email } });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'User already exists'
      });
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      role: role || 'salesperson',
      phone,
      monthlyTarget: monthlyTarget || 0,
      weeklyTarget: weeklyTarget || 0
    });

    const token = generateToken(user.id);

    res.status(201).json({
      success: true,
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        token
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res) => {
  try {
    console.info('[AUTH] POST /auth/login - start');
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      console.warn('[AUTH] /auth/login - missing email or password');
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    // Check for user with Company
    console.info('[AUTH] /auth/login - lookup by email', { email });
    const user = await User.findOne({
      where: { email },
      include: [{ model: Company, as: 'company', attributes: ['name', 'logoUrl', 'primaryColor'] }]
    });

    console.info('[AUTH] /auth/login - user found:', Boolean(user));
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if user is active
    console.info('[AUTH] /auth/login - isActive check', { userId: user.id, isActive: user.isActive });
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated. Please contact admin.'
      });
    }

    // Check password
    console.info('[AUTH] /auth/login - comparing password', { userId: user.id });
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    console.info('[AUTH] /auth/login - generating token', { userId: user.id });
    const token = generateToken(user.id);

    res.status(200).json({
      success: true,
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        monthlyTarget: user.monthlyTarget,
        weeklyTarget: user.weeklyTarget,
        company: user.company, // Send branding info
        token
      }
    });
  } catch (error) {
    console.error('[AUTH] /auth/login - error', { message: error.message, stack: error.stack });
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Change password
// @route   PUT /api/auth/password
// @access  Private
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide current and new password'
      });
    }

    const user = await User.findByPk(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    if (currentPassword === newPassword) {
      return res.status(400).json({
        success: false,
        message: 'New password must be different from current password'
      });
    }

    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update profile details
// @route   PUT /api/auth/profile
// @access  Private
export const updateProfile = async (req, res) => {
  try {
    const { name, email, phone } = req.body;

    if (!name && !email && !phone) {
      return res.status(400).json({
        success: false,
        message: 'Please provide details to update'
      });
    }

    const user = await User.findByPk(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (email && email !== user.email) {
      const emailTaken = await User.findOne({ where: { email } });
      if (emailTaken) {
        return res.status(400).json({
          success: false,
          message: 'Email already in use'
        });
      }
      user.email = email;
    }

    if (name) {
      user.name = name.trim();
    }

    if (phone !== undefined) {
      user.phone = phone;
    }

    await user.save();

    res.status(200).json({
      success: true,
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        monthlyTarget: user.monthlyTarget,
        weeklyTarget: user.weeklyTarget
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password'] },
      include: [{
        model: Company,
        as: 'company',
        attributes: ['name', 'logoUrl', 'primaryColor', 'maxUsers', 'subscriptionStatus']
      }]
    });

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
