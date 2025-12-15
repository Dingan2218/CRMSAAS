import { Lead, User, Activity, SuperAdminMessage } from '../models/index.js';
import { Op } from 'sequelize';
import sequelize from '../config/database.js';

// @desc    Get active global popup
// @route   GET /api/dashboard/popup
// @access  Private/Admin
export const getActivePopup = async (req, res) => {
  try {
    const userCompanyId = req.user.companyId || null; // Ensure null if undefined

    const whereClause = {
      isActive: true,
      [Op.or]: [
        { type: 'all' },
        { type: null } // Handle legacy records
      ]
    };

    if (userCompanyId) {
      whereClause[Op.or].push({ targetCompanyId: userCompanyId });
    }

    const popup = await SuperAdminMessage.findOne({
      where: whereClause,
      order: [['createdAt', 'DESC']]
    });
    res.status(200).json({ success: true, data: popup });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get admin dashboard stats
// @route   GET /api/dashboard/admin
// @access  Private/Admin
export const getAdminDashboard = async (req, res) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));

    // Total leads
    const totalLeads = await Lead.count();

    // Leads this month
    const leadsThisMonth = await Lead.count({
      where: {
        createdAt: {
          [Op.gte]: startOfMonth
        }
      }
    });

    // Total revenue this month
    const monthlyRevenue = await Lead.sum('value', {
      where: {
        status: 'closed',
        closedAt: {
          [Op.gte]: startOfMonth
        }
      }
    });

    // Leads by status
    const leadsByStatus = await Lead.findAll({
      attributes: [
        'status',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['status']
    });

    // Follow-ups count
    const followUpsCount = await Lead.count({
      where: {
        status: 'follow-up'
      }
    });

    // Pending leads (fresh + follow-up)
    const pendingLeads = await Lead.count({
      where: {
        status: {
          [Op.in]: ['fresh', 'follow-up']
        }
      }
    });

    // Top performers this month
    const topPerformers = await User.findAll({
      where: { role: 'salesperson', isActive: true },
      attributes: [
        'id',
        'name',
        'email',
        [sequelize.fn('COUNT', sequelize.col('leads.id')), 'totalLeads'],
        [
          sequelize.literal(`(
            SELECT COUNT(*)
            FROM "Leads" AS l
            WHERE l."assignedTo" = "User"."id"
            AND l."status" = 'closed'
            AND l."closedAt" >= '${startOfMonth.toISOString()}'
          )`),
          'closedLeads'
        ],
        [
          sequelize.literal(`(
            SELECT COALESCE(SUM(l."value"), 0)
            FROM "Leads" AS l
            WHERE l."assignedTo" = "User"."id"
            AND l."status" = 'closed'
            AND l."closedAt" >= '${startOfMonth.toISOString()}'
          )`),
          'revenue'
        ]
      ],
      include: [{
        model: Lead,
        as: 'leads',
        attributes: [],
        where: {
          createdAt: {
            [Op.gte]: startOfMonth
          }
        },
        required: false
      }],
      group: ['User.id'],
      order: [
        [sequelize.literal('"closedLeads"'), 'DESC'],
        [sequelize.literal('"revenue"'), 'DESC']
      ],
      limit: 5,
      subQuery: false
    });

    // Targets table: conversions (closed leads this month) vs monthlyTarget for each active salesperson
    const targetsRaw = await User.findAll({
      where: { role: 'salesperson', isActive: true },
      attributes: [
        'id',
        'name',
        'monthlyTarget',
        [
          sequelize.literal(`(
            SELECT COUNT(*)
            FROM "Leads" AS l
            WHERE l."assignedTo" = "User"."id"
            AND l."status" = 'closed'
            AND l."closedAt" >= '${startOfMonth.toISOString()}'
          )`),
          'conversions'
        ]
      ],
      order: [[sequelize.literal('"conversions"'), 'DESC']],
      raw: true
    });

    // Recent activities
    const recentActivities = await Activity.findAll({
      limit: 10,
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name']
        },
        {
          model: Lead,
          as: 'lead',
          attributes: ['id', 'name']
        }
      ]
    });

    // Conversion rate
    const closedLeads = await Lead.count({
      where: {
        status: 'closed',
        closedAt: {
          [Op.gte]: startOfMonth
        }
      }
    });

    const conversionRate = leadsThisMonth > 0
      ? ((closedLeads / leadsThisMonth) * 100).toFixed(2)
      : 0;

    res.status(200).json({
      success: true,
      data: {
        overview: {
          totalLeads,
          leadsThisMonth,
          followUpsCount,
          pendingLeads,
          monthlyRevenue: parseFloat(monthlyRevenue || 0).toFixed(2),
          conversionRate
        },
        leadsByStatus: leadsByStatus.map(item => ({
          status: item.status,
          count: parseInt(item.dataValues.count)
        })),
        topPerformers: topPerformers.map(p => ({
          id: p.id,
          name: p.name,
          email: p.email,
          totalLeads: parseInt(p.dataValues.totalLeads || 0),
          closedLeads: parseInt(p.dataValues.closedLeads || 0),
          revenue: parseFloat(p.dataValues.revenue || 0).toFixed(2)
        })),
        targets: targetsRaw.map(t => ({
          id: t.id,
          name: t.name,
          conversions: parseInt(t.conversions || 0),
          target: parseInt(t.monthlyTarget || 0)
        })),
        recentActivities
      }
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get salesperson dashboard stats
// @route   GET /api/dashboard/salesperson
// @access  Private/Salesperson
export const getSalespersonDashboard = async (req, res) => {
  try {
    const userId = req.user.id;
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());

    // My leads count
    const myLeadsCount = await Lead.count({
      where: { assignedTo: userId }
    });

    // Leads by status
    const leadsByStatus = await Lead.findAll({
      where: { assignedTo: userId },
      attributes: [
        'status',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['status']
    });

    // Monthly stats
    const monthlyStats = await Lead.findAll({
      where: {
        assignedTo: userId,
        createdAt: {
          [Op.gte]: startOfMonth
        }
      },
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'totalLeads'],
        [
          sequelize.literal(`COUNT(CASE WHEN status = 'closed' THEN 1 END)`),
          'closedLeads'
        ],
        [
          sequelize.literal(`COALESCE(SUM(CASE WHEN status = 'closed' THEN value ELSE 0 END), 0)`),
          'revenue'
        ]
      ],
      raw: true
    });

    // Weekly stats
    const weeklyStats = await Lead.findAll({
      where: {
        assignedTo: userId,
        createdAt: {
          [Op.gte]: startOfWeek
        }
      },
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'totalLeads'],
        [
          sequelize.literal(`COUNT(CASE WHEN status = 'closed' THEN 1 END)`),
          'closedLeads'
        ],
        [
          sequelize.literal(`COALESCE(SUM(CASE WHEN status = 'closed' THEN value ELSE 0 END), 0)`),
          'revenue'
        ]
      ],
      raw: true
    });

    // Get user targets
    const user = await User.findByPk(userId, {
      attributes: ['monthlyTarget', 'weeklyTarget']
    });

    // Recent calls (last 7 days)
    const recentCalls = await Lead.findAll({
      where: {
        assignedTo: userId,
        lastCalled: {
          [Op.gte]: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        }
      },
      order: [['lastCalled', 'DESC']],
      limit: 10
    });

    // Recent activities
    const recentActivities = await Activity.findAll({
      where: { userId },
      limit: 10,
      order: [['createdAt', 'DESC']],
      include: [{
        model: Lead,
        as: 'lead',
        attributes: ['id', 'name']
      }]
    });

    const monthlyData = monthlyStats[0] || { totalLeads: 0, closedLeads: 0, revenue: 0 };
    const weeklyData = weeklyStats[0] || { totalLeads: 0, closedLeads: 0, revenue: 0 };

    res.status(200).json({
      success: true,
      data: {
        overview: {
          totalLeads: myLeadsCount,
          freshLeads: leadsByStatus.find(s => s.status === 'fresh')?.dataValues.count || 0,
          followUpLeads: leadsByStatus.find(s => s.status === 'follow-up')?.dataValues.count || 0,
          rnrLeads: leadsByStatus.find(s => s.status === 'rnr')?.dataValues.count || 0,
          closedLeads: leadsByStatus.find(s => s.status === 'closed')?.dataValues.count || 0,
          deadLeads: leadsByStatus.find(s => s.status === 'dead')?.dataValues.count || 0
        },
        monthly: {
          totalLeads: parseInt(monthlyData.totalLeads),
          closedLeads: parseInt(monthlyData.closedLeads),
          revenue: parseFloat(monthlyData.revenue).toFixed(2),
          // Target is number of conversions (closed leads)
          target: parseInt(user.monthlyTarget || 0),
          achievement: parseFloat(user.monthlyTarget || 0) > 0
            ? ((parseInt(monthlyData.closedLeads || 0) / parseFloat(user.monthlyTarget)) * 100).toFixed(2)
            : 0
        },
        weekly: {
          totalLeads: parseInt(weeklyData.totalLeads),
          closedLeads: parseInt(weeklyData.closedLeads),
          revenue: parseFloat(weeklyData.revenue).toFixed(2),
          // Target is number of conversions (closed leads)
          target: parseInt(user.weeklyTarget || 0),
          achievement: parseFloat(user.weeklyTarget || 0) > 0
            ? ((parseInt(weeklyData.closedLeads || 0) / parseFloat(user.weeklyTarget)) * 100).toFixed(2)
            : 0
        },
        recentCalls,
        recentActivities
      }
    });
  } catch (error) {
    console.error('Salesperson dashboard error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get leaderboard
// @route   GET /api/dashboard/leaderboard
// @access  Private
export const getLeaderboard = async (req, res) => {
  try {
    const { period = 'month' } = req.query; // 'week' or 'month'

    const now = new Date();
    let startDate;

    if (period === 'week') {
      startDate = new Date();
      startDate.setDate(startDate.getDate() - startDate.getDay());
    } else {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }
    startDate.setHours(0, 0, 0, 0);

    const leaderboard = await User.findAll({
      where: { role: 'salesperson', isActive: true },
      attributes: [
        'id',
        'name',
        'email',
        [
          sequelize.literal(`(
            SELECT COUNT(*)
            FROM "Leads" AS l
            WHERE l."assignedTo" = "User"."id"
            AND l."createdAt" >= '${startDate.toISOString()}'
          )`),
          'totalLeads'
        ],
        [
          sequelize.literal(`(
            SELECT COUNT(*)
            FROM "Leads" AS l
            WHERE l."assignedTo" = "User"."id"
            AND l."status" = 'closed'
            AND l."closedAt" >= '${startDate.toISOString()}'
          )`),
          'closedLeads'
        ],
        [
          sequelize.literal(`(
            SELECT COALESCE(SUM(l."value"), 0)
            FROM "Leads" AS l
            WHERE l."assignedTo" = "User"."id"
            AND l."status" = 'closed'
            AND l."closedAt" >= '${startDate.toISOString()}'
          )`),
          'revenue'
        ]
      ],
      order: [[sequelize.literal('"revenue"'), 'DESC']],
      raw: true
    });

    const formattedLeaderboard = leaderboard.map((item, index) => ({
      rank: index + 1,
      id: item.id,
      name: item.name,
      email: item.email,
      totalLeads: parseInt(item.totalLeads || 0),
      closedLeads: parseInt(item.closedLeads || 0),
      revenue: parseFloat(item.revenue || 0).toFixed(2),
      conversionRate: item.totalLeads > 0
        ? ((parseInt(item.closedLeads) / parseInt(item.totalLeads)) * 100).toFixed(2)
        : 0,
      isStarPerformer: index === 0 && parseFloat(item.revenue) > 0
    }));

    res.status(200).json({
      success: true,
      period,
      data: formattedLeaderboard
    });
  } catch (error) {
    console.error('Leaderboard error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get status counts for a time period
// @route   GET /api/dashboard/status-counts
// @access  Private/Admin
export const getStatusCounts = async (req, res) => {
  try {
    let { period = 'daily' } = req.query;
    const p = String(period || '').toLowerCase();

    const now = new Date();
    let startDate = null;

    if (p === 'daily' || p === 'day' || p === 'today') {
      startDate = new Date();
      startDate.setHours(0, 0, 0, 0);
    } else if (p === 'weekly' || p === 'week') {
      startDate = new Date();
      // set to start of week (Sunday as 0 to match existing logic)
      startDate.setDate(startDate.getDate() - startDate.getDay());
      startDate.setHours(0, 0, 0, 0);
    } else if (p === 'monthly' || p === 'month') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    } else if (p === 'yearly' || p === 'year') {
      startDate = new Date(now.getFullYear(), 0, 1);
    } else if (p === 'all') {
      startDate = null; // no filter
    } else {
      // Fallback to monthly if unknown
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      period = 'monthly';
    }

    const where = {};
    if (startDate) {
      where.createdAt = { [Op.gte]: startDate };
    }

    const total = await Lead.count({ where });

    const breakdown = await Lead.findAll({
      attributes: ['status', [sequelize.fn('COUNT', sequelize.col('status')), 'count']],
      where,
      group: ['status'],
      raw: true
    });

    const statusCounts = {
      all: total,
      fresh: 0,
      'follow-up': 0,
      rnr: 0,
      closed: 0, // include 'registered' in this bucket for UI display as "Registered"
      dead: 0,
      cancelled: 0,
      rejected: 0
    };

    for (const row of breakdown) {
      const status = row.status;
      const count = Number(row.count || 0);
      if (status === 'registered') {
        statusCounts.closed += count;
      } else if (status in statusCounts) {
        statusCounts[status] += count;
      }
    }

    res.status(200).json({
      success: true,
      period: p,
      statusCounts
    });
  } catch (error) {
    console.error('Status counts error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
