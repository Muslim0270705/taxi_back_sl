import { getChannel } from '../utils/rabbitmq.js';
import { processPayment } from '../services/payment.service.js';
import ProcessedMessage from '../models/processed-message.model.js';
import logger from '../utils/logger.js';

export const subscribeToPaymentCommands = async () => {
    try {
        const channel = await getChannel();
        const exchangeName = 'payment_commands';
        await channel.assertExchange(exchangeName, 'direct', { durable: true });

        const q = await channel.assertQueue('payment_commands_queue', { durable: true });
        await channel.bindQueue(q.queue, exchangeName, 'process_payment');

        channel.consume(q.queue, async (msg) => {
            if (msg.content) {
                const command = JSON.parse(msg.content.toString());
                const messageId = msg.properties.messageId;

                const alreadyProcessed = await ProcessedMessage.findOne({ where: { messageId } });
                if (alreadyProcessed) {
                    logger.info(`Сообщение с messageId ${messageId} уже обработано`);
                    return;
                }

                try {
                    await processPayment(command.data);

                    await ProcessedMessage.create({ messageId, processedAt: new Date() });

                    await publishPaymentEvent('payment_success', { rideId: command.data.rideId });
                } catch (error) {
                    await publishPaymentEvent('payment_failed', { rideId: command.data.rideId });
                }
            }
        }, { noAck: true });

        logger.info('Подписка на payment_commands установлена');
    } catch (error) {
        logger.error('Ошибка при подписке на payment_commands', { error: error.message });
    }
};
