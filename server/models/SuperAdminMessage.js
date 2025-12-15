import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const SuperAdminMessage = sequelize.define('SuperAdminMessage', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false
    },
    content: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    type: {
        type: DataTypes.ENUM('all', 'specific'),
        defaultValue: 'all'
    },
    targetCompanyId: {
        type: DataTypes.UUID,
        allowNull: true
    }
}, {
    timestamps: true
});

export default SuperAdminMessage;
