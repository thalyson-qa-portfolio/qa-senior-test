import { z } from 'zod';

/** Corpo JSON de sucesso de POST /auth (Restful-Booker). */
export const postAuthResponseSchema = z.object({
  token: z.string().min(1, 'token deve ser string não vazia'),
});

export type PostAuthResponse = z.infer<typeof postAuthResponseSchema>;
