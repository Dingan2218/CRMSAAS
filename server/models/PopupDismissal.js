import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const PopupDismissal = sequelize.define('PopupDismissal', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  popupId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'AdminPopups',
      key: 'id'
    }
  },
  companyId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'Companies',
      key: 'id'
    }
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  dismissedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  timestamps: false
});

export default PopupDismissal;
