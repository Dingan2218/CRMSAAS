import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Lead = sequelize.define('Lead', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  date: {
    type: DataTypes.DATE,
    allowNull: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      isEmail: true
    }
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: false
  },
  country: {
    type: DataTypes.STRING,
    allowNull: false
  },
  product: {
    type: DataTypes.STRING,
    allowNull: true
  },
  source: {
    type: DataTypes.STRING,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('fresh', 'follow-up', 'rnr', 'closed', 'dead', 'registered', 'cancelled', 'rejected'),
    defaultValue: 'fresh'
  },
  priority: {
    type: DataTypes.ENUM('low', 'medium', 'high'),
    defaultValue: 'medium'
  },
  value: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  lastCalled: {
    type: DataTypes.DATE,
    allowNull: true
  },
  assignedTo: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  closedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  conversionRate: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 0
  }
}, {
  timestamps: true
});

export default Lead;
