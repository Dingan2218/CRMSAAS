import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const PopupCompany = sequelize.define('PopupCompany', {
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
    allowNull: false,
    references: {
      model: 'Companies',
      key: 'id'
    }
  }
}, {
  timestamps: false
});

export default PopupCompany;
