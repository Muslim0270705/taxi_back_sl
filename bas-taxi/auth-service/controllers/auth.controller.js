import {
    registerPassengerService,
    registerDriverService,
    authenticateUser,
    verifyPhoneCode,
    resendVerificationCode
} from '../services/auth.service.js';
import logger from '../utils/logger.js';
import { validateMiddleware } from '../middlewares/validate.middleware.js';
import {passengerRegisterSchema} from "../validators/register-passenger.validator.js";
import {driverRegistrationSchema} from "../validators/register-driver.validator.js";
import {verifyPhoneSchema} from "../validators/verify-number.validator.js";
import {loginSchema} from "../validators/login.validator.js";

export const registerPassenger = [
    validateMiddleware(passengerRegisterSchema),
    async (req, res) => {
        try {
            const { phoneNumber, password } = req.body;

            await registerPassengerService({ phoneNumber, password });

            res.status(201).json({ message: 'Пассажир успешно зарегистрирован. Проверьте SMS для подтверждения номера телефона.' });
        } catch (error) {
            logger.error('Ошибка при регистрации пассажира', { error: error.message });
            res.status(400).json({ error: error.message });
        }
    },
];

export const resendVerificationCodeController = async (req, res) => {
    try {
        const { phoneNumber } = req.body;

        if (!phoneNumber) {
            return res.status(400).json({ error: 'Номер телефона обязателен' });
        }

        await resendVerificationCode(phoneNumber);

        res.status(200).json({ message: 'Код верификации отправлен повторно' });
    } catch (error) {
        logger.error('Ошибка при повторной отправке кода верификации:', error.message);
        res.status(500).json({ error: error.message });
    }
};

export const registerDriver = [
    validateMiddleware(driverRegistrationSchema),
    async (req, res) => {
        try {
            const { phoneNumber, password } = req.body;
            const documentPath = req.file ? req.file.path : null;

            await registerDriverService({ phoneNumber, password, documentPath });

            res.status(201).json({ message: 'Водитель успешно зарегистрирован. Проверьте SMS для подтверждения номера телефона.' });
        } catch (error) {
            logger.error('Ошибка при регистрации водителя', { error: error.message });
            res.status(400).json({ error: error.message });
        }
    },
];

export const verifyPhone = [
    validateMiddleware(verifyPhoneSchema),
    async (req, res) => {
        try {
            const { phoneNumber, code } = req.body;

            await verifyPhoneCode(phoneNumber, code);

            res.json({ message: 'Номер телефона успешно подтвержден' });
        } catch (error) {
            logger.error('Ошибка при подтверждении номера телефона', { error: error.message });
            res.status(400).json({ error: error.message });
        }
    },
];

export const login = [
    validateMiddleware(loginSchema),
    async (req, res) => {
        try {
            const { phoneNumber, password } = req.body;

            const token = await authenticateUser(phoneNumber, password);

            res.json({ token });
        } catch (error) {
            logger.error('Ошибка при входе пользователя', { error: error.message });
            const statusCode = error.message === 'Неверные учетные данные' ? 400 : 403;
            res.status(statusCode).json({ error: error.message });
        }
    },
];
