// topUpBalance.domain.js

export const validateAndCreateEventsForTopUp = ({ userId, role, amount }) => {
    if (role !== 'driver') {
        throw new Error('Только водитель может пополнить баланс');
    }

    if (amount <= 0) {
        throw new Error('Сумма должна быть больше нуля');
    }

    // Возвращаем массив событий. В данном случае одно событие — BalanceToppedUp.
    // Можно добавить timestamp здесь или в event store при записи.
    return [{
        type: 'BalanceToppedUp',
        data: { amount },
        // timestamp может быть установлен при записи события
    }];
};
