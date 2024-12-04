import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const SMS_API_URL = process.env.SMS_API_URL;
const SMS_API_KEY = process.env.SMS_API_KEY;

export const sendVerificationCode = async (phoneNumber, code) => {
    const message = `Ваш код подтверждения: ${code}`;

    try {
        await axios.post(SMS_API_URL, {
            apiKey: SMS_API_KEY,
            to: phoneNumber,
            message,
        });
    } catch (error) {
        throw new Error('Ошибка при отправке SMS');
    }
};
