import jwt from 'jsonwebtoken';
import { User } from '../models/index.js';

export const protect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
      console.info('[AUTH] protect - Bearer token received');
    }

    if (!token) {
      console.warn('[AUTH] protect - no token provided', { path: req.path, method: req.method });
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route'
      });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.info('[AUTH] protect - token verified', { userId: decoded.id });
      req.user = await User.findByPk(decoded.id, {
        attributes: { exclude: ['password'] }
      });

      if (!req.user) {
        console.warn('[AUTH] protect - user not found for token', { userId: decoded.id });
        return res.status(401).json({
          success: false,
          message: 'User not found'
        });
      }

      if (!req.user.isActive) {
        console.warn('[AUTH] protect - user inactive', { userId: req.user.id });
        return res.status(401).json({
          success: false,
          message: 'User account is deactivated'
        });
      }

      console.info('[AUTH] protect - access granted', { userId: req.user.id, path: req.path, method: req.method });
      next();
    } catch (error) {
      console.error('[AUTH] protect - token verification error', { message: error.message, path: req.path });
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route'
      });
    }
  } catch (error) {
    console.error('[AUTH] protect - server error', { message: error.message, stack: error.stack });
    res.status(500).json({
      success: false,
      message: 'Server error in authentication'
    });
  }
};

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      console.warn('[AUTH] authorize - forbidden role', { userId: req.user?.id, role: req.user?.role, required: roles, path: req.path });
      return res.status(403).json({
        success: false,
        message: `User role ${req.user.role} is not authorized to access this route`
      });
    }
    console.info('[AUTH] authorize - role allowed', { userId: req.user?.id, role: req.user?.role, path: req.path });
    next();
  };
};
