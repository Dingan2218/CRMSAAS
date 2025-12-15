import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const AdminPopup = sequelize.define('AdminPopup', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  type: {
    type: DataTypes.ENUM('modal', 'banner', 'toast'),
    allowNull: false
  },
  bannerPosition: {
    type: DataTypes.ENUM('top', 'bottom'),
    allowNull: true
  },
  ctaText: {
    type: DataTypes.STRING,
    allowNull: true
  },
  ctaAction: {
    type: DataTypes.ENUM('billing', 'internal', 'external', 'close'),
    allowNull: false,
    defaultValue: 'close'
  },
  ctaUrl: {
    type: DataTypes.STRING,
    allowNull: true
  },
  targetScope: {
    type: DataTypes.ENUM('all', 'trial', 'expired', 'specific'),
    allowNull: false,
    defaultValue: 'all'
  },
  startAt: {
    type: DataTypes.DATE,
    allowNull: false
  },
  endAt: {
    type: DataTypes.DATE,
    allowNull: false
  },
  dismissible: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  },
  priority: {
    type: DataTypes.ENUM('payment', 'announcement', 'info'),
    allowNull: false,
    defaultValue: 'info'
  },
  createdBy: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  }
}, {
  timestamps: true
});

export default AdminPopup;
