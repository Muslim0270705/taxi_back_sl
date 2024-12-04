import { z } from 'zod';

export const passengerRegisterSchema = z.object({
    body: z.object({
        phoneNumber: z.string().nonempty('Номер телефона обязателен'),
        password: z.string().min(6, 'Пароль должен содержать минимум 6 символов'),
    }),
});