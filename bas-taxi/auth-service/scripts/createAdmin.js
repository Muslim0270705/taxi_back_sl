import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import sequelize from '../utils/database.js';
import User from '../models/user.model.js';
import logger from '../utils/logger.js';

dotenv.config();

const createAdmin = async () => {
    try {
        await sequelize.authenticate();
        logger.info('Успешное подключение к базе данных');

        await sequelize.sync();

        const existingAdmin = await User.findOne({ where: { phoneNumber: 'admin_phone_number' } });
        if (existingAdmin) {
            logger.info('Админ уже существует');
            return;
        }

        const hashedPassword = await bcrypt.hash('admin_password', 10);

        const admin = await User.create({
            phoneNumber: '9999999999999',
            password: hashedPassword,
            role: 'admin',
            isApproved: true,
            isPhoneVerified: true,
        });

        logger.info('Админ создан', { adminId: admin.id });
    } catch (error) {
        logger.error('Ошибка при создании админа', { error: error.message });
    } finally {
        await sequelize.close();
    }
};

createAdmin();
