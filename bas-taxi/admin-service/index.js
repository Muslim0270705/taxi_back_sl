import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import adminRoutes from './routes/admin.route.js';
import logger from './utils/logger.js';
import { connectRabbitMQ } from './utils/rabbitmq.js';
import sequelize from "./utils/database.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3008;

app.use(cors());
app.use(express.json());

sequelize.authenticate()
    .then(() => {
        logger.info('Успешное подключение к базе данных');
        return sequelize.sync(); // Синхронизация моделей
    })
    .then(() => {
        logger.info('Модели синхронизированы');
    })
    .catch((err) => {
        logger.error('Ошибка подключения к базе данных', { error: err.message });
    });

connectRabbitMQ()
    .catch(err => {
        logger.error('Ошибка при подключении к RabbitMQ', { error: err.message });
    });

app.use('/', adminRoutes);


app.use((err, req, res, next) => {
    logger.error('Необработанная ошибка', {
        message: err.message,
        stack: err.stack,
    });
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
});

app.listen(PORT, () => {
    logger.info(`Admin Service запущен на порту ${PORT}`);
});
