// src/services/websocketService.js
import { Server } from 'socket.io';
import logger from '../utils/logger.js';
import config from '../utils/config.js';
import redis from 'redis';

const createWebSocketService = (server) => {
    const io = new Server(server, {
        cors: {
            origin: "*", // Замените на URL вашего фронтенда
            methods: ["GET", "POST"]
        }
    });

    const redisClient = redis.createClient({
        socket: {
            host: config.redis.host,
            port: config.redis.port
        }
    });

    redisClient.on('error', (err) => logger.error('Redis Client Error', err));

    const connectRedis = async () => {
        try {
            await redisClient.connect();
            logger.info('Redis подключен для WebSocket-сервиса');
        } catch (error) {
            logger.error('Ошибка подключения к Redis:', error.message);
            setTimeout(connectRedis, 5000); // Повторное подключение через 5 секунд
        }
    };

    connectRedis();

    io.on('connection', (socket) => {
        logger.info(`Новое подключение: ${socket.id}`);

        socket.on('join_ride', (rideId) => {
            socket.join(`ride_${rideId}`);
            logger.info(`Сокет ${socket.id} присоединился к комнате ride_${rideId}`);
        });

        socket.on('disconnect', () => {
            logger.info(`Отключение сокета: ${socket.id}`);
        });
    });

    const emitRideUpdate = (rideId, update) => {
        io.to(`ride_${rideId}`).emit('ride_update', update);
        logger.info(`Обновление поездки ${rideId} отправлено в комнату ride_${rideId}`);
    };

    const emitParkingStatus = (driverId, parkingInfo) => {
        io.emit('driver_parking_update', parkingInfo);
        logger.info(`Обновление парковки водителя ${driverId} отправлено всем клиентам`);
    };

    return {
        emitRideUpdate,
        emitParkingStatus
    };
};

export default createWebSocketService;
