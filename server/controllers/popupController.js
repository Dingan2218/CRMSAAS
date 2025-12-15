import { Op } from 'sequelize';
import { AdminPopup, PopupCompany, PopupDismissal, Company } from '../models/index.js';

const hasHtml = (str) => /<[^>]+>/.test(String(str || ''));

const priorityRank = {
  payment: 0,
  announcement: 1,
  info: 2
};

const typeRank = {
  modal: 0,
  banner: 1,
  toast: 2
};

const sortPopups = (items) => {
  return [...items].sort((a, b) => {
    const pa = priorityRank[a.priority] ?? 99;
    const pb = priorityRank[b.priority] ?? 99;
    if (pa !== pb) return pa - pb;
    const ta = typeRank[a.type] ?? 99;
    const tb = typeRank[b.type] ?? 99;
    if (ta !== tb) return ta - tb;
    return new Date(a.startAt) - new Date(b.startAt);
  });
};

// Admin endpoints
export const getAdminActivePopups = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only company admins can fetch popups' });
    }

    const now = new Date();
    const companyId = req.user.companyId || null;
    let companyStatus = null;
    if (companyId) {
      const company = await Company.findByPk(companyId);
      companyStatus = company?.subscriptionStatus || null;
    }

    const popups = await AdminPopup.findAll({
      where: {
        isActive: true,
        startAt: { [Op.lte]: now },
        endAt: { [Op.gte]: now }
      },
      include: [{ model: Company, as: 'companies', attributes: ['id'], through: { attributes: [] } }]
    });

    // Filter by target scope
    const scoped = popups.filter((p) => {
      if (p.targetScope === 'all') return true;
      if (!companyId) return false;
      if (p.targetScope === 'trial') return companyStatus === 'trial';
      if (p.targetScope === 'expired') return companyStatus === 'expired';
      if (p.targetScope === 'specific') {
        const ids = (p.companies || []).map((c) => c.id);
        return ids.includes(companyId);
      }
      return false;
    });

    const popupIds = scoped.map((p) => p.id);
    const dismissals = popupIds.length > 0
      ? await PopupDismissal.findAll({ where: { userId: req.user.id, popupId: { [Op.in]: popupIds } }, attributes: ['popupId'] })
      : [];
    const dismissedIds = new Set(dismissals.map((d) => d.popupId));

    // Exclude dismissed
    let filtered = scoped.filter((p) => !dismissedIds.has(p.id));

    // Sort and ensure only one modal
    filtered = sortPopups(filtered);
    let modalSeen = false;
    filtered = filtered.filter((p) => {
      if (p.type === 'modal') {
        if (modalSeen) return false;
        modalSeen = true;
      }
      return true;
    });

    const payload = filtered.map((p) => ({
      id: p.id,
      title: p.title,
      message: p.message,
      type: p.type,
      bannerPosition: p.bannerPosition || null,
      ctaText: p.ctaText || null,
      ctaAction: p.ctaAction,
      ctaUrl: p.ctaUrl || null,
      dismissible: p.dismissible,
      priority: p.priority,
      startAt: p.startAt,
      endAt: p.endAt
    }));

    return res.status(200).json({ success: true, data: payload });
  } catch (error) {
    console.error('getAdminActivePopups error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const dismissPopup = async (req, res) => {
  try {
    const { id } = req.params;
    const popup = await AdminPopup.findByPk(id);
    if (!popup) return res.status(404).json({ success: false, message: 'Popup not found' });
    if (!popup.dismissible) {
      return res.status(400).json({ success: false, message: 'This popup is not dismissible' });
    }
    await PopupDismissal.findOrCreate({
      where: { popupId: id, userId: req.user.id },
      defaults: { popupId: id, userId: req.user.id, companyId: req.user.companyId || null, dismissedAt: new Date() }
    });
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('dismissPopup error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const completePopup = async (req, res) => {
  try {
    const { id } = req.params;
    const popup = await AdminPopup.findByPk(id);
    if (!popup) return res.status(404).json({ success: false, message: 'Popup not found' });
    await PopupDismissal.findOrCreate({
      where: { popupId: id, userId: req.user.id },
      defaults: { popupId: id, userId: req.user.id, companyId: req.user.companyId || null, dismissedAt: new Date() }
    });
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('completePopup error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Super admin endpoints
export const listPopups = async (req, res) => {
  try {
    const { active } = req.query;
    const where = {};
    if (active === 'true') where.isActive = true;
    if (active === 'false') where.isActive = false;
    const items = await AdminPopup.findAll({
      where,
      include: [{ model: Company, as: 'companies', attributes: ['id', 'name'], through: { attributes: [] } }],
      order: [['createdAt', 'DESC']]
    });
    return res.status(200).json({ success: true, data: items });
  } catch (error) {
    console.error('listPopups error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const validatePopupPayload = (body, isUpdate = false) => {
  const errors = [];
  const required = (field) => {
    if (!isUpdate && (body[field] === undefined || body[field] === null || String(body[field]).trim() === '')) {
      errors.push(`${field} is required`);
    }
  };

  required('title');
  required('message');
  required('type');
  required('ctaAction');
  required('targetScope');
  required('startAt');
  required('endAt');

  const title = body.title;
  const message = body.message;
  if (title && hasHtml(title)) errors.push('title must not contain HTML');
  if (message && hasHtml(message)) errors.push('message must not contain HTML');

  const types = ['modal', 'banner', 'toast'];
  if (body.type && !types.includes(body.type)) errors.push('invalid type');

  if (body.type === 'banner') {
    if (!['top', 'bottom'].includes(body.bannerPosition)) errors.push('bannerPosition must be top or bottom for banner type');
  }

  const actions = ['billing', 'internal', 'external', 'close'];
  if (body.ctaAction && !actions.includes(body.ctaAction)) errors.push('invalid ctaAction');

  if (body.ctaAction === 'internal') {
    if (!body.ctaUrl || !String(body.ctaUrl).startsWith('/')) errors.push('ctaUrl must be an internal path starting with / for internal action');
  }
  if (body.ctaAction === 'external') {
    if (!body.ctaUrl || !/^https?:\/\//i.test(String(body.ctaUrl))) errors.push('ctaUrl must be a valid http(s) URL for external action');
  }
  if (body.ctaAction === 'close') {
    if (body.dismissible === false) errors.push('non-dismissible popup cannot have close-only action');
  }

  if (body.targetScope && !['all', 'trial', 'expired', 'specific'].includes(body.targetScope)) errors.push('invalid targetScope');
  if (body.targetScope === 'specific' && (!Array.isArray(body.companyIds) || body.companyIds.length === 0)) {
    errors.push('companyIds required for specific scope');
  }

  if (body.startAt && body.endAt) {
    const s = new Date(body.startAt);
    const e = new Date(body.endAt);
    if (!(s instanceof Date) || isNaN(s.getTime()) || !(e instanceof Date) || isNaN(e.getTime()) || s >= e) {
      errors.push('startAt must be before endAt');
    }
  }

  return errors;
};

export const createPopup = async (req, res) => {
  try {
    const errors = validatePopupPayload(req.body, false);
    if (errors.length) return res.status(400).json({ success: false, message: errors.join(', ') });

    const {
      title,
      message,
      type,
      bannerPosition,
      ctaText,
      ctaAction,
      ctaUrl,
      targetScope,
      startAt,
      endAt,
      dismissible = true,
      isActive = true,
      priority = 'info',
      companyIds = []
    } = req.body;

    const popup = await AdminPopup.create({
      title: String(title).trim(),
      message: String(message).trim(),
      type,
      bannerPosition: type === 'banner' ? bannerPosition : null,
      ctaText: ctaText ? String(ctaText).trim() : null,
      ctaAction,
      ctaUrl: ctaAction === 'internal' || ctaAction === 'external' ? String(ctaUrl).trim() : null,
      targetScope,
      startAt: new Date(startAt),
      endAt: new Date(endAt),
      dismissible: !!dismissible,
      isActive: !!isActive,
      priority,
      createdBy: req.user.id
    });

    if (targetScope === 'specific' && Array.isArray(companyIds) && companyIds.length > 0) {
      const rows = companyIds.map((cid) => ({ popupId: popup.id, companyId: cid }));
      await PopupCompany.bulkCreate(rows);
    }

    const withCompanies = await AdminPopup.findByPk(popup.id, {
      include: [{ model: Company, as: 'companies', attributes: ['id', 'name'], through: { attributes: [] } }]
    });

    return res.status(201).json({ success: true, data: withCompanies });
  } catch (error) {
    console.error('createPopup error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const updatePopup = async (req, res) => {
  try {
    const { id } = req.params;
    const popup = await AdminPopup.findByPk(id);
    if (!popup) return res.status(404).json({ success: false, message: 'Popup not found' });

    const errors = validatePopupPayload(req.body, true);
    if (errors.length) return res.status(400).json({ success: false, message: errors.join(', ') });

    const allowed = ['title', 'message', 'type', 'bannerPosition', 'ctaText', 'ctaAction', 'ctaUrl', 'targetScope', 'startAt', 'endAt', 'dismissible', 'isActive', 'priority'];
    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        popup[key] = req.body[key];
      }
    }

    if (popup.type !== 'banner') popup.bannerPosition = null;
    if (!(popup.ctaAction === 'internal' || popup.ctaAction === 'external')) popup.ctaUrl = null;

    await popup.save();

    if (req.body.targetScope === 'specific' && Array.isArray(req.body.companyIds)) {
      await PopupCompany.destroy({ where: { popupId: popup.id } });
      if (req.body.companyIds.length > 0) {
        const rows = req.body.companyIds.map((cid) => ({ popupId: popup.id, companyId: cid }));
        await PopupCompany.bulkCreate(rows);
      }
    }

    const withCompanies = await AdminPopup.findByPk(popup.id, {
      include: [{ model: Company, as: 'companies', attributes: ['id', 'name'], through: { attributes: [] } }]
    });

    return res.status(200).json({ success: true, data: withCompanies });
  } catch (error) {
    console.error('updatePopup error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const setPopupActive = async (req, res) => {
  try {
    const { id } = req.params;
    const { active } = req.body;
    const popup = await AdminPopup.findByPk(id);
    if (!popup) return res.status(404).json({ success: false, message: 'Popup not found' });
    popup.isActive = !!active;
    await popup.save();
    return res.status(200).json({ success: true, data: { id: popup.id, isActive: popup.isActive } });
  } catch (error) {
    console.error('setPopupActive error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const deletePopup = async (req, res) => {
  try {
    const { id } = req.params;
    await PopupCompany.destroy({ where: { popupId: id } });
    await PopupDismissal.destroy({ where: { popupId: id } });
    const deleted = await AdminPopup.destroy({ where: { id } });
    if (!deleted) return res.status(404).json({ success: false, message: 'Popup not found' });
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('deletePopup error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
