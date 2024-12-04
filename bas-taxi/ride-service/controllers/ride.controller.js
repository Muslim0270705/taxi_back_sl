import {
    requestRide,
    createRideWithoutPassenger,
    startRideByQR,
    updateRideStatus,
    getRideInfo,
    activateParkingMode,
} from '../services/ride.service.js';
import logger from '../utils/logger.js';

export const requestRideHandler = async (req, res) => {
    try {
        const { origin, destination, city, paymentType = 'card' } = req.body;
        const passengerId = req.user.userId;
        const correlationId = req.correlationId;

        if (!['cash', 'card'].includes(paymentType)) {
            return res.status(400).json({ error: 'Некорректный тип оплаты', correlationId });
        }

        const ride = await requestRide(passengerId, origin, destination, city, paymentType, correlationId);

        res.status(201).json({ message: 'Поездка успешно создана', ride });
    } catch (error) {
        logger.error('Ошибка при создании поездки', { error: error.message, correlationId: req.correlationId });
        res.status(400).json({ error: error.message, correlationId: req.correlationId });
    }
};

export const createRideWithoutPassengerHandler = async (req, res) => {
    try {
        const { origin, destination, city } = req.body;
        const driverId = req.user.userId;
        const correlationId = req.correlationId;

        const ride = await createRideWithoutPassenger(driverId, origin, destination, city, correlationId);

        res.status(201).json({ message: 'Поездка успешно создана водителем', ride });
    } catch (error) {
        logger.error('Ошибка при создании поездки водителем', { error: error.message, correlationId: req.correlationId });
        res.status(400).json({ error: error.message, correlationId: req.correlationId });
    }
};

export const startRideByQRHandler = async (req, res) => {
    try {
        const { qrCodeData, destination, paymentType = 'card' } = req.body;
        const passengerId = req.user.userId;
        const correlationId = req.correlationId;

        if (!['cash', 'card'].includes(paymentType)) {
            return res.status(400).json({ error: 'Некорректный тип оплаты', correlationId });
        }

        const ride = await startRideByQR(passengerId, qrCodeData, destination, paymentType, correlationId);

        res.status(201).json({ message: 'Поездка успешно начата после сканирования QR-кода', ride });
    } catch (error) {
        logger.error('Ошибка при создании поездки через QR-код', { error: error.message, correlationId: req.correlationId });
        res.status(400).json({ error: error.message, correlationId: req.correlationId });
    }
};

export const updateRideStatusHandler = async (req, res) => {
    try {
        const { rideId, status } = req.body;
        const userId = req.user.userId;
        const userRole = req.user.role;
        const correlationId = req.correlationId;

        const ride = await updateRideStatus(rideId, status, userId, userRole, correlationId);

        res.status(200).json({ message: 'Статус поездки обновлен', ride });
    } catch (error) {
        logger.error('Ошибка при обновлении статуса поездки', { error: error.message, correlationId: req.correlationId });
        res.status(400).json({ error: error.message, correlationId: req.correlationId });
    }
};

export const getRideInfoHandler = async (req, res) => {
    try {
        const { origin, destination, city } = req.query;
        const correlationId = req.correlationId;

        const info = await getRideInfo(origin, destination, city, correlationId);

        res.status(200).json({ message: 'Информация о поездке получена', info });
    } catch (error) {
        logger.error('Ошибка при получении информации о поездке', { error: error.message, correlationId: req.correlationId });
        res.status(400).json({ error: error.message, correlationId: req.correlationId });
    }
};

export const activateParkingModeHandler = async (req, res) => {
    try {
        const driverId = req.user.userId;
        const { latitude, longitude } = req.body;
        const correlationId = req.correlationId;

        await activateParkingMode(driverId, latitude, longitude, correlationId);

        res.status(200).json({ message: 'Режим парковки активирован' });
    } catch (error) {
        logger.error('Ошибка при активации режима парковки', { error: error.message, correlationId: req.correlationId });
        res.status(400).json({ error: error.message, correlationId: req.correlationId });
    }

}
