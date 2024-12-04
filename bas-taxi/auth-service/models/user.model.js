import { DataTypes } from 'sequelize';
import sequelize from '../utils/database.js';

const User = sequelize.define(
    'User',
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        email: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
            validate: { isEmail: true },
        },
        phoneNumber: {
            type: DataTypes.STRING,
            unique: true,
            allowNull: false,
        },
        password: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        role: {
            type: DataTypes.ENUM('passenger', 'driver', 'admin', 'moderator'),
            allowNull: false,
        },
        isApproved: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },
        isPhoneVerified: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },
        verificationCode: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        lastSmsSentAt: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        documentPath: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        iin: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        vehicleDetails: {
            type: DataTypes.JSON,
            allowNull: true,
        },
    },
    {
        tableName: 'users',
    }
);

export default User;
