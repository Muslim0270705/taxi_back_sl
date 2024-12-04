import { getChannel } from '../utils/rabbitmq.js';
import logger from '../utils/logger.js';
import redis from '../utils/redis.js';

let tariffs = {
    baseFare: 50,
    costPerKm: 10,
    costPerMinute: 5,
};

export const getTariffs = () => tariffs;

export const updateTariffs = (newTariffs) => {
    tariffs = { ...tariffs, ...newTariffs };
    logger.info('Тарифы обновлены локально', tariffs);

    redis.set('tariffs', JSON.stringify(tariffs));
};

export const subscribeToTariffUpdates = async () => {
    const channel = await getChannel();
    const exchangeName = 'settings_events';

    await channel.assertExchange(exchangeName, 'fanout', { durable: true });
    const q = await channel.assertQueue('', { exclusive: true });
    await channel.bindQueue(q.queue, exchangeName, '');

    channel.consume(q.queue, (msg) => {
        if (msg.content) {
            const message = JSON.parse(msg.content.toString());
            if (message.event === 'settings_updated') {
                updateTariffs(message.data);
            }
        }
    }, { noAck: true });
};
