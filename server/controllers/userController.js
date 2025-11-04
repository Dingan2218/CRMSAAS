import { User, Lead } from '../models/index.js';
import { Op } from 'sequelize';

// @desc    Get all salespeople
// @route   GET /api/users/salespeople
// @access  Private/Admin
export const getSalespeople = async (req, res) => {
  try {
    const salespeople = await User.findAll({
      where: { role: 'salesperson' },
      attributes: { exclude: ['password'] },
      include: [{
        model: Lead,
        as: 'leads',
        attributes: ['id', 'status', 'value']
      }]
    });

    res.status(200).json({
      success: true,
      count: salespeople.length,
      data: salespeople
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Create salesperson
// @route   POST /api/users/salespeople
// @access  Private/Admin
export const createSalesperson = async (req, res) => {
  try {
    const { name, email, password, phone, monthlyTarget, weeklyTarget } = req.body;

    const userExists = await User.findOne({ where: { email } });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    const user = await User.create({
      name,
      email,
      password,
      role: 'salesperson',
      phone,
      monthlyTarget: monthlyTarget || 0,
      weeklyTarget: weeklyTarget || 0
    });

    const userResponse = user.toJSON();
    delete userResponse.password;

    res.status(201).json({
      success: true,
      data: userResponse
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update salesperson
// @route   PUT /api/users/salespeople/:id
// @access  Private/Admin
export const updateSalesperson = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, monthlyTarget, weeklyTarget, isActive } = req.body;

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.role !== 'salesperson') {
      return res.status(400).json({
        success: false,
        message: 'Can only update salesperson accounts'
      });
    }

    await user.update({
      name: name || user.name,
      email: email || user.email,
      phone: phone || user.phone,
      monthlyTarget: monthlyTarget !== undefined ? monthlyTarget : user.monthlyTarget,
      weeklyTarget: weeklyTarget !== undefined ? weeklyTarget : user.weeklyTarget,
      isActive: isActive !== undefined ? isActive : user.isActive
    });

    const userResponse = user.toJSON();
    delete userResponse.password;

    res.status(200).json({
      success: true,
      data: userResponse
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete/Deactivate salesperson
// @route   DELETE /api/users/salespeople/:id
// @access  Private/Admin
export const deactivateSalesperson = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    await user.update({ isActive: false });

    res.status(200).json({
      success: true,
      message: 'Salesperson deactivated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get salesperson performance
// @route   GET /api/users/salespeople/:id/performance
// @access  Private
export const getSalespersonPerformance = async (req, res) => {
  try {
    const { id } = req.params;
    const { period } = req.query; // 'week' or 'month'

    const user = await User.findByPk(id, {
      attributes: { exclude: ['password'] }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Calculate date range
    const now = new Date();
    let startDate;
    
    if (period === 'week') {
      startDate = new Date(now.setDate(now.getDate() - 7));
    } else {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    // Get leads statistics
    const leads = await Lead.findAll({
      where: {
        assignedTo: id,
        createdAt: {
          [Op.gte]: startDate
        }
      }
    });

    const stats = {
      totalLeads: leads.length,
      freshLeads: leads.filter(l => l.status === 'fresh').length,
      followUpLeads: leads.filter(l => l.status === 'follow-up').length,
      closedLeads: leads.filter(l => l.status === 'closed').length,
      deadLeads: leads.filter(l => l.status === 'dead').length,
      totalRevenue: leads
        .filter(l => l.status === 'closed')
        .reduce((sum, l) => sum + parseFloat(l.value || 0), 0),
      conversionRate: leads.length > 0 
        ? ((leads.filter(l => l.status === 'closed').length / leads.length) * 100).toFixed(2)
        : 0
    };

    res.status(200).json({
      success: true,
      data: {
        user,
        period,
        stats
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
