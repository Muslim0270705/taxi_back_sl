import Ride from '../models/ride.model.js';
import sequelize from '../utils/database.js';
import { initiatePayment, cancelPayment } from './paymenr.service.js';
import { publishRideEvent } from './event.publisher.js';
import logger from '../utils/logger.js';
import { v4 as uuidv4 } from 'uuid';
import retry from 'async-retry';
import {getDistanceAndDurationFromGeoService, sendRideRequestToGeoService} from './geo.service.js';
import { updateDriverLocationInGeoService } from './geo.service.js';
import websoketService from "./websoket.service";

export const requestRide = async (passengerId, origin, destination, city, paymentType, correlationId) => {
    const transaction = await sequelize.transaction();
    let ride = null;
    try {
        ride = await Ride.create({
            passengerId,
            origin,
            destination,
            city,
            paymentType,
            status: 'pending',
        }, { transaction });

        await sendRideRequestToGeoService(ride.id, origin, destination, city, correlationId);

        await transaction.commit();

        logger.info('Запрос на поездку успешно отправлен', { rideId: ride.id, correlationId });

        return ride;
    } catch (error) {
        await transaction.rollback();
        logger.error('Ошибка при создании поездки', { error: error.message, correlationId });
        throw error;
    }
};

export const processRideGeoData = async (geoData, correlationId) => {
    const transaction = await sequelize.transaction();
    try {
        const { rideId, originLocation, destinationLocation, distanceData, nearbyDrivers } = geoData;

        const ride = await Ride.findByPk(rideId, { transaction });
        if (!ride) {
            throw new Error(`Поездка с ID ${rideId} не найдена`);
        }

        ride.distance = distanceData.distance / 1000;
        ride.price = calculatePrice(ride.city, ride.distance);
        ride.driverId = nearbyDrivers[0].member;

        if (ride.paymentType === 'cash') {
            ride.status = 'in_progress';
        } else {
            ride.status = 'driver_assigned';
        }

        await ride.save({ transaction });

        if (ride.paymentType === 'card') {
            await initiatePayment(ride, correlationId);
        }

        await publishRideEvent('ride_started', ride, correlationId);

        await transaction.commit();
        logger.info('Поездка обновлена с гео-данными и водителем', { rideId: ride.id, correlationId });
    } catch (error) {
        await transaction.rollback();
        logger.error('Ошибка при обработке гео-данных поездки', { error: error.message, correlationId });
    }
};


export const createRideWithoutPassenger = async (driverId, origin, destination, city, correlationId) => {
    const transaction = await sequelize.transaction();
    let ride = null;
    try {
        ride = await Ride.create({
            driverId,
            origin,
            destination,
            city,
            status: 'in_progress',
        }, { transaction });

        await transaction.commit();

        logger.info('Поездка успешно создана водителем без пассажира', { rideId: ride.id, correlationId });

        return ride;
    } catch (error) {
        await transaction.rollback();
        logger.error('Ошибка при создании поездки водителем без пассажира', { error: error.message, correlationId });
        throw error;
    }
};

export const startRideByQR = async (passengerId, qrCodeData, destination, paymentType, correlationId) => {
    const transaction = await sequelize.transaction();
    let ride = null;
    try {
        const driverId = extractDriverIdFromQRCode(qrCodeData);

        ride = await Ride.create({
            passengerId,
            driverId,
            origin: 'Текущее местоположение пассажира',
            destination,
            city: 'Указать город',
            paymentType,
            status: 'in_progress',
        }, { transaction });

        if (paymentType === 'card') {
            await initiatePayment(ride, correlationId);
        }

        await transaction.commit();

        logger.info('Поездка успешно начата после сканирования QR-кода', { rideId: ride.id, correlationId });

        return ride;
    } catch (error) {
        await transaction.rollback();
        logger.error('Ошибка при создании поездки через QR-код', { error: error.message, correlationId });
        throw error;
    }
};

export const updateRideStatus = async (rideId, status, userId, userRole, correlationId) => {
    const transaction = await sequelize.transaction();
    try {
        const ride = await Ride.findByPk(rideId, { transaction });
        if (!ride) {
            throw new Error(`Поездка с ID ${rideId} не найдена`);
        }

        if (userRole === 'driver' && ride.driverId !== userId) {
            throw new Error('Вы не можете обновить статус этой поездки');
        }
        if (userRole === 'passenger' && ride.passengerId !== userId) {
            throw new Error('Вы не можете обновить статус этой поездки');
        }

        ride.status = status;
        await ride.save({ transaction });

        websoketService.emitRideUpdate(rideId, { status });

        await publishRideEvent('ride_status_updated', ride, correlationId);

        await transaction.commit();

        logger.info('Статус поездки обновлен', { rideId: ride.id, status, correlationId });

        return ride;
    } catch (error) {
        await transaction.rollback();
        logger.error('Ошибка при обновлении статуса поездки', { error: error.message, correlationId });
        throw error;
    }
};

export const getRideInfo = async (origin, destination, city, correlationId) => {
    try {
        const distanceData = await getDistanceAndDurationFromGeoService(origin, destination, correlationId);

        const distance = distanceData.distance / 1000; // в километрах
        const price = calculatePrice(city, distance);

        return { distance, price };
    } catch (error) {
        logger.error('Ошибка при получении информации о поездке', { error: error.message, correlationId });
        throw error;
    }
};

export const activateParkingMode = async (driverId, latitude, longitude, correlationId) => {
    try {
        await updateDriverLocationInGeoService(driverId, latitude, longitude, true, correlationId);

        logger.info('Режим парковки активирован', { driverId, correlationId });
    } catch (error) {
        logger.error('Ошибка при активации режима парковки', { error: error.message, correlationId });
        throw error;
    }
};

const extractDriverIdFromQRCode = (qrCodeData) => {
    return qrCodeData.driverId;
};

const calculatePrice = (city, distance) => {
    const tariff = getTariffForCity(city);
    return tariff.baseFare + (distance * tariff.costPerKm);
};

const getTariffForCity = (city) => {
    return {
        baseFare: 50,
        costPerKm: 10,
    };
};

// const getParkingDrivers = async () => {
//     const keys = await redisClient.keys('driver_parking:*');
//     const parkingDrivers = [];
//
//     for (const key of keys) {
//         const data = await redisClient.get(key);
//         if (data) {
//             parkingDrivers.push(JSON.parse(data));
//         }
//     }
//
//     return parkingDrivers;
// };

