import User from './User.js';
import Lead from './Lead.js';
import Activity from './Activity.js';
import Company from './Company.js';
import AdminPopup from './AdminPopup.js';
import PopupCompany from './PopupCompany.js';
import PopupDismissal from './PopupDismissal.js';

import SuperAdminMessage from './SuperAdminMessage.js';

// Define associations
User.hasMany(Lead, { foreignKey: 'assignedTo', as: 'leads' });
Lead.belongsTo(User, { foreignKey: 'assignedTo', as: 'salesperson' });

User.hasMany(Activity, { foreignKey: 'userId', as: 'activities' });
Activity.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Lead.hasMany(Activity, { foreignKey: 'leadId', as: 'activities' });
Activity.belongsTo(Lead, { foreignKey: 'leadId', as: 'lead' });

// Company relationships
Company.hasMany(User, { foreignKey: 'companyId', as: 'users' });
User.belongsTo(Company, { foreignKey: 'companyId', as: 'company' });

// Popups relationships
AdminPopup.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });
AdminPopup.belongsToMany(Company, { through: PopupCompany, foreignKey: 'popupId', otherKey: 'companyId', as: 'companies' });
Company.belongsToMany(AdminPopup, { through: PopupCompany, foreignKey: 'companyId', otherKey: 'popupId', as: 'popups' });

PopupDismissal.belongsTo(AdminPopup, { foreignKey: 'popupId', as: 'popup' });
PopupDismissal.belongsTo(Company, { foreignKey: 'companyId', as: 'company' });
PopupDismissal.belongsTo(User, { foreignKey: 'userId', as: 'user' });

export { User, Lead, Activity, Company, AdminPopup, PopupCompany, PopupDismissal, SuperAdminMessage };
