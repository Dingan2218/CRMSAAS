import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Company = sequelize.define('Company', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  subscriptionStatus: {
    type: DataTypes.ENUM('trial', 'active', 'expired'),
    defaultValue: 'trial'
  },
  trialEndsAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  logoUrl: {
    type: DataTypes.STRING,
    allowNull: true
  },
  primaryColor: {
    type: DataTypes.STRING,
    defaultValue: '#DC2626' // Red default
  },
  maxUsers: {
    type: DataTypes.INTEGER,
    defaultValue: 5
  }
}, {
  timestamps: true
});

export default Company;
