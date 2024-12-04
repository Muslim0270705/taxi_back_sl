import { z } from 'zod';

export const driverRegistrationSchema = z.object({
    body: z.object({
        email: z.string().email(),
        password: z.string().min(6),
        licenseNumber: z.string().nonempty('Номер водительского удостоверения обязателен'),
        vehicleDetails: z.object({
            make: z.string().nonempty(),
            model: z.string().nonempty(),
            year: z.number().int().positive(),
            color: z.string().nonempty(),
            plateNumber: z.string().nonempty(),
        }),
    }),
});