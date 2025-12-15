import { Lead, User, Activity } from '../models/index.js';
import { Op } from 'sequelize';
import sequelize from '../config/database.js';
import { parseFile, deleteFile } from '../utils/fileParser.js';
import { distributeLeads, getDistributionSummary } from '../utils/leadDistributor.js';

// @desc    Upload and distribute leads
// @route   POST /api/leads/upload
// @access  Private/Admin
export const uploadLeads = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload a file'
      });
    }

    const filePath = req.file.path;

    // Parse the file
    const parsedLeads = await parseFile(filePath);

    if (parsedLeads.length === 0) {
      deleteFile(filePath);
      return res.status(400).json({
        success: false,
        message: 'No valid leads found in file'
      });
    }

    // Distribute leads among salespeople
    const distributedLeads = await distributeLeads(parsedLeads);

    // Save leads to database
    const createdLeads = await Lead.bulkCreate(distributedLeads);

    // Get distribution summary
    const summary = await getDistributionSummary(distributedLeads);

    // Delete the uploaded file
    deleteFile(filePath);

    res.status(201).json({
      success: true,
      message: `${createdLeads.length} leads uploaded and distributed successfully`,
      data: {
        totalLeads: createdLeads.length,
        distribution: summary
      }
    });
  } catch (error) {
    if (req.file) {
      deleteFile(req.file.path);
    }
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Create a single lead manually
// @route   POST /api/leads
// @access  Private (Admin/Accountant/Salesperson)
export const createLead = async (req, res) => {
  try {
    const { name, phone, country, email, product, source, value, notes, date, assignedTo } = req.body;

    if (!name || !phone || !country) {
      return res.status(400).json({ success: false, message: 'Name, phone and country are required' });
    }

    // Determine assignment rules
    let assigned = null;
    if (['admin', 'accountant'].includes(req.user.role)) {
      // Admin/accountant can assign to a salesperson if provided
      if (assignedTo) {
        const user = await User.findByPk(assignedTo);
        if (user && user.role === 'salesperson' && user.isActive) {
          assigned = user.id;
        }
      }
    } else if (req.user.role === 'salesperson') {
      // Salesperson: force assign to self
      assigned = req.user.id;
    }

    const created = await Lead.create({
      name: String(name).trim(),
      phone: String(phone).trim(),
      country,
      email: email || null,
      product: product || null,
      source: source || null,
      value: value !== undefined && value !== null && value !== '' ? Number(value) : 0,
      notes: notes || null,
      date: date ? new Date(date) : null,
      assignedTo: assigned,
      status: 'fresh'
    });

    const leadWithUser = await Lead.findByPk(created.id, {
      include: [{ model: User, as: 'salesperson', attributes: ['id', 'name', 'email'] }]
    });

    return res.status(201).json({ success: true, data: leadWithUser });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all leads (Admin)
// @route   GET /api/leads
// @access  Private/Admin
export const getAllLeads = async (req, res) => {
  try {
    const { status, search, page = 1, limit = 50, country, source, product } = req.query;

    const where = {};
    
    if (status) {
      where.status = status;
    }

    if (country) {
      where.country = { [Op.like]: `%${country}%` };
    }

    if (source) {
      where.source = { [Op.like]: `%${source}%` };
    }

    if (product) {
      where.product = product;
    }

    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
        { phone: { [Op.like]: `%${search}%` } },
        { country: { [Op.like]: `%${search}%` } },
        { product: { [Op.like]: `%${search}%` } },
        { source: { [Op.like]: `%${search}%` } }
      ];
    }

    const offset = (page - 1) * limit;

    const { count, rows } = await Lead.findAndCountAll({
      where,
      include: [{
        model: User,
        as: 'salesperson',
        attributes: ['id', 'name', 'email']
      }],
      order: [
        [sequelize.literal("CASE status WHEN 'fresh' THEN 1 WHEN 'follow-up' THEN 2 WHEN 'closed' THEN 3 WHEN 'dead' THEN 4 ELSE 5 END"), 'ASC'],
        ['createdAt', 'DESC']
      ],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    const statusBreakdownRaw = await Lead.findAll({
      attributes: ['status', [sequelize.fn('COUNT', sequelize.col('status')), 'count']],
      where,
      group: ['status']
    });

    const statusCounts = {
      fresh: 0,
      'follow-up': 0,
      rnr: 0,
      closed: 0,
      dead: 0,
      cancelled: 0,
      rejected: 0,
      all: count
    };

    statusBreakdownRaw.forEach((item) => {
      const status = item.get('status');
      const countValue = Number(item.get('count') || 0);
      if (status && status in statusCounts) {
        statusCounts[status] = countValue;
      }
    });

    res.status(200).json({
      success: true,
      count,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page),
      data: rows,
      statusCounts
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get leads for logged in salesperson
// @route   GET /api/leads/my-leads
// @access  Private/Salesperson
export const getMyLeads = async (req, res) => {
  try {
    const { status, search, page = 1, limit = 50, country, source, product } = req.query;

    const where = { assignedTo: req.user.id };
    
    if (status) {
      where.status = status;
    }

    if (country) {
      where.country = { [Op.like]: `%${country}%` };
    }

    if (source) {
      where.source = { [Op.like]: `%${source}%` };
    }

    if (product) {
      where.product = product;
    }

    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
        { phone: { [Op.like]: `%${search}%` } },
        { country: { [Op.like]: `%${search}%` } },
        { product: { [Op.like]: `%${search}%` } },
        { source: { [Op.like]: `%${search}%` } }
      ];
    }

    const offset = (page - 1) * limit;

    const { count, rows } = await Lead.findAndCountAll({
      where,
      order: [
        [sequelize.literal("CASE status WHEN 'fresh' THEN 1 WHEN 'follow-up' THEN 2 WHEN 'closed' THEN 3 WHEN 'dead' THEN 4 ELSE 5 END"), 'ASC'],
        ['createdAt', 'DESC']
      ],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.status(200).json({
      success: true,
      count,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page),
      data: rows
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get single lead
// @route   GET /api/leads/:id
// @access  Private
export const getLead = async (req, res) => {
  try {
    const { id } = req.params;

    const lead = await Lead.findByPk(id, {
      include: [
        {
          model: User,
          as: 'salesperson',
          attributes: ['id', 'name', 'email', 'phone']
        },
        {
          model: Activity,
          as: 'activities',
          include: [{
            model: User,
            as: 'user',
            attributes: ['id', 'name']
          }],
          order: [['createdAt', 'DESC']]
        }
      ]
    });

    if (!lead) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found'
      });
    }

    // Check authorization for salesperson
    if (req.user.role === 'salesperson' && lead.assignedTo !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this lead'
      });
    }

    res.status(200).json({
      success: true,
      data: lead
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update lead
// @route   PUT /api/leads/:id
// @access  Private
export const updateLead = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes, lastCalled, value, country, product } = req.body;
    console.log('[updateLead] incoming', { id, status, notes, lastCalled, value, country, product });

    const lead = await Lead.findByPk(id);

    if (!lead) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found'
      });
    }

    // Check authorization for salesperson
    if (req.user.role === 'salesperson' && lead.assignedTo !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this lead'
      });
    }

    const oldStatus = lead.status;
    const oldCountry = lead.country || null;

    // Normalize inputs
    const normalizedLastCalled = (lastCalled === '') ? null
      : (lastCalled !== undefined ? new Date(lastCalled) : lead.lastCalled);

    // Handle value: convert to number, handle empty string and undefined
    let normalizedValue = lead.value; // default to existing value
    if (value !== undefined) {
      if (value === '' || value === null) {
        normalizedValue = 0;
      } else {
        const parsedValue = parseFloat(value);
        normalizedValue = isNaN(parsedValue) ? 0 : parsedValue;
      }
    }

    // Prepare payload and update lead
    const updatePayload = {
      status: status || lead.status,
      notes: notes !== undefined ? notes : lead.notes,
      lastCalled: normalizedLastCalled,
      value: normalizedValue,
      closedAt: status === 'closed' ? new Date() : (status && status !== 'closed' ? null : lead.closedAt)
    };

    // Country/Product updates if provided
    if (country !== undefined && country !== '') {
      updatePayload.country = country;
    }
    if (product !== undefined) {
      updatePayload.product = product;
    }

    await lead.update(updatePayload);

    // Reload to ensure we return the latest persisted values
    await lead.reload();
    console.log('[updateLead] persisted', { id: lead.id, status: lead.status, value: String(lead.value), lastCalled: lead.lastCalled });

    // Log activity if status changed
    if (status && status !== oldStatus) {
      await Activity.create({
        leadId: lead.id,
        userId: req.user.id,
        type: 'status_change',
        description: `Status changed from ${oldStatus} to ${status}`,
        oldStatus,
        newStatus: status
      });
    }

    // Log activity if country changed
    if (country !== undefined && country !== '' && country !== oldCountry) {
      await Activity.create({
        leadId: lead.id,
        userId: req.user.id,
        type: 'note',
        description: `Country changed from ${oldCountry ?? '-'} to ${country}`,
        oldCountry: oldCountry,
        newCountry: country
      });
    }

    res.status(200).json({
      success: true,
      data: lead
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Add activity/note to lead
// @route   POST /api/leads/:id/activity
// @access  Private
export const addActivity = async (req, res) => {
  try {
    const { id } = req.params;
    const { type, description } = req.body;

    const lead = await Lead.findByPk(id);

    if (!lead) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found'
      });
    }

    // Check authorization for salesperson
    if (req.user.role === 'salesperson' && lead.assignedTo !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to add activity to this lead'
      });
    }

    const activity = await Activity.create({
      leadId: id,
      userId: req.user.id,
      type,
      description
    });

    res.status(201).json({
      success: true,
      data: activity
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get distinct countries
// @route   GET /api/leads/countries
// @access  Private
export const getCountries = async (req, res) => {
  try {
    const countries = await Lead.findAll({
      attributes: [[sequelize.fn('DISTINCT', sequelize.col('country')), 'country']],
      where: {
        country: {
          [Op.ne]: null
        }
      },
      order: [[sequelize.col('country'), 'ASC']],
      raw: true
    });

    const countryList = countries.map(c => c.country).filter(c => c);

    res.status(200).json({
      success: true,
      data: countryList
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get distinct products
// @route   GET /api/leads/products
// @access  Private
export const getProducts = async (req, res) => {
  try {
    const products = await Lead.findAll({
      attributes: [[sequelize.fn('DISTINCT', sequelize.col('product')), 'product']],
      where: {
        product: {
          [Op.and]: [{ [Op.ne]: null }, { [Op.ne]: '' }]
        }
      },
      order: [[sequelize.col('product'), 'ASC']],
      raw: true
    });

    const productList = products.map(p => p.product).filter(Boolean);

    res.status(200).json({
      success: true,
      data: productList
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get distinct lead sources
// @route   GET /api/leads/sources
// @access  Private
export const getSources = async (req, res) => {
  try {
    const sources = await Lead.findAll({
      attributes: [[sequelize.fn('DISTINCT', sequelize.col('source')), 'source']],
      where: {
        source: {
          [Op.and]: [{ [Op.ne]: null }, { [Op.ne]: '' }]
        }
      },
      order: [[sequelize.col('source'), 'ASC']],
      raw: true
    });

    const sourceList = sources.map(s => s.source).filter(Boolean);

    res.status(200).json({
      success: true,
      data: sourceList
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete lead
// @route   DELETE /api/leads/:id
// @access  Private/Admin
export const deleteLead = async (req, res) => {
  try {
    const { id } = req.params;

    const lead = await Lead.findByPk(id);

    if (!lead) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found'
      });
    }

    await lead.destroy();

    res.status(200).json({
      success: true,
      message: 'Lead deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get stale leads (Fresh/RNR for 4+ days)
// @route   GET /api/leads/stale
// @access  Private/Admin
export const getStaleLeads = async (req, res) => {
  try {
    const fourDaysAgo = new Date();
    fourDaysAgo.setDate(fourDaysAgo.getDate() - 4);

    const staleLeads = await Lead.findAll({
      where: {
        status: {
          [Op.in]: ['fresh', 'rnr']
        },
        createdAt: {
          [Op.lte]: fourDaysAgo
        }
      },
      include: [{
        model: User,
        as: 'salesperson',
        attributes: ['id', 'name', 'email']
      }],
      order: [['createdAt', 'ASC']]
    });

    res.status(200).json({
      success: true,
      count: staleLeads.length,
      data: staleLeads
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Redistribute stale leads
// @route   POST /api/leads/redistribute
// @access  Private/Admin
export const redistributeLeads = async (req, res) => {
  try {
    const { leadIds } = req.body;

    if (!leadIds || leadIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No leads selected for redistribution'
      });
    }

    // Get active salespeople
    const salespeople = await User.findAll({
      where: {
        role: 'salesperson',
        isActive: true
      },
      attributes: ['id', 'name']
    });

    if (salespeople.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No active salespeople available'
      });
    }

    // Get leads to redistribute
    const leads = await Lead.findAll({
      where: {
        id: {
          [Op.in]: leadIds
        },
        status: {
          [Op.in]: ['fresh', 'rnr']
        }
      }
    });

    // Redistribute in round-robin
    const updates = leads.map((lead, index) => {
      const salespersonIndex = index % salespeople.length;
      return lead.update({
        assignedTo: salespeople[salespersonIndex].id,
        status: 'fresh' // Reset to fresh on redistribution
      });
    });

    await Promise.all(updates);

    res.status(200).json({
      success: true,
      message: `${leads.length} leads redistributed successfully`,
      data: leads
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Manually assign one or many leads to a salesperson
// @route   POST /api/leads/assign
// @access  Private/Admin,Accountant
export const assignLeads = async (req, res) => {
  try {
    const { leadIds, assignTo } = req.body;

    if (!assignTo) {
      return res.status(400).json({ success: false, message: 'assignTo (salesperson user id) is required' });
    }

    // Validate target salesperson
    const newOwner = await User.findByPk(assignTo);
    if (!newOwner || newOwner.role !== 'salesperson' || !newOwner.isActive) {
      return res.status(400).json({ success: false, message: 'assignTo must be an active salesperson' });
    }

    const ids = Array.isArray(leadIds) ? leadIds : (leadIds ? [leadIds] : []);
    if (ids.length === 0) {
      return res.status(400).json({ success: false, message: 'leadIds array is required' });
    }

    // Fetch all requested leads
    const leads = await Lead.findAll({
      where: { id: { [Op.in]: ids } }
    });

    if (!leads || leads.length === 0) {
      return res.status(404).json({ success: false, message: 'No matching leads found' });
    }

    // Update assignment and log activity
    await Promise.all(leads.map(async (lead) => {
      const oldAssigneeId = lead.assignedTo;
      await lead.update({ assignedTo: newOwner.id });
      let description = `Assigned to ${newOwner.name}`;
      if (oldAssigneeId && oldAssigneeId !== newOwner.id) {
        description = `Reassigned to ${newOwner.name}`;
      }
      await Activity.create({
        leadId: lead.id,
        userId: req.user.id,
        type: 'note',
        description
      });
    }));

    // Return updated entities including salesperson details
    const updated = await Lead.findAll({
      where: { id: { [Op.in]: ids } },
      include: [{ model: User, as: 'salesperson', attributes: ['id', 'name', 'email'] }]
    });

    return res.status(200).json({ success: true, count: updated.length, data: updated });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
