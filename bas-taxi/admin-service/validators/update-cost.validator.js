import { z } from 'zod';

export const updateCostSchema = z.object({
    body: z.object({
        baseFare: z.number().positive(),
        costPerKm: z.number().positive(),
        costPerMinute: z.number().positive(),
    }),
});
