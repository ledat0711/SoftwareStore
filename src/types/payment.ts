import { z } from 'zod';
import { paymentMethodSchema } from '@/lib/users/validations';

export type PaymentMethod = z.infer<typeof paymentMethodSchema>