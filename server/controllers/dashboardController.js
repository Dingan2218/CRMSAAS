import { Lead, User, Activity } from '../models/index.js';
import { Op } from 'sequelize';
import sequelize from '../config/database.js';

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
          target: parseFloat(user.monthlyTarget).toFixed(2),
          achievement: user.monthlyTarget > 0 
            ? ((parseFloat(monthlyData.revenue) / parseFloat(user.monthlyTarget)) * 100).toFixed(2)
            : 0
        },
        weekly: {
          totalLeads: parseInt(weeklyData.totalLeads),
          closedLeads: parseInt(weeklyData.closedLeads),
          revenue: parseFloat(weeklyData.revenue).toFixed(2),
          target: parseFloat(user.weeklyTarget).toFixed(2),
          achievement: user.weeklyTarget > 0 
            ? ((parseFloat(weeklyData.revenue) / parseFloat(user.weeklyTarget)) * 100).toFixed(2)
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
