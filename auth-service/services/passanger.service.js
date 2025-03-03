import logger from '../utils/logger.js';
import User from '../models/user.model.js';
import { generateVerificationCode } from '../utils/generate-code.js';
import { sendVerificationCode } from "../utils/sms.service.js";
import jwt from "jsonwebtoken";
import ChangePhone from "../models/change-phone.model.js";

const SMS_SEND_INTERVAL_MS = 60 * 1000;

export const registerPassengerService = async ({ phoneNumber }) => {
    logger.info('registerPassengerService: Начало регистрации пассажира');

    const existingUser = await User.findOne({ where: { phoneNumber } });
    if (existingUser) {
        logger.warn('registerPassengerService: Пользователь с таким номером телефона уже существует', { phoneNumber });
        throw new Error('Номер телефона уже используется');
    }

    const verificationCode = generateVerificationCode();
    logger.info('registerPassengerService: Сгенерирован код верификации', { verificationCode });

    const user = await User.create({
        phoneNumber,
        role: 'passenger',
        fullName: phoneNumber,
        isApproved: true,
        isPhoneVerified: true,
        verificationCode,
        lastSmsSentAt: new Date(),
    });
    logger.info('registerPassengerService: Пользователь создан', { user });

    await sendVerificationCode(phoneNumber, verificationCode);
    logger.info('registerPassengerService: Код верификации отправлен', { phoneNumber, verificationCode });

    return user;
};

export const loginPassengerService = async ({ phoneNumber }) => {
    logger.info('loginOrRegisterPassengerService: Начало обработки логина или регистрации', { phoneNumber });

    let user = await User.findOne({ where: { phoneNumber } });
    const now = new Date();
    let created = false;

    if (!user) {
        logger.info('loginOrRegisterPassengerService: Пользователь не найден, создаем нового пассажира', { phoneNumber });

        const verificationCode = generateVerificationCode();
        logger.info('loginOrRegisterPassengerService: Сгенерирован код верификации', { verificationCode });

        user = await User.create({
            phoneNumber,
            role: 'passenger',
            isApproved: true,
            isPhoneVerified: false,
            verificationCode,
            lastSmsSentAt: now,
        });
        logger.info('loginOrRegisterPassengerService: Пользователь создан', { user });

        created = true;

        await sendVerificationCode(phoneNumber, verificationCode);
        logger.info('loginOrRegisterPassengerService: Код верификации отправлен', { phoneNumber, verificationCode });
    } else {
        if (user.lastSmsSentAt && now - user.lastSmsSentAt < SMS_SEND_INTERVAL_MS) {
            const remainingTime = Math.ceil((SMS_SEND_INTERVAL_MS - (now - user.lastSmsSentAt)) / 1000);
            logger.warn('loginOrRegisterPassengerService: Слишком частая отправка SMS', { phoneNumber, remainingTime });
            throw new Error(`Подождите ${remainingTime} секунд перед повторной отправкой SMS`);
        }

        const verificationCode = generateVerificationCode();
        logger.info('loginOrRegisterPassengerService: Сгенерирован новый код верификации', { verificationCode });

        user.verificationCode = verificationCode;
        user.lastSmsSentAt = now;
        await user.save();
        logger.info('loginOrRegisterPassengerService: Обновлён код верификации в базе данных', { phoneNumber, verificationCode });

        await sendVerificationCode(phoneNumber, verificationCode);
        logger.info('loginOrRegisterPassengerService: Код верификации отправлен', { phoneNumber, verificationCode });
    }

    return { created };
};

export const loginPassengerWebService = async ({ phoneNumber }) => {
    logger.info('loginOrRegisterPassengerService: Начало обработки логина или регистрации', { phoneNumber });
    let token;
    let user = await User.findOne({ where: { phoneNumber } });
    let created = false;

    if (!user) {
        logger.info('loginOrRegisterPassengerWebService: Пользователь не найден, создаем нового пассажира', { phoneNumber });

        user = await User.create({
            phoneNumber,
            role: 'passenger',
            isApproved: true,
            isPhoneVerified: true
        });
        created = true;
        logger.info('loginOrRegisterPassengerWebService: Пользователь создан', { user });
    }

    token = jwt.sign(
        { userId: user.id, phoneNumber: user.phoneNumber, role: user.role },
        process.env.JWT_SECRET || 'your_jwt_secret',
        { expiresIn: '20d' }
    );

    return { userId: user.id, token, created };
};

export const confirmLoginService = async ({ phoneNumber, verificationCode }) => {
    logger.info('confirmLoginService: Начало подтверждения логина');

    let user = await User.findOne({ where: { phoneNumber } });


    if (!user) {
        logger.warn('confirmLoginService: Пользователь с таким номером телефона не найден', { phoneNumber });
        throw new Error('Пользователь не найден');
    }

    if (user.verificationCode !== verificationCode) {
        logger.warn('confirmLoginService: Неверный код верификации', { phoneNumber, verificationCode });
        throw new Error('Неверный код верификации');
    }

    user.isPhoneVerified = true;
    user.verificationCode = null;
    await user.save();
    logger.info('confirmLoginService: Пользователь подтверждён', { phoneNumber });

    const token = jwt.sign(
        { userId: user.id, phoneNumber: user.phoneNumber, role: user.role },
        process.env.JWT_SECRET || 'your_jwt_secret',
        { expiresIn: '20d' }
    );

    logger.info('confirmLoginService: JWT-токен сгенерирован', { token });

    return { userId: user.id, token };
};


export const changePhoneService = async ({phoneNumber, userId}) => {
    try {
        const user = await User.findByPk(userId);
        if (!user) {
            logger.warn('changePhoneService: Пользователь не найден', { phoneNumber });
            throw new Error('Пользователь не найден');
        }

        const verificationCode = generateVerificationCode();
        const lastSmsSentAt = new Date();

        const changeRequest = await ChangePhone.create({
            user_id: userId,
            phoneNumber: phoneNumber,
            verificationCode,
            lastSmsSentAt,
        });

        await sendVerificationCode(phoneNumber, verificationCode);
        return true;
    } catch (error) {
        console.error('Ошибка в /change-phone:', error);
        return false;
    }
}

export const confirmPhoneService = async ({ phoneNumber, verificationCode, userId }) => {
    const changeRequest = await ChangePhone.findOne({
        where: {
            user_id: userId,
            phoneNumber,
            verificationCode
        },
        order: [['createdAt', 'DESC']]
    });

    if (!changeRequest) {
        throw new Error('Неверный код подтверждения или запрос не найден');
    }

    const user = await User.findByPk(userId);
    if (!user) {
        throw new Error('Пользователь не найден');
    }

    user.phoneNumber = changeRequest.phoneNumber;
    await user.save();
    await changeRequest.destroy();
};