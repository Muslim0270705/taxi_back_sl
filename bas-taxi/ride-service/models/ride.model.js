import { DataTypes } from 'sequelize';
import sequelize from '../utils/database.js';

const Ride = sequelize.define('Ride', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    passengerId: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    driverId: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    origin: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    destination: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    city: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    distance: {
        type: DataTypes.FLOAT,
        allowNull: true,
    },
    price: {
        type: DataTypes.FLOAT,
        allowNull: true,
    },
    paymentType: {
        type: DataTypes.ENUM('cash', 'card'),
        allowNull: false,
        defaultValue: 'card',
    },
    status: {
        type: DataTypes.ENUM('pending', 'driver_assigned', 'in_progress', 'completed', 'cancelled'),
        defaultValue: 'pending',
    },
}, {
    tableName: 'rides',
    timestamps: true,
});

export default Ride;
