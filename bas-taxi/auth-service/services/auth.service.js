import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';
import { getChannel } from '../utils/rabbitmq.js';
import logger from '../utils/logger.js';
import dotenv from 'dotenv';
import { sendVerificationCode } from '../utils/sms.service.js';

dotenv.config();

const generateVerificationCode = () => Math.floor(100000 + Math.random() * 900000).toString();
const SMS_RESEND_INTERVAL = 60 * 1000;

export const registerPassengerService = async ({ phoneNumber, password }) => {
    const existingUser = await User.findOne({ where: { phoneNumber } });
    if (existingUser) {
        throw new Error('Номер телефона уже используется');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationCode = generateVerificationCode();

    const user = await User.create({
        phoneNumber,
        password: hashedPassword,
        role: 'passenger',
        isApproved: true,
        isPhoneVerified: false,
        verificationCode,
        lastSmsSentAt: new Date(),
    });

    await sendVerificationCode(phoneNumber, verificationCode);

    return user;
};

export const resendVerificationCode = async (phoneNumber) => {
    const user = await User.findOne({ where: { phoneNumber } });
    if (!user) {
        throw new Error('Пользователь не найден');
    }

    if (user.isPhoneVerified) {
        throw new Error('Номер телефона уже подтвержден');
    }

    const now = new Date();
    if (user.lastSmsSentAt && now - new Date(user.lastSmsSentAt) < SMS_RESEND_INTERVAL) {
        throw new Error('Переотправка SMS возможна только через минуту');
    }

    const newCode = generateVerificationCode();
    user.verificationCode = newCode;
    user.lastSmsSentAt = now;
    await user.save();

    await sendVerificationCode(phoneNumber, newCode);
    logger.info('Код подтверждения повторно отправлен', { phoneNumber });

    return { message: 'Код подтверждения повторно отправлен' };
};

export const registerDriverService = async ({ phoneNumber, password, documentPath }) => {
    const existingUser = await User.findOne({ where: { phoneNumber } });
    if (existingUser) {
        throw new Error('Номер телефона уже используется');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationCode = generateVerificationCode();

    const user = await User.create({
        phoneNumber,
        password: hashedPassword,
        role: 'driver',
        isApproved: false,
        isPhoneVerified: false,
        verificationCode,
        lastSmsSentAt: new Date(),
        documentPath,
    });

    await sendVerificationCode(phoneNumber, verificationCode);

    const channel = await getChannel();
    const exchangeName = 'driver_verification';
    await channel.assertExchange(exchangeName, 'fanout', { durable: true });
    const verificationMessage = {
        userId: user.id,
        phoneNumber: user.phoneNumber,
        documentPath: user.documentPath,
    };
    channel.publish(exchangeName, '', Buffer.from(JSON.stringify(verificationMessage)), {
        persistent: true,
    });
    logger.info('Данные водителя отправлены на проверку', verificationMessage);

    return user;
};

export const verifyPhoneCode = async (phoneNumber, code) => {
    const user = await User.findOne({ where: { phoneNumber } });
    if (!user) {
        throw new Error('Пользователь не найден');
    }

    if (user.verificationCode !== code) {
        throw new Error('Неверный код подтверждения');
    }

    user.isPhoneVerified = true;
    user.verificationCode = null;
    await user.save();
};

export const authenticateUser = async (phoneNumber, password) => {
    const user = await User.findOne({ where: { phoneNumber } });
    if (!user) {
        throw new Error('Неверные учетные данные');
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
        throw new Error('Неверные учетные данные');
    }

    if (!user.isPhoneVerified) {
        throw new Error('Номер телефона не подтвержден');
    }

    if (user.role === 'driver' && !user.isApproved) {
        throw new Error('Ваш аккаунт водителя не одобрен');
    }

    const token = jwt.sign(
        { userId: user.id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '12h' }
    );

    return token;
};
