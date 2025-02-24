export const createGetBalanceHistoryQuery = ({ userId, role }) => ({
    type: 'GetBalanceHistoryQuery',
    userId,
    role
});