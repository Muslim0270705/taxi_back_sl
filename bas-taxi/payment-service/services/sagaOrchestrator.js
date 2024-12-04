import { getChannel } from '../utils/rabbitmq.js';
import Payment from '../models/payment.model.js';
import logger from '../utils/logger.js';

export const initiatePaymentSaga = async (paymentData) => {
    const channel = await getChannel();
    const exchangeName = 'payment_saga';
    await channel.assertExchange(exchangeName, 'topic', { durable: true });

    try {
        const payment = await Payment.create(paymentData);

        const message = {
            sagaId: payment.id,
            event: 'PaymentInitiated',
            data: {
                paymentId: payment.id,
                rideId: payment.rideId,
                amount: payment.amount,
                passengerId: payment.passengerId,
            },
        };
        channel.publish(exchangeName, 'payment.initiated', Buffer.from(JSON.stringify(message)));
        logger.info('Платеж инициирован', message);

        return payment;
    } catch (error) {
        logger.error('Ошибка при инициации платежа', { error: error.message });
        throw error;
    }
};

export const startConsuming = async () => {
    const channel = await getChannel();
    const exchangeName = 'payment_saga';
    await channel.assertExchange(exchangeName, 'topic', { durable: true });
    const q = await channel.assertQueue('', { exclusive: true });
    await channel.bindQueue(q.queue, exchangeName, '#');

    channel.consume(q.queue, async (msg) => {
        if (msg.content) {
            const message = JSON.parse(msg.content.toString());
            logger.info('Получено сообщение в Saga Orchestrator', message);
            switch (message.event) {
                case 'RideCompleted':
                    await handleRideCompleted(message.data);
                    break;
                default:
                    logger.warn('Неизвестное событие', { event: message.event });
            }
        }
    }, { noAck: true });
};

const handleRideCompleted = async (data) => {
    try {
        const paymentData = {
            rideId: data.rideId,
            amount: data.amount,
            passengerId: data.passengerId,
        };
        await initiatePaymentSaga(paymentData);
    } catch (error) {
        logger.error('Ошибка при обработке RideCompleted', { error: error.message });
    }
};
