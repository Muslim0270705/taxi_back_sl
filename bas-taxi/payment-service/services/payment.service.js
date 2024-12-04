import Balance from '../models/payment.model.js';
import {Model as PaymentMethod} from "sequelize";

export const topUpBalanceService = async (userId, amount, role) => {
    if (role !== 'driver') {
        throw new Error('Только водители могут пополнять баланс');
    }

    let balance = await Balance.findOne({ where: { driverId: userId } });
    if (!balance) {
        balance = await Balance.create({ driverId: userId, amount: 0 });
    }

    balance.amount += parseFloat(amount);
    await balance.save();
    return balance;
};

export const getBalanceHistoryService = async (userId, role) => {
    if (role !== 'driver') {
        throw new Error('Нет доступа');
    }

    const balance = await Balance.findOne({ where: { driverId: userId } });
    return balance;
};

export const processPayment = async ({ rideId, passengerId, amount }) => {
    const paymentMethod = await PaymentMethod.findOne({ where: { userId: passengerId } });
    if (!paymentMethod) {
        throw new Error('Метод оплаты не найден');
    }

    await chargeCard(paymentMethod.cardToken, amount);
};