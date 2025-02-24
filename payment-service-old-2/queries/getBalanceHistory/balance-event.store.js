// getBalanceHistory.eventStore.js

import BalanceEvent from "../../models/balance-event.model";
import logger from "../../utils/logger";

export const getEventsForDriver = async (driverId) => {
    try {
        // Получаем все события для данного водителя, отсортированные по времени
        const events = await BalanceEvent.findAll({
            where: { driverId },
            order: [['eventTimestamp', 'ASC']]
        });

        // Преобразуем записи из БД в массив объектов события
        return events.map(e => ({
            type: e.eventType,
            data: e.eventData,
            timestamp: e.eventTimestamp.toISOString() // Приводим к строке ISO
        }));
    } catch (error) {
        logger.error('Ошибка при получении событий для водителя', { error: error.message });
        throw error;
    }
};
