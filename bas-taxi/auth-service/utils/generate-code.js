export const generateVerificationCode = () => {
    return Math.floor(1000 + Math.random() * 9000).toString();
};