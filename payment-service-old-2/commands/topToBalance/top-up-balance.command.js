// topUpBalance.command.js

export const createTopUpBalanceCommand = ({ userId, role, amount }) => ({
    type: 'TopUpBalanceCommand',
    userId,
    role,
    amount
});
