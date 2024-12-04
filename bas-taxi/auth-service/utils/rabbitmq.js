import amqp from 'amqplib';
import dotenv from 'dotenv';
import logger from './logger.js';
import User from '../models/user.model.js';

dotenv.config();

let channel;

const assertQueueAndBind = async (exchange, queueName) => {
    await channel.assertExchange(exchange, 'fanout', { durable: true });
    const { queue } = await channel.assertQueue(queueName, { exclusive: true });
    await channel.bindQueue(queue, exchange, '');
    return queue;
};

const handleDriverApproval = async (msg) => {
    if (msg.content) {
        const message = JSON.parse(msg.content.toString());
        logger.info('Получено сообщение об одобрении водителя', message);
        try {
            const user = await User.findByPk(message.userId);
            if (user && user.role === 'driver') {
                user.isApproved = true;
                await user.save();
                logger.info('Водитель одобрен', { userId: user.id });
            }
        } catch (error) {
            logger.error('Ошибка при одобрении водителя через RabbitMQ', { error: error.message });
        }
    }
};

const handleDriverRejection = async (msg) => {
    if (msg.content) {
        const message = JSON.parse(msg.content.toString());
        logger.info('Получено сообщение об отклонении водителя', message);
        try {
            const user = await User.findByPk(message.userId);
            if (user && user.role === 'driver') {
                user.isApproved = false;
                await user.save();
                logger.info('Водитель отклонён', { userId: user.id });
            }
        } catch (error) {
            logger.error('Ошибка при отклонении водителя через RabbitMQ', { error: error.message });
        }
    }
};

export const connectRabbitMQ = async () => {
    try {
        const connection = await amqp.connect(process.env.RABBITMQ_URL);
        channel = await connection.createChannel();
        logger.info('Успешное подключение к RabbitMQ');

        const approvalQueue = await assertQueueAndBind('driver_approval', 'approvalQueue');
        channel.consume(approvalQueue, handleDriverApproval, { noAck: true });

        const rejectionQueue = await assertQueueAndBind('driver_rejection', 'rejectionQueue');
        channel.consume(rejectionQueue, handleDriverRejection, { noAck: true });

    } catch (error) {
        logger.error('Ошибка подключения к RabbitMQ:', error);
        throw error;
    }
};

export const getChannel = async () => {
    if (!channel) {
        await connectRabbitMQ();
    }
    return channel;
};