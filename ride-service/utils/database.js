import { Sequelize } from 'sequelize';
import logger from './logger.js';

const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD, {
    host: 'mysql-ride',
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql',
    logging: (msg) => logger.debug(msg),
});

console.log({sequelize})

const connectDB = async () => {
    try {
        await sequelize.authenticate();
        logger.info('Подключение к базе данных успешно');

        await sequelize.sync();
        logger.info('Таблицы синхронизированы');
    } catch (error) {
	console.log({error})
        logger.error('Ошибка подключения к базе данных', { error: error.message });
        process.exit(1);
    }
};

connectDB();

export default sequelize;
