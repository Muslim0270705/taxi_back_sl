import { DataTypes } from 'sequelize';
import sequelize from '../../auth-service/utils/database.js';

const DriverRequest = sequelize.define('DriverRequest', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    phoneNumber: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    documentPath: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    status: {
        type: DataTypes.ENUM('pending', 'approved', 'rejected'),
        defaultValue: 'pending',
    },
    reason: {
        type: DataTypes.STRING,
        allowNull: false,
    }
}, {
    tableName: 'driver_requests',
    timestamps: true,
});

export default DriverRequest;
