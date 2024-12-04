import express from 'express';
import smsRoutes from './routes/sms.route.js';
import config from './utils/config.js';
import rabbitmqService from './utils/rabbitmq';
import logger from './utils/logger.js';

const app = express();

app.use(express.json());

app.use('/api', smsRoutes);

// Запуск сервера
app.listen(config.port, () => {
    logger.info(`SMS Service is running on port ${config.port}`);
});
