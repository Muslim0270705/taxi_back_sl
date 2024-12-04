import express from 'express';
import createRideController from '../controllers/ride.controller.js';
import authMiddleware from "../middlewares/auth.middleware";

const router = express.Router();

const rideRoutes = (websocketService) => {
    const {
        createRideRequest,
        createRideWithoutPassenger,
        createRideByQR,
        updateRideStatus,
        getRideInfo,
        setDriverParking,
        getParkingDrivers
    } = createRideController(websocketService);

    router.post('/request', authMiddleware('passenger'), requestRideHandler);

    router.post('/without-passenger', authMiddleware('driver'), createRideWithoutPassengerHandler);

    router.post('/start-by-qr', authMiddleware('passenger'), startRideByQRHandler);

    router.put('/update-status', authMiddleware(['driver', 'passenger']), updateRideStatusHandler);

    router.get('/price', authMiddleware(['driver', 'passenger']), getRideInfoHandler);

    router.post('/parking', authMiddleware('driver'), activateParkingModeHandler);

    router.get('/rides/parking', getParkingDrivers);

    return router;
};

export default rideRoutes;
