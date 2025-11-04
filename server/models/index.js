import User from './User.js';
import Lead from './Lead.js';
import Activity from './Activity.js';

// Define associations
User.hasMany(Lead, { foreignKey: 'assignedTo', as: 'leads' });
Lead.belongsTo(User, { foreignKey: 'assignedTo', as: 'salesperson' });

User.hasMany(Activity, { foreignKey: 'userId', as: 'activities' });
Activity.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Lead.hasMany(Activity, { foreignKey: 'leadId', as: 'activities' });
Activity.belongsTo(Lead, { foreignKey: 'leadId', as: 'lead' });

export { User, Lead, Activity };
