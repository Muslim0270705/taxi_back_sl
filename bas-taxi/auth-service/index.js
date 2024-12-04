import express from 'express';
import dotenv from 'dotenv'
import cors from 'cors';
import logger from './utils/logger.js';
import authRoutes from './routes/auth.route.js';
import sequelize from './utils/database.js';
import {connectRabbitMQ} from "./utils/rabbitmq.js";
import * as client from "prom-client";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use((req, res, next) => {
    req.correlationId = req.headers['x-correlation-id'] || uuidv4();
    res.setHeader('X-Correlation-ID', req.correlationId);
    next();
});


const collectDefaultMetrics = client.collectDefaultMetrics;
collectDefaultMetrics();

app.get('/metrics', async (req, res) => {
    res.set('Content-Type', client.register.contentType);
    res.end(await client.register.metrics());
});

app.use('/uploads', express.static('uploads'));

sequelize.authenticate()
    .then(() => {
        logger.info('Успешное подключение к базе данных');
        return sequelize.sync();
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

app.use('/auth', authRoutes);

app.use((err, req, res, next) => {
    logger.error('Необработанная ошибка', {
        message: err.message,
        stack: err.stack,
    });
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
});

const PORT = process.env.PORT || 3001;
sequelize.sync().then(() => {
    app.listen(PORT, () => {
        logger.info(`Auth-Service запущен на порту ${PORT}`);
    });
}).catch(error => {
    logger.error('Ошибка подключения к базе данных', { error: error.message });
    process.exit(1);
});
