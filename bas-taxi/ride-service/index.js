import express from 'express';
import http from 'http';
import rideRoutesFactory from './routes/ride.route.js';
import config from './utils/config.js';
import logger from './utils/logger.js';
import createWebSocketService from './services/websoket.service.js';
import client from 'prom-client';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import {startRideSubscribers} from "./services/ride.subscribe";
import {subscribeToTariffUpdates} from "./services/tariff.service";

const app = express();
const server = http.createServer(app);

app.use(express.json());

const websocketService = createWebSocketService(server);

const rideRoutes = rideRoutesFactory(websocketService);
app.use('/api', rideRoutes);

const collectDefaultMetrics = client.collectDefaultMetrics;
collectDefaultMetrics({ timeout: 5000 });

const webSocketService = createWebSocketService(server);

app.get('/metrics', async (req, res) => {
    try {
        res.set('Content-Type', client.register.contentType);
        res.end(await client.register.metrics());
    } catch (error) {
        res.status(500).end(error);
    }
});

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Ride Service API',
            version: '1.0.0',
            description: 'API документация для Ride Service'
        },
        servers: [
            {
                url: `http://localhost:${config.port}/api`,
                description: 'Development server'
            }
        ],
    },
    apis: ['./src/routes/*.js'], // Пути к файлам с аннотациями Swagger
};

const specs = swaggerJsdoc(options);
app.use(config.swagger.path, swaggerUi.serve, swaggerUi.setup(specs));

await startRideSubscribers();
await subscribeToTariffUpdates(webSocketService);

server.listen(config.port, () => {
    logger.info(`Ride Service is running on port ${config.port}`);
});
