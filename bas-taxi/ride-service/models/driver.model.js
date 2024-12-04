import { DataTypes } from 'sequelize';
import sequelize from '../utils/database.js';

const Driver = sequelize.define('Driver', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    isParkingMode: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
}, {
    tableName: 'drivers',
    timestamps: true,
});

export default Driver;
