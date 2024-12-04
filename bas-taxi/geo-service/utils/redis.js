import { createClient } from 'redis';
import logger from './logger.js';

const redisClient = createClient({
    url: `redis://${process.env.REDIS_HOST || 'redis://localhost'}:${process.env.REDIS_PORT || 6379}`,
});

redisClient.on('error', (err) => {
    logger.error('Ошибка подключения к Redis', { error: err.message });
});

redisClient.on('connect', () => {
    logger.info('Подключено к Redis');
});

await redisClient.connect();

export default redisClient;
