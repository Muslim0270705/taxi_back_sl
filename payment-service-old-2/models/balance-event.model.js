// payment-service/src/models/balanceEvent.model.js
import { DataTypes } from 'sequelize';
import sequelize from '../utils/database.js'; // Ваш sequelize instance

const BalanceEvent = sequelize.define('BalanceEvent', {
    driverId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'driver_id'
    },
    eventType: {
        type: DataTypes.STRING,
        allowNull: false,
        field: 'event_type'
    },
    eventData: {
        type: DataTypes.JSONB,
        allowNull: false,
        field: 'event_data'
    },
    eventTimestamp: {
        type: DataTypes.DATE,
        allowNull: false,
        field: 'event_timestamp',
        defaultValue: DataTypes.NOW
    }
}, {
    tableName: 'balance_events',
    timestamps: false
});

export default BalanceEvent;
