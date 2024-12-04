import crypto from "node:crypto";
import { getChannel } from '../utils/rabbitmq.js';
import axios from 'axios';
import logger from '../utils/logger.js';

const uuidv4 = crypto.randomUUID()

const GEO_SERVICE_URL = process.env.GEO_SERVICE_URL || 'http://geo-service:3008';

export const sendRideRequestToGeoService = async (rideId, origin, destination, city, correlationId) => {
    const channel = getChannel();
    const exchangeName = 'ride_requests';
    await channel.assertExchange(exchangeName, 'fanout', { durable: true });

    const messageId = uuidv4();
    const message = {
        event: 'ride_requested',
        data: {
            rideId,
            origin,
            destination,
            city,
        },
    };

    channel.publish(exchangeName, '', Buffer.from(JSON.stringify(message)), {
        messageId,
        contentType: 'application/json',
        headers: {
            'x-correlation-id': correlationId,
        },
    });

    logger.info('Запрос на поездку отправлен в geo-service', { rideId, messageId, correlationId });
};

export const updateDriverLocationInGeoService = async (driverId, latitude, longitude, isParkingMode, correlationId) => {
    const channel = getChannel();
    const exchangeName = 'driver_location_updates';
    await channel.assertExchange(exchangeName, 'fanout', { durable: true });

    const messageId = uuidv4();
    const message = {
        event: 'driver_location_update',
        data: {
            driverId,
            latitude,
            longitude,
            isParkingMode,
        },
    };

    channel.publish(exchangeName, '', Buffer.from(JSON.stringify(message)), {
        messageId,
        contentType: 'application/json',
        headers: {
            'x-correlation-id': correlationId,
        },
    });

    logger.info('Обновление местоположения водителя отправлено в geo-service', { driverId, messageId, correlationId });
};

export const getDistanceAndDurationFromGeoService = async (origin, destination, correlationId) => {
    try {
        const response = await axios.post(`${GEO_SERVICE_URL}/geo/distance`, {
            origin,
            destination,
        }, {
            headers: {
                'X-Correlation-ID': correlationId,
            },
        });

        if (response.status === 200) {
            logger.info('Получены данные расстояния и времени из geo-service', { correlationId });
            return response.data;
        } else {
            logger.error('Ошибка при получении данных из geo-service', { status: response.status, correlationId });
            throw new Error('Ошибка при получении данных из geo-service');
        }
    } catch (error) {
        logger.error('Ошибка при запросе к geo-service', { error: error.message, correlationId });
        throw new Error('Не удалось получить данные о расстоянии и времени из geo-service');
    }
};

